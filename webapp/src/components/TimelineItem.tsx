import React, { useState } from 'react';
import { MapPin, Plane, BedDouble, Navigation, CalendarClock, GripVertical, ChevronDown, ChevronUp, MountainSnow, TrainFront, Utensils, StickyNote, Car, Hash, DollarSign, CreditCard, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import Linkified from './Linkified';

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
        return { icon: <MountainSnow size={24} />, color: '#30D158', bg: 'rgba(48, 209, 88, 0.1)' };
      }

      switch (item.type) {
        case 'flight':   return { icon: <Plane size={24} />, color: '#0A84FF', bg: 'rgba(10, 132, 255, 0.1)' };
        case 'hotel':    return { 
          icon: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <BedDouble size={20} style={{ marginBottom: '0px' }} />
               <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.5px', marginTop: '-2px' }}>{isCheckout ? 'OUT' : 'IN'}</span>
            </div>
          ), 
          color: isCheckout ? '#FF3B30' : '#FF9F0A', 
          bg: isCheckout ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 159, 10, 0.1)' 
        };
        case 'rental-car': return { 
          icon: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <Car size={20} style={{ marginBottom: '0px' }} />
               <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.5px', marginTop: '-2px' }}>{isCheckout ? 'RET' : 'PKUP'}</span>
            </div>
          ),
          color: '#AF52DE', 
          bg: 'rgba(175, 82, 222, 0.1)' 
        };
        case 'activity': return { icon: <Navigation size={24} />, color: '#EBEBF5', bg: 'rgba(255, 255, 255, 0.05)' };
        case 'hike':
        case 'hiking':   return { icon: <MountainSnow size={24} />, color: '#30D158', bg: 'rgba(48, 209, 88, 0.1)' };
        case 'transit':  return { icon: <TrainFront size={24} />, color: '#5E5CE6', bg: 'rgba(94, 92, 230, 0.1)' };
        case 'food':     return { icon: <Utensils size={24} />, color: '#FF7000', bg: 'rgba(255, 112, 0, 0.1)' };
        case 'note':     return { icon: <StickyNote size={24} />, color: '#FFD60A', bg: 'rgba(255, 214, 10, 0.1)' };
        default:         return { icon: <CalendarClock size={24} />, color: '#EBEBF5', bg: 'rgba(255, 255, 255, 0.05)' };
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


  return (
    <div
      className={`travel-card fade-in ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      style={{
        borderLeft: `4px solid ${theme.color}`,
        backgroundColor: tintedBackgrounds ? theme.bg : undefined,
        overflow: 'hidden',
        maxHeight: isExpanded ? '1000px' : '200px',
        marginTop: (groupPosition === 'middle' || groupPosition === 'end') ? '-12px' : '0px',
        borderTopLeftRadius: (groupPosition === 'middle' || groupPosition === 'end') ? '0' : '20px',
        borderTopRightRadius: (groupPosition === 'middle' || groupPosition === 'end') ? '0' : '20px',
        borderBottomLeftRadius: (groupPosition === 'middle' || groupPosition === 'start') ? '0' : '20px',
        borderBottomRightRadius: (groupPosition === 'middle' || groupPosition === 'start') ? '0' : '20px',
        zIndex: groupPosition === 'start' ? 2 : groupPosition === 'middle' ? 1 : 0,
      }}
    >
      {(groupPosition === 'middle' || groupPosition === 'end') && (
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.05)', zIndex: 5 }} />
      )}
      {/* Top row: date label | times | drag handle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-label-secondary)', letterSpacing: '0.05em' }}>
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
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  fontSize: '10px', fontWeight: 800, color: '#FFF', 
                  background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
                title={itemWeather.condition}
              >
                <span style={{ color: '#FF9F0A' }}>H: {Math.round(itemWeather.tempHigh)}°</span>
                <span style={{ color: '#0A84FF' }}>L: {Math.round(itemWeather.tempLow)}°</span>
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: theme.color, background: theme.bg, padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
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
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--sys-label-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                {item.type === 'flight' ? 'LANDING' : 'END'} {getTimeLabel(item.endDate)}
                {(() => {
                  const s = item.startDate.split('T')[0];
                  const e = item.endDate.split('T')[0];
                  if (s === e) return null;
                  const d1 = new Date(s);
                  const d2 = new Date(e);
                  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
                  return diff > 0 ? <span style={{ color: '#0A84FF', marginLeft: '2px' }}>+{diff}</span> : null;
                })()}
              </div>
            )}
          </div>

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          backgroundColor: theme.bg,
          color: theme.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '12px',
          flexShrink: 0
        }}>
          {theme.icon}
        </div>

        {/* Title + location — flex:1, full width */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {item.type !== 'note' && (
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </h3>
          )}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start',
              cursor: (typeof item.location.latitude === 'number') ? 'pointer' : 'default',
              padding: '1px 0',
              transition: 'background 0.2s',
              overflow: 'hidden'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number') {
                setFocusedLocation({ lat: item.location.latitude, lng: item.location.longitude });
                navigate('/map');
              }
            }}
            onMouseEnter={e => {
               if (typeof item.location.latitude === 'number') e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => {
               e.currentTarget.style.background = 'transparent';
            }}
          >
            <MapPin size={12} color="var(--sys-label-tertiary)" style={{ marginRight: '5px', marginTop: '3px', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {item.location.name && item.location.name !== item.location.address && (
                <span style={{ fontSize: '13px', color: '#FFF', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.location.name}
                </span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--sys-label-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.location.address || item.location.name || 'No location'}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron (Hide for notes if they don't have confirmation/cost/paid info) */}
        {!(item.type === 'note' && !item.confirmationNumber && item.cost === undefined && item.paidAmount === undefined) && (
          <div
            style={{ padding: '8px', paddingLeft: '6px', opacity: 0.4, cursor: 'pointer', zIndex: 10, flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        )}
      </div>

      {item.type === 'note' && item.description && (
        <div style={{ 
          fontSize: '14px', color: 'var(--sys-label-secondary)', 
          lineHeight: '1.5', margin: '4px 0 8px 56px',
          maxHeight: '120px', overflowY: 'auto'
        }}>
          <Linkified text={item.description} />
        </div>
      )}

      {isExpanded && (
        <div className="expand-content" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {isCheckout ? (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF9F0A', background: 'rgba(255,159,10,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                {item.type === 'hotel' ? 'CHECK-IN' : 'PICKUP'} {getTimeLabel(item.startDate)}
                {item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) && ` (${getDayLabel(item.startDate)})`}
              </div>
            </div>
          ) : (item.type === 'hotel' || item.type === 'rental-car') && item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate) ? (
            // Hotel/rental checkout date: show in expanded view (not shown collapsed)
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sys-label-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px' }}>
                {item.type === 'hotel' ? 'CHECK-OUT' : 'RETURN'} {getTimeLabel(item.endDate)}
                {` (${getDayLabel(item.endDate)})`}
              </div>
            </div>
          ) : null}

          {(item.type === 'hiking' || item.type === 'hike') && item.hikeDetails && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(48, 209, 88, 0.15)', color: '#30D158', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                {item.hikeDetails.difficulty === 'Expert' ? '⬛ EXPERT' : item.hikeDetails.difficulty === 'Hard' ? '🟥 HARD' : item.hikeDetails.difficulty === 'Moderate' ? '🟦 MODERATE' : '🟩 EASY'}
              </div>
              {item.hikeDetails.distance && (
                <div style={{ background: 'rgba(255,255,255,0.06)', color: '#EBEBF5', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                  ↔️ {item.hikeDetails.distance}
                </div>
              )}
              {item.hikeDetails.elevation && (
                <div style={{ background: 'rgba(255,255,255,0.06)', color: '#EBEBF5', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                  ⛰️ +{item.hikeDetails.elevation}
                </div>
              )}
              {item.hikeDetails.duration && (
                <div style={{ background: 'rgba(255,255,255,0.06)', color: '#EBEBF5', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                  ⏱️ {item.hikeDetails.duration}
                </div>
              )}
              {item.hikeDetails.allTrailsLink && (
                <div 
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // window.top.open is often more reliable for bypassing shell restrictions in PWAs
                    const win = window.top || window;
                    win.open(item.hikeDetails!.allTrailsLink, '_blank', 'noopener,noreferrer');
                  }}
                  style={{ 
                    background: 'rgba(48, 209, 88, 0.25)', color: '#30D158', padding: '4px 12px', 
                    borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    border: '1px solid rgba(48, 209, 88, 0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  🔗 AllTrails
                </div>
              )}
            </div>
          )}

          {item.type !== 'note' && item.description && (
            <div style={{ 
              fontSize: '14px', color: 'var(--sys-label-secondary)', 
              lineHeight: '1.5', margin: '0 0 20px 0',
              maxHeight: '260px', overflowY: 'auto', paddingRight: '4px'
            }}>
              <Linkified text={item.description} />
            </div>
          )}

          {item.confirmationNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: 'var(--sys-label-secondary)' }}>
              <Hash size={14} />
              <span style={{ fontWeight: 600 }}>Confirmation:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{item.confirmationNumber}</span>
            </div>
          )}

          {(item.type === 'hotel' || item.type === 'rental-car' || item.type === 'flight') && (item.hotelDetails || item.rentalDetails || item.flightDetails) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {(item.hotelDetails?.refundable || item.rentalDetails?.refundable || item.flightDetails?.refundable) && (
                <div style={{ 
                  background: item.type === 'hotel' ? 'rgba(255, 159, 10, 0.15)' : 
                             item.type === 'rental-car' ? 'rgba(175, 82, 222, 0.15)' :
                             'rgba(10, 132, 255, 0.15)', 
                  color: item.type === 'hotel' ? '#FF9F0A' : 
                         item.type === 'rental-car' ? '#AF52DE' :
                         '#0A84FF', 
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 
                }}>
                  ✓ REFUNDABLE
                </div>
              )}
              {(item.hotelDetails?.refundableCutoffDate || item.rentalDetails?.refundableCutoffDate || item.flightDetails?.refundableCutoffDate) && (
                <div style={{ 
                  background: 'rgba(255, 159, 10, 0.15)', 
                  color: '#FF9F0A', 
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 
                }}>
                  ⌛ REFUND UNTIL {(() => {
                    const dStr = item.hotelDetails?.refundableCutoffDate || item.rentalDetails?.refundableCutoffDate || item.flightDetails?.refundableCutoffDate;
                    if (!dStr) return '';
                    const d = new Date(dStr.replace(/-/g, '/'));
                    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
                  })()}
                </div>
              )}
              {(item.hotelDetails?.bookingSource || item.rentalDetails?.bookingSource || item.flightDetails?.bookingSource) && (
                <div style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--sys-label-secondary)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>
                  via <span style={{ color: '#fff', fontWeight: 700 }}>{item.hotelDetails?.bookingSource || item.rentalDetails?.bookingSource || item.flightDetails?.bookingSource}</span>
                </div>
              )}
            </div>
          )}

          {(item.cost !== undefined || item.paidAmount !== undefined) && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              {item.cost !== undefined && item.cost !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--sys-label-secondary)' }}>
                  <DollarSign size={14} />
                  <span style={{ fontWeight: 600 }}>Cost:</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>${(item.cost || 0).toLocaleString()}</span>
                </div>
              )}
              {item.paidAmount !== undefined && item.paidAmount !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--sys-label-secondary)' }}>
                  <CreditCard size={14} />
                  <span style={{ fontWeight: 600 }}>Paid:</span>
                  <span style={{ color: (item.cost && item.paidAmount > item.cost) ? '#FF453A' : 'var(--sys-green)', fontWeight: 700 }}>
                    ${(item.paidAmount || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onPress(); }}
              className="details-btn btn-glass-blue"
              style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
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
              style={{ 
                width: '46px', height: '46px', borderRadius: '12px',
                color: 'var(--sys-red)', background: 'rgba(255, 69, 58, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', border: '1px solid rgba(255, 69, 58, 0.2)',
                cursor: 'pointer', flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
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
