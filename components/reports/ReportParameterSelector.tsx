"use client";

import { useState, useEffect } from "react";
import {
  type EntityType,
  type GroupingType,
  type ChartType,
  getAvailableEntities,
  getAvailableGroupings,
  getDefaultGrouping,
  isValidCombination,
} from "@/lib/reportConfig";

interface ReportParameterSelectorProps {
  onSelectionChange?: (params: {
    entity: EntityType;
    grouping: GroupingType;
    chartType: ChartType;
  }) => void;
}

export default function ReportParameterSelector({
  onSelectionChange,
}: ReportParameterSelectorProps) {
  // State management
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("depositos");
  const [selectedGrouping, setSelectedGrouping] = useState<GroupingType | "">(
    ""
  );
  const [selectedChartType, setSelectedChartType] =
    useState<ChartType>("auto");

  // Get available entities
  const availableEntities = getAvailableEntities();

  // Get available groupings for selected entity (dynamic filtering!)
  const availableGroupings = getAvailableGroupings(selectedEntity);

  // Initialize with first available grouping when entity changes
  useEffect(() => {
    const defaultGrouping = getDefaultGrouping(selectedEntity);
    if (defaultGrouping) {
      setSelectedGrouping(defaultGrouping.key);
    } else {
      setSelectedGrouping("");
    }
  }, [selectedEntity]);

  // Notify parent when selection changes (only if valid combination)
  useEffect(() => {
    if (
      selectedGrouping &&
      onSelectionChange &&
      isValidCombination(selectedEntity, selectedGrouping as GroupingType)
    ) {
      onSelectionChange({
        entity: selectedEntity,
        grouping: selectedGrouping as GroupingType,
        chartType: selectedChartType,
      });
    }
  }, [selectedEntity, selectedGrouping, selectedChartType, onSelectionChange]);

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEntity(e.target.value as EntityType);
    // Grouping will be auto-set by useEffect
  };

  const handleGroupingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrouping(e.target.value as GroupingType);
  };

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChartType(e.target.value as ChartType);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Configuración del Reporte
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Transacción
          </label>
          <select
            value={selectedEntity}
            onChange={handleEntityChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-brand-primary focus:border-transparent
                     transition-colors"
          >
            {availableEntities.map((entity) => (
              <option key={entity.key} value={entity.key}>
                {entity.icon} {entity.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {availableEntities.find((e) => e.key === selectedEntity)
              ?.description || ""}
          </p>
        </div>

        {/* Grouping Selection - Dynamically populated! */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Agrupar Por
          </label>
          <select
            value={selectedGrouping}
            onChange={handleGroupingChange}
            disabled={availableGroupings.length === 0}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-brand-primary focus:border-transparent
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {availableGroupings.length === 0 ? (
              <option value="">No hay opciones disponibles</option>
            ) : (
              availableGroupings.map((grouping) => (
                <option key={grouping.key} value={grouping.key}>
                  {grouping.icon} {grouping.label}
                </option>
              ))
            )}
          </select>
          {selectedGrouping && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {availableGroupings.find((g) => g.key === selectedGrouping)
                ?.description || ""}
            </p>
          )}
        </div>

        {/* Chart Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Visualización
          </label>
          <select
            value={selectedChartType}
            onChange={handleChartTypeChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-brand-primary focus:border-transparent
                     transition-colors"
          >
            <option value="auto">🎯 Automático</option>
            <option value="pie">🍰 Gráfico Circular</option>
            <option value="bar">📊 Gráfico de Barras</option>
            <option value="line">📈 Gráfico de Línea</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {selectedChartType === "auto"
              ? "El sistema elegirá el mejor gráfico"
              : selectedChartType === "pie"
              ? "Ideal para mostrar composición"
              : selectedChartType === "bar"
              ? "Ideal para comparar valores"
              : "Ideal para tendencias temporales"}
          </p>
        </div>
      </div>

      {/* Info Banner when no groupings available */}
      {availableGroupings.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Reportes en Desarrollo
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Los reportes de "{selectedEntity}" están actualmente en
                desarrollo. Selecciona otro tipo de transacción para ver
                reportes disponibles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
