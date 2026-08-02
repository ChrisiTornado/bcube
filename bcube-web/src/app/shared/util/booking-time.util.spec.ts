import { toIsoDate, formatTimeOfDay, formatBookingTime, formatBookingTimeRange } from './booking-time.util';

describe('toIsoDate', () => {
  it('passes an already-ISO date string through unchanged', () => {
    expect(toIsoDate('2026-03-05')).toBe('2026-03-05');
  });

  it('converts a Date object to YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('pads single-digit month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 7))).toBe('2026-01-07');
  });

  it('parses a non-ISO date string via the Date constructor', () => {
    expect(toIsoDate('2026-03-05T14:30:00')).toBe('2026-03-05');
  });
});

describe('formatTimeOfDay', () => {
  it('formats a Date as 24h HH:mm in the given timezone', () => {
    const date = new Date('2026-03-05T14:30:00Z');
    expect(formatTimeOfDay(date, 'UTC')).toBe('14:30');
  });

  it('formats using the local timezone when none is given', () => {
    const date = new Date(2026, 2, 5, 9, 5);
    expect(formatTimeOfDay(date)).toBe('09:05');
  });
});

describe('formatBookingTime', () => {
  it('returns an empty string for a falsy value', () => {
    expect(formatBookingTime('')).toBe('');
  });

  it('slices a raw HH:mm string as-is', () => {
    expect(formatBookingTime('09:15')).toBe('09:15');
  });

  it('slices the first 5 characters of a longer non-datetime string', () => {
    expect(formatBookingTime('09:15:00')).toBe('09:15');
  });

  it('formats a full ISO datetime string via Intl in the given timezone', () => {
    expect(formatBookingTime('2026-03-05T14:30:00Z', 'UTC')).toBe('14:30');
  });

  it('falls back to slicing when the datetime string fails to parse', () => {
    expect(formatBookingTime('T-not-a-date')).toBe('T-not');
  });
});

describe('formatBookingTimeRange', () => {
  it('joins two HH:mm times with a hyphen', () => {
    expect(formatBookingTimeRange('09:00', '11:30')).toBe('09:00 - 11:30');
  });

  it('applies the given timezone to both ends of the range', () => {
    const range = formatBookingTimeRange('2026-03-05T09:00:00Z', '2026-03-05T11:00:00Z', 'UTC');
    expect(range).toBe('09:00 - 11:00');
  });
});
