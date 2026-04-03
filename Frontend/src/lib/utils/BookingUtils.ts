// ─── Date Helpers ─────────────────────────────────────────────────────────────

export interface CalendarDay {
  date: number;
  past: boolean;
}

/**
 * Returns an array of CalendarDay (or null for empty leading cells) for a
 * given year/month.  Weeks start on Sunday.
 */
export function buildCalendarDays(year: number, month: number): (CalendarDay | null)[] {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const cells: (CalendarDay | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date: d, past: date < todayStart });
  }

  return cells;
}

/**
 * Formats year / month / day as "YYYY-MM-DD".
 */
export function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Returns today as "YYYY-MM-DD".
 */
export function todayISO(): string {
  const t = new Date();
  return toISODate(t.getFullYear(), t.getMonth(), t.getDate());
}

// ─── Number Helpers ───────────────────────────────────────────────────────────

export const TAX_RATE = 0.1;

export function calcTax(subtotal: number): number {
  return parseFloat((subtotal * TAX_RATE).toFixed(2));
}

export function calcTotal(subtotal: number): number {
  return parseFloat((subtotal + calcTax(subtotal)).toFixed(2));
}

// ─── String / ID Helpers ──────────────────────────────────────────────────────

/**
 * Generates a short random booking reference, e.g. "RC2F4A".
 */
export function generateBookingRef(prefix = "RC"): string {
  return `#${prefix}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ─── Input Formatters ─────────────────────────────────────────────────────────

export function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}