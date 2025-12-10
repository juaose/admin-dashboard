/**
 * DAL HTTP Client Utility
 * HTTP REST API client for lotto-mongo-dal-api service via API Gateway
 * Uses Amplify API with Cognito authentication
 */

import { get, post, put, patch, del } from "aws-amplify/api";

// API name for Amplify configuration
const API_NAME = "dal-api";

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

  const response = await get({
    apiName: API_NAME,
    path,
    options: {
      queryParams: params,
    },
  }).response;

  const data = await response.body.json();
  return data;
}

/**
 * POST request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPost(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] POST ${path}`, { body });

  const response = await post({
    apiName: API_NAME,
    path,
    options: {
      body,
    },
  }).response;

  const data = await response.body.json();
  return data;
}

/**
 * PUT request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPut(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] PUT ${path}`, { body });

  const response = await put({
    apiName: API_NAME,
    path,
    options: {
      body,
    },
  }).response;

  const data = await response.body.json();
  return data;
}

/**
 * PATCH request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPatch(path: string, body: any): Promise<any> {
  console.log(`[DAL Client] PATCH ${path}`, { body });

  const response = await patch({
    apiName: API_NAME,
    path,
    options: {
      body,
    },
  }).response;

  const data = await response.body.json();
  return data;
}

/**
 * DELETE request to DAL API
 * @param path - API endpoint path
 * @returns Response data
 */
export async function dalDelete(path: string): Promise<any> {
  console.log(`[DAL Client] DELETE ${path}`);

  const response = await del({
    apiName: API_NAME,
    path,
  }).response;

  const data = await response.body.json();
  return data;
}
