import { apiFetchWithAuth } from "@/lib/services/api";
import type { MenuItem } from "@/lib/data";

export interface CreateMenuPayload {
  name: string;
  price: number;
  stock: number;
  category: "mie" | "dimsum" | "minuman" | "topping";
  imageUrl?: string;
}

export interface UpdateMenuPayload {
  price?: number;
  stock?: number;
  imageUrl?: string;
}

/**
 * GET /api/menus — Ambil semua menu dari backend
 */
export async function getMenus(): Promise<MenuItem[]> {
  const data = await apiFetchWithAuth("/api/menus");
  // Backend mungkin return { data: [...] } atau langsung array
  return Array.isArray(data) ? data : data.data ?? data.menus ?? [];
}

/**
 * POST /api/menus — Tambah menu baru (kasir only)
 */
export async function createMenu(
  payload: CreateMenuPayload
): Promise<MenuItem> {
  const data = await apiFetchWithAuth("/api/menus", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.menu ?? data;
}

/**
 * PUT /api/menus/:id — Edit menu (kasir only)
 */
export async function updateMenu(
  id: string | number,
  payload: UpdateMenuPayload
): Promise<MenuItem> {
  const data = await apiFetchWithAuth(`/api/menus/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.data ?? data;
}

/**
 * Dexport async function createMenuELETE /api/menus/:id — Hapus menu (kasir only)
 */
export async function deleteMenu(id: string | number): Promise<void> {
  await apiFetchWithAuth(`/api/menus/${id}`, {
    method: "DELETE",
  });
}
