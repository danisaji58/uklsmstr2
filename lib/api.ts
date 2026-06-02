import { type MenuItem, type User } from "./data";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://ukllllhamaaaaaaaagenap-production.up.railway.app"
).replace(/\/$/, "");

const TOKEN_KEY = "token";

export interface LoginResponse {
  token: string;
  user: User;
}

type ApiRecord = Record<string, unknown>;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAuthToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (isBrowser()) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  if (isBrowser()) {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data) return data;
  if (data && typeof data === "object") {
    const record = data as ApiRecord;
    const message = record.message || record.error;

    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }

  return fallback;
}

function unwrapArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as ApiRecord;
    const value = record.data || record.items || record.menus || record.users || record.result;
    if (Array.isArray(value)) return value;
  }

  return [];
}

function readString(record: ApiRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return fallback;
}

function readNumber(record: ApiRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

export function normalizeRole(value: unknown): User["role"] {
  return String(value || "pembeli").toLowerCase() === "kasir" ? "kasir" : "pembeli";
}

export function normalizeCategory(value: unknown): MenuItem["category"] {
  const category = String(value || "mie").toLowerCase();

  if (["mie", "dimsum", "minuman", "topping"].includes(category)) {
    return category as MenuItem["category"];
  }

  if (["drink", "drinks", "beverage", "beverages"].includes(category)) return "minuman";
  if (["noodle", "noodles", "makanan"].includes(category)) return "mie";

  return "mie";
}

export function normalizeUser(raw: unknown): User {
  let record = (raw && typeof raw === "object" ? raw : {}) as ApiRecord;

  if (!record.id && typeof record.user === "object" && record.user) {
    record = record.user as ApiRecord;
  } else if (!record.id && typeof record.data === "object" && record.data) {
    record = record.data as ApiRecord;
  }

  return {
    id: readString(record, ["id", "userId", "id_user"]),
    name: readString(record, ["name", "nama", "username", "email"], "Pengguna"),
    email: readString(record, ["email"], "-"),
    role: normalizeRole(record.role),
    balance: readNumber(record, ["balance", "saldo", "money", "amount"], 0),
  };
}

export function normalizeMenu(raw: unknown): MenuItem {
  let record = (raw && typeof raw === "object" ? raw : {}) as ApiRecord;

  if (!record.id && typeof record.menu === "object" && record.menu) {
    record = record.menu as ApiRecord;
  } else if (!record.id && typeof record.data === "object" && record.data) {
    record = record.data as ApiRecord;
  }

  return {
    id: readString(record, ["id", "menuId", "id_menu"]),
    name: readString(record, ["name", "nama", "menu", "title"], "Menu"),
    price: readNumber(record, ["price", "harga", "cost"], 0),
    stock: readNumber(record, ["stock", "stok", "qty", "quantity"], 0),
    category: normalizeCategory(record.category || record.kategori || record.jenis),
    imageUrl: readString(record, ["imageUrl", "image", "gambar", "photo", "url"], "") || undefined,
    description: readString(record, ["description", "deskripsi", "desc"], "") || undefined,
  };
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Terjadi kesalahan saat menghubungi server"));
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<ApiRecord>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = readString(data, ["accessToken", "token", "jwt"]);
  const rawUser = (data.user || data.data || data) as unknown;

  if (!token) {
    throw new Error("Token login tidak ditemukan dari response backend");
  }

  setAuthToken(token);

  return {
    token,
    user: normalizeUser(rawUser),
  };
}

export async function getProfile() {
  return normalizeUser(await apiFetch("/api/api/me"));
}

export async function getUsers() {
  const data = await apiFetch("/api/api/users");
  return unwrapArray(data).map(normalizeUser);
}

export async function getMenus() {
  const data = await apiFetch("/api/menus");
  return unwrapArray(data).map(normalizeMenu);
}

export async function createMenu(menu: Omit<MenuItem, "id">) {
  const data = await apiFetch("/api/menus", {
    method: "POST",
    body: JSON.stringify({
      name: menu.name,
      nama: menu.name,
      price: menu.price,
      harga: menu.price,
      stock: menu.stock,
      stok: menu.stock,
      category: menu.category,
      kategori: menu.category,
      imageUrl: menu.imageUrl,
      image: menu.imageUrl,
      description: menu.description,
      deskripsi: menu.description,
    }),
  });

  return normalizeMenu(data);
}

export async function updateMenu(id: string, menu: Partial<Omit<MenuItem, "id">>) {
  const data = await apiFetch(`/api/menus/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...menu,
      nama: menu.name,
      harga: menu.price,
      stok: menu.stock,
      kategori: menu.category,
      image: menu.imageUrl,
      deskripsi: menu.description,
    }),
  });

  return normalizeMenu(data);
}

export async function deleteMenu(id: string) {
  return apiFetch(`/api/menus/${id}`, { method: "DELETE" });
}

export async function topUpUser(userId: string, amount: number) {
  const data = await apiFetch("/api/api/user/topup", {
    method: "POST",
    body: JSON.stringify({ userId: Number(userId) || userId, id_user: Number(userId) || userId, amount, nominal: amount, saldo: amount }),
  });

  return data ? normalizeUser(data) : null;
}

export async function createTransaction(userId: string, items: Array<{ menuId: string; quantity: number }>) {
  return apiFetch<ApiRecord>("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      userId: Number(userId) || userId,
      id_user: Number(userId) || userId,
      items: items.map((item) => ({
        menuId: Number(item.menuId) || item.menuId,
        menu_id: Number(item.menuId) || item.menuId,
        id_menu: Number(item.menuId) || item.menuId,
        quantity: item.quantity,
        qty: item.quantity,
      })),
    }),
  });
}
