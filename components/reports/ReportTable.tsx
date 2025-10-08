"use client";

import { useState, useMemo } from "react";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatPercentage,
  sortData,
  filterData,
} from "@/lib/reportUtils";

export interface ColumnConfig<T = any> {
  key: string;
  label: string;
  format?: "currency" | "date" | "number" | "percentage" | "text";
  sortable?: boolean;
  filterable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

interface ReportTableProps<T = any> {
  data: T[];
  columns: ColumnConfig<T>[];
  entityName: string;
  groupingLabel?: string;
  loading?: boolean;
  emptyMessage?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  breakpoint?: "sm" | "md" | "lg";
  defaultSort?: { column: string; direction: "asc" | "desc" };
}

export default function ReportTable<T extends Record<string, any>>({
  data,
  columns,
  entityName,
  groupingLabel,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  enableSearch = true,
  searchPlaceholder = "Buscar...",
  breakpoint = "md",
  defaultSort,
}: ReportTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: "asc" | "desc";
  }>(defaultSort || { column: null, direction: "asc" });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Get filterable columns
  const filterableColumns = useMemo(
    () =>
      columns
        .filter((col) => col.filterable !== false)
        .map((col) => col.key as keyof T),
    [columns]
  );

  // Apply filtering
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return filterData(data, searchTerm, filterableColumns);
  }, [data, searchTerm, filterableColumns]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.column) return filteredData;
    return sortData(
      filteredData,
      sortConfig.column as keyof T,
      sortConfig.direction
    );
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  // Reset to page 1 when search or sort changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  const handleSort = (column: string) => {
    const col = columns.find((c) => c.key === column);
    if (col?.sortable === false) return;

    let direction: "asc" | "desc" = "asc";
    if (sortConfig.column === column && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ column, direction });
  };

  const formatValue = (value: any, format?: string): string => {
    if (value == null) return "-";

    switch (format) {
      case "currency":
        return formatCurrency(Number(value));
      case "number":
        return formatNumber(Number(value));
      case "date":
        return formatDate(value, "PP");
      case "percentage":
        return formatPercentage(Number(value));
      case "text":
      default:
        return String(value);
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      case "left":
      default:
        return "text-left";
    }
  };

  const getHeaderJustifyClass = (align?: string) => {
    switch (align) {
      case "center":
        return "justify-center";
      case "right":
        return "justify-end";
      case "left":
      default:
        return "justify-start";
    }
  };

  const desktopShowClass = {
    sm: "sm:block",
    md: "md:block",
    lg: "lg:block",
  }[breakpoint];

  const mobileShowClass = {
    sm: "sm:hidden",
    md: "md:hidden",
    lg: "lg:hidden",
  }[breakpoint];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Table Header with Search and Pagination Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {sortedData.length} {groupingLabel || entityName}
          </h3>
          {totalPages > 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)} de{" "}
              {sortedData.length}
            </p>
          )}
        </div>

        {enableSearch && (
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-brand-primary focus:border-transparent
                       transition-colors text-sm"
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {/* Desktop Table View */}
      {sortedData.length > 0 && (
        <>
          <div
            className={`hidden ${desktopShowClass} overflow-x-auto max-h-[600px] overflow-y-auto`}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 ${getAlignClass(column.align)} ${
                        column.sortable !== false
                          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          : ""
                      }`}
                      onClick={() =>
                        column.sortable !== false && handleSort(column.key)
                      }
                      style={{ width: column.width }}
                    >
                      <div
                        className={`flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ${getHeaderJustifyClass(
                          column.align
                        )}`}
                      >
                        <span>{column.label}</span>
                        {column.sortable !== false && (
                          <span className="text-gray-400">
                            {sortConfig.column === column.key ? (
                              sortConfig.direction === "asc" ? (
                                "↑"
                              ) : (
                                "↓"
                              )
                            ) : (
                              <span className="opacity-50">↕</span>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 
                             hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${getAlignClass(
                          column.align
                        )}`}
                      >
                        {formatValue(row[column.key], column.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className={`block ${mobileShowClass} space-y-4`}>
            {/* Sort Selector for Mobile */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                value={
                  sortConfig.column
                    ? `${sortConfig.column}-${sortConfig.direction}`
                    : ""
                }
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [column, direction] = e.target.value.split("-");
                  setSortConfig({
                    column,
                    direction: direction as "asc" | "desc",
                  });
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Sin ordenar</option>
                {columns
                  .filter((col) => col.sortable !== false)
                  .flatMap((col) => [
                    <option key={`${col.key}-asc`} value={`${col.key}-asc`}>
                      {col.label} (A-Z)
                    </option>,
                    <option key={`${col.key}-desc`} value={`${col.key}-desc`}>
                      {col.label} (Z-A)
                    </option>,
                  ])}
              </select>
            </div>

            {/* Cards */}
            {paginatedData.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-2 gap-3">
                  {columns.map((column) => (
                    <div key={column.key}>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {column.label}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatValue(row[column.key], column.format)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
