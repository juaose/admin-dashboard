/**
 * DAL HTTP Client Utility
 * HTTP REST API client for lotto-mongo-dal-api service
 */

// Get DAL API base URL from environment
const DAL_API_URL = process.env.DAL_API_URL || "http://localhost:3100";

/**
 * Base fetch wrapper with error handling
 * By default, caching is disabled to ensure fresh data
 */
async function dalFetch(path: string, options: RequestInit = {}): Promise<any> {
  try {
    const url = `${DAL_API_URL}${path}`;

    console.log(`[DAL Client] ${options.method || "GET"} ${url}`);
    console.log(`[DAL Client] DAL_API_URL from env:`, DAL_API_URL);

    const response = await fetch(url, {
      cache: "no-store", // Disable caching by default
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    // Check if the API returned an error
    if (!data.success) {
      throw new Error(data.error || "DAL API request failed");
    }

    // Return the full response structure (includes success, data, metadata)
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
  let url = path;

  // Add query parameters if provided
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

  return dalFetch(url, { method: "GET" });
}

/**
 * POST request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPost(path: string, body: any): Promise<any> {
  return dalFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPut(path: string, body: any): Promise<any> {
  return dalFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request to DAL API
 * @param path - API endpoint path
 * @param body - Request body
 * @returns Response data
 */
export async function dalPatch(path: string, body: any): Promise<any> {
  return dalFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request to DAL API
 * @param path - API endpoint path
 * @returns Response data
 */
export async function dalDelete(path: string): Promise<any> {
  return dalFetch(path, { method: "DELETE" });
}
