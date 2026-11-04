
const API_BASE_URL = "http://127.0.0.1:8000";

export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${path}`
    );
  }

  return (await response.json()) as T;
}
