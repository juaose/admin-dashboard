/**
 * DAL HTTP Client Utility
 * HTTP REST API client for lotto-mongo-dal-api service via API Gateway
 * Supports both server-side (IAM service account) and client-side (IAM user credentials) signing
 */

import { get, post, put, patch, del } from "aws-amplify/api";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { fromEnv } from "@aws-sdk/credential-providers";

// Get DAL API base URL from environment
const DAL_API_URL = process.env.DAL_API_URL || "http://localhost:3100";

// API name for Amplify configuration
const API_NAME = "dal-api";

// Determine if we're using API Gateway (IAM auth) or direct connection (no auth)
const isApiGateway = DAL_API_URL.includes("execute-api");

let alreadyRan = false;
async function testOneTime() {
  if (alreadyRan) {
    return;
  }
  console.log("Running for the 1st time: ", Date.now());
  alreadyRan = true;
  try {
    const response = await signRequestServerSide(
      "GET",
      "https://zanttjd6zj.execute-api.us-east-1.amazonaws.com/debug/admins"
    );
    console.log("[response] Error: ", response);
  } catch (error) {
    console.log("[testOneTime] Error: ", error);
  }
}

/**
 * Sign a request with AWS IAM credentials for Server-Side use
 * Uses service account credentials from environment variables
 */
async function signRequestServerSide(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  await testOneTime();
  const urlObj = new URL(url);

  const request = new HttpRequest({
    method,
    protocol: urlObj.protocol.slice(0, -1) as "http" | "https",
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    headers: {
      "Content-Type": "application/json",
      host: urlObj.hostname,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Debug: Log ACTUAL credentials (REMOVE THIS AFTER DEBUGGING!)
  console.log("=== ACTUAL CREDENTIALS (DELETE AFTER DEBUG) ===");
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY);
  console.log("AWS_SESSION_TOKEN:", process.env.AWS_SESSION_TOKEN);
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("=== END CREDENTIALS ===");

  const signer = new SignatureV4({
    service: "execute-api",
    region:
      process.env.AWS_REGION || process.env.DAL_SERVICE_REGION || "us-east-1",
    credentials: fromEnv(), // Automatically uses AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN from Lambda environment
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  const headers: Record<string, string> = signedRequest.headers;
  console.debug("signedRequest Headers: ", JSON.stringify(headers, null, " "));
  console.debug(
    "signedRequest Body: ",
    JSON.stringify(signedRequest.body, null, " ")
  );
  // Make fetch with signed headers
  return fetch(url, {
    method,
    headers: headers,
    body: signedRequest.body,
    cache: "no-store",
  });
}

/**
 * Base fetch wrapper for direct DAL connection (local development or non-API Gateway)
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
 * @param isClientSide - If true, uses client-side Amplify signing; if false (default), uses server-side signing
 * @returns Response data
 */
export async function dalGet(
  path: string,
  params?: Record<string, string>,
  isClientSide = false
): Promise<any> {
  console.log(`[DAL Client] GET ${path}`, {
    params,
    isClientSide,
    isApiGateway,
  });

  if (isApiGateway) {
    if (isClientSide) {
      // CLIENT-SIDE: Use Amplify API with user's IAM credentials from Cognito
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
      // SERVER-SIDE: Use AWS SDK to sign with service account
      let url = `${DAL_API_URL}${path}`;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await signRequestServerSide("GET", url);
      const data = await response.json();
      return data;
    }
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
 * @param isClientSide - If true, uses client-side Amplify signing; if false (default), uses server-side signing
 * @returns Response data
 */
export async function dalPost(
  path: string,
  body: any,
  isClientSide = false
): Promise<any> {
  console.log(`[DAL Client] POST ${path}`, { body, isClientSide });

  if (isApiGateway) {
    if (isClientSide) {
      // CLIENT-SIDE: Use Amplify API
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
      // SERVER-SIDE: Use AWS SDK signing
      const url = `${DAL_API_URL}${path}`;
      const response = await signRequestServerSide("POST", url, body);
      const data = await response.json();
      return data;
    }
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
 * @param isClientSide - If true, uses client-side Amplify signing; if false (default), uses server-side signing
 * @returns Response data
 */
export async function dalPut(
  path: string,
  body: any,
  isClientSide = false
): Promise<any> {
  console.log(`[DAL Client] PUT ${path}`, { body, isClientSide });

  if (isApiGateway) {
    if (isClientSide) {
      // CLIENT-SIDE: Use Amplify API
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
      // SERVER-SIDE: Use AWS SDK signing
      const url = `${DAL_API_URL}${path}`;
      const response = await signRequestServerSide("PUT", url, body);
      const data = await response.json();
      return data;
    }
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
 * @param isClientSide - If true, uses client-side Amplify signing; if false (default), uses server-side signing
 * @returns Response data
 */
export async function dalPatch(
  path: string,
  body: any,
  isClientSide = false
): Promise<any> {
  console.log(`[DAL Client] PATCH ${path}`, { body, isClientSide });

  if (isApiGateway) {
    if (isClientSide) {
      // CLIENT-SIDE: Use Amplify API
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
      // SERVER-SIDE: Use AWS SDK signing
      const url = `${DAL_API_URL}${path}`;
      const response = await signRequestServerSide("PATCH", url, body);
      const data = await response.json();
      return data;
    }
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
 * @param isClientSide - If true, uses client-side Amplify signing; if false (default), uses server-side signing
 * @returns Response data
 */
export async function dalDelete(
  path: string,
  isClientSide = false
): Promise<any> {
  console.log(`[DAL Client] DELETE ${path}`, { isClientSide });

  if (isApiGateway) {
    if (isClientSide) {
      // CLIENT-SIDE: Use Amplify API
      const response = await del({
        apiName: API_NAME,
        path,
      }).response;

      const data = await response.body.json();
      return data;
    } else {
      // SERVER-SIDE: Use AWS SDK signing
      const url = `${DAL_API_URL}${path}`;
      const response = await signRequestServerSide("DELETE", url);
      const data = await response.json();
      return data;
    }
  } else {
    // Direct connection
    return dalFetchDirect(path, { method: "DELETE" });
  }
}
