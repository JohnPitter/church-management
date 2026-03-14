/**
 * Utility functions for handling dates without timezone offset issues.
 *
 * Problem: toISOString() converts to UTC, which shifts dates backwards
 * for negative UTC offsets (e.g., Brazil UTC-3). An input date of March 13
 * at 22:00 BRT becomes March 14 at 01:00 UTC, or March 12 at 21:00 UTC
 * depending on the direction.
 *
 * Solution: Always use local date components (getFullYear, getMonth, getDate)
 * instead of toISOString() for date-only values.
 */

/**
 * Formats a Date object to YYYY-MM-DD string using LOCAL timezone.
 * Use this instead of `date.toISOString().split('T')[0]`.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object in LOCAL timezone at noon.
 * Using noon (12:00) avoids any edge cases with DST transitions at midnight.
 * Use this instead of `new Date(dateString + 'T00:00:00')`.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Returns today's date as YYYY-MM-DD string in LOCAL timezone.
 * Use this instead of `new Date().toISOString().split('T')[0]`.
 */
export function todayLocalString(): string {
  return toLocalDateString(new Date());
}
