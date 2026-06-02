import { apiFetchWithAuth } from "@/lib/services/api";
import type { User } from "@/lib/data";

// Raw response shape from backend (unknown fields)
interface RawUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  balance?: number;
  saldo?: number;
  [key: string]: unknown;
}

function normalizeUser(raw: RawUser): User {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    role:
      String(raw.role).toLowerCase() === "kasir" ? "kasir" : "pembeli",
    balance: raw.balance ?? raw.saldo ?? 0,
  };
}

/**
 * GET /api/me — Ambil info user yang sedang login + saldo terbaru
 */
export async function getMe(): Promise<User> {
  const data = await apiFetchWithAuth("/api/api/me");
  const raw: RawUser = data.data ?? data;
  return normalizeUser(raw);
}

/**
 * GET /api/users — Ambil daftar semua user pembeli (kasir only)
 */
export async function getUsers(): Promise<User[]> {
  const data = await apiFetchWithAuth("/api/api/users");
  const list: RawUser[] = Array.isArray(data)
    ? data
    : data.data ?? data.users ?? [];
  return list
    .map(normalizeUser)
    .filter((u) => u.role === "pembeli");
}

/**
 * POST /api/users/:id/topup — Top up saldo user (kasir only)
 */
export async function topUpUser(
  userId: string,
  amount: number
): Promise<{ balance: number }> {
  const data = await apiFetchWithAuth(`/api/users/${userId}/topup`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  return data.data ?? data;
}
