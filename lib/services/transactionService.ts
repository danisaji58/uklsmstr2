import { apiFetchWithAuth } from "@/lib/services/api";
import type { CartItem } from "@/lib/data";

export interface TransactionItem {
  menuId: string | number;
  quantity: number;
  price: number;
}

export interface CreateTransactionPayload {
  items: TransactionItem[];
}

export interface Transaction {
  id: string;
  transactionId?: string;
  date: string;
  total: number;
  items: CartItem[];
}

/**
 * POST /api/transactions — Buat transaksi baru (order oleh pembeli)
 */
export async function createTransaction(
  cartItems: CartItem[]
): Promise<Transaction> {
  const payload: CreateTransactionPayload = {
    items: cartItems.map((item) => ({
      menuId: item.id,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  const data = await apiFetchWithAuth("/api/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data.data ?? data;
}

/**
 * GET /api/transactions — Ambil riwayat transaksi
 */
export async function getTransactions(): Promise<Transaction[]> {
  const data = await apiFetchWithAuth("/api/transactions");
  return Array.isArray(data) ? data : data.data ?? data.transactions ?? [];
}
