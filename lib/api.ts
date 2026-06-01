const BASE_URL = "https://ukllllhamaaaaaaaagenap-production.up.railway.app";

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const response = await fetch(
        `${BASE_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Terjadi kesalahan");
    }

    return data;
}

export async function getMenus() {
    const response = await fetch(`${BASE_URL}/menus`);

    if (!response.ok) {
        throw new Error("Gagal mengambil menu");
    }

    return response.json();
}