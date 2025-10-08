"use client";

import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrencyCompact } from "@/lib/reportUtils";

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ReportChartProps {
  data: ChartData[];
  type: "pie" | "bar" | "line" | "auto";
  title?: string;
  subtitle?: string;
  height?: number;
  colors?: string[];
  valueFormat?: "currency" | "number";
  fullWidth?: boolean;
}

// Brand colors for charts (dark mode compatible)
const DEFAULT_COLORS = [
  "#2d4a2b", // brand-primary
  "#4a6b47", // brand-primary-alt
  "#5a8a4f", // brand-secondary
  "#7fb069", // mint-highlight
  "#8fc77a", // lighter mint
  "#6a9a5f", // emerald
  "#3d6339", // darker green
  "#91b88b", // light green
];

export default function ReportChart({
  data,
  type,
  title,
  subtitle,
  height = 400,
  colors = DEFAULT_COLORS,
  valueFormat = "currency",
  fullWidth = true,
}: ReportChartProps) {
  // Auto-select chart type
  const chartType = type === "auto" ? (data.length <= 6 ? "pie" : "bar") : type;

  const formatValue = (value: number): string => {
    if (valueFormat === "currency") {
      return formatCurrencyCompact(value);
    }
    return value.toLocaleString("es-CR");
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  `${entry.name} (${(entry.percent * 100).toFixed(0)}%)`
                }
                outerRadius={Math.min(140, height / 3)}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 40, left: 60, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={formatValue}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={colors[0]} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {/* Chart Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos suficientes para generar el gráfico
          </p>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
}
