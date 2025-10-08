"use client";

import { useState, useEffect } from "react";
import ReportParameterSelector from "@/components/reports/ReportParameterSelector";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportSummaryCards, {
  type SummaryCard,
} from "@/components/reports/ReportSummaryCards";
import ReportChart, {
  type ChartData,
} from "@/components/reports/ReportChart";
import ReportTable, {
  type ColumnConfig,
} from "@/components/reports/ReportTable";
import { exportToCSV } from "@/lib/reportUtils";
import { fetchReportData } from "@/lib/reportApi";
import type { EntityType, GroupingType, ChartType } from "@/lib/reportConfig";

export default function ReportesPage() {
  const [selectedParams, setSelectedParams] = useState<{
    entity: EntityType;
    grouping: GroupingType;
    chartType: ChartType;
  } | null>(null);

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report data from API
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnConfig[]>([]);

  // Fetch report data when parameters or date range changes
  useEffect(() => {
    console.log("useEffect triggered", {
      selectedParams,
      dateRange,
      hasStart: !!dateRange.start,
      hasEnd: !!dateRange.end,
    });

    if (!selectedParams || !dateRange.start || !dateRange.end) {
      console.log("Skipping load - missing requirements");
      return;
    }

    console.log("Calling loadReportData");
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParams, dateRange.start, dateRange.end]);

  const loadReportData = async () => {
    if (!selectedParams || !dateRange.start || !dateRange.end) {
      console.log("loadReportData: Missing requirements", {
        selectedParams,
        dateRange,
      });
      return;
    }

    console.log("loadReportData: Starting fetch", {
      entity: selectedParams.entity,
      grouping: selectedParams.grouping,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    setLoading(true);
    setError(null);

    try {
      const data = await fetchReportData(
        selectedParams.entity,
        selectedParams.grouping,
        dateRange.start,
        dateRange.end
      );

      console.log("loadReportData: Received data", data);

      setSummaryCards(data.summaryCards);
      setChartData(data.chartData);
      setTableData(data.tableData);
      setTableColumns(data.tableColumns);
    } catch (err) {
      console.error("Error loading report data:", err);
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      
      // Clear data on error
      setSummaryCards([]);
      setChartData([]);
      setTableData([]);
      setTableColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleRefresh = () => {
    loadReportData();
  };

  const handleExport = () => {
    if (tableData.length > 0) {
      exportToCSV(
        tableData,
        `reporte_${selectedParams?.entity}_${selectedParams?.grouping}_${dateRange.start}`,
        tableColumns
      );
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📊 Centro de Reportes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sistema unificado de reportes
        </p>
      </div>

      {/* Parameter Selector */}
      <ReportParameterSelector onSelectionChange={setSelectedParams} />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Error al Cargar Datos
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Show when entity is selected */}
      {selectedParams && (
        <ReportFilters
          onDateRangeChange={handleDateRangeChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={loading}
        />
      )}

      {/* Report Content - Show when we have data */}
      {selectedParams && !error && dateRange.start && dateRange.end && (
        <>
          {/* Summary Cards */}
          <ReportSummaryCards cards={summaryCards} columns={4} loading={loading} />

          {/* Chart */}
          <ReportChart
            data={chartData}
            type={selectedParams.chartType}
            title="Distribución por Categoría"
            subtitle="Visualización de los datos seleccionados"
            height={450}
            fullWidth={true}
          />

          {/* Table */}
          <ReportTable
            data={tableData}
            columns={tableColumns}
            entityName={
              selectedParams.entity === "depositos"
                ? "depósitos"
                : selectedParams.entity === "recargas"
                ? "recargas"
                : "registros"
            }
            groupingLabel={(() => {
              // Get grouping label from reportConfig
              const entityConfig = require("@/lib/reportConfig").REPORT_CONFIG[selectedParams.entity];
              const groupingConfig = entityConfig?.groupings[selectedParams.grouping];
              return groupingConfig?.label;
            })()}
            enableSearch={true}
            searchPlaceholder="Buscar..."
            defaultSort={{ column: "totalAmount", direction: "desc" }}
            loading={loading}
          />
        </>
      )}

      {/* Info Message for No Date Range */}
      {selectedParams && !dateRange.start && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Selecciona un Rango de Fechas
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            Usa los filtros de fecha para generar el reporte.
          </p>
        </div>
      )}

      {/* Info Message for Unavailable Reports */}
      {selectedParams && dateRange.start && !error && tableData.length === 0 && !loading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Reportes en Desarrollo
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Los reportes para esta combinación están actualmente en desarrollo.
            Por favor selecciona Depósitos o Recargas para ver la demostración.
          </p>
        </div>
      )}
    </div>
  );
}
