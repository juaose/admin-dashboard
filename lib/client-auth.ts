/**
 * Client-side authentication utilities
 *
 * Provides helper functions for authenticated API calls from React components
 */

import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Get authenticated headers for API calls
 * Retrieves the current user's JWT access token and formats it for API requests
 *
 * @returns Headers object with Authorization bearer token if available
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
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
