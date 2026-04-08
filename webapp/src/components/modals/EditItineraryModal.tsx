import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { ItineraryItem } from '../../core/models';

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
  const [description, setDescription] = useState((item.description ?? '').replace(/<br\s*\/?>/gi, '\n'));

  // Hike specific
  const [hikeDiff, setHikeDiff] = useState<'Easy'|'Moderate'|'Hard'|'Expert'>(item.hikeDetails?.difficulty ?? 'Moderate');
  const [hikeDist, setHikeDist] = useState(item.hikeDetails?.distance ?? '');
  const [hikeDur, setHikeDur]   = useState(item.hikeDetails?.duration ?? '');
  const [hikeElev, setHikeElev] = useState(item.hikeDetails?.elevation ?? '');
  const [hikeLink, setHikeLink] = useState(item.hikeDetails?.allTrailsLink ?? '');

  const [foodMeal, setFoodMeal] = useState<'Breakfast'|'Lunch'|'Dinner'|'Snack'|'Dessert'>(item.foodDetails?.mealType ?? 'Dinner');

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
        mealType: foodMeal
      } : undefined,
      cost: cost ? parseFloat(cost) : undefined
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92vh', paddingBottom: 0 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
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

          {/* Cost */}
          <div className="edit-field-group">
            <label className="edit-field-label">Estimated Cost ($)</label>
            <input
              className="edit-field-input"
              type="number"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0.00"
            />
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
                <label className="edit-field-label">{type === 'flight' ? 'Landing Date (optional)' : 'End Date (optional)'}</label>
              <input
                className="edit-field-input"
                style={{ width: 'auto', minWidth: '150px' }}
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="edit-field-group" style={{ flex: '0 0 auto' }}>
              <label className="edit-field-label">{type === 'flight' ? 'Landing Time' : 'End Time'}</label>
              <input
                className="edit-field-input"
                style={{ width: 'auto', minWidth: '130px' }}
                type="time"
                value={endTime}
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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🥾</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#34C759' }}>TRAIL STATS</span>
              </div>
              
              <div className="edit-field-group">
                <label className="edit-field-label">Difficulty</label>
                <select className="edit-field-input" value={hikeDiff} onChange={e => setHikeDiff(e.target.value as any)}>
                  <option value="Easy">🟩 Easy</option>
                  <option value="Moderate">🟦 Moderate</option>
                  <option value="Hard">🟥 Hard</option>
                  <option value="Expert">⬛ Expert</option>
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
                  <input className="edit-field-input" type="text" value={hikeElev} onChange={e => setHikeElev(e.target.value)} placeholder="e.g. 1,400 ft" />
                </div>
                <div className="edit-field-group" style={{ flex: '1 1 100%', minWidth: 0, marginBottom: 0, marginTop: '8px' }}>
                  <label className="edit-field-label">AllTrails Link</label>
                  <input className="edit-field-input" type="url" value={hikeLink} onChange={e => setHikeLink(e.target.value)} placeholder="https://www.alltrails.com/..." />
                </div>
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
        </div>

        {/* Save button — fixed at bottom */}
        <div style={{ flexShrink: 0, paddingTop: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSave}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              background: 'var(--sys-blue)', color: '#FFF',
              fontSize: '16px', fontWeight: 700,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 16px rgba(10,132,255,0.4)',
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
