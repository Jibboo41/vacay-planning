import { CheckCircle2, CircleX, CircleMinus } from 'lucide-react';

export const BOOKING_STATUSES = [
  { value: 'booked', label: 'Booked', Icon: CheckCircle2 },
  { value: 'not-booked', label: 'Not booked', Icon: CircleX },
  { value: 'not-required', label: 'Booking not required', Icon: CircleMinus },
] as const;
