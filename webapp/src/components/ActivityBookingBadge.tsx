import { CircleHelp, CalendarClock, ExternalLink } from 'lucide-react';
import type { ItineraryItem } from '../core/models';
import { bookingDateLabel, bookingOpensOn, safeBookingUrl } from '../core/activityBooking';
import { BOOKING_STATUSES } from './activityBookingStatuses';

export function ActivityBookingBadge({ item, onEdit }: { item: ItineraryItem; onEdit: () => void }) {
  const status = BOOKING_STATUSES.find(entry => entry.value === item.activityBooking?.status);
  const Icon = status?.Icon || CircleHelp;
  return <button type="button" className={`activity-booking-badge booking-status--${status?.value || 'unset'}`} title={status?.label || 'Set booking status'} aria-label={`${status?.label || 'Set booking status'}: ${item.title}`} onClick={event => { event.stopPropagation(); onEdit(); }}><Icon size={19} aria-hidden="true" /></button>;
}

export function ActivityBookingTiming({ item }: { item: ItineraryItem }) {
  const booking = item.activityBooking;
  if (booking?.status !== 'not-booked') return null;
  const opens = bookingOpensOn(item.startDate, booking.opensBefore);
  let url = '';
  try { url = safeBookingUrl(booking.url || ''); } catch { /* Don't render an unsafe imported link. */ }
  return <div className="activity-booking-timing">
    <div><CalendarClock size={16} aria-hidden="true" /><span>
      {opens && <>Booking opens <strong>{bookingDateLabel(opens)}</strong>{booking.opensBefore && <span className="booking-lead-time"> · {booking.opensBefore.amount} {booking.opensBefore.unit} ahead</span>}</>}
      {booking.bookBy && <span className="booking-deadline">Book by <strong>{bookingDateLabel(booking.bookBy)}</strong></span>}
      {!opens && !booking.bookBy && 'Not booked · Booking timing not set'}
    </span></div>
    {url && <a href={url} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}><ExternalLink size={14} aria-hidden="true" />Book</a>}
  </div>;
}
