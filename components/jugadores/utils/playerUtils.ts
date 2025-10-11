import { BANKCODES } from "@juaose/lotto-shared-types";

/**
 * Bank color dots based on bank codes (matching deniro's color scheme)
 */
export const getBankColorBall = (bankCode: number): string => {
  switch (bankCode) {
    case BANKCODES.BAC: // 102
      return "🔴";
    case BANKCODES.POPULAR: // 161
      return "🟠";
    case BANKCODES.BNCR: // 151
      return "⚫️";
    case BANKCODES.BCR: // 152
      return "🔵";
    case BANKCODES.MUTUAL: // 803
      return "🟡";
    case BANKCODES.PROMERICA: // 116
      return "🟢";
    default:
      return "❓";
  }
};

/**
 * Format amount as Costa Rican currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date string for Costa Rican locale
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get reload type information with label, icon, and color
 */
export const getReloadTypeInfo = (type: number) => {
  switch (type) {
    case 1: // DEPOSIT_AUTO
      return { label: "Automática", icon: "🤖", color: "#10b981" };
    case 2: // RELOAD_PRIZE
      return { label: "Premio", icon: "🎁", color: "#f59e0b" };
    case 3: // DEPOSIT_MANUAL
      return { label: "Manual", icon: "✋", color: "#6b7280" };
    default:
      return { label: "Desconocido", icon: "❓", color: "#6b7280" };
  }
};

/**
 * Get codename from IBAN by searching host accounts
 */
export const getCodenameFromIban = (
  iban: string,
  hostAccounts: any[]
): string => {
  const account = hostAccounts.find((acc: any) => acc.iban_num === iban);
  return account?.codename || iban.slice(0, 10) + "...";
};
