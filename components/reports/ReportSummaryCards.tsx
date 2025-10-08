"use client";

import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/reportUtils";

export interface SummaryCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
    label?: string;
  };
  format?: "currency" | "number" | "percentage" | "text";
}

interface ReportSummaryCardsProps {
  cards: SummaryCard[];
  columns?: 2 | 3 | 4;
  loading?: boolean;
}

export default function ReportSummaryCards({
  cards,
  columns = 4,
  loading = false,
}: ReportSummaryCardsProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  const formatValue = (card: SummaryCard): string => {
    if (typeof card.value === "string") {
      return card.value;
    }

    switch (card.format) {
      case "currency":
        return formatCurrency(card.value);
      case "number":
        return formatNumber(card.value);
      case "percentage":
        return formatPercentage(card.value);
      case "text":
      default:
        return String(card.value);
    }
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-6 mb-6`}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-6 mb-6`}>
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 
                     hover:shadow-lg transition-shadow"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </h3>
            {card.icon && <span className="text-2xl">{card.icon}</span>}
          </div>

          {/* Card Value */}
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {formatValue(card)}
          </div>

          {/* Card Subtitle or Trend */}
          <div className="flex items-center justify-between">
            {card.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {card.subtitle}
              </p>
            )}

            {card.trend && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  card.trend.direction === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                <span>{card.trend.direction === "up" ? "↑" : "↓"}</span>
                <span>{formatPercentage(Math.abs(card.trend.value))}</span>
                {card.trend.label && (
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    {card.trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
