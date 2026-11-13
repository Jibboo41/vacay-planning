import ItemThumbnail from './ItemThumbnail';
import React, { useState } from 'react';
import { MapPin, Plane, BedDouble, Navigation, CalendarClock, GripVertical, ChevronDown, ChevronUp, MountainSnow, TrainFront, Utensils, StickyNote, Car, Hash, DollarSign, CreditCard, Trash2, Globe, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import Linkified from './Linkified';
import { ActivityBookingBadge, ActivityBookingTiming } from './ActivityBookingBadge';
import { supportsActivityBooking } from '../core/activityBooking';

interface TimelineItemProps {
  item: ItineraryItem;
  index?: number;
  onPress: () => void;
  isDragging?: boolean;
  onGripTouchStart?: (e: React.TouchEvent) => void;
  isCheckout?: boolean;
  groupPosition?: 'start' | 'middle' | 'end' | 'single';
}

export default function TimelineItem({ item, onPress, onGripTouchStart, isCheckout, groupPosition }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const setFocusedLocation = useTripStore(s => s.setFocusedLocation);
  const tintedBackgrounds = useTripStore(s => s.tintedBackgrounds);
  const weather = useTripStore(s => s.weather);

    const getTheme = () => {
      // Resilience: If hikeDetails exist, force it to be a hike theme regardless of type string
      if (item.hikeDetails) {
        return { icon: <MountainSnow size={24} />, color: 'var(--sys-green)', bg: 'rgba(48, 209, 88, 0.1)' };
      }

      switch (item.type) {
        case 'flight':   return { icon: <Plane size={24} />, color: 'var(--sys-blue)', bg: 'rgba(10, 132, 255, 0.1)' };
        case 'hotel':    return { 
          icon: (
            <div className="item-icon-stack">
               <BedDouble size={20} />
               <span>{isCheckout ? 'OUT' : 'IN'}</span>
            </div>
          ), 
          color: isCheckout ? 'var(--sys-red-alt)' : 'var(--sys-orange)',
          bg: isCheckout ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 159, 10, 0.1)' 
        };
        case 'rental-car': return { 
          icon: (
            <div className="item-icon-stack">
               <Car size={20} />
               <span>{isCheckout ? 'RET' : 'PKUP'}</span>
            </div>
          ),
          color: 'var(--sys-cyan)',
          bg: 'rgba(100, 210, 255, 0.1)' 
        };
        case 'activity': return { icon: <Navigation size={24} />, color: 'var(--sys-label-primary)', bg: 'rgba(var(--neutral-rgb), 0.05)' };
        case 'hike':
        case 'hiking':   return { icon: <MountainSnow size={24} />, color: 'var(--sys-green)', bg: 'rgba(48, 209, 88, 0.1)' };
        case 'transit':  return { icon: <TrainFront size={24} />, color: 'var(--sys-indigo)', bg: 'rgba(94, 92, 230, 0.1)' };
        case 'food':     return { icon: <Utensils size={24} />, color: 'var(--sys-purple)', bg: 'rgba(191, 90, 242, 0.1)' };
        case 'note':     return { icon: <StickyNote size={24} />, color: 'var(--sys-gray)', bg: 'rgba(142, 142, 147, 0.1)' };
        default:         return { icon: <CalendarClock size={24} />, color: 'var(--sys-label-primary)', bg: 'rgba(var(--neutral-rgb), 0.05)' };
      }
    };

  const theme = getTheme();

  const getDayLabel = (dateString: string) => {
    if (!dateString) return 'DATE TBD';
    // Force local interpretation by replacing dashes with slashes if no time present
    const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
    const d = new Date(clean);
    if (isNaN(d.getTime())) return 'DATE TBD';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      .toUpperCase();
  };

  const getTimeLabel = (dateString: string) => {
    if (!dateString.includes('T')) return '';
    const d = new Date(dateString);
    // Hide noon for notes or if explicitly requested as "timeless" logic
    if (item.type === 'note' && d.getHours() === 12 && d.getMinutes() === 0) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };


  const hasCoordinates = typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number';
  // Show the place name once: a second line is only worth it when there is a distinct address.
  const placeName = item.location.name && item.location.name !== item.location.address ? item.location.name : '';
  const addressLine = item.location.address || (placeName ? '' : 'No location');
  const cardClassName = [
    'travel-card fade-in',
    isExpanded && 'expanded',
    item.isStarred && 'travel-card--starred',
    tintedBackgrounds && 'travel-card--tinted',
    groupPosition && groupPosition !== 'single' && `travel-card--group-${groupPosition}`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      style={{ '--item-color': theme.color, '--item-tint': theme.bg } as React.CSSProperties}
    >
      {(groupPosition === 'middle' || groupPosition === 'end') && <div className="travel-card__seam" />}
      {/* Top row: date label | times | drag handle */}
      <div className="travel-card__meta">
        <div className="travel-card__meta-group">
          <span className="travel-card__date">
            {getDayLabel(isCheckout && item.endDate ? item.endDate : item.startDate)}
          </span>

          {/* Weather Badge */}
          {(() => {
            if (!weather || !item.location.latitude || !item.location.longitude) return null;
            if (item.type !== 'hotel' && item.type !== 'activity' && item.type !== 'hiking' && item.type !== 'hike') return null;

            const dateKey = getDayKey(isCheckout && item.endDate ? item.endDate : item.startDate);
            const itemWeather = weather.forecast.find(f =>
              f.date === dateKey &&
              f.lat?.toFixed(3) === item.location.latitude?.toFixed(3) &&
              f.lon?.toFixed(3) === item.location.longitude?.toFixed(3)
            );

            if (!itemWeather) return null;

            return (
              <div className="item-chip" title={itemWeather.condition}>
                <span className="temp-high">H: {Math.round(itemWeather.tempHigh)}°</span>
                <span className="temp-low">L: {Math.round(itemWeather.tempLow)}°</span>
              </div>
            );
          })()}
        </div>

        <div className="travel-card__meta-group travel-card__meta-group--end">
          <div className="item-chip item-chip--tone">
            {item.type === 'hotel' ? (isCheckout ? 'CHECK-OUT' : 'CHECK-IN') :
              item.type === 'rental-car' ? (isCheckout ? 'RETURN' : 'PICKUP') :
              item.type === 'food' ? (item.foodDetails?.mealType?.toUpperCase() || 'DINING') :
              item.type === 'flight' ? 'TAKEOFF' :
              item.type === 'note' ? item.title.toUpperCase() : 'START'}
            {item.type !== 'food' && ` ${getTimeLabel(isCheckout && item.endDate ? item.endDate : item.startDate)}`}
            {(() => {
              if (item.type === 'hotel' && !isCheckout && item.endDate) {
                const nDays = Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24));
                if (nDays > 0) return ` (${nDays} ${nDays === 1 ? 'night' : 'nights'})`;
              }
              return '';
            })()}
          </div>
          {!isCheckout && item.endDate && item.endDate.includes('T') &&
            item.type !== 'hotel' && item.type !== 'rental-car' && (
            <div className="item-chip">
              {item.type === 'flight' ? 'LANDING' : 'END'} {getTimeLabel(item.endDate)}
              {(() => {
                const s = item.startDate.split('T')[0];
                const e = item.endDate.split('T')[0];
                if (s === e) return null;
                const d1 = new Date(s);
                const d2 = new Date(e);
                const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
                return diff > 0 ? <span className="item-chip__offset">+{diff}</span> : null;
              })()}
            </div>
          )}

          <div
            className="drag-handle"
            onClick={e => e.stopPropagation()}
            onTouchStart={onGripTouchStart}
          >
            <GripVertical size={16} />
          </div>
        </div>
      </div>

      {/* Body row: icon | title+location | chevron */}
      <div className="travel-card__body">
        <ItemThumbnail imageUrl={item.imageUrl} title={item.title} icon={theme.icon} color={theme.color} background={theme.bg} onEdit={onPress} />

        {/* Title + location — flex:1, full width */}
        <div className="travel-card__main">
          {item.type !== 'note' && (
            <div className="travel-card__title-row">
              <h3 className="travel-card__title">
                {item.title}
              </h3>
              {supportsActivityBooking(item.type) && <ActivityBookingBadge item={item} onEdit={onPress} />}
              <div
                className={`travel-card__star${item.isStarred ? ' travel-card__star--on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  useTripStore.getState().updateItem(item.id, { isStarred: !item.isStarred });
                }}
                title={item.isStarred ? "Remove preferred activity star" : "Mark as preferred activity for the day"}
              >
                <Star size={16} fill={item.isStarred ? 'currentColor' : 'none'} />
              </div>
            </div>
          )}
          <div
            className={`travel-card__location${hasCoordinates ? ' travel-card__location--link' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number') {
                setFocusedLocation({ lat: item.location.latitude, lng: item.location.longitude });
                navigate('/map');
              }
            }}
          >
            <MapPin size={12} />
            <div className="travel-card__location-text">
              {placeName && <span className="travel-card__place">{placeName}</span>}
              {addressLine && <span className="travel-card__address">{addressLine}</span>}
            </div>
          </div>
        </div>

        {/* Chevron (Hide for notes if they don't have confirmation/cost/paid info) */}
        {!(item.type === 'note' && !item.confirmationNumber && item.cost === undefined && item.paidAmount === undefined) && (
          <div
            className="travel-card__chevron"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        )}
      </div>

      {supportsActivityBooking(item.type) && <ActivityBookingTiming item={item} />}

      {item.type === 'note' && item.description && (
        <div className="travel-card__note">
          <Linkified text={item.description} />
        </div>
      )}

      {isExpanded && (
        <div className="expand-content travel-card__details">
          {isCheckout ? (
            <div className="travel-card__chips">
              <div className="item-chip item-chip--md item-chip--tone tone-orange">
                {item.type === 'hotel' ? 'CHECK-IN' : 'PICKUP'} {getTimeLabel(item.startDate)}
                {item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) && ` (${getDayLabel(item.startDate)})`}
              </div>
            </div>
          ) : (item.type === 'hotel' || item.type === 'rental-car') && item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) ? (
            // Hotel/rental checkout date: show in expanded view (not shown collapsed)
            <div className="travel-card__chips">
              <div className="item-chip item-chip--md">
                {item.type === 'hotel' ? 'CHECK-OUT' : 'RETURN'} {getTimeLabel(item.endDate)}
                {` (${getDayLabel(item.endDate)})`}
              </div>
            </div>
          ) : null}

          {(item.type === 'hiking' || item.type === 'hike') && item.hikeDetails && (
            <div className="travel-card__chips">
              <div className="item-chip item-chip--md item-chip--tone tone-green">
                {item.hikeDetails.difficulty === 'Expert' ? '⬛ EXPERT' : item.hikeDetails.difficulty === 'Hard' ? '🟥 HARD' : item.hikeDetails.difficulty === 'Moderate' ? '🟦 MODERATE' : '🟩 EASY'}
              </div>
              {item.hikeDetails.distance && (
                <div className="item-chip item-chip--md item-chip--strong">
                  ↔️ {item.hikeDetails.distance}
                </div>
              )}
              {item.hikeDetails.elevation && (
                <div className="item-chip item-chip--md item-chip--strong">
                  ⛰️ +{item.hikeDetails.elevation}
                </div>
              )}
              {item.hikeDetails.duration && (
                <div className="item-chip item-chip--md item-chip--strong">
                  ⏱️ {item.hikeDetails.duration}
                </div>
              )}
              {item.hikeDetails.allTrailsLink && (
                <div
                  role="button"
                  className="item-chip item-chip--md item-chip--tone item-chip--link tone-green"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // window.top.open is often more reliable for bypassing shell restrictions in PWAs
                    const win = window.top || window;
                    win.open(item.hikeDetails!.allTrailsLink, '_blank', 'noopener,noreferrer');
                  }}
                >
                  🔗 AllTrails
                </div>
              )}
            </div>
          )}

          {item.type === 'food' && item.foodDetails && (item.foodDetails.happyCowUrl || item.foodDetails.officialUrl) && (
            <div className="travel-card__chips">
              {item.foodDetails.happyCowUrl && (
                <div
                  role="button"
                  className="item-chip item-chip--md item-chip--tone item-chip--link tone-green"
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    window.open(item.foodDetails!.happyCowUrl!, '_blank', 'noopener,noreferrer');
                  }}
                >
                  🥗 HappyCow
                </div>
              )}
              {item.foodDetails.officialUrl && (
                <div
                  role="button"
                  className="item-chip item-chip--md item-chip--tone item-chip--link tone-blue"
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    window.open(item.foodDetails!.officialUrl!, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Globe size={11} /> Website
                </div>
              )}
            </div>
          )}

          {item.type !== 'note' && item.description && (
            <div className="travel-card__description">
              <Linkified text={item.description} />
            </div>
          )}

          {item.confirmationNumber && (
            <div className="travel-card__facts">
              <div className="travel-card__fact">
                <Hash size={14} />
                <span>Confirmation:</span>
                <strong>{item.confirmationNumber}</strong>
              </div>
            </div>
          )}

          {(item.type === 'hotel' || item.type === 'rental-car' || item.type === 'flight') && (item.hotelDetails || item.rentalDetails || item.flightDetails) && (
            <div className="travel-card__chips">
              {(item.hotelDetails?.refundable || item.rentalDetails?.refundable || item.flightDetails?.refundable) && (
                <div className={`item-chip item-chip--md item-chip--tone ${item.type === 'hotel' ? 'tone-orange' : item.type === 'rental-car' ? 'tone-purple' : 'tone-blue'}`}>
                  ✓ REFUNDABLE
                </div>
              )}
              {(item.hotelDetails?.refundableCutoffDate || item.rentalDetails?.refundableCutoffDate || item.flightDetails?.refundableCutoffDate) && (
                <div className="item-chip item-chip--md item-chip--tone tone-orange">
                  ⌛ REFUND UNTIL {(() => {
                    const dStr = item.hotelDetails?.refundableCutoffDate || item.rentalDetails?.refundableCutoffDate || item.flightDetails?.refundableCutoffDate;
                    if (!dStr) return '';
                    const d = new Date(dStr.replace(/-/g, '/'));
                    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
                  })()}
                </div>
              )}
              {(item.hotelDetails?.bookingSource || item.rentalDetails?.bookingSource || item.flightDetails?.bookingSource) && (
                <div className="item-chip item-chip--md">
                  via <strong>{item.hotelDetails?.bookingSource || item.rentalDetails?.bookingSource || item.flightDetails?.bookingSource}</strong>
                </div>
              )}
            </div>
          )}

          {(item.cost !== undefined || item.paidAmount !== undefined) && (
            <div className="travel-card__facts">
              {item.cost !== undefined && item.cost !== null && (
                <div className="travel-card__fact">
                  <DollarSign size={14} />
                  <span>Cost:</span>
                  <strong>${(item.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}
              {item.paidAmount !== undefined && item.paidAmount !== null && (
                <div className="travel-card__fact">
                  <CreditCard size={14} />
                  <span>Paid:</span>
                  <strong className={(item.cost && item.paidAmount > item.cost) ? 'is-over' : 'is-paid'}>
                    ${(item.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>
          )}

          <div className="travel-card__actions">
            <button
              onClick={(e) => { e.stopPropagation(); onPress(); }}
              className="details-btn btn btn--tonal btn--grow"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${item.title}"?`)) {
                  useTripStore.getState().deleteItem(item.id);
                }
              }}
              className="icon-btn icon-btn--lg icon-btn--danger"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getDayKey(dateString: string) {
  if (!dateString) return '';
  // Force local interpretation for date-only strings to avoid UTC-midnight jumping to previous day
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
