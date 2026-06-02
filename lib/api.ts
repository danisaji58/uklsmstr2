const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ukllllhamaaaaaaaagenap-production.up.railway.app";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Fetch ke backend tanpa autentikasi (untuk login, dll.)
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}`);
  }

  return data;
}

/**
 * Fetch ke backend dengan Authorization header otomatis dari localStorage.
 */
export async function apiFetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired/invalid — hapus dan lempar error khusus
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }
    throw new Error(data.message || `Error ${response.status}`);
  }

  return data;
}