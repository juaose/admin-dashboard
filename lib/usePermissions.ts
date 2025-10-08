/**
 * Custom React Hook for Permission Checks
 *
 * Provides client-side permission checking for UI rendering decisions
 */

import { useAppAuth } from "@/contexts/AppAuthContext";
import {
  PlayerOperation,
  hasPermission,
  isInGroup,
  isAdmin,
  UserGroup,
} from "./rbac";

export function usePermissions() {
  const { userGroups } = useAppAuth();

  /**
   * Check if current user has permission for an operation
   */
  const can = (operation: PlayerOperation): boolean => {
    return hasPermission(userGroups, operation);
  };

  /**
   * Check if current user is in a specific group
   */
  const inGroup = (group: UserGroup): boolean => {
    return isInGroup(userGroups, group);
  };

  /**
   * Check if current user is an admin
   */
  const isUserAdmin = (): boolean => {
    return isAdmin(userGroups);
  };

  /**
   * Check if current user is in treasury group
   */
  const isTreasury = (): boolean => {
    return inGroup(UserGroup.TREASURY);
  };

  /**
   * Check if current user is a store manager
   */
  const isStoreManager = (): boolean => {
    return inGroup(UserGroup.STORE_MANAGER);
  };

  /**
   * Get all user groups
   */
  const getUserGroups = (): string[] => {
    return userGroups;
  };

  return {
    can,
    inGroup,
    isUserAdmin,
    isTreasury,
    isStoreManager,
    getUserGroups,
    userGroups,
  };
}
