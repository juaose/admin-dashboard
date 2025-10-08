"use client";

import { useState } from "react";
import { formatDateForAPI, getQuickDateRange } from "@/lib/reportUtils";

interface ReportFiltersProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onSearch?: (searchTerm: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
}

export default function ReportFilters({
  onDateRangeChange,
  onSearch,
  onRefresh,
  onExport,
  enableSearch = false,
  searchPlaceholder = "Buscar...",
  loading = false,
}: ReportFiltersProps) {
  // Initialize with today's date
  const today = new Date();
  const [startDate, setStartDate] = useState(formatDateForAPI(today));
  const [endDate, setEndDate] = useState(formatDateForAPI(today));
  const [searchTerm, setSearchTerm] = useState("");

  const handleQuickDate = (type: "today" | "week" | "month") => {
    const { start, end } = getQuickDateRange(type);
    const startStr = formatDateForAPI(start);
    const endStr = formatDateForAPI(end);

    setStartDate(startStr);
    setEndDate(endStr);
    onDateRangeChange(startStr, endStr);
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStartDate(value);
      onDateRangeChange(value, endDate);
    } else {
      setEndDate(value);
      onDateRangeChange(startDate, value);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Filtros
      </h3>

      {/* Date Range Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange("start", e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-brand-primary focus:border-transparent
                       transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange("end", e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-brand-primary focus:border-transparent
                       transition-colors"
            />
          </div>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Accesos Rápidos
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDate("today")}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Hoy
            </button>
            <button
              onClick={() => handleQuickDate("week")}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Ésta semana
            </button>
            <button
              onClick={() => handleQuickDate("month")}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Éste mes
            </button>
          </div>
        </div>
      </div>

      {/* Search and Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input (optional) */}
        {enableSearch && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-brand-primary focus:border-transparent
                       transition-colors"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 sm:items-end">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-alt text-white rounded-lg 
                       transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cargando...
                </>
              ) : (
                <>🔄 Actualizar</>
              )}
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 Exportar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
