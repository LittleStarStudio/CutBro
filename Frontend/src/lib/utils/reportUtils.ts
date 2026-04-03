/**
 * Utility functions for exporting reports to CSV/Excel format
 */

export interface ExportColumn {
  header: string;
  key: string;
  formatter?: (value: any) => string | number;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  summary?: {
    label: string;
    value: string | number;
  }[];
}

/**
 * Export data to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
  try {
    const { filename, columns, data, summary } = options;

    // Create headers
    const headers = columns.map(col => col.header);
    let csvContent = headers.join(",") + "\n";

    // Create rows
    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : value;
        return `"${formattedValue}"`;
      });
      csvContent += values.join(",") + "\n";
    });

    // Add summary if provided
    if (summary && summary.length > 0) {
      csvContent += "\n";
      csvContent += "SUMMARY\n";
      summary.forEach((item) => {
        csvContent += `"${item.label}","${item.value}"\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
    throw new Error("Failed to export data. Please try again.");
  }
}

/**
 * Generate filename with date range
 */
export function generateFilename(
  prefix: string,
  fromDate: string,
  toDate: string,
  extension: string = "csv"
): string {
  const from = fromDate.replace(/\//g, "-");
  const to = toDate.replace(/\//g, "-");
  return `${prefix}_${from}_to_${to}.${extension}`;
}

/**
 * Capitalize first letter of string
 */
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}