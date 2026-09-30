import React, { useId, useState } from 'react';
import { MapPin, GripVertical, ChevronDown, ChevronUp, Hash, DollarSign, CreditCard, Trash2, Globe, Copy, Navigation, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import { getEventLabel, getItemTone, getItemTypeMeta } from '../core/itemTypes';
import { cn } from '../lib/cn';
import Linkified from './Linkified';
import { Button, IconButton, LinkChip } from './ui';
import { deleteWithUndo } from '../store/deleteWithUndo';
import { dayDiff, getDayKey, getDayLabel, getTimeLabel, nightsBetween } from '../utils/dates';
import { getDirectionsUrl } from '../utils/itinerary';
import { downloadIcs } from '../utils/ics';
import { toast } from '../store/useToastStore';

interface TimelineItemProps {
  item: ItineraryItem;
  index?: number;
  onPress: () => void;
  isDragging?: boolean;
  onGripTouchStart?: (e: React.TouchEvent) => void;
  isCheckout?: boolean;
  groupPosition?: 'start' | 'middle' | 'end' | 'single';
}

export default function TimelineItem({ item, onPress, onGripTouchStart, isCheckout = false, groupPosition }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const navigate = useNavigate();
  const setFocusedLocation = useTripStore(s => s.setFocusedLocation);
  const tintedBackgrounds = useTripStore(s => s.tintedBackgrounds);
  const weather = useTripStore(s => s.weather);
  const meta = getItemTypeMeta(item);
  const tone = getItemTone(item, isCheckout);
  const Icon = meta.icon;
  const eventDate = isCheckout && item.endDate ? item.endDate : item.startDate;
  const hasCoordinates = typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number';
  const eventLabel = getEventLabel(item, isCheckout);
  const shortLabel = isCheckout ? meta.endShort : meta.startShort;
  const canExpand = !(item.type === 'note' && !item.confirmationNumber && item.cost === undefined && item.paidAmount === undefined);

  const directionsUrl = getDirectionsUrl(item.location);

  const toggleExpanded = () => {
    if (canExpand) setIsExpanded(v => !v);
  };

  const copyConfirmation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.confirmationNumber) return;
    try {
      await navigator.clipboard.writeText(item.confirmationNumber);
      toast.success('Confirmation number copied');
    } catch {
      toast.error('Could not copy confirmation number');
    }
  };

  const addToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcs(item);
    toast.success('Calendar file downloaded');
  };

  const openLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasCoordinates || item.location.latitude === null || item.location.longitude === null) return;
    setFocusedLocation({ lat: item.location.latitude, lng: item.location.longitude });
    navigate('/map');
  };

  const locationContent = (
    <>
      <MapPin className="mt-[3px] mr-1.5 size-3 shrink-0 text-label-tertiary" />
      <div className="flex min-w-0 flex-col overflow-hidden text-left">
        {item.location.name && item.location.name !== item.location.address && (
          <span className="truncate text-footnote font-semibold text-label">{item.location.name}</span>
        )}
        <span className="truncate text-caption text-label-secondary">
          {item.location.address || item.location.name || 'No location'}
        </span>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        'travel-card fade-in relative overflow-hidden border-l-4 transition-all duration-300 ease-ios motion-reduce:transition-none',
        isExpanded && 'expanded max-h-[1000px]',
        !isExpanded && 'max-h-[200px]',
        tone.borderClass,
        tintedBackgrounds && tone.bgClass,
        (groupPosition === 'middle' || groupPosition === 'end') && '-mt-3 rounded-t-none',
        (groupPosition === 'middle' || groupPosition === 'start') && 'rounded-b-none',
        groupPosition === 'start' && 'z-[2]',
        groupPosition === 'middle' && 'z-[1]',
      )}
    >
      {(groupPosition === 'middle' || groupPosition === 'end') && (
        <div className="absolute inset-x-0 top-0 z-[5] h-px bg-white/5" />
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          className={cn(
            '-ml-2 flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-control px-2 text-left transition-colors hover:bg-white/6 motion-reduce:transition-none',
            !canExpand && 'cursor-default hover:bg-transparent',
          )}
          aria-expanded={canExpand ? isExpanded : undefined}
          aria-controls={canExpand ? detailsId : undefined}
          onClick={toggleExpanded}
          disabled={!canExpand}
        >
          <span className="whitespace-nowrap text-caption font-extrabold tracking-wide text-label-secondary">
            {getDayLabel(eventDate, 'long')}
          </span>

          {(() => {
            if (!weather || !hasCoordinates || !meta.weatherRelevant) return null;
            const dateKey = getDayKey(eventDate);
            const itemWeather = weather.forecast.find(f =>
              f.date === dateKey &&
              f.lat?.toFixed(3) === item.location.latitude?.toFixed(3) &&
              f.lon?.toFixed(3) === item.location.longitude?.toFixed(3)
            );
            if (!itemWeather) return null;

            return (
              <div
                className="flex items-center gap-1.5 rounded-chip border border-white/8 bg-white/6 px-2 py-0.5 text-caption font-extrabold text-label"
                title={itemWeather.condition}
              >
                <span className="text-sys-orange">H: {Math.round(itemWeather.tempHigh)}°</span>
                <span className="text-sys-blue">L: {Math.round(itemWeather.tempLow)}°</span>
              </div>
            );
          })()}
          {canExpand && (
            <span className="ml-auto shrink-0 text-label-secondary opacity-70">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className={cn('whitespace-nowrap rounded-chip px-2 py-0.5 text-caption font-extrabold', tone.textClass, tone.bgClass)}>
              {eventLabel}
              {item.type !== 'food' && ` ${getTimeLabel(eventDate)}`}
              {(() => {
                if (item.type === 'hotel' && !isCheckout && item.endDate) {
                  const nDays = nightsBetween(item.startDate, item.endDate);
                  if (nDays > 0) return ` (${nDays} ${nDays === 1 ? 'night' : 'nights'})`;
                }
                return '';
              })()}
            </div>
            {!isCheckout && item.endDate && item.endDate.includes('T') && item.type !== 'hotel' && item.type !== 'rental-car' && (
              <div className="whitespace-nowrap rounded-chip bg-white/6 px-2 py-0.5 text-caption font-bold text-label-secondary">
                {item.type === 'flight' ? 'LANDING' : 'END'} {getTimeLabel(item.endDate)}
                {(() => {
                  const diff = dayDiff(item.startDate, item.endDate);
                  return diff > 0 ? <span className="ml-0.5 text-sys-blue">+{diff}</span> : null;
                })()}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Drag to reorder"
            className="drag-handle text-label-tertiary"
            onClick={e => e.stopPropagation()}
            onTouchStart={onGripTouchStart}
          >
            <GripVertical size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0">
        <div className={cn('mr-3 flex size-11 shrink-0 items-center justify-center rounded-control', tone.bgClass, tone.textClass)}>
          <div className="flex flex-col items-center justify-center">
            <Icon size={shortLabel ? 20 : 24} />
            {shortLabel && <span className="-mt-0.5 text-[7px] font-black tracking-[0.5px]">{shortLabel}</span>}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          {item.type !== 'note' && (
            <h3 className="mb-0.5 truncate text-headline font-bold text-label">{item.title}</h3>
          )}
          {hasCoordinates ? (
            <button
              type="button"
              className="flex w-full items-start overflow-hidden rounded-chip py-px transition-colors hover:bg-white/6 motion-reduce:transition-none"
              onClick={openLocation}
            >
              {locationContent}
            </button>
          ) : (
            <div className="flex items-start overflow-hidden py-px">{locationContent}</div>
          )}
        </div>

      </div>

      {item.type === 'note' && item.description && (
        <div className="my-1 mb-2 ml-14 max-h-[120px] overflow-y-auto text-[14px] leading-6 text-label-secondary">
          <Linkified text={item.description} />
        </div>
      )}

      {isExpanded && (
        <div id={detailsId} className="expand-content mt-5 border-t border-white/5 pt-4">
          {isCheckout ? (
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-chip bg-type-hotel/10 px-2 py-0.5 text-caption font-bold text-type-hotel">
                {item.type === 'hotel' ? 'CHECK-IN' : 'PICKUP'} {getTimeLabel(item.startDate)}
                {item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) && ` (${getDayLabel(item.startDate, 'long')})`}
              </div>
            </div>
          ) : (item.type === 'hotel' || item.type === 'rental-car') && item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) ? (
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-chip bg-white/6 px-2 py-0.5 text-caption font-bold text-label-secondary">
                {item.type === 'hotel' ? 'CHECK-OUT' : 'RETURN'} {getTimeLabel(item.endDate)} ({getDayLabel(item.endDate, 'long')})
              </div>
            </div>
          ) : null}

          {(item.type === 'hiking' || item.type === 'hike') && item.hikeDetails && (
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="rounded-chip bg-sys-green/15 px-2.5 py-1 text-caption font-extrabold text-sys-green">
                {item.hikeDetails.difficulty === 'Expert' ? '⬛ EXPERT' : item.hikeDetails.difficulty === 'Hard' ? '🟥 HARD' : item.hikeDetails.difficulty === 'Moderate' ? '🟦 MODERATE' : '🟩 EASY'}
              </div>
              {item.hikeDetails.distance && <div className="rounded-chip bg-white/6 px-2.5 py-1 text-caption font-semibold text-label">↔️ {item.hikeDetails.distance}</div>}
              {item.hikeDetails.elevation && <div className="rounded-chip bg-white/6 px-2.5 py-1 text-caption font-semibold text-label">⛰️ +{item.hikeDetails.elevation}</div>}
              {item.hikeDetails.duration && <div className="rounded-chip bg-white/6 px-2.5 py-1 text-caption font-semibold text-label">⏱️ {item.hikeDetails.duration}</div>}
              {item.hikeDetails.allTrailsLink && (
                <LinkChip href={item.hikeDetails.allTrailsLink} tone="green" icon="🔗">AllTrails</LinkChip>
              )}
            </div>
          )}

          {item.type === 'food' && item.foodDetails && (item.foodDetails.happyCowUrl || item.foodDetails.officialUrl) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {item.foodDetails.happyCowUrl && <LinkChip href={item.foodDetails.happyCowUrl} tone="green" icon="🥗">HappyCow</LinkChip>}
              {item.foodDetails.officialUrl && <LinkChip href={item.foodDetails.officialUrl} tone="blue" icon={<Globe size={11} />}>Website</LinkChip>}
            </div>
          )}

          {item.type !== 'note' && item.description && (
            <div className="mb-5 max-h-[260px] overflow-y-auto pr-1 text-[14px] leading-6 text-label-secondary">
              <Linkified text={item.description} />
            </div>
          )}

          {item.confirmationNumber && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-footnote text-label-secondary">
              <Hash size={14} />
              <span className="font-semibold">Confirmation:</span>
              <span className="font-bold text-label">{item.confirmationNumber}</span>
              <Button variant="secondary" size="md" className="min-h-11 px-3" onClick={copyConfirmation}>
                <Copy size={15} />
                Copy
              </Button>
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {directionsUrl && (
              <LinkChip href={directionsUrl} tone="blue" icon={<Navigation size={13} />} className="min-h-11">
                Directions
              </LinkChip>
            )}
            <Button variant="secondary" size="md" className="min-h-11" onClick={addToCalendar}>
              <CalendarPlus size={16} />
              Add to calendar
            </Button>
          </div>

          {(item.type === 'hotel' || item.type === 'rental-car' || item.type === 'flight') && (item.hotelDetails || item.rentalDetails || item.flightDetails) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(item.hotelDetails?.refundable || item.rentalDetails?.refundable || item.flightDetails?.refundable) && (
                <div className={cn('rounded-chip px-2.5 py-1 text-caption font-extrabold', item.type === 'hotel' && 'bg-sys-orange/15 text-sys-orange', item.type === 'rental-car' && 'bg-sys-purple/15 text-sys-purple', item.type === 'flight' && 'bg-sys-blue/15 text-sys-blue')}>
                  ✓ REFUNDABLE
                </div>
              )}
              {(item.hotelDetails?.refundableCutoffDate || item.rentalDetails?.refundableCutoffDate || item.flightDetails?.refundableCutoffDate) && (
                <div className="rounded-chip bg-sys-orange/15 px-2.5 py-1 text-caption font-extrabold text-sys-orange">
                  ⌛ REFUND UNTIL {(() => {
                    const dStr = item.hotelDetails?.refundableCutoffDate || item.rentalDetails?.refundableCutoffDate || item.flightDetails?.refundableCutoffDate;
                    if (!dStr) return '';
                    const d = new Date(dStr.replace(/-/g, '/'));
                    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
                  })()}
                </div>
              )}
              {(item.hotelDetails?.bookingSource || item.rentalDetails?.bookingSource || item.flightDetails?.bookingSource) && (
                <div className="rounded-chip bg-white/6 px-2.5 py-1 text-caption font-semibold text-label-secondary">
                  via <span className="font-bold text-label">{item.hotelDetails?.bookingSource || item.rentalDetails?.bookingSource || item.flightDetails?.bookingSource}</span>
                </div>
              )}
            </div>
          )}

          {(item.cost !== undefined || item.paidAmount !== undefined) && (
            <div className="mb-4 flex flex-wrap gap-4">
              {item.cost !== undefined && item.cost !== null && (
                <div className="flex items-center gap-2 text-footnote text-label-secondary">
                  <DollarSign size={14} />
                  <span className="font-semibold">Cost:</span>
                  <span className="font-bold text-label">${(item.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {item.paidAmount !== undefined && item.paidAmount !== null && (
                <div className="flex items-center gap-2 text-footnote text-label-secondary">
                  <CreditCard size={14} />
                  <span className="font-semibold">Paid:</span>
                  <span className={cn('font-bold', item.cost && item.paidAmount > item.cost ? 'text-sys-red' : 'text-sys-green')}>
                    ${(item.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button block onClick={(e) => { e.stopPropagation(); onPress(); }}>Edit</Button>
            <IconButton
              aria-label={`Delete ${item.title}`}
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                deleteWithUndo('items', item.id, `"${item.title}"`);
              }}
            >
              <Trash2 size={18} />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
