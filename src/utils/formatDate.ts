const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * ISO `YYYY-MM-DD` (the value emitted by `<input type="date">`)
 * → human-readable `DD-MMM-YYYY` (e.g. `12-Apr-2026`).
 *
 * Returns the input unchanged if it doesn't match the ISO pattern,
 * so already-formatted strings or empty values pass through cleanly.
 */
export function formatDate(value: string): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  const [, year, month, day] = m;
  const monthIdx = Number(month) - 1;
  if (monthIdx < 0 || monthIdx > 11) return value;
  return `${day}-${MONTHS[monthIdx]}-${year}`;
}
