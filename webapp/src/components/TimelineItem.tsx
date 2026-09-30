import React, { useState } from 'react';
import { MapPin, GripVertical, ChevronDown, ChevronUp, Hash, DollarSign, CreditCard, Trash2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import { getEventLabel, getItemTone, getItemTypeMeta } from '../core/itemTypes';
import { cn } from '../lib/cn';
import Linkified from './Linkified';
import { Button, IconButton, LinkChip } from './ui';

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

  const toggleExpanded = () => setIsExpanded(v => !v);

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
      onClick={toggleExpanded}
    >
      {(groupPosition === 'middle' || groupPosition === 'end') && (
        <div className="absolute inset-x-0 top-0 z-[5] h-px bg-white/5" />
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="whitespace-nowrap text-caption font-extrabold tracking-wide text-label-secondary">
            {getDayLabel(eventDate)}
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
        </div>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className={cn('whitespace-nowrap rounded-chip px-2 py-0.5 text-caption font-extrabold', tone.textClass, tone.bgClass)}>
              {eventLabel}
              {item.type !== 'food' && ` ${getTimeLabel(eventDate)}`}
              {(() => {
                if (item.type === 'hotel' && !isCheckout && item.endDate) {
                  const nDays = Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24));
                  if (nDays > 0) return ` (${nDays} ${nDays === 1 ? 'night' : 'nights'})`;
                }
                return '';
              })()}
            </div>
            {!isCheckout && item.endDate && item.endDate.includes('T') && item.type !== 'hotel' && item.type !== 'rental-car' && (
              <div className="whitespace-nowrap rounded-chip bg-white/6 px-2 py-0.5 text-caption font-bold text-label-secondary">
                {item.type === 'flight' ? 'LANDING' : 'END'} {getTimeLabel(item.endDate)}
                {(() => {
                  const s = item.startDate.split('T')[0];
                  const e = item.endDate.split('T')[0];
                  if (s === e) return null;
                  const d1 = new Date(s);
                  const d2 = new Date(e);
                  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
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

        {canExpand && (
          <IconButton
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
            aria-expanded={isExpanded}
            variant="ghost"
            size="sm"
            className="z-10 shrink-0 opacity-60"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </IconButton>
        )}
      </div>

      {item.type === 'note' && item.description && (
        <div className="my-1 mb-2 ml-14 max-h-[120px] overflow-y-auto text-[14px] leading-6 text-label-secondary">
          <Linkified text={item.description} />
        </div>
      )}

      {isExpanded && (
        <div className="expand-content mt-5 border-t border-white/5 pt-4">
          {isCheckout ? (
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-chip bg-type-hotel/10 px-2 py-0.5 text-caption font-bold text-type-hotel">
                {item.type === 'hotel' ? 'CHECK-IN' : 'PICKUP'} {getTimeLabel(item.startDate)}
                {item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) && ` (${getDayLabel(item.startDate)})`}
              </div>
            </div>
          ) : (item.type === 'hotel' || item.type === 'rental-car') && item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) ? (
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-chip bg-white/6 px-2 py-0.5 text-caption font-bold text-label-secondary">
                {item.type === 'hotel' ? 'CHECK-OUT' : 'RETURN'} {getTimeLabel(item.endDate)} ({getDayLabel(item.endDate)})
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
            <div className="mb-3 flex items-center gap-2 text-footnote text-label-secondary">
              <Hash size={14} />
              <span className="font-semibold">Confirmation:</span>
              <span className="font-bold text-label">{item.confirmationNumber}</span>
            </div>
          )}

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
                if (window.confirm(`Delete "${item.title}"?`)) {
                  useTripStore.getState().deleteItem(item.id);
                }
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

function getDayLabel(dateString: string) {
  if (!dateString) return 'DATE TBD';
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return 'DATE TBD';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function getTimeLabel(dateString: string) {
  if (!dateString.includes('T')) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getDayKey(dateString: string) {
  if (!dateString) return '';
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
