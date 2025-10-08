# Role-Based Access Control (RBAC) System Documentation

## 🎉 Overview

This document describes the complete implementation of the **Role-Based Access Control (RBAC)** system in the Admin Dashboard. The system provides granular permission control for player management operations based on user groups defined in AWS Cognito.

---

## 🔐 User Groups

The system supports three user groups managed through AWS Cognito:

| Group             | Name in Cognito | Description                                                      |
| ----------------- | --------------- | ---------------------------------------------------------------- |
| **Admin**         | `admin`         | Full system access - can perform all operations                  |
| **Treasury**      | `treasury`      | Financial operations - can manage bank accounts, deposits, etc.  |
| **Store Manager** | `store_manager` | Basic operations - can manage player info but not financial data |

---

## 📊 Permission Matrix

### Player Operations Permissions

| Operation Category                                                                  | Admin | Treasury | Store Manager |
| ----------------------------------------------------------------------------------- | ----- | -------- | ------------- |
| **Player Info Updates** (codename, notes, SINPE, WhatsApp, withdrawal instructions) | ✅    | ✅       | ✅            |
| **Shop Assignment Changes**                                                         | ✅    | ❌       | ❌            |
| **Bank Account Operations** (add, delete, toggle status/favorite, host accounts)    | ✅    | ✅       | ❌            |
| **Auto-Recarga Toggle**                                                             | ✅    | ✅       | ✅            |
| **Deposit Footprints** (add, remove, set)                                           | ✅    | ✅       | ✅            |
| **Authorized Accounts** (add, remove, set)                                          | ✅    | ❌       | ❌            |

---

## 🏗️ Architecture

### **Four-Layer RBAC Architecture**

```
┌─────────────────────────────────────────┐
│  Frontend (React Components)            │
│  - usePermissions() hook                │
│  - Conditional UI rendering             │
│  - Permission-based feature flags       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Auth Context (AppAuthContext)          │
│  - Fetches user groups from Cognito     │
│  - Provides userGroups to app           │
│  - Centralized auth state               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  API Routes (Next.js)                   │
│  - checkUpdatePermission()              │
│  - Returns 403 if unauthorized          │
│  - Server-side enforcement              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Permission Definitions (RBAC)          │
│  - Permission matrix                    │
│  - Operation enums                      │
│  - Validation logic                     │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

### **Core RBAC Files**

```
admin-dashboard/
├── lib/
│   ├── rbac.ts                 # Permission definitions and validation logic
│   ├── api-auth.ts             # Server-side authorization utilities
│   └── usePermissions.ts       # Client-side permission hook
├── contexts/
│   └── AppAuthContext.tsx      # Enhanced with group fetching
└── app/api/jugadores/[id]/
    └── route.ts                # Protected with authorization checks
```

---

## 🔧 Implementation Guide

### **1. Setting Up User Groups in Cognito**

1. Go to AWS Cognito Console
2. Select your User Pool
3. Navigate to "Groups" tab
4. Create three groups:
   - `admin`
   - `treasury`
   - `store_manager`
5. Add users to appropriate groups

### **2. Server-Side Protection (API Routes)**

The API route is automatically protected. All player update operations check permissions:

```typescript
// Example from /app/api/jugadores/[id]/route.ts
import { checkUpdatePermission } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... other code ...

  const { updateType, data } = await request.json();

  // Check authorization
  const authCheck = await checkUpdatePermission(request, updateType);
  if (!authCheck.allowed) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: 403 }
    );
  }

  // ... proceed with update ...
}
```

### **3. Frontend Permission Checks**

Use the `usePermissions()` hook to conditionally render UI elements:

```typescript
import { usePermissions } from "@/lib/usePermissions";
import { PlayerOperation } from "@/lib/rbac";

function PlayerEditor() {
  const { can, isUserAdmin, isTreasury } = usePermissions();

  return (
    <div>
      {/* Show shop selector only to admins */}
      {can(PlayerOperation.CHANGE_SHOP) && <ShopSelector />}

      {/* Show bank account management to admins and treasury */}
      {can(PlayerOperation.ADD_BANK_ACCOUNT) && <BankAccountManager />}

      {/* Alternative: Check by group */}
      {isUserAdmin() && <AdminOnlyFeature />}
    </div>
  );
}
```

### **4. Available Hook Functions**

```typescript
const {
  // Check permission for specific operation
  can, // can(PlayerOperation.CHANGE_SHOP) => boolean

  // Check group membership
  inGroup, // inGroup(UserGroup.ADMIN) => boolean
  isUserAdmin, // isUserAdmin() => boolean
  isTreasury, // isTreasury() => boolean
  isStoreManager, // isStoreManager() => boolean

  // Get all groups
  getUserGroups, // getUserGroups() => string[]
  userGroups, // Direct access to groups array
} = usePermissions();
```

---

## 🎯 Common Use Cases

### **Use Case 1: Disable Button Based on Permission**

```typescript
import { usePermissions } from "@/lib/usePermissions";
import { PlayerOperation } from "@/lib/rbac";

function ShopAssignmentButton() {
  const { can } = usePermissions();
  const canChangeShop = can(PlayerOperation.CHANGE_SHOP);

  return (
    <button
      disabled={!canChangeShop}
      title={!canChangeShop ? "Solo administradores pueden cambiar tienda" : ""}
    >
      Cambiar Tienda
    </button>
  );
}
```

### **Use Case 2: Hide Entire Section**

```typescript
import { usePermissions } from "@/lib/usePermissions";
import { PlayerOperation } from "@/lib/rbac";

function BankAccountsSection() {
  const { can } = usePermissions();

  // Don't render at all if no permission
  if (!can(PlayerOperation.ADD_BANK_ACCOUNT)) {
    return null;
  }

  return (
    <div>
      <h3>Cuentas Bancarias</h3>
      {/* Bank account management UI */}
    </div>
  );
}
```

### **Use Case 3: Show Different UI for Different Roles**

```typescript
import { usePermissions } from "@/lib/usePermissions";

function PlayerDashboard() {
  const { isUserAdmin, isTreasury, isStoreManager } = usePermissions();

  return (
    <div>
      <h2>Panel de Jugador</h2>

      {isUserAdmin() && <AdminToolbar />}
      {isTreasury() && <FinancialTools />}
      {isStoreManager() && <StoreManagementTools />}

      {/* Common tools for all */}
      <PlayerBasicInfo />
    </div>
  );
}
```

---

## 🔍 Available Operations

All available operations are defined in `PlayerOperation` enum:

```typescript
// Basic info updates
PlayerOperation.UPDATE_CODENAME;
PlayerOperation.UPDATE_NOTES;
PlayerOperation.UPDATE_SINPE;
PlayerOperation.UPDATE_WHATSAPP;
PlayerOperation.UPDATE_WITHDRAWAL_INSTRUCTIONS;

// Shop management
PlayerOperation.CHANGE_SHOP;

// Bank account operations
PlayerOperation.ADD_BANK_ACCOUNT;
PlayerOperation.DELETE_BANK_ACCOUNT;
PlayerOperation.TOGGLE_BANK_ACCOUNT_STATUS;
PlayerOperation.TOGGLE_BANK_ACCOUNT_FAVORITE;
PlayerOperation.ADD_HOST_ACCOUNT;
PlayerOperation.REMOVE_HOST_ACCOUNT;

// Auto-recarga
PlayerOperation.TOGGLE_AUTO_RECARGA;

// Deposit footprints
PlayerOperation.ADD_FOOTPRINT;
PlayerOperation.REMOVE_FOOTPRINT;
PlayerOperation.SET_FOOTPRINTS;

// Authorized accounts
PlayerOperation.ADD_AUTHORIZED_ACCOUNT;
PlayerOperation.REMOVE_AUTHORIZED_ACCOUNT;
PlayerOperation.SET_AUTHORIZED_ACCOUNTS;
```

---

## 🛡️ Security Features

### **Multi-Layer Protection**

1. **Frontend Layer**: UI elements hidden/disabled based on permissions
2. **API Layer**: Server-side validation of all requests
3. **Token-Based**: Groups extracted from JWT tokens
4. **Centralized**: Single source of truth for permissions

### **Error Handling**

When unauthorized:

- **Frontend**: Elements not rendered or disabled
- **API**: Returns 403 status with Spanish error message
- **Error Messages**: User-friendly, role-specific feedback

Example error message:

```
"No tienes permisos para realizar esta operación. Requiere ser: Administrador"
```

---

## 📝 Adding New Permissions

### **Step 1: Add Operation to Enum**

```typescript
// In lib/rbac.ts
export enum PlayerOperation {
  // ... existing operations ...
  NEW_OPERATION = "new_operation",
}
```

### **Step 2: Define Permissions**

```typescript
// In lib/rbac.ts
const PERMISSIONS: Record<PlayerOperation, UserGroup[]> = {
  // ... existing permissions ...
  [PlayerOperation.NEW_OPERATION]: [UserGroup.ADMIN, UserGroup.TREASURY],
};
```

### **Step 3: Map to Update Type (if API operation)**

```typescript
// In lib/rbac.ts
export const UPDATE_TYPE_TO_OPERATION: Record<string, PlayerOperation> = {
  // ... existing mappings ...
  newOperation: PlayerOperation.NEW_OPERATION,
};
```

### **Step 4: Use in Frontend**

```typescript
const { can } = usePermissions();

{
  can(PlayerOperation.NEW_OPERATION) && <NewFeatureComponent />;
}
```

---

## 🧪 Testing the System

### **Manual Testing Checklist**

1. **Create Test Users**

   - One user in `admin` group
   - One user in `treasury` group
   - One user in `store_manager` group

2. **Test Admin User**

   - ✅ Can change shop assignment
   - ✅ Can manage bank accounts
   - ✅ Can manage authorized accounts
   - ✅ Can see all UI elements

3. **Test Treasury User**

   - ❌ Cannot change shop assignment
   - ✅ Can manage bank accounts
   - ❌ Cannot manage authorized accounts
   - ✅ Shop assignment UI hidden

4. **Test Store Manager User**
   - ❌ Cannot change shop assignment
   - ❌ Cannot manage bank accounts
   - ❌ Cannot manage authorized accounts
   - ✅ Can update basic player info
   - ✅ Can toggle auto-recarga

### **API Testing**

Test with different user tokens:

```bash
# Admin user - should succeed
curl -X PUT /api/jugadores/123 \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"updateType": "shopID", "data": {"shopID": 5}}'

# Treasury user - should return 403
curl -X PUT /api/jugadores/123 \
  -H "Authorization: Bearer <treasury_token>" \
  -d '{"updateType": "shopID", "data": {"shopID": 5}}'
```

---

## 🔄 Migration Notes

### **Backward Compatibility**

- Existing functionality unchanged
- No breaking changes to API
- Gradual rollout possible

### **For Existing Users**

Users without groups assigned will have no permissions. Ensure all users are added to at least one group before deploying.

---

## 📚 Best Practices

1. **Always Check Permissions on Both Sides**

   - Frontend: Better UX (hide unavailable features)
   - Backend: Security (prevent unauthorized access)

2. **Use Descriptive Operation Names**

   - Makes permissions self-documenting
   - Easier to understand permission matrix

3. **Group Similar Operations**

   - Related operations should have similar permissions
   - Makes system easier to reason about

4. **Test with Real User Accounts**

   - Don't just test as admin
   - Verify each role works as expected

5. **Document Permission Changes**
   - Update this document when adding operations
   - Keep permission matrix current

---

## 🐛 Troubleshooting

### **User Can't See Expected Features**

1. Check user group assignment in Cognito
2. Verify user has logged out and back in (groups cached in token)
3. Check browser console for userGroups value
4. Verify operation is in permission matrix

### **API Returns 403 Unexpectedly**

1. Check Authorization header is present
2. Verify JWT token contains `cognito:groups` claim
3. Check operation mapping in `UPDATE_TYPE_TO_OPERATION`
4. Review server logs for permission check details

### **Groups Not Loading**

1. Check `AppAuthContext` is mounted correctly
2. Verify `fetchAuthSession` has access to token
3. Check network tab for auth requests
4. Ensure Amplify is configured properly

---

## 🎓 Example: Complete Component with RBAC

```typescript
"use client";

import { useState } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { PlayerOperation } from "@/lib/rbac";

export default function PlayerEditor({ player }) {
  const { can, isUserAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);

  const handleShopChange = async (newShopId: number) => {
    // Permission check redundant here (button is hidden) but good practice
    if (!can(PlayerOperation.CHANGE_SHOP)) {
      alert("No tienes permisos para cambiar la tienda");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/jugadores/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateType: "shopID",
          data: { shopID: newShopId },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al actualizar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>{player.codename}</h2>

      {/* Only show to admins */}
      {can(PlayerOperation.CHANGE_SHOP) && (
        <div>
          <label>Tienda:</label>
          <select
            onChange={(e) => handleShopChange(parseInt(e.target.value))}
            disabled={loading}
          >
            <option value="1">Tienda 1</option>
            <option value="2">Tienda 2</option>
          </select>
        </div>
      )}

      {/* Show to admins and treasury */}
      {can(PlayerOperation.ADD_BANK_ACCOUNT) && (
        <button onClick={() => openBankAccountModal()}>
          Agregar Cuenta Bancaria
        </button>
      )}

      {/* Show to everyone */}
      {can(PlayerOperation.TOGGLE_AUTO_RECARGA) && (
        <label>
          <input
            type="checkbox"
            checked={player.autoRecarga}
            onChange={handleAutoRecargaToggle}
          />
          Auto-Recarga
        </label>
      )}

      {/* Admin-only debug info */}
      {isUserAdmin() && (
        <div style={{ background: "#f0f0f0", padding: "10px" }}>
          <strong>Debug Info (Admin Only):</strong>
          <pre>{JSON.stringify(player, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Summary

The RBAC system provides:

✅ **Granular Permissions** - Control at operation level  
✅ **Multi-Layer Security** - Frontend + Backend protection  
✅ **Easy to Use** - Simple hooks and utilities  
✅ **Maintainable** - Centralized permission definitions  
✅ **Extensible** - Easy to add new roles/operations  
✅ **Cognito Integration** - Leverages existing AWS infrastructure

---

**Document Version:** 1.0  
**Last Updated:** October 6, 2025  
**Status:** ✅ Complete & Production Ready
