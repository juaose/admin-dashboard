/**
 * DAL HTTP Client Utility
 * HTTP REST API client for lotto-mongo-dal-api service via API Gateway
 * Client-side only - uses fetch with Cognito JWT Bearer authentication
 */

import { fetchAuthSession } from "aws-amplify/auth";

// API Gateway endpoint - must be set via NEXT_PUBLIC_DAL_API_URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_DAL_API_URL || "http://localhost:3100";

/**
 * Get Cognito ID token for authentication
 */
async function getAuthToken(): Promise<string | undefined> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (error) {
    console.warn("No Cognito session available:", error);
    return undefined;
  }
}

/**
 * Build full URL with query parameters
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
}

/**
 * GET request to DAL API
 * @param path - API endpoint path (e.g., "/api/v1/admins")
 * @param params - Optional query parameters
 * @returns Response data
 */
export async function dalGet(
  path: string,
  params?: Record<string, string>
): Promise<any> {
  console.log(`[DAL Client] GET ${path}`, { params });

  const token = await getAuthToken();
  const url = buildUrl(path, params);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DAL API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * POST request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPost(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] POST ${path}`, { body });

  const token = await getAuthToken();
  const url = buildUrl(path);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DAL API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * PUT request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPut(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] PUT ${path}`, { body });

  const token = await getAuthToken();
  const url = buildUrl(path);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DAL API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * PATCH request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPatch(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] PATCH ${path}`, { body });

  const token = await getAuthToken();
  const url = buildUrl(path);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DAL API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * DELETE request to DAL API
 * @param path - API endpoint path
 * @returns Response data
 */
export async function dalDelete(path: string): Promise<any> {
  console.log(`[DAL Client] DELETE ${path}`);

  const token = await getAuthToken();
  const url = buildUrl(path);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DAL API error: ${response.status} - ${error}`);
  }

  return response.json();
}
