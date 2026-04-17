import { useState, useEffect } from 'react';
import { X, Save, Sparkles, Loader, Utensils } from 'lucide-react';
import type { ItineraryItem } from '../../core/models';
import { parseAllTrailsUrl } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';

interface EditItineraryModalProps {
  item: ItineraryItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ItineraryItem>) => void;
}

/** Split "2024-07-10T08:00:00" → ["2024-07-10", "08:00"] safely */
function splitDateTime(dateStr: string): [string, string] {
  const [datePart = '', timePart = ''] = dateStr.split('T');
  return [datePart, timePart.slice(0, 5)];
}

export default function EditItineraryModal({ item, onClose, onSave }: EditItineraryModalProps) {
  const [initDate, initTime] = splitDateTime(item.startDate);
  const [initEndDate, initEndTime] = item.endDate ? splitDateTime(item.endDate) : ['', ''];

  const [groupId] = useState(item.groupId || '');
  const [sortOrder] = useState<number | undefined>(item.sortOrder);

  const [allTrailsUrl, setAllTrailsUrl] = useState('');
  const [isParsingAllTrails, setIsParsingAllTrails] = useState(false);

  const [title, setTitle]           = useState(item.title);
  const [type, setType]             = useState((item.type as string) === 'hike' ? 'hiking' : item.type);
  const [date, setDate]             = useState(initDate);
  const [time, setTime]             = useState(initTime);
  const [endDate, setEndDate]       = useState(initEndDate);
  const [endTime, setEndTime]       = useState(initEndTime);
  const [confirmationNumber, setConfirmationNumber] = useState(item.confirmationNumber ?? '');
  const [locationName, setLocationName] = useState(item.location.name);
  const [address, setAddress]       = useState(item.location.address);
  const [lat, setLat]               = useState(item.location.latitude);
  const [lng, setLng]               = useState(item.location.longitude);
  const [cost, setCost]             = useState(item.cost?.toString() ?? '');
  const [paidAmount, setPaidAmount] = useState(item.paidAmount?.toString() ?? '');
  const [description, setDescription] = useState((item.description ?? '').replace(/<br\s*\/?>/gi, '\n'));

  // Hike specific
  const [hikeDiff, setHikeDiff] = useState<'Easy'|'Moderate'|'Hard'|'Expert'>(item.hikeDetails?.difficulty ?? 'Moderate');
  const [hikeDist, setHikeDist] = useState(item.hikeDetails?.distance ?? '');
  const [hikeDur, setHikeDur]   = useState(item.hikeDetails?.duration ?? '');
  const [hikeElev, setHikeElev] = useState(item.hikeDetails?.elevation ?? '');
  const [hikeLink, setHikeLink] = useState(item.hikeDetails?.allTrailsLink ?? '');

  const [foodMeal, setFoodMeal] = useState<'Breakfast'|'Lunch'|'Dinner'|'Snack'|'Dessert'>(item.foodDetails?.mealType ?? 'Dinner');
  const [foodHappyCow, setFoodHappyCow] = useState(item.foodDetails?.happyCowUrl ?? '');
  const [foodOfficial, setFoodOfficial]   = useState(item.foodDetails?.officialUrl ?? '');
  const [refundable, setRefundable] = useState(
    item.hotelDetails?.refundable ?? 
    item.rentalDetails?.refundable ?? 
    item.flightDetails?.refundable ?? 
    false
  );
  const [refundableCutoffDate, setRefundableCutoffDate] = useState(
    item.hotelDetails?.refundableCutoffDate ?? 
    item.rentalDetails?.refundableCutoffDate ?? 
    item.flightDetails?.refundableCutoffDate ?? 
    ''
  );
  const [bookingSource, setBookingSource] = useState(
    item.hotelDetails?.bookingSource ?? 
    item.rentalDetails?.bookingSource ?? 
    item.flightDetails?.bookingSource ?? 
    ''
  );

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=4`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {}
      setIsSearching(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [address]);

  const handleSave = () => {
    const startDateString = type === 'food' ? date : date ? (time ? `${date}T${time}:00` : date) : item.startDate;
    const endDateString = type === 'food' ? undefined : endDate ? (endTime ? `${endDate}T${endTime}:00` : endDate) : undefined;

    onSave(item.id, {
      title,
      type,
      startDate: startDateString,
      endDate: endDateString,
      confirmationNumber: confirmationNumber || undefined,
      description: description || undefined,
      location: {
        ...item.location,
        name: locationName,
        address,
        latitude: lat,
        longitude: lng,
      },
      hikeDetails: (type === 'hiking' || type === 'hike') ? {
        difficulty: hikeDiff,
        distance: hikeDist,
        duration: hikeDur,
        elevation: hikeElev,
        allTrailsLink: hikeLink || undefined,
      } : undefined,
      foodDetails: type === 'food' ? {
        mealType: foodMeal,
        happyCowUrl: foodHappyCow || undefined,
        officialUrl: foodOfficial || undefined
      } : undefined,
      hotelDetails: type === 'hotel' ? {
        refundable,
        refundableCutoffDate: refundable ? (refundableCutoffDate || undefined) : undefined,
        bookingSource: bookingSource || undefined
      } : undefined,
      rentalDetails: type === 'rental-car' ? {
        refundable,
        refundableCutoffDate: refundable ? (refundableCutoffDate || undefined) : undefined,
        bookingSource: bookingSource || undefined
      } : undefined,
      flightDetails: type === 'flight' ? {
        refundable,
        refundableCutoffDate: refundable ? (refundableCutoffDate || undefined) : undefined,
        bookingSource: bookingSource || undefined
      } : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
      groupId,
      sortOrder
    });
    onClose();
  };

  const handleParseAllTrails = async () => {
    let rawUrl = allTrailsUrl.trim();
    if (!rawUrl) return;

    // --- Sanitization Logic ---
    // Handle mobile app share text (e.g. "Bear's Hump on AllTrails https://...")
    const httpsIdx = rawUrl.indexOf('https://');
    if (httpsIdx !== -1) {
      rawUrl = rawUrl.substring(httpsIdx);
    }
    // Remove query parameters (anything starting with ?)
    const cleanedUrl = rawUrl.split('?')[0];

    setIsParsingAllTrails(true);
    try {
      const currentTripId = useTripStore.getState().currentTripId;
      const tripTitleRaw = useTripStore.getState().trips.find(t => t.id === currentTripId)?.title || '';
      
      const hikeData = await parseAllTrailsUrl(cleanedUrl, tripTitleRaw);
      if (hikeData.title) {
        setLocationName(hikeData.title);
        if (!title || title === 'New Activity' || title === 'Hike') {
          setTitle(`Hike at ${hikeData.title}`);
        }
      }
      if (hikeData.difficulty) setHikeDiff(hikeData.difficulty as any);
      if (hikeData.distance) setHikeDist(hikeData.distance);
      if (hikeData.elevation) setHikeElev(hikeData.elevation);
      if (hikeData.duration) setHikeDur(hikeData.duration);
      if (hikeData.startAddress) setAddress(hikeData.startAddress);
      if (hikeData.startLat) setLat(hikeData.startLat);
      if (hikeData.startLng) setLng(hikeData.startLng);
      setHikeLink(cleanedUrl);
      setAllTrailsUrl('');
    } catch(err) {
      console.error(err);
      alert('Failed to parse AllTrails link. Ensure the URL is valid.');
    } finally {
      setIsParsingAllTrails(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 0 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0, paddingTop: '4px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Edit Details</h2>
          <button onClick={onClose}><X size={22} color="var(--sys-label-secondary)" /></button>
        </div>

        {/* Scrollable form body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px', paddingRight: '12px' }}>

          {/* Title */}
          <div className="edit-field-group">
            <label className="edit-field-label">Title</label>
            <input
              className="edit-field-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={() => {
                if (title === 'New Activity' || title === 'New Trip Stop') {
                  setTitle('');
                }
              }}
              placeholder="Activity name"
            />
          </div>

          {/* Category */}
          <div className="edit-field-group">
            <label className="edit-field-label">Category</label>
            <select
              className="edit-field-input"
              value={type}
              onChange={e => setType(e.target.value as any)}
            >
              <option value="activity">Activity</option>
              <option value="hiking">Hiking / Trail</option>
              <option value="hotel">Hotel / Lodging</option>
              <option value="flight">Flight Segment</option>
              <option value="rental-car">Rental Car</option>
              <option value="transit">Transit</option>
              <option value="food">Food & Dining</option>
              <option value="note">Note / Reminder</option>
            </select>
          </div>
          {type === 'note' ? (
            /* Note-only View: Title + Description only */
            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">Note Content</label>
              <textarea
                className="edit-field-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add notes, tips, or details…"
                rows={12}
                style={{ resize: 'none', lineHeight: '1.5' }}
              />
            </div>
          ) : (
            <>
              {/* Financials */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="edit-field-group" style={{ flex: 1, minWidth: '140px' }}>
                  <label className="edit-field-label">Estimated Cost ($)</label>
                  <input
                    className="edit-field-input"
                    type="number"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="edit-field-group" style={{ flex: 1, minWidth: '140px' }}>
                  <label className="edit-field-label">Amount Paid ($)</label>
                  <input
                    className="edit-field-input"
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ color: cost && parseFloat(paidAmount) > parseFloat(cost) ? 'var(--sys-red)' : 'var(--sys-green)' }}
                  />
                </div>
              </div>

              {/* Start Date & Time */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="edit-field-group" style={{ flex: '0 0 auto' }}>
                  <label className="edit-field-label">{type === 'flight' ? 'Takeoff Date' : 'Date'}</label>
                  <input
                    className="edit-field-input"
                    style={{ width: 'auto', minWidth: '150px' }}
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>

                {type !== 'food' && (
                  <div className="edit-field-group" style={{ flex: '0 0 auto' }}>
                    <label className="edit-field-label">{type === 'flight' ? 'Takeoff Time' : 'Time'}</label>
                    <input
                      className="edit-field-input"
                      style={{ width: 'auto', minWidth: '130px' }}
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* End Date & Time */}
              {type !== 'food' && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="edit-field-group" style={{ flex: '0 0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="edit-field-label" style={{ margin: 0 }}>{type === 'flight' ? 'Landing Date (opt)' : 'End Date (opt)'}</label>
                      {endDate && <button onClick={() => setEndDate('')} style={{ fontSize: '10px', color: 'var(--sys-blue)', fontWeight: 600 }}>Clear</button>}
                    </div>
                  <input
                    className="edit-field-input"
                    style={{ width: 'auto', minWidth: '150px' }}
                    type="date"
                    value={endDate}
                    onFocus={() => { if (!endDate && date) setEndDate(date); }}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>

                <div className="edit-field-group" style={{ flex: '0 0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="edit-field-label" style={{ margin: 0 }}>{type === 'flight' ? 'Landing Time' : 'End Time'}</label>
                      {endTime && <button onClick={() => setEndTime('')} style={{ fontSize: '10px', color: 'var(--sys-blue)', fontWeight: 600 }}>Clear</button>}
                    </div>
                  <input
                    className="edit-field-input"
                    style={{ width: 'auto', minWidth: '130px' }}
                    type="time"
                    value={endTime}
                    onFocus={() => { if (!endTime && time) setEndTime(time); }}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              )}

              {/* Conditional Food Details */}
              {type === 'food' && (
                <div className="edit-field-group">
                  <label className="edit-field-label">Meal</label>
                  <select className="edit-field-input" value={foodMeal} onChange={e => setFoodMeal(e.target.value as any)}>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
              )}

              {/* Confirmation Number */}
              {type !== 'hiking' && type !== 'hike' && (
                <div className="edit-field-group">
                  <label className="edit-field-label">Confirmation Number</label>
                  <input
                    className="edit-field-input"
                    type="text"
                    value={confirmationNumber}
                    onChange={e => setConfirmationNumber(e.target.value)}
                    placeholder="e.g. AB12345 (Optional)"
                  />
                </div>
              )}

              {/* Conditional Hotel/Rental/Flight Details */}
              {(type === 'hotel' || type === 'rental-car' || type === 'flight') && (
                <div style={{ 
                  background: type === 'hotel' ? 'rgba(10, 132, 255, 0.08)' : 
                              type === 'rental-car' ? 'rgba(175, 82, 222, 0.08)' :
                              'rgba(10, 132, 255, 0.08)', 
                  padding: '16px', borderRadius: '16px', marginBottom: '16px', 
                  border: type === 'hotel' ? '1px solid rgba(10, 132, 255, 0.2)' : 
                          type === 'rental-car' ? '1px solid rgba(175, 82, 222, 0.2)' :
                          '1px solid rgba(10, 132, 255, 0.2)' 
                }}>
                   <div className="edit-field-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: refundable ? '16px' : '12px' }}>
                    <label className="edit-field-label" style={{ margin: 0 }}>Refundable Booking?</label>
                    <input 
                      type="checkbox" 
                      checked={refundable} 
                      onChange={e => setRefundable(e.target.checked)}
                      style={{ width: '22px', height: '22px', accentColor: type === 'rental-car' ? 'var(--sys-purple)' : 'var(--sys-blue)' }}
                    />
                  </div>

                  {refundable && (
                    <div className="edit-field-group" style={{ marginBottom: '16px' }}>
                      <label className="edit-field-label">Refundable Until (Cutoff Date)</label>
                      <input 
                        className="edit-field-input" 
                        type="date" 
                        value={refundableCutoffDate} 
                        onChange={e => setRefundableCutoffDate(e.target.value)}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  )}

                  <div className="edit-field-group" style={{ marginBottom: 0 }}>
                    <label className="edit-field-label">Booking Source / Agency</label>
                    <input 
                      className="edit-field-input" 
                      type="text" 
                      value={bookingSource} 
                      onChange={e => setBookingSource(e.target.value)} 
                      placeholder={type === 'flight' ? "e.g. United, Expedia, Chase Travel" : "e.g. Expedia, Direct, Turo"} 
                    />
                  </div>
                </div>
              )}

              {/* Location Search API + Address */}
              <div className="edit-field-group" style={{ position: 'relative' }}>
                <label className="edit-field-label">Search / Address</label>
                <input
                  className="edit-field-input"
                  type="text"
                  value={address}
                  onChange={e => { setAddress(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => {
                    if (address === 'Location TBD') setAddress('');
                    setShowSuggestions(true);
                  }}
                  placeholder="Search for place or address..."
                />
                {isSearching && (
                   <div style={{ position: 'absolute', right: '14px', top: '40px', fontSize: '11px', color: 'var(--sys-blue)', fontWeight: 600 }}>Searching...</div>
                )}
                
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, 
                      background: 'var(--sys-bg-elevated-3)', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px', marginTop: '6px', zIndex: 100, overflow: 'hidden',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                    }}
                  >
                    {suggestions.map((s, i) => {
                      const sName = s.name || s.display_name.split(',')[0];
                      return (
                        <div 
                          key={i}
                          style={{ padding: '12px 14px', borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                          onClick={() => {
                              setLocationName(sName);
                              setAddress(s.display_name);
                              setLat(parseFloat(s.lat));
                              setLng(parseFloat(s.lon));
                              setShowSuggestions(false);
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px', marginBottom: '2px' }}>{sName}</div>
                          <div style={{ color: 'var(--sys-label-secondary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.display_name}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Location Name */}
              <div className="edit-field-group">
                <label className="edit-field-label">Location Name</label>
                <input
                  className="edit-field-input"
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  onFocus={() => {
                    if (locationName === 'TBD' || locationName === 'Location TBD') {
                      setLocationName('');
                    }
                  }}
                  placeholder="Custom place name or title"
                />
              </div>

              {/* Conditional Hike Details */}
              {(type === 'hiking' || type === 'hike') && (
                <div style={{ background: 'rgba(52, 199, 89, 0.08)', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: '1px solid rgba(52, 199, 89, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🥾</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#34C759' }}>TRAIL STATS</span>
                    </div>
                  </div>

                  <div className="edit-field-group" style={{ position: 'relative' }}>
                    <label className="edit-field-label" style={{ color: '#34C759', fontWeight: 700 }}>AllTrails Quick Import</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        className="edit-field-input" 
                        type="text" 
                        value={allTrailsUrl} 
                        onChange={e => setAllTrailsUrl(e.target.value)} 
                        placeholder="Paste AllTrails URL..." 
                        style={{ background: 'rgba(52, 199, 89, 0.05)', borderColor: 'rgba(52, 199, 89, 0.3)' }}
                      />
                      <button 
                        type="button"
                        onClick={handleParseAllTrails}
                        disabled={isParsingAllTrails || !allTrailsUrl.trim()}
                        style={{
                          background: '#34C759', color: '#000', border: 'none', borderRadius: '10px',
                          padding: '0 16px', fontWeight: 700, cursor: isParsingAllTrails ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!allTrailsUrl.trim() || isParsingAllTrails) ? 0.6 : 1
                        }}
                      >
                        {isParsingAllTrails ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="edit-field-group">
                    <label className="edit-field-label">Difficulty</label>
                    <select className="edit-field-input" value={hikeDiff} onChange={e => setHikeDiff(e.target.value as any)}>
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Hard">Hard</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="edit-field-group" style={{ flex: '1 1 90px', minWidth: 0, marginBottom: 0 }}>
                      <label className="edit-field-label">Distance</label>
                      <input className="edit-field-input" type="text" value={hikeDist} onChange={e => setHikeDist(e.target.value)} placeholder="e.g. 5.2 mi" />
                    </div>
                    <div className="edit-field-group" style={{ flex: '1 1 90px', minWidth: 0, marginBottom: 0 }}>
                      <label className="edit-field-label">Duration</label>
                      <input className="edit-field-input" type="text" value={hikeDur} onChange={e => setHikeDur(e.target.value)} placeholder="e.g. 3.5 hrs" />
                    </div>
                    <div className="edit-field-group" style={{ flex: '1 1 90px', minWidth: 0, marginBottom: 0 }}>
                      <label className="edit-field-label">Elevation</label>
                      <input className="edit-field-input" type="text" value={hikeElev} onChange={e => setHikeElev(e.target.value)} placeholder="e.g. 1,500 ft" />
                    </div>
                    <div className="edit-field-group" style={{ flex: '1 1 100%', minWidth: 0, marginBottom: 0, marginTop: '8px' }}>
                      <label className="edit-field-label">AllTrails Link</label>
                      <input className="edit-field-input" type="url" value={hikeLink} onChange={e => setHikeLink(e.target.value)} placeholder="https://www.alltrails.com/..." />
                    </div>
                  </div>
                </div>
              )}

              {type === 'food' && (
                <div style={{ background: 'rgba(255, 159, 10, 0.08)', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: '1px solid rgba(255, 159, 10, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Utensils size={18} color="#FF9F0A" />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#FF9F0A' }}>DINING DISCOVERY</span>
                    </div>
                  </div>

                  <div className="edit-field-group">
                    <label className="edit-field-label">HappyCow Link</label>
                    <input 
                      className="edit-field-input" 
                      type="url" 
                      value={foodHappyCow} 
                      onChange={e => setFoodHappyCow(e.target.value)} 
                      placeholder="https://www.happycow.net/..." 
                      style={{ background: 'rgba(48, 209, 88, 0.05)', borderColor: 'rgba(48, 209, 88, 0.15)' }}
                    />
                  </div>
                  <div className="edit-field-group" style={{ marginBottom: 0 }}>
                    <label className="edit-field-label">Official Website</label>
                    <input 
                      className="edit-field-input" 
                      type="url" 
                      value={foodOfficial} 
                      onChange={e => setFoodOfficial(e.target.value)} 
                      placeholder="https://restaurant-site.com/..." 
                      style={{ background: 'rgba(10, 132, 255, 0.05)', borderColor: 'rgba(10, 132, 255, 0.15)' }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="edit-field-group" style={{ marginBottom: 0 }}>
                <label className="edit-field-label">Description</label>
                <textarea
                  className="edit-field-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add notes, tips, or details…"
                  rows={4}
                  style={{ resize: 'none', lineHeight: '1.5' }}
                />
              </div>
            </>
          )}


          </div>

        {/* Save button — fixed at bottom */}
        <div style={{ flexShrink: 0, paddingTop: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSave}
            className="btn-glass-blue"
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              fontSize: '16px',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            }}
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
