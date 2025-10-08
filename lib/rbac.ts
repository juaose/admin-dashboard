/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines permissions for different user groups and provides
 * utility functions to check authorization.
 *
 * Permissions are now loaded from rbac-permissions.json for easier
 * management and future database migration.
 */

import permissionsData from "./rbac-permissions.json";

// Define the user groups in the system
export enum UserGroup {
  ADMIN = "admin",
  TREASURY = "treasury",
  STORE_MANAGER = "store_manager",
}

// Define operation types for player updates
export enum PlayerOperation {
  // Basic info updates
  UPDATE_CODENAME = "update_codename",
  UPDATE_NOTES = "update_notes",
  UPDATE_SINPE = "update_sinpe",
  UPDATE_WHATSAPP = "update_whatsapp",
  UPDATE_WITHDRAWAL_INSTRUCTIONS = "update_withdrawal_instructions",

  // Shop management
  CHANGE_SHOP = "change_shop",

  // Bank account operations
  ADD_BANK_ACCOUNT = "add_bank_account",
  DELETE_BANK_ACCOUNT = "delete_bank_account",
  TOGGLE_BANK_ACCOUNT_STATUS = "toggle_bank_account_status",
  TOGGLE_BANK_ACCOUNT_FAVORITE = "toggle_bank_account_favorite",
  ADD_HOST_ACCOUNT = "add_host_account",
  REMOVE_HOST_ACCOUNT = "remove_host_account",

  // Auto-recarga
  TOGGLE_AUTO_RECARGA = "toggle_auto_recarga",

  // Deposit footprints
  ADD_FOOTPRINT = "add_footprint",
  REMOVE_FOOTPRINT = "remove_footprint",
  SET_FOOTPRINTS = "set_footprints",

  // Authorized accounts
  ADD_AUTHORIZED_ACCOUNT = "add_authorized_account",
  REMOVE_AUTHORIZED_ACCOUNT = "remove_authorized_account",
  SET_AUTHORIZED_ACCOUNTS = "set_authorized_accounts",
}

/**
 * Build permission matrix from JSON configuration
 * Converts rolePermissions (role -> operations) to PERMISSIONS (operation -> roles)
 */
function buildPermissionMatrix(): Record<PlayerOperation, UserGroup[]> {
  const matrix: Record<string, UserGroup[]> = {};

  // Get valid operation values from enum for validation
  const validOperations = Object.values(PlayerOperation);

  // Iterate through each role and its permissions
  Object.entries(permissionsData.rolePermissions).forEach(
    ([role, operations]) => {
      operations.forEach((operation) => {
        // Validate that operation exists in enum
        if (!validOperations.includes(operation as PlayerOperation)) {
          console.warn(
            `⚠️ RBAC Warning: Unknown operation "${operation}" in role "${role}"`
          );
          return;
        }

        if (!matrix[operation]) {
          matrix[operation] = [];
        }
        matrix[operation].push(role as UserGroup);
      });
    }
  );

  console.log(
    `✅ RBAC matrix loaded: ${Object.keys(matrix).length} operations`
  );

  return matrix as Record<PlayerOperation, UserGroup[]>;
}

// Permission matrix: maps operations to allowed groups (loaded from JSON)
const PERMISSIONS: Record<
  PlayerOperation,
  UserGroup[]
> = buildPermissionMatrix();

/**
 * Maps update types from API to operations
 */
export const UPDATE_TYPE_TO_OPERATION: Record<string, PlayerOperation> = {
  codename: PlayerOperation.UPDATE_CODENAME,
  shopID: PlayerOperation.CHANGE_SHOP,
  sinpe_num: PlayerOperation.UPDATE_SINPE,
  whatsapp_num: PlayerOperation.UPDATE_WHATSAPP,
  notes: PlayerOperation.UPDATE_NOTES,
  withdrawalInstructions: PlayerOperation.UPDATE_WITHDRAWAL_INSTRUCTIONS,
  addFootprint: PlayerOperation.ADD_FOOTPRINT,
  removeFootprint: PlayerOperation.REMOVE_FOOTPRINT,
  setDepositFootprints: PlayerOperation.SET_FOOTPRINTS,
  addAuthorizedAccount: PlayerOperation.ADD_AUTHORIZED_ACCOUNT,
  removeAuthorizedAccount: PlayerOperation.REMOVE_AUTHORIZED_ACCOUNT,
  setAuthorizedAccounts: PlayerOperation.SET_AUTHORIZED_ACCOUNTS,
  autoRecarga: PlayerOperation.TOGGLE_AUTO_RECARGA,
  addBankAccount: PlayerOperation.ADD_BANK_ACCOUNT,
  addHostAccount: PlayerOperation.ADD_HOST_ACCOUNT,
  removeHostAccount: PlayerOperation.REMOVE_HOST_ACCOUNT,
  deleteBankAccount: PlayerOperation.DELETE_BANK_ACCOUNT,
  toggleBankAccountStatus: PlayerOperation.TOGGLE_BANK_ACCOUNT_STATUS,
  toggleBankAccountFavorite: PlayerOperation.TOGGLE_BANK_ACCOUNT_FAVORITE,
};

/**
 * Check if a user has permission to perform an operation
 * @param userGroups - Array of groups the user belongs to
 * @param operation - The operation to check
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(
  userGroups: string[],
  operation: PlayerOperation
): boolean {
  const allowedGroups = PERMISSIONS[operation];
  return userGroups.some((group) => allowedGroups.includes(group as UserGroup));
}

/**
 * Check if user is in a specific group
 * @param userGroups - Array of groups the user belongs to
 * @param group - The group to check for
 * @returns true if user is in the group
 */
export function isInGroup(userGroups: string[], group: UserGroup): boolean {
  return userGroups.includes(group);
}

/**
 * Check if user is an admin
 * @param userGroups - Array of groups the user belongs to
 * @returns true if user is an admin
 */

export function isAdmin(userGroups: string[]): boolean {
  return isInGroup(userGroups, UserGroup.ADMIN);
}

/**
 * Get human-readable error message for unauthorized operations
 * @param operation - The operation that was denied
 * @returns Error message
 */
export function getUnauthorizedMessage(operation: PlayerOperation): string {
  const allowedGroups = PERMISSIONS[operation];
  const groupNames = allowedGroups.map((g) => {
    switch (g) {
      case UserGroup.ADMIN:
        return "Administrador";
      case UserGroup.TREASURY:
        return "Tesorería";
      case UserGroup.STORE_MANAGER:
        return "Gerente de Tienda";
      default:
        return g;
    }
  });

  return `No tienes permisos para realizar esta operación. Requiere ser: ${groupNames.join(
    " o "
  )}`;
}
