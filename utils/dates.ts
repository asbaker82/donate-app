/** YYYY-MM-DD from a date-only or ISO timestamptz string. */
export function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Local noon Date for calendar fields (avoids UTC midnight off-by-one). */
export function parseCalendarDate(value: string): Date {
  return new Date(toDateOnly(value) + 'T12:00:00');
}

export function formatCalendarDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return parseCalendarDate(value).toLocaleDateString('en-US', options);
}
