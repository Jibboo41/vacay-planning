import type { ActivityBooking } from '../core/models';
import { bookingDateLabel, bookingOpensOn } from '../core/activityBooking';
import { BOOKING_STATUSES } from './activityBookingStatuses';

interface Props { value?: ActivityBooking; startDate: string; onChange: (value?: ActivityBooking) => void; }

export default function ActivityBookingFields({ value, startDate, onChange }: Props) {
  const opens = bookingOpensOn(startDate, value?.opensBefore);
  return <section className="activity-booking-fields" aria-label="Activity booking">
    <div className="activity-booking-fields__heading"><h3>Booking</h3>{value && <button type="button" onClick={() => onChange(undefined)}>Clear status</button>}</div>
    <div className="booking-status-options" role="group" aria-label="Booking status">
      {BOOKING_STATUSES.map(({ value: status, label, Icon }) => <button key={status} type="button" className={`booking-status-option booking-status--${status}`} aria-pressed={value?.status === status} onClick={() => onChange({ ...value, status })}><Icon size={19} aria-hidden="true" />{label}</button>)}
    </div>
    {value?.status === 'not-booked' && <>
      <div className="booking-window-fields">
        <label className="edit-field-group"><span className="edit-field-label">Booking opens how far ahead?</span><input className="edit-field-input" type="number" min="0" step="1" placeholder="e.g. 90" value={value.opensBefore?.amount ?? ''} onChange={event => onChange({ ...value, opensBefore: event.target.value === '' ? undefined : { amount: Number(event.target.value), unit: value.opensBefore?.unit || 'days' } })} /></label>
        <label className="edit-field-group"><span className="edit-field-label">Window unit</span><select className="edit-field-input" value={value.opensBefore?.unit || 'days'} onChange={event => onChange({ ...value, opensBefore: { amount: value.opensBefore?.amount ?? 0, unit: event.target.value as 'days' | 'weeks' | 'months' } })}><option value="days">Days before</option><option value="weeks">Weeks before</option><option value="months">Months before</option></select></label>
      </div>
      {opens && <p className="field-hint">Booking opens {bookingDateLabel(opens)}.</p>}
      <label className="edit-field-group"><span className="edit-field-label">Book by <span className="field-optional">(optional deadline)</span></span><input className="edit-field-input" type="date" value={value.bookBy || ''} max={startDate.slice(0, 10)} onChange={event => onChange({ ...value, bookBy: event.target.value || undefined })} /></label>
      <label className="edit-field-group"><span className="edit-field-label">Booking link</span><input className="edit-field-input" type="url" placeholder="https://…" value={value.url || ''} onChange={event => onChange({ ...value, url: event.target.value })} /></label>
    </>}
  </section>;
}
