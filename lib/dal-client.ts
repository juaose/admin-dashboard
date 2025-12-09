/**
 * DAL HTTP Client Utility
 * HTTP REST API client for lotto-mongo-dal-api service via API Gateway with IAM auth
 */

import { get, post, put, patch, del } from "aws-amplify/api";

// Get DAL API base URL from environment
const DAL_API_URL = process.env.DAL_API_URL || "http://localhost:3100";

// API name for Amplify configuration
const API_NAME = "dal-api";

/**
 * Determine if we're using API Gateway (IAM auth) or direct connection (no auth)
 */
const isApiGateway = DAL_API_URL.includes("execute-api");

/**
 * Base fetch wrapper for direct DAL connection (local development)
 * Used when DAL_API_URL points to localhost or internal ALB
 */
async function dalFetchDirect(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const url = `${DAL_API_URL}${path}`;

    console.log(`[DAL Client] ${options.method || "GET"} ${url}`);

    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "DAL API request failed");
    }

    return data;
  } catch (error) {
    console.error(
      `[DAL Client Error] ${options.method || "GET"} ${path}:`,
      error
    );
    throw error;
  }
}

/**
 * GET request to DAL API
 * @param path - API endpoint path (e.g., "/api/v1/players")
 * @param params - Optional query parameters
 * @returns Response data
 */
export async function dalGet(
  path: string,
  params?: Record<string, string>
): Promise<any> {
  console.log(`[DAL Client] GET ${path}`, params);

  if (isApiGateway) {
    // Use Amplify API with IAM signing for API Gateway
    const response = await get({
      apiName: API_NAME,
      path,
      options: {
        queryParams: params,
      },
    }).response;

    const data = await response.body.json();
    return data;
  } else {
    // Direct connection (local dev or internal ALB)
    let url = path;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${path}?${queryString}`;
      }
    }
    return dalFetchDirect(url, { method: "GET" });
  }
}

/**
 * POST request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPost(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] POST ${path}`, body);

  if (isApiGateway) {
    // Use Amplify API with IAM signing for API Gateway
    const response = await post({
      apiName: API_NAME,
      path,
      options: {
        body,
      },
    }).response;

    const data = await response.body.json();
    return data;
  } else {
    // Direct connection
    return dalFetchDirect(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

/**
 * PUT request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPut(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] PUT ${path}`, body);

  if (isApiGateway) {
    // Use Amplify API with IAM signing for API Gateway
    const response = await put({
      apiName: API_NAME,
      path,
      options: {
        body,
      },
    }).response;

    const data = await response.body.json();
    return data;
  } else {
    // Direct connection
    return dalFetchDirect(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}

/**
 * PATCH request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPatch(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] PATCH ${path}`, body);

  if (isApiGateway) {
    // Use Amplify API with IAM signing for API Gateway
    const response = await patch({
      apiName: API_NAME,
      path,
      options: {
        body,
      },
    }).response;

    const data = await response.body.json();
    return data;
  } else {
    // Direct connection
    return dalFetchDirect(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
}

/**
 * DELETE request to DAL API
 * @param path - API endpoint path
 * @returns Response data
 */
export async function dalDelete(path: string): Promise<any> {
  console.log(`[DAL Client] DELETE ${path}`);

  if (isApiGateway) {
    // Use Amplify API with IAM signing for API Gateway
    const response = await del({
      apiName: API_NAME,
      path,
    }).response;

    const data = await response.body.json();
    return data;
  } else {
    // Direct connection
    return dalFetchDirect(path, { method: "DELETE" });
  }
}
