/**
 * Server-Side DAL Client
 * For use in Next.js API routes (server-side only)
 * Makes direct HTTP calls to DAL API
 */

const DAL_API_URL =
  process.env.DAL_API_URL ||
  "https://zanttjd6zj.execute-api.us-east-1.amazonaws.com";

/**
 * GET request to DAL API (server-side)
 * @param path - API endpoint path
 * @param params - Optional query parameters
 * @param authToken - Optional Cognito token from client
 */
export async function dalGetServer(
  path: string,
  params?: Record<string, string>,
  authToken?: string
): Promise<any> {
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

  console.log(`[DAL Server Client] GET ${url}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // If auth token provided (from client), forward it
  if (authToken) {
    headers.Authorization = authToken;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `DAL API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * POST request to DAL API (server-side)
 */
export async function dalPostServer(
  path: string,
  body: any,
  authToken?: string
): Promise<any> {
  const url = `${DAL_API_URL}${path}`;
  console.log(`[DAL Server Client] POST ${url}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = authToken;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `DAL API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * PUT request to DAL API (server-side)
 */
export async function dalPutServer(
  path: string,
  body: any,
  authToken?: string
): Promise<any> {
  const url = `${DAL_API_URL}${path}`;
  console.log(`[DAL Server Client] PUT ${url}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = authToken;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `DAL API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * PATCH request to DAL API (server-side)
 */
export async function dalPatchServer(
  path: string,
  body: any,
  authToken?: string
): Promise<any> {
  const url = `${DAL_API_URL}${path}`;
  console.log(`[DAL Server Client] PATCH ${url}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = authToken;
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `DAL API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * DELETE request to DAL API (server-side)
 */
export async function dalDeleteServer(
  path: string,
  authToken?: string
): Promise<any> {
  const url = `${DAL_API_URL}${path}`;
  console.log(`[DAL Server Client] DELETE ${url}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = authToken;
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `DAL API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
