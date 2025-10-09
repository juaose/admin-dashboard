/**
 * Report API Client
 * Centralized service for fetching report data from backend APIs
 */

import type { EntityType, GroupingType } from "./reportConfig";
import type { SummaryCard } from "@/components/reports/ReportSummaryCards";
import type { ChartData } from "@/components/reports/ReportChart";
import type { ColumnConfig } from "@/components/reports/ReportTable";

export interface ReportResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface ReportData {
  summaryCards: SummaryCard[];
  chartData: ChartData[];
  tableData: any[];
  tableColumns: ColumnConfig[];
}

/**
 * Convert Costa Rica local date to UTC datetime
 * Costa Rica is UTC-6, so local midnight = 6am UTC
 * 
 * @param localDate - Date in YYYY-MM-DD format (Costa Rica local time)
 * @returns UTC datetime string in ISO format
 */
function costaRicaDateToUTC(localDate: string): string {
  // Parse the local date
  const [year, month, day] = localDate.split('-').map(Number);
  
  // Create date in UTC, then add 6 hours to shift to Costa Rica midnight
  // Example: 2025-10-18 (local) → 2025-10-18T06:00:00Z (UTC)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 6, 0, 0, 0));
  
  return utcDate.toISOString();
}

/**
 * Convert Costa Rica date range to UTC range
 * 
 * @param startDate - Start date in YYYY-MM-DD format (Costa Rica local)
 * @param endDate - End date in YYYY-MM-DD format (Costa Rica local)
 * @returns Object with UTC start and end datetime strings
 */
function costaRicaRangeToUTC(startDate: string, endDate: string): {
  utcStart: string;
  utcEnd: string;
} {
  // Start: beginning of start date (midnight Costa Rica = 6am UTC)
  const utcStart = costaRicaDateToUTC(startDate);
  
  // End: beginning of day AFTER end date (to include full end date)
  // Example: endDate = 2025-10-18 → need 2025-10-19T06:00:00Z
  const [year, month, day] = endDate.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 6, 0, 0, 0));
  const utcEnd = nextDay.toISOString();
  
  return { utcStart, utcEnd };
}

/**
 * Fetch report data from API
 */
export async function fetchReportData(
  entityType: EntityType,
  groupingType: GroupingType,
  startDate: string,
  endDate: string
): Promise<ReportData> {
  // Build endpoint based on entity and grouping
  const endpoint = getApiEndpoint(entityType, groupingType);

  if (!endpoint) {
    throw new Error(`No API endpoint configured for ${entityType}/${groupingType}`);
  }

  // Convert Costa Rica local dates to UTC range
  const { utcStart, utcEnd } = costaRicaRangeToUTC(startDate, endDate);

  // Make API request with UTC datetime strings
  const url = `${endpoint}?startDate=${encodeURIComponent(utcStart)}&endDate=${encodeURIComponent(utcEnd)}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.details || `HTTP ${response.status}`
    );
  }

  const result: ReportResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || result.details || "API returned no data");
  }

  // Transform API response to component-ready format
  return transformReportData(entityType, groupingType, result.data);
}

/**
 * Get API endpoint for entity-grouping combination
 */
function getApiEndpoint(
  entityType: EntityType,
  groupingType: GroupingType
): string | null {
  const endpoints: Record<string, Record<string, string>> = {
    depositos: {
      bank: "/api/depositos/banco-destino",
      bank_origin: "/api/depositos/banco-procedencia",
      bank_account: "/api/depositos/cuenta-destino",
      customer: "/api/depositos/clientes",
    },
    recargas: {
      shop: "/api/recargas/tiendas",
      customer: "/api/recargas/clientes",
    },
    retiros: {
      customer: "/api/retiros/clientes",
      shop: "/api/retiros/tiendas",
      bank: "/api/retiros/bancos",
    },
    promociones: {
      bonusTier: "/api/promociones/nivel",
      customer: "/api/promociones/clientes",
      paymentMethod: "/api/promociones/metodo-pago",
      shop: "/api/promociones/tiendas",
    },
  };

  return endpoints[entityType]?.[groupingType] || null;
}

/**
 * Aggregate chart data to show top N items + "Rest"
 */
function aggregateChartData(
  data: ChartData[],
  topN: number = 10
): ChartData[] {
  if (data.length <= topN) {
    return data;
  }

  // Sort by value descending
  const sorted = [...data].sort((a, b) => b.value - a.value);
  
  // Take top N
  const topItems = sorted.slice(0, topN);
  
  // Aggregate rest
  const restItems = sorted.slice(topN);
  const restTotal = restItems.reduce((sum, item) => sum + item.value, 0);
  
  if (restTotal > 0) {
    const largestIndividual = topItems[0].value;
    
    // If Rest is more than 2x the largest item, it's too dominant - discard it
    if (restTotal > largestIndividual * 2) {
      return topItems;
    }
    
    // Create final array with Rest item
    const finalData = [
      ...topItems,
      {
        name: `Resto (${restItems.length})`,
        value: restTotal,
      },
    ];
    
    // Sort again to avoid outlier position
    return finalData.sort((a, b) => b.value - a.value);
  }
  
  return topItems;
}

/**
 * Transform API response data to component-ready format
 */
function transformReportData(
  entityType: EntityType,
  groupingType: GroupingType,
  apiData: any
): ReportData {
  const key = `${entityType}_${groupingType}`;

  switch (key) {
    case "depositos_bank":
    case "depositos_bank_origin":
      return transformDepositosBankData(apiData);
    
    case "depositos_bank_account":
      return transformDepositosBankAccountData(apiData);
    
    case "depositos_customer":
      return transformDepositosCustomerData(apiData);
    
    case "recargas_shop":
      return transformRecargasShopData(apiData);
    
    case "recargas_customer":
      return transformRecargasCustomerData(apiData);
    
    case "retiros_customer":
      return transformRetirosCustomerData(apiData);
    
    case "retiros_shop":
      return transformRetirosShopData(apiData);
    
    case "retiros_bank":
      return transformRetirosBankData(apiData);
    
    case "promociones_bonusTier":
    case "promociones_customer":
    case "promociones_paymentMethod":
    case "promociones_shop":
      return transformPromocionesData(apiData);
    
    default:
      throw new Error(`No transformer configured for ${key}`);
  }
}

/**
 * Transform promociones data (all groupings)
 * API already returns data in the correct format, so this is a pass-through
 */
function transformPromocionesData(apiData: any): ReportData {
  const {
    summaryCards = [],
    chartData = [],
    tableData = [],
    tableColumns = [],
  } = apiData;

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform depositos bank data
 */
function transformDepositosBankData(apiData: any): ReportData {
  const { bankSummaries = [], statistics = {} } = apiData;

  // Calculate total from all banks
  const totalVolume = bankSummaries.reduce(
    (sum: number, bank: any) => sum + (bank.totalAmount || 0),
    0
  );

  // Summary Cards
  const summaryCards: SummaryCard[] = [
    {
      title: "Total Depositado",
      value: totalVolume,
      format: "currency",
      icon: "💰",
      subtitle: `${statistics.totalBanks || 0} bancos`,
    },
    {
      title: "Banco Principal",
      value: statistics.topVolumeBank || "N/A",
      format: "text",
      icon: "🏦",
      subtitle: "Por volumen",
    },
    {
      title: "Promedio por Banco",
      value: statistics.avgVolumePerBank || 0,
      format: "currency",
      icon: "📊",
      subtitle: "Distribución",
    },
    {
      title: "Más Clientes",
      value: statistics.topCustomerBank || "N/A",
      format: "text",
      icon: "👥",
      subtitle: `${statistics.topCustomerBankCount || 0} clientes`,
    },
  ];

  // Chart Data - Top 10 + Rest
  const allChartData: ChartData[] = bankSummaries.map((bank: any) => ({
    name: bank.bankName,
    value: bank.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  // Table Data & Columns
  const tableData = bankSummaries;
  const tableColumns: ColumnConfig[] = [
    { key: "bankName", label: "Banco", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalReloads",
      label: "Transacciones",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "customerCount",
      label: "Clientes",
      format: "number",
      sortable: true,
      align: "center",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform retiros customer data
 */
function transformRetirosCustomerData(apiData: any): ReportData {
  const { customers = [], statistics = {} } = apiData;

  const summaryCards: SummaryCard[] = [
    {
      title: "Total de Clientes",
      value: statistics.totalCustomers || 0,
      format: "number",
      icon: "👥",
      subtitle: "Clientes activos",
    },
    {
      title: "Volumen Total",
      value: statistics.totalVolume || 0,
      format: "currency",
      icon: "💸",
      subtitle: "Total retirado",
    },
    {
      title: "Promedio por Retiro",
      value: statistics.avgWithdrawalAmount || 0,
      format: "currency",
      icon: "📊",
      subtitle: "Por transacción",
    },
    {
      title: "Promedio por Cliente",
      value: statistics.totalCustomers > 0 ? statistics.totalVolume / statistics.totalCustomers : 0,
      format: "currency",
      icon: "👤",
      subtitle: "Total retirado",
    },
  ];

  // Chart Data - Top 10 customers + Rest
  const allChartData: ChartData[] = customers.map((customer: any) => ({
    name: customer.screenName || customer.codename || `Cliente ${customer.premayor_acc}`,
    value: customer.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  const tableData = customers;
  const tableColumns: ColumnConfig[] = [
    { key: "shopID", label: "Tienda", format: "number", sortable: true, align: "center" },
    { key: "screenName", label: "Cliente", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalWithdrawals",
      label: "Retiros",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "averageWithdrawal",
      label: "Promedio",
      format: "currency",
      sortable: true,
      align: "right",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform retiros shop data
 */
function transformRetirosShopData(apiData: any): ReportData {
  const { shopReports = [], statistics = {} } = apiData;

  // Transform shop data to use "Puesto {shopID}" format
  const transformedShopReports = shopReports.map((shop: any) => ({
    ...shop,
    shopDisplayName: `Puesto ${shop.shopId}`,
  }));

  // Summary Cards
  const summaryCards: SummaryCard[] = [
    {
      title: "Total Retirado",
      value: statistics.totalVolume || 0,
      format: "currency",
      icon: "💸",
      subtitle: `${statistics.totalShops || 0} tiendas`,
    },
    {
      title: "Transacciones",
      value: statistics.totalWithdrawals || 0,
      format: "number",
      icon: "🔄",
      subtitle: "Total de retiros",
    },
    {
      title: "Promedio por Tienda",
      value: statistics.avgPerShop || 0,
      format: "currency",
      icon: "📊",
      subtitle: "Distribución",
    },
    {
      title: "Tienda Principal",
      value: statistics.topShop || "N/A",
      format: "text",
      icon: "🏪",
      subtitle: "Mayor volumen",
    },
  ];

  // Chart Data - Top 10 + Rest
  const allChartData: ChartData[] = transformedShopReports.map((shop: any) => ({
    name: shop.shopDisplayName,
    value: shop.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  // Table Data & Columns
  const tableData = transformedShopReports;
  const tableColumns: ColumnConfig[] = [
    { key: "shopDisplayName", label: "Tienda", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalWithdrawals",
      label: "Retiros",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "customerCount",
      label: "Clientes",
      format: "number",
      sortable: true,
      align: "center",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform retiros bank data
 */
function transformRetirosBankData(apiData: any): ReportData {
  const { bankSummaries = [], statistics = {} } = apiData;

  // Summary Cards
  const summaryCards: SummaryCard[] = [
    {
      title: "Total Retirado",
      value: statistics.totalVolume || 0,
      format: "currency",
      icon: "💸",
      subtitle: `${statistics.totalBanks || 0} bancos`,
    },
    {
      title: "Banco Principal",
      value: statistics.topBank || "N/A",
      format: "text",
      icon: "🏦",
      subtitle: "Mayor liquidez requerida",
    },
    {
      title: "Promedio por Banco",
      value: statistics.avgPerBank || 0,
      format: "currency",
      icon: "📊",
      subtitle: "Distribución",
    },
    {
      title: "Transacciones",
      value: statistics.totalWithdrawals || 0,
      format: "number",
      icon: "🔄",
      subtitle: "Total de retiros",
    },
  ];

  // Chart Data - Top 10 + Rest
  const allChartData: ChartData[] = bankSummaries.map((bank: any) => ({
    name: bank.bankName || "Sin banco",
    value: bank.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  // Table Data & Columns
  const tableData = bankSummaries;
  const tableColumns: ColumnConfig[] = [
    { key: "bankName", label: "Banco", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalWithdrawals",
      label: "Retiros",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "customerCount",
      label: "Clientes",
      format: "number",
      sortable: true,
      align: "center",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform depositos bank account data
 */
function transformDepositosBankAccountData(apiData: any): ReportData {
  const { accountSummaries = [], statistics = {} } = apiData;

  // Calculate total from all accounts
  const totalVolume = accountSummaries.reduce(
    (sum: number, acc: any) => sum + (acc.totalAmount || 0),
    0
  );

  // Calculate total reloads from account summaries
  const totalReloads = accountSummaries.reduce(
    (sum: number, acc: any) => sum + (acc.totalReloads || 0),
    0
  );

  const summaryCards: SummaryCard[] = [
    {
      title: "Total Depositado",
      value: totalVolume,
      format: "currency",
      icon: "💰",
      subtitle: "Todas las cuentas",
    },
    {
      title: "Cuentas Activas",
      value: statistics.totalAccounts || 0,
      format: "number",
      icon: "💳",
      subtitle: "Cuentas destino",
    },
    {
      title: "Cuenta Principal",
      value: statistics.topVolumeAccount || "N/A",
      format: "text",
      icon: "🏦",
      subtitle: "Mayor volumen",
    },
    {
      title: "Transacciones",
      value: totalReloads,
      format: "number",
      icon: "🔄",
      subtitle: "Total",
    },
  ];

  // Chart Data - Top 10 + Rest
  const allChartData: ChartData[] = accountSummaries.map((account: any) => ({
    name: account.accountCodename || `Cuenta ${account.accountID}`,
    value: account.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  const tableData = accountSummaries;
  const tableColumns: ColumnConfig[] = [
    { key: "accountCodename", label: "Cuenta", format: "text", sortable: true },
    { key: "bankName", label: "Banco", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalReloads",
      label: "Depósitos",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "customerCount",
      label: "Clientes",
      format: "number",
      sortable: true,
      align: "center",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform depositos customer data
 */
function transformDepositosCustomerData(apiData: any): ReportData {
  const { customers = [], statistics = {} } = apiData;

  const summaryCards: SummaryCard[] = [
    {
      title: "Total de Clientes",
      value: statistics.totalCustomers || 0,
      format: "number",
      icon: "👥",
      subtitle: "Clientes activos",
    },
    {
      title: "Volumen Total",
      value: statistics.totalVolume || 0,
      format: "currency",
      icon: "💰",
      subtitle: "Total depositado",
    },
    {
      title: "Promedio por Depósito",
      value: statistics.avgDepositAmount || 0,
      format: "currency",
      icon: "📊",
      subtitle: "Por transacción",
    },
    {
      title: "Promedio por Cliente",
      value: statistics.totalCustomers > 0 ? statistics.totalVolume / statistics.totalCustomers : 0,
      format: "currency",
      icon: "👤",
      subtitle: "Total depositado",
    },
  ];

  // Chart Data - Top 10 customers + Rest
  const allChartData: ChartData[] = customers.map((customer: any) => ({
    name: customer.screenName || customer.codename || `Cliente ${customer.premayor_acc}`,
    value: customer.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  const tableData = customers;
  const tableColumns: ColumnConfig[] = [
    { key: "shopID", label: "Tienda", format: "number", sortable: true, align: "center" },
    { key: "screenName", label: "Cliente", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalDeposits",
      label: "Depósitos",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "averageDeposit",
      label: "Promedio",
      format: "currency",
      sortable: true,
      align: "right",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform recargas shop data
 */
function transformRecargasShopData(apiData: any): ReportData {
  const { shopReports = [], totalAmount = 0, totalTransactions = 0 } = apiData;

  // Transform shop data to use "Puesto {shopID}" format
  const transformedShopReports = shopReports.map((shop: any) => ({
    ...shop,
    shopDisplayName: `Puesto ${shop.shopID}`,
  }));

  // Summary Cards
  const summaryCards: SummaryCard[] = [
    {
      title: "Total Recargado",
      value: totalAmount || 0,
      format: "currency",
      icon: "💰",
      subtitle: `${shopReports.length} tiendas`,
    },
    {
      title: "Transacciones",
      value: totalTransactions || 0,
      format: "number",
      icon: "🔄",
      subtitle: "Total de recargas",
    },
    {
      title: "Promedio por Tienda",
      value: shopReports.length > 0 ? totalAmount / shopReports.length : 0,
      format: "currency",
      icon: "📊",
      subtitle: "Distribución",
    },
    {
      title: "Tienda Principal",
      value: transformedShopReports[0]?.shopDisplayName || "N/A",
      format: "text",
      icon: "🏪",
      subtitle: "Mayor volumen",
    },
  ];

  // Chart Data - Top 10 + Rest (though shops are usually < 10)
  const allChartData: ChartData[] = transformedShopReports.map((shop: any) => ({
    name: shop.shopDisplayName,
    value: shop.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  // Table Data & Columns
  const tableData = transformedShopReports;
  const tableColumns: ColumnConfig[] = [
    { key: "shopDisplayName", label: "Tienda", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "transactionCount",
      label: "Recargas",
      format: "number",
      sortable: true,
      align: "center",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}

/**
 * Transform recargas customer data
 */
function transformRecargasCustomerData(apiData: any): ReportData {
  const { customers = [], statistics = {} } = apiData;

  const summaryCards: SummaryCard[] = [
    {
      title: "Total de Clientes",
      value: statistics.totalCustomers || 0,
      format: "number",
      icon: "👥",
      subtitle: "Clientes activos",
    },
    {
      title: "Volumen Total",
      value: statistics.totalVolume || 0,
      format: "currency",
      icon: "💰",
      subtitle: "Total recargado",
    },
    {
      title: "Promedio por Recarga",
      value: statistics.avgReloadAmount || 0,
      format: "currency",
      icon: "📊",
      subtitle: "Por transacción",
    },
    {
      title: "Promedio por Cliente",
      value: statistics.totalCustomers > 0 ? statistics.totalVolume / statistics.totalCustomers : 0,
      format: "currency",
      icon: "👤",
      subtitle: "Total recargado",
    },
  ];

  // Chart Data - Top 10 customers + Rest
  const allChartData: ChartData[] = customers.map((customer: any) => ({
    name: customer.screenName || customer.codename || `Cliente ${customer.premayor_acc}`,
    value: customer.totalAmount,
  }));
  const chartData = aggregateChartData(allChartData, 10);

  const tableData = customers;
  const tableColumns: ColumnConfig[] = [
    { key: "shopID", label: "Tienda", format: "number", sortable: true, align: "center" },
    { key: "screenName", label: "Cliente", format: "text", sortable: true },
    {
      key: "totalAmount",
      label: "Monto Total",
      format: "currency",
      sortable: true,
      align: "right",
    },
    {
      key: "totalReloads",
      label: "Recargas",
      format: "number",
      sortable: true,
      align: "center",
    },
    {
      key: "averageReload",
      label: "Promedio",
      format: "currency",
      sortable: true,
      align: "right",
    },
  ];

  return { summaryCards, chartData, tableData, tableColumns };
}
