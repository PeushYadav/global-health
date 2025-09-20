// utils/date.ts
export const TZ = 'Asia/Kolkata';

// Stable "YYYY-MM-DD" in a fixed time zone (en-CA yields ISO date shape)
export const ymdLocal = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);

// Human header like "Saturday, September 20" with fixed time zone/locale
export const headerLocal = (d: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(d);
