/**
 * Search in object by multiple fields
 * @param obj - Object to search in
 * @param query - Search query string
 * @param fields - Array of field names to search in
 * @returns true if query matches any field
 */
export function searchInObject(
  obj: any,
  query: string,
  fields: string[]
): boolean {
  if (!query) return true;

  const lowerQuery = query.toLowerCase();

  return fields.some((field) => {
    const value = obj[field];
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(lowerQuery);
  });
}

/**
 * Filter by field value
 * @param item - Item to filter
 * @param field - Field name to check
 * @param filterValue - Filter value ("all" means no filter)
 * @returns true if item matches filter
 */
export function filterByField(
  item: any,
  field: string,
  filterValue: string
): boolean {
  if (filterValue === "all") return true;
  return item[field] === filterValue;
}

/**
 * Capitalize first letter of a string
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 */
export function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format date time string
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format currency (Indonesian Rupiah)
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separator
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Format number to compact notation (K, M, B)
 * @param value - Number or pre-formatted string
 * @returns Compact formatted string
 */
export const formatCompactNumber = (value: number | string): string => {
  if (typeof value === "string") return value;
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (value >= 1_000_000)     return (value / 1_000_000).toFixed(1).replace(/\.0$/, "")     + "M";
  if (value >= 1_000)         return (value / 1_000).toFixed(1).replace(/\.0$/, "")         + "K";
  return new Intl.NumberFormat("id-ID").format(value);
};