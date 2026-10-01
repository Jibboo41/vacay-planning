import { useState, useEffect } from 'react';
import { Save, Sparkles, Loader, Utensils } from 'lucide-react';
import type { FoodDetails, HikeDetails, ItineraryItem } from '../../core/models';
import { parseAllTrailsUrl } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';
import { ITEM_TYPES, type ItemTypeKey } from '../../core/itemTypes';
import { Button, Field, Input, Select, Sheet, TextArea } from '../ui';

interface EditItineraryModalProps {
  item: ItineraryItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ItineraryItem>) => void;
}

type EditableItemType = Exclude<ItemTypeKey, 'unknown'>;
type HikeDifficulty = HikeDetails['difficulty'];
type MealType = FoodDetails['mealType'];

interface NominatimSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

const TYPE_OPTIONS: EditableItemType[] = ['activity', 'hiking', 'hotel', 'flight', 'rental-car', 'transit', 'food', 'note'];
const MEAL_OPTIONS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
const DIFFICULTY_OPTIONS: HikeDifficulty[] = ['Easy', 'Moderate', 'Hard', 'Expert'];

/** Split "2024-07-10T08:00:00" → ["2024-07-10", "08:00"] safely */
function splitDateTime(dateStr: string): [string, string] {
  const [datePart = '', timePart = ''] = dateStr.split('T');
  return [datePart, timePart.slice(0, 5)];
}

function normaliseType(type: ItineraryItem['type']): EditableItemType {
  if (type === 'hike') return 'hiking';
  if (type === 'unknown') return 'activity';
  return type;
}

function isHikeDifficulty(value: string): value is HikeDifficulty {
  return DIFFICULTY_OPTIONS.includes(value as HikeDifficulty);
}

export default function EditItineraryModal({ item, onClose, onSave }: EditItineraryModalProps) {
  const [initDate, initTime] = splitDateTime(item.startDate);
  const [initEndDate, initEndTime] = item.endDate ? splitDateTime(item.endDate) : ['', ''];

  const [groupId] = useState(item.groupId || '');
  const [sortOrder] = useState<number | undefined>(item.sortOrder);

  const [allTrailsUrl, setAllTrailsUrl] = useState('');
  const [isParsingAllTrails, setIsParsingAllTrails] = useState(false);

  const [title, setTitle]           = useState(item.title);
  const [type, setType]             = useState<EditableItemType>(normaliseType(item.type));
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

  const [hikeDiff, setHikeDiff] = useState<HikeDifficulty>(item.hikeDetails?.difficulty ?? 'Moderate');
  const [hikeDist, setHikeDist] = useState(item.hikeDetails?.distance ?? '');
  const [hikeDur, setHikeDur]   = useState(item.hikeDetails?.duration ?? '');
  const [hikeElev, setHikeElev] = useState(item.hikeDetails?.elevation ?? '');
  const [hikeLink, setHikeLink] = useState(item.hikeDetails?.allTrailsLink ?? '');

  const [foodMeal, setFoodMeal] = useState<MealType>(item.foodDetails?.mealType ?? 'Dinner');
  const [foodHappyCow, setFoodHappyCow] = useState(item.foodDetails?.happyCowUrl ?? '');
  const [foodOfficial, setFoodOfficial] = useState(item.foodDetails?.officialUrl ?? '');
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

  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
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
        const data: unknown = await res.json();
        setSuggestions(Array.isArray(data) ? data as NominatimSuggestion[] : []);
      } catch (error) {
        console.error('Location search failed:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
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
      hikeDetails: type === 'hiking' ? {
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

    const httpsIdx = rawUrl.indexOf('https://');
    if (httpsIdx !== -1) {
      rawUrl = rawUrl.substring(httpsIdx);
    }
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
      if (hikeData.difficulty && isHikeDifficulty(hikeData.difficulty)) setHikeDiff(hikeData.difficulty);
      if (hikeData.distance) setHikeDist(hikeData.distance);
      if (hikeData.elevation) setHikeElev(hikeData.elevation);
      if (hikeData.duration) setHikeDur(hikeData.duration);
      if (hikeData.startAddress) setAddress(hikeData.startAddress);
      if (hikeData.startLat) setLat(hikeData.startLat);
      if (hikeData.startLng) setLng(hikeData.startLng);
      setHikeLink(cleanedUrl);
      setAllTrailsUrl('');
    } catch(error) {
      console.error(error);
      alert('Failed to parse AllTrails link. Ensure the URL is valid.');
    } finally {
      setIsParsingAllTrails(false);
    }
  };

  const paidAmountClass = cost && parseFloat(paidAmount) > parseFloat(cost) ? 'text-sys-red' : 'text-sys-green';
  const selectedTypeMeta = ITEM_TYPES[type];
  const SelectedTypeIcon = selectedTypeMeta.icon;

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit Details"
      className="flex max-h-[90vh] flex-col pb-0"
      bodyClassName="flex-1 pr-3 pb-4"
      footer={(
        <Button onClick={handleSave} className="btn-glass-blue" block size="lg">
          <Save size={18} />
          Save Changes
        </Button>
      )}
    >
      <div className="flex flex-col gap-4">
        <Field label="Title">
          {id => (
            <Input
              id={id}
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
          )}
        </Field>

        <Field label="Category">
          {id => (
            <div className="flex items-center gap-2">
              <SelectedTypeIcon size={20} className={selectedTypeMeta.textClass} />
              <Select
                id={id}
                value={type}
                onChange={e => setType(e.target.value as EditableItemType)}
                className={selectedTypeMeta.borderClass}
              >
                {TYPE_OPTIONS.map(option => {
                  const meta = ITEM_TYPES[option];
                  return <option key={option} value={option}>{meta.label}</option>;
                })}
              </Select>
            </div>
          )}
        </Field>

        {type === 'note' ? (
          <Field label="Note Content" className="mb-0">
            {id => (
              <TextArea
                id={id}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add notes, tips, or details…"
                rows={12}
                className="resize-none leading-normal"
              />
            )}
          </Field>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              <Field label="Estimated Cost ($)" className="flex-1 min-w-[140px]">
                {id => <Input id={id} type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />}
              </Field>
              <Field label="Amount Paid ($)" className="flex-1 min-w-[140px]">
                {id => (
                  <Input
                    id={id}
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    className={paidAmountClass}
                  />
                )}
              </Field>
            </div>

            <div className="flex flex-wrap gap-4">
              <Field label={type === 'flight' ? 'Takeoff Date' : 'Date'} className="flex-none">
                {id => <Input id={id} className="w-auto min-w-[150px]" type="date" value={date} onChange={e => setDate(e.target.value)} />}
              </Field>

              {type !== 'food' && (
                <Field label={type === 'flight' ? 'Takeoff Time' : 'Time'} className="flex-none">
                  {id => <Input id={id} className="w-auto min-w-[130px]" type="time" value={time} onChange={e => setTime(e.target.value)} />}
                </Field>
              )}
            </div>

            {type !== 'food' && (
              <div className="flex flex-wrap gap-4">
                <Field label={type === 'flight' ? 'Landing Date (opt)' : 'End Date (opt)'} className="flex-none">
                  {id => (
                    <div className="flex items-center gap-2">
                      <Input
                        id={id}
                        className="w-auto min-w-[150px]"
                        type="date"
                        value={endDate}
                        onFocus={() => { if (!endDate && date) setEndDate(date); }}
                        onChange={e => setEndDate(e.target.value)}
                      />
                      {endDate && <Button onClick={() => setEndDate('')} variant="ghost" size="sm" className="relative min-h-0 px-1.5 py-0.5 text-caption text-sys-blue before:absolute before:-inset-2.5 before:content-['']">Clear</Button>}
                    </div>
                  )}
                </Field>

                <Field label={type === 'flight' ? 'Landing Time' : 'End Time'} className="flex-none">
                  {id => (
                    <div className="flex items-center gap-2">
                      <Input
                        id={id}
                        className="w-auto min-w-[130px]"
                        type="time"
                        value={endTime}
                        onFocus={() => { if (!endTime && time) setEndTime(time); }}
                        onChange={e => setEndTime(e.target.value)}
                      />
                      {endTime && <Button onClick={() => setEndTime('')} variant="ghost" size="sm" className="relative min-h-0 px-1.5 py-0.5 text-caption text-sys-blue before:absolute before:-inset-2.5 before:content-['']">Clear</Button>}
                    </div>
                  )}
                </Field>
              </div>
            )}

            {type === 'food' && (
              <Field label="Meal">
                {id => (
                  <Select id={id} value={foodMeal} onChange={e => setFoodMeal(e.target.value as MealType)}>
                    {MEAL_OPTIONS.map(meal => <option key={meal} value={meal}>{meal}</option>)}
                  </Select>
                )}
              </Field>
            )}

            {type !== 'hiking' && (
              <Field label="Confirmation Number">
                {id => (
                  <Input
                    id={id}
                    type="text"
                    value={confirmationNumber}
                    onChange={e => setConfirmationNumber(e.target.value)}
                    placeholder="e.g. AB12345 (Optional)"
                  />
                )}
              </Field>
            )}

            {(type === 'hotel' || type === 'rental-car' || type === 'flight') && (
              <div className={`mb-4 rounded-2xl p-4 ${
                type === 'rental-car'
                  ? 'border border-sys-purple/20 bg-sys-purple/8'
                  : 'border border-sys-blue/20 bg-sys-blue/8'
              }`}>
                <Field label="Refundable Booking?" className={refundable ? 'mb-4' : 'mb-3'}>
                  {id => (
                    <Input
                      id={id}
                      type="checkbox"
                      checked={refundable}
                      onChange={e => setRefundable(e.target.checked)}
                      className={`size-[22px] ${type === 'rental-car' ? 'accent-sys-purple' : 'accent-sys-blue'}`}
                    />
                  )}
                </Field>

                {refundable && (
                  <Field label="Refundable Until (Cutoff Date)" className="mb-4">
                    {id => (
                      <Input
                        id={id}
                        type="date"
                        value={refundableCutoffDate}
                        onChange={e => setRefundableCutoffDate(e.target.value)}
                        className="scheme-dark"
                      />
                    )}
                  </Field>
                )}

                <Field label="Booking Source / Agency" className="mb-0">
                  {id => (
                    <Input
                      id={id}
                      type="text"
                      value={bookingSource}
                      onChange={e => setBookingSource(e.target.value)}
                      placeholder={type === 'flight' ? 'e.g. United, Expedia, Chase Travel' : 'e.g. Expedia, Direct, Turo'}
                    />
                  )}
                </Field>
              </div>
            )}

            <Field label="Search / Address" className="relative">
              {id => (
                <>
                  <Input
                    id={id}
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
                    <div className="absolute right-3.5 top-10 text-caption font-semibold text-sys-blue">Searching...</div>
                  )}
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 overflow-hidden rounded-control border border-white/15 bg-surface-3 shadow-elevated">
                      {suggestions.map((s, i) => {
                        const sName = s.name || s.display_name.split(',')[0];
                        return (
                          <Button
                            key={`${s.display_name}-${i}`}
                            variant="ghost"
                            onClick={() => {
                              setLocationName(sName);
                              setAddress(s.display_name);
                              setLat(parseFloat(s.lat));
                              setLng(parseFloat(s.lon));
                              setShowSuggestions(false);
                            }}
                            className={`block w-full rounded-none px-3.5 py-3 text-left ${i === suggestions.length - 1 ? '' : 'border-b border-white/5'}`}
                          >
                            <div className="mb-0.5 text-[14px] font-bold text-label">{sName}</div>
                            <div className="truncate text-caption text-label-secondary">{s.display_name}</div>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Field>

            <Field label="Location Name">
              {id => (
                <Input
                  id={id}
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
              )}
            </Field>

            {type === 'hiking' && (
              <div className="mb-4 rounded-2xl border border-sys-green/20 bg-sys-green/8 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">🥾</span>
                    <span className="text-[14px] font-extrabold text-sys-green">TRAIL STATS</span>
                  </div>
                </div>

                <Field label="AllTrails Quick Import" className="relative">
                  {id => (
                    <div className="flex gap-2">
                      <Input
                        id={id}
                        type="text"
                        value={allTrailsUrl}
                        onChange={e => setAllTrailsUrl(e.target.value)}
                        placeholder="Paste AllTrails URL..."
                        className="border-sys-green/30 bg-sys-green/5"
                      />
                      <Button
                        onClick={handleParseAllTrails}
                        disabled={isParsingAllTrails || !allTrailsUrl.trim()}
                        className="flex items-center justify-center rounded-[10px] border-0 bg-sys-green px-4 font-bold text-black disabled:cursor-default disabled:opacity-60"
                      >
                        {isParsingAllTrails ? <Loader size={18} className="animate-spin motion-reduce:animate-none" /> : <Sparkles size={18} />}
                      </Button>
                    </div>
                  )}
                </Field>
                
                <Field label="Difficulty">
                  {id => (
                    <Select id={id} value={hikeDiff} onChange={e => setHikeDiff(e.target.value as HikeDifficulty)}>
                      {DIFFICULTY_OPTIONS.map(difficulty => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                    </Select>
                  )}
                </Field>

                <div className="flex flex-wrap gap-2.5">
                  <Field label="Distance" className="mb-0 flex-[1_1_90px] min-w-0">
                    {id => <Input id={id} type="text" value={hikeDist} onChange={e => setHikeDist(e.target.value)} placeholder="e.g. 5.2 mi" />}
                  </Field>
                  <Field label="Duration" className="mb-0 flex-[1_1_90px] min-w-0">
                    {id => <Input id={id} type="text" value={hikeDur} onChange={e => setHikeDur(e.target.value)} placeholder="e.g. 3.5 hrs" />}
                  </Field>
                  <Field label="Elevation" className="mb-0 flex-[1_1_90px] min-w-0">
                    {id => <Input id={id} type="text" value={hikeElev} onChange={e => setHikeElev(e.target.value)} placeholder="e.g. 1,500 ft" />}
                  </Field>
                  <Field label="AllTrails Link" className="mb-0 mt-2 flex-[1_1_100%] min-w-0">
                    {id => <Input id={id} type="url" value={hikeLink} onChange={e => setHikeLink(e.target.value)} placeholder="https://www.alltrails.com/..." />}
                  </Field>
                </div>
              </div>
            )}

            {type === 'food' && (
              <div className="mb-4 rounded-2xl border border-sys-purple/20 bg-sys-purple/8 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Utensils size={18} className="text-sys-purple" />
                    <span className="text-[14px] font-extrabold text-sys-purple">DINING DISCOVERY</span>
                  </div>
                </div>

                <Field label="HappyCow Link">
                  {id => (
                    <Input
                      id={id}
                      type="url"
                      value={foodHappyCow}
                      onChange={e => setFoodHappyCow(e.target.value)}
                      placeholder="https://www.happycow.net/..."
                      className="border-sys-green/15 bg-sys-green/5"
                    />
                  )}
                </Field>
                <Field label="Official Website" className="mb-0">
                  {id => (
                    <Input
                      id={id}
                      type="url"
                      value={foodOfficial}
                      onChange={e => setFoodOfficial(e.target.value)}
                      placeholder="https://restaurant-site.com/..."
                      className="border-sys-blue/15 bg-sys-blue/5"
                    />
                  )}
                </Field>
              </div>
            )}

            <Field label="Description" className="mb-0">
              {id => (
                <TextArea
                  id={id}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add notes, tips, or details…"
                  rows={4}
                  className="resize-none leading-normal"
                />
              )}
            </Field>
          </>
        )}
      </div>
    </Sheet>
  );
}
