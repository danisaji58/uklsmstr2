// =============================================================================
// Types / Interfaces
// (Dummy data sudah dihapus — semua data berasal dari backend API)
// =============================================================================

export interface MenuItem {
  menu: MenuItem;
  id: string;
  name: string;
  price: number;
  stock: number;
  category: "mie" | "dimsum" | "minuman" | "topping";
  imageUrl?: string;
  description?: string;
  isSpicy?: boolean;
  spicyLevel?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "pembeli" | "kasir";
  balance: number;
}

// =============================================================================
// Fallback images per category (hanya digunakan jika item tidak punya imageUrl)
// =============================================================================
export const categoryPlaceholders: Record<string, string> = {
  mie: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop",
  dimsum:
    "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=200&h=200&fit=crop",
  minuman:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop",
  topping:
    "https://images.unsplash.com/photo-1625938145744-e380515399b7?w=200&h=200&fit=crop",
};

// =============================================================================
// Utility
// =============================================================================
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
