"use client";

import { useEffect, useState } from "react";
import { dalGet } from "@/lib/dal-client";

interface DashboardStats {
  deposits: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    activeCustomers: number;
    avgDepositsPerCustomer: number;
    avgAmountPerCustomer: number;
  };
  depositReloads: {
    auto: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
    };
    manual: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
    };
    combined: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
      activeCustomers: number;
      avgReloadsPerCustomer: number;
      avgAmountPerCustomer: number;
    };
  };
  prizeReloads: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    activeCustomers: number;
    avgReloadsPerCustomer: number;
    avgAmountPerCustomer: number;
  };
  redemptions: {
    totalRedeemAmount: number;
    totalCashAmount: number;
    reloadReturnAmount: number;
    totalAmount: number;
    totalCount: number;
    averageRedeemAmount: number;
    averageCashAmount: number;
    averageAmount: number;
    activeCustomers: number;
    avgRedemptionsPerCustomer: number;
  };
  players: {
    newRegistrations: number;
  };
  period: {
    type: "today" | "week" | "month";
    startDate: string;
    endDate: string;
  };
}

interface Shop {
  shopID: number;
  nickname: string;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<"today" | "week" | "month">(
    "today"
  );
  const [selectedShopId, setSelectedShopId] = useState<string>("");

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    loadStats();
  }, [periodType, selectedShopId]);

  const loadShops = async () => {
    try {
      // Call DAL directly - filter admins with active shops
      const result = await dalGet("/api/v1/admins", {
        hasActiveShop: "true",
      });

      if (result.success && result.data) {
        // Filter shops that have active shops
        const activeShops = result.data.filter(
          (admin: any) => admin.hasActiveShop === true && admin.shopID
        );
        setShops(activeShops);
      }
    } catch (err) {
      console.error("Error loading shops:", err);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params: Record<string, string> = { period: periodType };
      if (selectedShopId) {
        params.shopId = selectedShopId;
      }

      // Call DAL directly
      const result = await dalGet("/api/v1/stats", params);

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
      setError("Error al cargar las estadísticas del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-CR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case "today":
        return "Hoy";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mes";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-mobile">
          <p className="text-lg text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Filters */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primary-alt dark:from-brand-primary-alt dark:to-brand-secondary rounded-xl shadow-lg border border-brand-secondary dark:border-brand-primary p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">📊</span>
              Estadísticas - {getPeriodLabel()}
            </h1>
            <p className="text-white/90 mt-2 text-lg">
              Resumen de operaciones del sistema
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Period Filter */}
            <select
              value={periodType}
              onChange={(e) =>
                setPeriodType(e.target.value as "today" | "week" | "month")
              }
              className="px-4 py-3 border-2 border-white/30 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint hover:bg-white/20 transition-all cursor-pointer shadow-lg"
              style={{ minWidth: "160px" }}
            >
              <option value="today" className="text-gray-900">
                📅 Hoy
              </option>
              <option value="week" className="text-gray-900">
                📆 Esta Semana
              </option>
              <option value="month" className="text-gray-900">
                🗓️ Este Mes
              </option>
            </select>

            {/* Shop Filter */}
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="px-4 py-3 border-2 border-white/30 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint hover:bg-white/20 transition-all cursor-pointer shadow-lg"
              style={{ minWidth: "200px" }}
            >
              <option value="" className="text-gray-900">
                🏪 Todas las Tiendas
              </option>
              {shops.map((shop) => (
                <option
                  key={shop.shopID}
                  value={shop.shopID}
                  className="text-gray-900"
                >
                  {shop.nickname} (ID: {shop.shopID})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. DEPOSITS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-gray-100 mb-6 flex items-center gap-3 pb-4 border-b-2 border-accent-mint/30 dark:border-accent-mint/20">
          <span className="text-3xl">💰</span>
          Depósitos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-5 bg-gradient-to-br from-accent-mint/10 to-accent-mint/20 dark:from-accent-mint/20 dark:to-accent-mint/30 rounded-xl border-2 border-accent-mint/40 dark:border-accent-mint/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-brand-primary dark:text-accent-mint uppercase tracking-wide mb-1">
              Total Depositado
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
              {formatCurrency(stats.deposits.totalAmount)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-accent-mint/10 to-accent-mint/20 dark:from-accent-mint/20 dark:to-accent-mint/30 rounded-xl border-2 border-accent-mint/40 dark:border-accent-mint/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-brand-primary dark:text-accent-mint uppercase tracking-wide mb-1">
              Total Depósitos
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
              {formatNumber(stats.deposits.totalCount)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-accent-mint/10 to-accent-mint/20 dark:from-accent-mint/20 dark:to-accent-mint/30 rounded-xl border-2 border-accent-mint/40 dark:border-accent-mint/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-brand-primary dark:text-accent-mint uppercase tracking-wide mb-1">
              Promedio por Depósito
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
              {formatCurrency(stats.deposits.averageAmount)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/20 dark:from-brand-secondary/20 dark:to-brand-secondary/30 rounded-xl border-2 border-brand-secondary/40 dark:border-brand-secondary/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-brand-primary-alt dark:text-brand-secondary uppercase tracking-wide mb-1">
              Clientes Activos
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
              {formatNumber(stats.deposits.activeCustomers)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/20 dark:from-brand-secondary/20 dark:to-brand-secondary/30 rounded-xl border-2 border-brand-secondary/40 dark:border-brand-secondary/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-brand-primary-alt dark:text-brand-secondary uppercase tracking-wide mb-1">
              Depósitos por Cliente
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
              {formatNumber(stats.deposits.avgDepositsPerCustomer)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/20 dark:from-brand-secondary/20 dark:to-brand-secondary/30 rounded-xl border-2 border-brand-secondary/40 dark:border-brand-secondary/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-brand-primary-alt dark:text-brand-secondary uppercase tracking-wide mb-1">
              Monto Promedio por Cliente
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
              {formatCurrency(stats.deposits.avgAmountPerCustomer)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. DEPOSIT RELOADS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-gray-100 mb-6 flex items-center gap-3 pb-4 border-b-2 border-brand-secondary/30 dark:border-brand-secondary/20">
          <span className="text-3xl">🏦 </span>
          Recargas - Depósitos
        </h2>

        {/* Auto Deposits */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-brand-primary dark:text-accent-mint mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            Depósitos Automáticos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="p-5 bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 dark:from-brand-primary/10 dark:to-brand-primary/20 rounded-xl border-2 border-brand-primary/30 dark:border-brand-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-brand-primary dark:text-accent-mint uppercase tracking-wide mb-1">
                Total Recargado
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatCurrency(stats.depositReloads.auto.totalAmount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 dark:from-brand-primary/10 dark:to-brand-primary/20 rounded-xl border-2 border-brand-primary/30 dark:border-brand-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-brand-primary dark:text-accent-mint uppercase tracking-wide mb-1">
                Total Recargas
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatNumber(stats.depositReloads.auto.totalCount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 dark:from-brand-primary/10 dark:to-brand-primary/20 rounded-xl border-2 border-brand-primary/30 dark:border-brand-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-brand-primary dark:text-accent-mint uppercase tracking-wide mb-1">
                Promedio
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatCurrency(stats.depositReloads.auto.averageAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Manual Deposits */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-brand-primary-alt dark:text-brand-secondary mb-4 flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            Depósitos Manuales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="p-5 bg-gradient-to-br from-brand-primary-alt/5 to-brand-primary-alt/10 dark:from-brand-primary-alt/10 dark:to-brand-primary-alt/20 rounded-xl border-2 border-brand-primary-alt/30 dark:border-brand-primary-alt/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-brand-primary-alt dark:text-brand-secondary uppercase tracking-wide mb-1">
                Total Recargado
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatCurrency(stats.depositReloads.manual.totalAmount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-brand-primary-alt/5 to-brand-primary-alt/10 dark:from-brand-primary-alt/10 dark:to-brand-primary-alt/20 rounded-xl border-2 border-brand-primary-alt/30 dark:border-brand-primary-alt/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-brand-primary-alt dark:text-brand-secondary uppercase tracking-wide mb-1">
                Total Recargas
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatNumber(stats.depositReloads.manual.totalCount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-brand-primary-alt/5 to-brand-primary-alt/10 dark:from-brand-primary-alt/10 dark:to-brand-primary-alt/20 rounded-xl border-2 border-brand-primary-alt/30 dark:border-brand-primary-alt/20 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-brand-primary-alt dark:text-brand-secondary uppercase tracking-wide mb-1">
                Promedio
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatCurrency(stats.depositReloads.manual.averageAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Combined Stats */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">➕</span>
            Total
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="p-5 bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/20 dark:from-accent-emerald/20 dark:to-accent-emerald/30 rounded-xl border-2 border-accent-emerald/40 dark:border-accent-emerald/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-accent-emerald dark:text-accent-mint uppercase tracking-wide mb-1">
                Total Recargado
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatCurrency(stats.depositReloads.combined.totalAmount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/20 dark:from-accent-emerald/20 dark:to-accent-emerald/30 rounded-xl border-2 border-accent-emerald/40 dark:border-accent-emerald/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-accent-emerald dark:text-accent-mint uppercase tracking-wide mb-1">
                Total Recargas
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatNumber(stats.depositReloads.combined.totalCount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/20 dark:from-accent-emerald/20 dark:to-accent-emerald/30 rounded-xl border-2 border-accent-emerald/40 dark:border-accent-emerald/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-accent-emerald dark:text-accent-mint uppercase tracking-wide mb-1">
                Clientes Activos
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatNumber(stats.depositReloads.combined.activeCustomers)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/20 dark:from-accent-emerald/20 dark:to-accent-emerald/30 rounded-xl border-2 border-accent-emerald/40 dark:border-accent-emerald/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-accent-emerald dark:text-accent-mint uppercase tracking-wide mb-1">
                Recargas por Cliente
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatNumber(
                  stats.depositReloads.combined.avgReloadsPerCustomer
                )}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/20 dark:from-accent-emerald/20 dark:to-accent-emerald/30 rounded-xl border-2 border-accent-emerald/40 dark:border-accent-emerald/30 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-accent-emerald dark:text-accent-mint uppercase tracking-wide mb-1">
                Monto por Cliente
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-brand-dark dark:text-gray-100">
                {formatCurrency(
                  stats.depositReloads.combined.avgAmountPerCustomer
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIZE RELOADS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200 dark:border-amber-700">
          <span className="text-3xl">🎰</span>
          Recargas - Premios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Total Recargado
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-800 dark:text-amber-300">
              {formatCurrency(stats.prizeReloads.totalAmount)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Total Recargas
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-800 dark:text-amber-300">
              {formatNumber(stats.prizeReloads.totalCount)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Promedio
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-800 dark:text-amber-300">
              {formatCurrency(stats.prizeReloads.averageAmount)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Clientes Activos
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-800 dark:text-amber-300">
              {formatNumber(stats.prizeReloads.activeCustomers)}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              Recargas por Cliente
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-800 dark:text-amber-300">
              {formatNumber(stats.prizeReloads.avgReloadsPerCustomer)}
            </p>
          </div>
        </div>
      </div>

      {/* 4. REDEMPTIONS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3 pb-4 border-b-2 border-red-200 dark:border-red-700">
          <span className="text-3xl">💸</span>
          Retiros - Composición
        </h2>

        {/* Breakdown of withdrawal amounts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-xl border-2 border-red-400 dark:border-red-600 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-red-900 dark:text-red-300 uppercase tracking-wide mb-1">
              Total en Retiros
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-red-900 dark:text-red-200">
              {formatCurrency(stats.redemptions.totalRedeemAmount)}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-2 font-medium">
              Valor total de vouchers redimidos
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl border-2 border-orange-400 dark:border-orange-600 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-300 uppercase tracking-wide mb-1">
              Salidas Efectivo
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-orange-900 dark:text-orange-200">
              {formatCurrency(stats.redemptions.totalCashAmount)}
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-2 font-medium">
              Efectivo pagado a clientes
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border-2 border-green-400 dark:border-green-600 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-green-900 dark:text-green-300 uppercase tracking-wide mb-1">
              Reingresa Recarga
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-green-900 dark:text-green-200">
              {formatCurrency(stats.redemptions.reloadReturnAmount)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-2 font-medium">
              Diferencia que vuelve al sistema
            </p>
          </div>
        </div>

        {/* Additional stats */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border-2 border-red-300 dark:border-red-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                Total Retiros
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-red-800 dark:text-red-300">
                {formatNumber(stats.redemptions.totalCount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border-2 border-red-300 dark:border-red-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                Promedio Efectivo
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-red-800 dark:text-red-300">
                {formatCurrency(stats.redemptions.averageCashAmount)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border-2 border-red-300 dark:border-red-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                Clientes Activos
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-red-800 dark:text-red-300">
                {formatNumber(stats.redemptions.activeCustomers)}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border-2 border-red-300 dark:border-red-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                Retiros por Cliente
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-red-800 dark:text-red-300">
                {formatNumber(stats.redemptions.avgRedemptionsPerCustomer)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PLAYERS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3 pb-4 border-b-2 border-cyan-200 dark:border-cyan-700">
          <span className="text-3xl">👥</span>
          Jugadores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl border-2 border-cyan-300 dark:border-cyan-700 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mb-2">
              Nuevos Registros
            </p>
            <p className="text-4xl md:text-5xl font-extrabold text-cyan-800 dark:text-cyan-300">
              {formatNumber(stats.players.newRegistrations)}
            </p>
            <p className="text-xs text-cyan-600 dark:text-cyan-500 mt-2 font-medium">
              Registros en el período seleccionado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
