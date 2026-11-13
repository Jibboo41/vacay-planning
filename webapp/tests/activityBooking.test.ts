import { describe, expect, it } from 'vitest';
import { bookingOpensOn, safeBookingUrl, validateActivityBooking } from '../src/core/activityBooking';

describe('activity booking windows', () => {
  it('subtracts days and weeks without shifting calendar dates', () => {
    expect(bookingOpensOn('2027-07-02T19:00:00', { amount: 90, unit: 'days' })).toBe('2027-04-03');
    expect(bookingOpensOn('2027-01-08T10:00:00', { amount: 2, unit: 'weeks' })).toBe('2026-12-25');
    expect(bookingOpensOn('2027-07-02', { amount: 0, unit: 'days' })).toBe('2027-07-02');
  });
  it('clamps month-based windows to the last valid day, including leap years', () => {
    expect(bookingOpensOn('2027-07-31', { amount: 1, unit: 'months' })).toBe('2027-06-30');
    expect(bookingOpensOn('2028-03-31', { amount: 1, unit: 'months' })).toBe('2028-02-29');
    expect(bookingOpensOn('2027-03-31', { amount: 1, unit: 'months' })).toBe('2027-02-28');
  });
  it('keeps an unknown window unknown and rejects fractional or negative windows', () => {
    expect(bookingOpensOn('2027-07-02')).toBeUndefined();
    for (const amount of [-1, 1.5, Infinity, 1e25]) {
      expect(bookingOpensOn('2027-07-02', { amount, unit: 'days' })).toBeUndefined();
      expect(() => validateActivityBooking({ status: 'not-booked', opensBefore: { amount, unit: 'days' } }, '2027-07-02')).toThrow();
    }
  });
  it('rejects deadlines outside the activity booking window', () => {
    expect(() => validateActivityBooking({ status: 'not-booked', bookBy: '2027-07-03' }, '2027-07-02')).toThrow();
    expect(() => validateActivityBooking({ status: 'not-booked', bookBy: '2027-04-01', opensBefore: { amount: 90, unit: 'days' } }, '2027-07-02')).toThrow();
    expect(() => validateActivityBooking({ status: 'not-booked', bookBy: '2027-02-30' }, '2027-07-02')).toThrow();
  });
  it('does not retain obsolete not-booked details when booked or not required', () => {
    expect(validateActivityBooking({ status: 'booked', bookBy: '2027-07-01' }, '2027-07-02')).toEqual({ status: 'booked' });
    expect(validateActivityBooking({ status: 'not-required', opensBefore: { amount: 90, unit: 'days' } }, '2027-07-02')).toEqual({ status: 'not-required' });
  });
});

describe('booking links', () => {
  it('accepts normal booking sites and rejects executable links', () => {
    expect(safeBookingUrl(' https://example.com/book ')).toBe('https://example.com/book');
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://user:password@example.com', 'book tickets']) expect(() => safeBookingUrl(url)).toThrow();
  });
});
