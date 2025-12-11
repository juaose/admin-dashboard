/**
 * Server-side Authorization Utilities for API Routes (Amplify Gen2)
 *
 * Provides functions to extract user groups from requests and validate permissions
 */

import { NextRequest } from "next/server";
import {
  PlayerOperation,
  hasPermission,
  getUnauthorizedMessage,
  UPDATE_TYPE_TO_OPERATION,
} from "./rbac";

//import { createServerRunner } from "@aws-amplify/adapter-nextjs";
// import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth/server";
// import { cookies } from "next/headers";
//import outputs from "../amplify_outputs.json";
// const { runWithAmplifyServerContext } = createServerRunner({
//   config: outputs,
// });

/**
 * Extract raw JWT token from Authorization header
 * Used to forward the user's token to downstream services
 */
export function getAuthTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Return the full "Bearer TOKEN" format
  return authHeader;
}

/**
 * Extract user groups from JWT token in Authorization header
 *
 * The frontend will send the Cognito access token (from fetchAuthSession)
 * in the Authorization header. We decode this AWS-signed JWT to extract groups.
 */
export async function getUserGroupsFromRequest(
  request: NextRequest
): Promise<string[]> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token in Authorization header");
      return [];
    }

    // Extract the token
    const accessToken = authHeader.substring(7);

    // Decode JWT token (just the payload)
    // JWT format: header.payload.signature
    const parts = accessToken.split(".");
    if (parts.length !== 3) {
      console.log("❌ Invalid JWT format");
      return [];
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    const decodedPayload = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8")
    );

    // Extract groups from the payload
    const groups = decodedPayload["cognito:groups"];

    // Type-safe check: ensure groups is an array of strings
    if (Array.isArray(groups) && groups.every((g) => typeof g === "string")) {
      console.log("✅ User groups:", groups);
      return groups as string[];
    }

    console.log("❌ No valid groups in JWT");
    return [];
  } catch (error) {
    console.error("❌ Error parsing JWT:", error);
    return [];
  }
}

/**
 * Check if the current request has permission to perform an operation
 *
 * @param request - The Next.js request object
 * @param operation - The operation to check permission for
 * @returns Object with success status and optional error message
 */
export async function checkPermission(
  request: NextRequest,
  operation: PlayerOperation
): Promise<{ allowed: boolean; error?: string }> {
  const userGroups = await getUserGroupsFromRequest(request);

  if (userGroups.length === 0) {
    console.log(`❌ Auth failed for ${operation} - no groups`);
    return {
      allowed: false,
      error:
        "Error de autenticación: No se pudo verificar tu identidad. Por favor, cierra sesión y vuelve a iniciar sesión.",
    };
  }

  const allowed = hasPermission(userGroups, operation);

  if (!allowed) {
    console.log(
      `❌ Permission denied: ${operation} for groups [${userGroups.join(", ")}]`
    );
    return {
      allowed: false,
      error: getUnauthorizedMessage(operation),
    };
  }

  console.log(
    `✅ Permission granted: ${operation} for [${userGroups.join(", ")}]`
  );
  return { allowed: true };
}

/**
 * Check permission for an update type (convenience wrapper)
 *
 * @param request - The Next.js request object
 * @param updateType - The update type string from the API request
 * @returns Object with success status and optional error message
 */
export async function checkUpdatePermission(
  request: NextRequest,
  updateType: string
): Promise<{ allowed: boolean; error?: string }> {
  const operation = UPDATE_TYPE_TO_OPERATION[updateType];

  if (!operation) {
    return {
      allowed: false,
      error: "Tipo de operación desconocido",
    };
  }

  return checkPermission(request, operation);
}
