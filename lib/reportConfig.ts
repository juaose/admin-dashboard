/**
 * Report Configuration System
 * Defines all valid entity-grouping combinations and their metadata
 */

export type EntityType = "depositos" | "recargas" | "retiros" | "promociones";
export type GroupingType =
  | "bank"
  | "bank_origin"
  | "bank_account"
  | "shop"
  | "customer"
  | "team";
export type ChartType = "auto" | "pie" | "bar" | "line";

export interface GroupingConfig {
  key: GroupingType;
  label: string;
  icon: string;
  title: string;
  description: string;
  apiEndpoint: string;
  defaultChart: ChartType;
  summaryCards: string[];
  columns: string[];
}

export interface EntityConfig {
  key: EntityType;
  label: string;
  icon: string;
  description: string;
  groupings: Record<string, GroupingConfig>;
}

/**
 * Master Report Configuration
 * Only combinations defined here are valid and will be shown to users
 */
export const REPORT_CONFIG: Record<EntityType, EntityConfig> = {
  depositos: {
    key: "depositos",
    label: "Depósitos",
    icon: "💰",
    description: "Análisis de depósitos y transacciones de entrada",
    groupings: {
      bank: {
        key: "bank",
        label: "Banco Destino",
        icon: "🏦",
        title: "Depósitos por Banco",
        description:
          "Análisis de depósitos agrupados por entidad bancaria de destino",
        apiEndpoint: "/api/depositos/banco-destino",
        defaultChart: "pie",
        summaryCards: ["totalAmount", "bankCount", "avgPerBank", "topBank"],
        columns: [
          "bankName",
          "totalAmount",
          "transactionCount",
          "customerCount",
        ],
      },
      bank_origin: {
        key: "bank_origin",
        label: "Banco Procedencia",
        icon: "🏦",
        title: "Depósitos por Banco de Procedencia",
        description:
          "Análisis de depósitos agrupados por banco de origen del depósito",
        apiEndpoint: "/api/depositos/banco-procedencia",
        defaultChart: "pie",
        summaryCards: [
          "totalAmount",
          "bankCount",
          "avgPerBank",
          "topOriginBank",
        ],
        columns: [
          "bankName",
          "totalAmount",
          "transactionCount",
          "customerCount",
        ],
      },
      bank_account: {
        key: "bank_account",
        label: "Cuenta Destino",
        icon: "💳",
        title: "Depósitos por Cuenta de Destino",
        description: "Análisis detallado por cuenta bancaria de destino",
        apiEndpoint: "/api/depositos/cuenta-destino",
        defaultChart: "bar",
        summaryCards: [
          "totalAmount",
          "accountCount",
          "avgPerAccount",
          "topAccount",
        ],
        columns: [
          "bankName",
          "accountNumber",
          "totalAmount",
          "transactionCount",
        ],
      },
      customer: {
        key: "customer",
        label: "Por Cliente",
        icon: "👤",
        title: "Depósitos por Cliente",
        description: "Análisis de comportamiento de depósito por cliente",
        apiEndpoint: "/api/depositos/clientes",
        defaultChart: "pie",
        summaryCards: [
          "totalAmount",
          "customerCount",
          "avgPerCustomer",
          "topCustomer",
        ],
        columns: ["customerName", "totalAmount", "depositCount", "lastDeposit"],
      },
    },
  },

  recargas: {
    key: "recargas",
    label: "Recargas",
    icon: "🔄",
    description: "Análisis de recargas y reposiciones de saldo",
    groupings: {
      shop: {
        key: "shop",
        label: "Por Tienda",
        icon: "🏪",
        title: "Recargas por Tienda",
        description: "Análisis de recargas agrupadas por punto de venta",
        apiEndpoint: "/api/recargas/tiendas",
        defaultChart: "bar",
        summaryCards: ["totalAmount", "shopCount", "avgPerShop", "topShop"],
        columns: ["shopName", "totalAmount", "reloadCount", "customerCount"],
      },
      customer: {
        key: "customer",
        label: "Por Cliente",
        icon: "👤",
        title: "Recargas por Cliente",
        description: "Análisis de comportamiento de recarga por cliente",
        apiEndpoint: "/api/recargas/clientes",
        defaultChart: "pie",
        summaryCards: [
          "totalAmount",
          "customerCount",
          "avgPerCustomer",
          "topCustomer",
        ],
        columns: ["customerName", "totalAmount", "reloadCount", "lastReload"],
      },
    },
  },

  retiros: {
    key: "retiros",
    label: "Retiros",
    icon: "💸",
    description: "Análisis de retiros y pagos",
    groupings: {
      customer: {
        key: "customer",
        label: "Por Cliente",
        icon: "👤",
        title: "Retiros por Cliente",
        description: "Análisis de comportamiento de retiros por cliente",
        apiEndpoint: "/api/retiros/clientes",
        defaultChart: "pie",
        summaryCards: [
          "totalAmount",
          "customerCount",
          "avgPerCustomer",
          "topCustomer",
        ],
        columns: [
          "screenName",
          "totalAmount",
          "withdrawalCount",
          "averageWithdrawal",
        ],
      },
      shop: {
        key: "shop",
        label: "Por Tienda",
        icon: "🏪",
        title: "Retiros por Tienda",
        description: "Análisis de retiros agrupados por punto de venta",
        apiEndpoint: "/api/retiros/tiendas",
        defaultChart: "bar",
        summaryCards: ["totalAmount", "shopCount", "avgPerShop", "topShop"],
        columns: [
          "shopName",
          "totalAmount",
          "withdrawalCount",
          "customerCount",
        ],
      },
      bank: {
        key: "bank",
        label: "Banco Receptor",
        icon: "🏦",
        title: "Retiros por Banco Receptor",
        description:
          "Análisis de liquidez necesaria por banco para retiros (gestión de fondos)",
        apiEndpoint: "/api/retiros/bancos",
        defaultChart: "pie",
        summaryCards: ["totalAmount", "bankCount", "avgPerBank", "topBank"],
        columns: [
          "bankName",
          "totalAmount",
          "withdrawalCount",
          "customerCount",
        ],
      },
    },
  },

  promociones: {
    key: "promociones",
    label: "Promociones",
    icon: "🎁",
    description: "Análisis de promociones y bonificaciones otorgadas",
    groupings: {
      bonusTier: {
        key: "bonusTier" as GroupingType,
        label: "Nivel de Bonificación",
        icon: "🏆",
        title: "Bonificaciones por Nivel",
        description:
          "Análisis de bonificaciones agrupadas por nivel (TRÉBOL4, etc.)",
        apiEndpoint: "/api/promociones/nivel",
        defaultChart: "pie",
        summaryCards: ["totalBonus", "tierCount", "avgPerTier", "topTier"],
        columns: ["tierName", "totalBonus", "bonusCount", "avgBonus"],
      },
      customer: {
        key: "customer",
        label: "Por Cliente",
        icon: "👤",
        title: "Bonificaciones por Cliente",
        description: "Top 10 clientes con más bonificaciones recibidas",
        apiEndpoint: "/api/promociones/clientes",
        defaultChart: "pie",
        summaryCards: [
          "totalBonus",
          "customerCount",
          "avgPerCustomer",
          "topCustomer",
        ],
        columns: [
          "customerName",
          "totalBonus",
          "bonusCount",
          "avgBonus",
          "lastBonus",
        ],
      },
      paymentMethod: {
        key: "paymentMethod" as GroupingType,
        label: "Método de Pago",
        icon: "💳",
        title: "Bonificaciones por Método de Pago",
        description:
          "Análisis de bonificaciones según método de pago utilizado",
        apiEndpoint: "/api/promociones/metodo-pago",
        defaultChart: "pie",
        summaryCards: [
          "totalBonus",
          "methodCount",
          "avgPerMethod",
          "topMethod",
        ],
        columns: ["methodName", "totalBonus", "bonusCount", "avgBonus"],
      },
      shop: {
        key: "shop",
        label: "Por Tienda",
        icon: "🏪",
        title: "Bonificaciones por Tienda",
        description: "Análisis de actividad promocional por punto de venta",
        apiEndpoint: "/api/promociones/tiendas",
        defaultChart: "pie",
        summaryCards: ["totalBonus", "shopCount", "avgPerShop", "topShop"],
        columns: ["shopName", "totalBonus", "bonusCount", "customerCount"],
      },
    },
  },
};

/**
 * Get available groupings for a specific entity
 */
export function getAvailableGroupings(
  entityType: EntityType
): GroupingConfig[] {
  const entity = REPORT_CONFIG[entityType];
  if (!entity) return [];

  return Object.values(entity.groupings);
}

/**
 * Get all available entities
 */
export function getAvailableEntities(): EntityConfig[] {
  return Object.values(REPORT_CONFIG);
}

/**
 * Get configuration for a specific entity-grouping combination
 */
export function getReportConfig(
  entityType: EntityType,
  groupingType: GroupingType
): GroupingConfig | null {
  const entity = REPORT_CONFIG[entityType];
  if (!entity) return null;

  return entity.groupings[groupingType] || null;
}

/**
 * Check if a entity-grouping combination is valid
 */
export function isValidCombination(
  entityType: EntityType,
  groupingType: GroupingType
): boolean {
  return getReportConfig(entityType, groupingType) !== null;
}

/**
 * Get the first available grouping for an entity (for default selection)
 */
export function getDefaultGrouping(
  entityType: EntityType
): GroupingConfig | null {
  const groupings = getAvailableGroupings(entityType);
  return groupings.length > 0 ? groupings[0] : null;
}
