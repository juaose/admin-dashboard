/**
 * Report Utility Functions
 * Formatting, calculations, and helper functions for reports
 */

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format currency in Costa Rican Colones
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency in compact form (e.g., 1.5M)
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CR").format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date in Spanish locale
 */
export function formatDate(
  date: string | Date,
  formatStr: string = "PPP"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "PPP p");
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Get date range label
 */
export function getDateRangeLabel(startDate: Date, endDate: Date): string {
  const start = formatDate(startDate, "PP");
  const end = formatDate(endDate, "PP");

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Sort data by column
 */
export function sortData<T>(
  data: T[],
  column: keyof T,
  direction: "asc" | "desc"
): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Number comparison
    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return direction === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (direction === "asc") {
      return aStr.localeCompare(bStr, "es");
    } else {
      return bStr.localeCompare(aStr, "es");
    }
  });
}

/**
 * Filter data by search term across specified columns
 */
export function filterData<T>(
  data: T[],
  searchTerm: string,
  searchColumns: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return data;

  const searchLower = searchTerm.toLowerCase();

  return data.filter((row) =>
    searchColumns.some((column) => {
      const value = row[column];
      if (value == null) return false;
      return String(value)
        .toLowerCase()
        .includes(searchLower);
    })
  );
}

/**
 * Get quick date range
 *
 * IMPORTANT TIMEZONE BEHAVIOR (Costa Rica = UTC-6):
 * All dates are created in LOCAL browser time, which for Costa Rica users means:
 * - "Monday at 0hrs" in Costa Rica = Monday at 06:00 UTC
 * - "1st at 0hrs" in Costa Rica = 1st at 06:00 UTC
 *
 * This is correct because JavaScript Date objects use browser local time.
 * The API's costaRicaRangeToUTC function handles the UTC conversion.
 */
export function getQuickDateRange(
  type: "today" | "week" | "month" | "custom"
): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (type) {
    case "today":
      // Today: from 00:00 to 23:59 LOCAL time (which is 06:00-05:59 UTC for Costa Rica)
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      // This week: from Monday at 00:00 LOCAL time to now
      // For Costa Rica: Monday 00:00 local = Monday 06:00 UTC
      const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; otherwise go back (dayOfWeek - 1) days
      start.setDate(start.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      // This month: from 1st at 00:00 LOCAL time to now
      // For Costa Rica: 1st 00:00 local = 1st 06:00 UTC
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      // Return current date for both
      break;
  }

  return { start, end };
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void {
  // Create CSV header
  const headers = columns.map((col) => `"${col.label}"`).join(",");

  // Create CSV rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        // Handle different value types
        if (value == null) return '""';
        if (typeof value === "number") return value;
        // Escape quotes in strings
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  // Combine header and rows
  const csvContent = [headers, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Calculate summary statistics
 */
export function calculateSummaryStats(
  values: number[]
): {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
} {
  if (values.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    total,
    average,
    min,
    max,
    count: values.length,
  };
}
