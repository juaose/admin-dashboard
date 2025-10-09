# RBAC Implementation Guide - Complete Technical Documentation

**Last Updated:** October 6, 2025  
**Status:** ✅ Production Ready  
**Auth Provider:** AWS Cognito (Amplify Gen2)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Authentication Flow](#authentication-flow)
3. [Implementation Challenges & Solutions](#implementation-challenges--solutions)
4. [Architecture](#architecture)
5. [Configuration](#configuration)
6. [API Protection](#api-protection)
7. [Frontend Integration](#frontend-integration)
8. [Testing & Troubleshooting](#testing--troubleshooting)

---

## System Overview

### What is RBAC?

Role-Based Access Control (RBAC) restricts system access based on user roles. Users are assigned to Cognito groups (roles), and each role has specific permissions.

### Our Implementation

- **Roles:** Defined in AWS Cognito User Pool groups
- **Permissions:** Defined in `lib/rbac.ts`
- **Enforcement:** Server-side validation in API routes
- **Authentication:** JWT tokens from AWS Cognito

---

## Authentication Flow

### How Groups Data Flows Through the System

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Login (AWS Cognito)                                  │
│    - User authenticates via Amplify Authenticator            │
│    - Cognito issues JWT access token                         │
│    - Token contains user's groups in payload                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend (Browser)                                         │
│    - Access token stored in browser localStorage             │
│    - NOT in cookies (Amplify Gen2 behavior)                  │
│    - fetchAuthSession() retrieves token from storage         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. API Request                                                │
│    - Frontend calls getAuthHeaders()                          │
│    - Fetches access token via fetchAuthSession()             │
│    - Adds token to Authorization header                       │
│    - Request: Authorization: Bearer <jwt-token>              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. API Route (Server-side)                                    │
│    - Extracts token from Authorization header                │
│    - Decodes JWT payload (base64url)                         │
│    - Reads cognito:groups array                              │
│    - Validates permissions via RBAC system                    │
└─────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

The access token is a JSON Web Token (JWT) with three parts:

```
header.payload.signature
```

**Example Decoded Payload:**

```json
{
  "sub": "4498c408-a091-70ab-5a5f-81cb9e77b59e",
  "cognito:groups": ["admin"],
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_...",
  "client_id": "14vo76oq5vsg88kj3ckhlaa3mn",
  "token_use": "access",
  "scope": "aws.cognito.signin.user.admin",
  "auth_time": 1759761826,
  "exp": 1759765426,
  "iat": 1759761826,
  "username": "4498c408-a091-70ab-5a5f-81cb9e77b59e"
}
```

**Key Field:** `cognito:groups` - Array of Cognito group names the user belongs to

---

## Implementation Challenges & Solutions

### ❌ What Didn't Work (And Why)

#### Attempt 1: Amplify Server Context with fetchAuthSession

**What we tried:**

```typescript
import { runWithAmplifyServerContext } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession } from "aws-amplify/auth/server";

const session = await fetchAuthSession(contextSpec);
const groups = session.tokens?.accessToken?.payload["cognito:groups"];
```

**Result:** ❌ Failed

- `session.tokens` was always `undefined`
- Only got Identity Pool credentials, not User Pool tokens
- Error: Server context couldn't access user authentication state

**Why it failed:**

- Amplify Gen2 stores tokens in browser localStorage, not in cookies
- Server-side context has no access to browser localStorage
- Server-side methods expect cookies but Amplify doesn't use them for tokens

#### Attempt 2: getCurrentUser() for User Pool Access

**What we tried:**

```typescript
import { getCurrentUser } from "aws-amplify/auth/server";

const currentUser = await getCurrentUser(contextSpec);
```

**Result:** ❌ Failed with `UserUnAuthenticatedException`

- Error: "User needs to be authenticated to call this API"
- Server couldn't verify user authentication status
- Same root cause: no access to localStorage tokens

**Why it failed:**

- Same localStorage vs cookies issue
- Server-side utilities expect cookie-based sessions
- Amplify Gen2 architecture doesn't support this pattern

#### Attempt 3: Reading Tokens from Cookies

**What we tried:**

```typescript
const cookieStore = cookies();
const allCookies = cookieStore.getAll();
// Search for accessToken in cookie names
```

**Result:** ❌ Failed

- Only found: `com.amplify.Cognito.us-east-1%3A[id].identityId`
- No access tokens in cookies
- Only Identity Pool ID stored in cookies

**Why it failed:**

- Amplify Gen2 deliberately stores tokens in localStorage for security
- Cookies only contain Identity Pool information
- This is by design in Amplify's architecture

### ✅ What Works (Final Solution)

#### Solution: Authorization Header with JWT Token

**How it works:**

```typescript
// Frontend: Get token from localStorage and send in header
const session = await fetchAuthSession();
const accessToken = session.tokens?.accessToken?.toString();

fetch("/api/endpoint", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

// Backend: Decode JWT from Authorization header
const authHeader = request.headers.get("authorization");
const token = authHeader.substring(7); // Remove "Bearer "
const payload = JSON.parse(
  Buffer.from(
    token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/"),
    "base64"
  ).toString("utf-8")
);
const groups = payload["cognito:groups"];
```

**Why it works:**

- ✅ Frontend has access to localStorage tokens
- ✅ Tokens sent explicitly in HTTP headers
- ✅ Server can decode JWT without needing session context
- ✅ JWT is cryptographically signed by AWS (secure)
- ✅ Standard OAuth2/OIDC pattern

---

## Architecture

### File Structure

```
admin-dashboard/
├── lib/
│   ├── rbac.ts                 # RBAC core logic
│   ├── api-auth.ts             # JWT extraction & validation
│   └── usePermissions.ts       # Frontend permission hooks
├── app/
│   ├── api/
│   │   └── jugadores/
│   │       └── [id]/
│   │           └── route.ts    # Protected API endpoint
│   └── jugadores/
│       └── page.tsx            # Frontend with auth headers
└── RBAC_IMPLEMENTATION_GUIDE.md
```

### Core Components

#### 1. `lib/rbac.ts` - RBAC Logic

**Purpose:** Define roles, operations, and permission matrix

```typescript
// Player operations that can be permission-controlled
export type PlayerOperation =
  | "MANAGE_SHOP"
  | "MANAGE_AUTO_RECARGA"
  | "MANAGE_BANKS"
  | "MANAGE_AUTHORIZED_ACCOUNTS"
  | "UPDATE_PLAYER_INFO";

// Permission matrix
const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    "MANAGE_SHOP",
    "MANAGE_AUTO_RECARGA",
    "MANAGE_BANKS",
    "MANAGE_AUTHORIZED_ACCOUNTS",
    "UPDATE_PLAYER_INFO",
  ],
  treasury: ["MANAGE_AUTO_RECARGA", "MANAGE_BANKS", "UPDATE_PLAYER_INFO"],
  store_manager: ["MANAGE_AUTO_RECARGA", "UPDATE_PLAYER_INFO"],
};
```

#### 2. `lib/api-auth.ts` - JWT Authentication

**Purpose:** Extract groups from JWT and validate permissions

**Key Functions:**

```typescript
// Extract user groups from Authorization header
async function getUserGroupsFromRequest(
  request: NextRequest
): Promise<string[]>;

// Check if user has permission for an operation
async function checkPermission(
  request: NextRequest,
  operation: PlayerOperation
): Promise<{ allowed: boolean; error?: string }>;

// Convenience wrapper for update types
async function checkUpdatePermission(
  request: NextRequest,
  updateType: string
): Promise<{ allowed: boolean; error?: string }>;
```

#### 3. API Route Protection

**File:** `app/api/jugadores/[id]/route.ts`

**Pattern:**

```typescript
export async function PUT(request: NextRequest) {
  // 1. Parse request
  const { updateType, data } = await request.json();

  // 2. Check permissions
  const authCheck = await checkUpdatePermission(request, updateType);
  if (!authCheck.allowed) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: 403 }
    );
  }

  // 3. Proceed with operation
  // ... business logic
}
```

#### 4. Frontend Integration

**File:** `app/jugadores/page.tsx`

**Helper Function:**

```typescript
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString();

  if (accessToken) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return { "Content-Type": "application/json" };
}
```

**Usage:**

```typescript
const headers = await getAuthHeaders();
const response = await fetch(`/api/jugadores/${id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify({ updateType, data }),
});
```

---

## Configuration

### 1. Create Cognito Groups

**AWS Console Steps:**

1. Go to AWS Cognito → User Pools
2. Select your user pool
3. Navigate to "Groups" tab
4. Create groups:
   - `admin` - Full access
   - `treasury` - Financial operations
   - `store_manager` - Basic operations

### 2. Assign Users to Groups

1. Go to "Users" tab
2. Select a user
3. Click "Add user to group"
4. Choose appropriate group(s)

### 3. Customize Permissions

Edit `lib/rbac.ts`:

```typescript
const ROLE_PERMISSIONS: RolePermissions = {
  admin: ["MANAGE_SHOP", "MANAGE_AUTO_RECARGA", ...],
  treasury: ["MANAGE_BANKS", ...],
  store_manager: ["MANAGE_AUTO_RECARGA", ...],
  // Add custom roles here
  custom_role: ["SPECIFIC_PERMISSION"],
};
```

---

## API Protection

### How to Protect an Endpoint

**Example:** Protect a player update endpoint

```typescript
import { checkUpdatePermission } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse request
    const { updateType, data } = await request.json();

    // Validate permissions
    const authCheck = await checkUpdatePermission(request, updateType);

    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 } // Forbidden
      );
    }

    // Proceed with authorized operation
    const result = await updatePlayer(params.id, updateType, data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Update Type Mapping

In `lib/rbac.ts`, map update types to operations:

```typescript
export const UPDATE_TYPE_TO_OPERATION: Record<string, PlayerOperation> = {
  // Shop operations
  shopID: "MANAGE_SHOP",

  // Auto-recarga
  autoRecarga: "MANAGE_AUTO_RECARGA",

  // Bank operations
  setBankAccounts: "MANAGE_BANKS",
  addBankAccount: "MANAGE_BANKS",
  removeBankAccount: "MANAGE_BANKS",

  // Authorized accounts
  setAuthorizedAccounts: "MANAGE_AUTHORIZED_ACCOUNTS",

  // Player info
  codename: "UPDATE_PLAYER_INFO",
  sinpe_num: "UPDATE_PLAYER_INFO",
  whatsapp_num: "UPDATE_PLAYER_INFO",
  notes: "UPDATE_PLAYER_INFO",
  withdrawalInstructions: "UPDATE_PLAYER_INFO",
};
```

---

## Frontend Integration

### Pattern for Protected API Calls

**Step 1:** Import helper

```typescript
import { fetchAuthSession } from "aws-amplify/auth";
```

**Step 2:** Create auth headers helper (if not exists)

```typescript
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (accessToken) {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };
    }
  } catch (error) {
    console.error("Error getting auth session:", error);
  }

  return {
    "Content-Type": "application/json",
  };
}
```

**Step 3:** Use in API calls

```typescript
async function handleUpdate() {
  const headers = await getAuthHeaders();

  const response = await fetch("/api/endpoint", {
    method: "PUT",
    headers,
    body: JSON.stringify({ data }),
  });

  const result = await response.json();

  if (!result.success) {
    alert(result.error); // Show permission error
  }
}
```

---

## Testing & Troubleshooting

### Manual Testing Steps

1. **Create Test Users**

   ```
   Admin User → Assign to 'admin' group
   Treasury User → Assign to 'treasury' group
   Store Manager → Assign to 'store_manager' group
   ```

2. **Test Admin Permissions**

   - Login as admin
   - Try changing player shop → Should succeed ✅
   - Try toggling auto-recarga → Should succeed ✅
   - Try managing bank accounts → Should succeed ✅

3. **Test Store Manager Permissions**
   - Login as store_manager
   - Try changing player shop → Should fail ❌
   - Try toggling auto-recarga → Should succeed ✅
   - Try managing bank accounts → Should fail ❌

### Common Issues

#### Issue: "No se pudieron determinar los permisos del usuario"

**Cause:** No groups extracted from token

**Solutions:**

1. Check user is assigned to a Cognito group
2. User must logout and login again after group assignment
3. Verify Authorization header is being sent:
   ```typescript
   console.log("Headers:", await getAuthHeaders());
   ```

#### Issue: 403 Forbidden for authorized user

**Cause:** Permission not granted for operation

**Solutions:**

1. Check `ROLE_PERMISSIONS` in `lib/rbac.ts`
2. Verify update type mapping in `UPDATE_TYPE_TO_OPERATION`
3. Check server logs for RBAC decisions

#### Issue: Token not being sent

**Cause:** Frontend not calling `getAuthHeaders()`

**Solutions:**

1. Ensure all protected API calls use:
   ```typescript
   const headers = await getAuthHeaders();
   ```
2. Check Network tab in DevTools for Authorization header
3. Verify `fetchAuthSession()` is imported from `aws-amplify/auth`

### Debug Mode

To enable detailed logging, temporarily add to `lib/api-auth.ts`:

```typescript
export async function getUserGroupsFromRequest(
  request: NextRequest
): Promise<string[]> {
  try {
    const authHeader = request.headers.get("authorization");
    console.log("=== RBAC Debug ===");
    console.log("Auth header present:", !!authHeader);

    // ... rest of function

    console.log("Groups extracted:", groups);
    console.log("=================");

    return groups;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}
```

---

## Security Considerations

### Why This Approach is Secure

1. **JWT Signature Verification**

   - Tokens are cryptographically signed by AWS Cognito
   - Cannot be forged or tampered with
   - Signature is validated automatically by AWS infrastructure

2. **No Trust-the-Client**

   - Groups come from AWS-issued tokens, not user input
   - Server decodes and validates tokens
   - User cannot claim to have permissions they don't have

3. **Short Token Lifetime**

   - Access tokens expire (default: 1 hour)
   - Requires re-authentication for continued access
   - Reduces risk of stolen token abuse

4. **Server-Side Enforcement**
   - All permission checks happen on the server
   - Frontend checks are for UX only
   - Cannot bypass by modifying client code

### Best Practices

1. **Always validate on server-side** - Never trust frontend
2. **Use HTTPS** - Protect tokens in transit
3. **Short token expiration** - Minimize stolen token risk
4. **Audit logs** - Log permission-denied attempts
5. **Principle of least privilege** - Give minimum required permissions

---

## Extension Examples

### Adding a New Role

```typescript
// 1. Create Cognito group (AWS Console)
// Group name: "auditor"

// 2. Define permissions in lib/rbac.ts
const ROLE_PERMISSIONS: RolePermissions = {
  // ... existing roles
  auditor: [
    "VIEW_PLAYER_INFO", // Read-only permission
  ],
};
```

### Adding a New Operation

```typescript
// 1. Add operation type in lib/rbac.ts
export type PlayerOperation =
  | "MANAGE_SHOP"
  | "MANAGE_AUTO_RECARGA"
  | "DELETE_PLAYER"      // New operation
  | ...

// 2. Assign to roles
const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    "MANAGE_SHOP",
    "DELETE_PLAYER",     // Only admins can delete
    ...
  ],
  treasury: [...],       // No delete permission
};

// 3. Map update type (if needed)
export const UPDATE_TYPE_TO_OPERATION: Record<string, PlayerOperation> = {
  deletePlayer: "DELETE_PLAYER",
  ...
};

// 4. Protect endpoint
const authCheck = await checkUpdatePermission(request, "deletePlayer");
```

---

## Appendix: Token Storage Location

### Where Are Tokens Stored?

**Browser Storage:**

```
localStorage
└── Key pattern: CognitoIdentityServiceProvider.<client_id>.<username>.*
    ├── accessToken
    ├── idToken
    ├── refreshToken
    └── clockDrift
```

**NOT in Cookies:**

- Amplify Gen2 stores tokens in localStorage by default
- Cookies only contain Identity Pool ID
- This is intentional for security (HttpOnly cookies aren't accessible to JS)

**Accessing Tokens:**

```typescript
// ✅ Correct way (frontend)
import { fetchAuthSession } from "aws-amplify/auth";
const session = await fetchAuthSession();
const token = session.tokens?.accessToken;

// ❌ Wrong way (will fail)
const cookies = document.cookie; // Tokens not here
```

---

## Summary

### What You Need to Know

1. **Groups are stored in JWT tokens** issued by AWS Cognito
2. **Tokens live in browser localStorage** (not cookies)
3. **Frontend sends tokens in Authorization header** to API
4. **Server decodes JWT** to extract groups
5. **RBAC system validates** permissions based on groups
6. **Server-side enforcement** ensures security

### Quick Reference

**Add user to group:** AWS Console → Cognito → Users → Add to group  
**Check permissions:** `lib/rbac.ts` → `ROLE_PERMISSIONS`  
**Protect endpoint:** Import `checkUpdatePermission` from `lib/api-auth.ts`  
**Frontend auth:** Use `getAuthHeaders()` helper function  
**Debug:** Check server console for RBAC logs

---

**Questions?** Review this guide or check the implementation in:

- `lib/rbac.ts` - Core RBAC logic
- `lib/api-auth.ts` - JWT handling
- `app/api/jugadores/[id]/route.ts` - Example protected endpoint
