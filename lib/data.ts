export interface MenuItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: 'mie' | 'dimsum' | 'minuman' | 'topping';
  imageUrl?: string;
  description?: string;
  isSpicy?: boolean;
  spicyLevel?: number;
}

// Default placeholder images for each category
export const categoryPlaceholders: Record<string, string> = {
  mie: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop',
  dimsum: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=200&h=200&fit=crop',
  minuman: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop',
  topping: 'https://images.unsplash.com/photo-1482049016gy-d606ba6d9a9c?w=200&h=200&fit=crop',
};

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'pembeli' | 'kasir';
  balance: number;
}

export const menuItems: MenuItem[] = [
  // Mie
  { id: '1', name: 'Mie Gacoan Level 0', price: 10000, stock: 50, category: 'mie', isSpicy: false, description: 'Mie pedas signature tanpa level pedas' },
  { id: '2', name: 'Mie Gacoan Level 1', price: 10000, stock: 45, category: 'mie', isSpicy: true, spicyLevel: 1, description: 'Mie pedas signature level 1' },
  { id: '3', name: 'Mie Gacoan Level 2', price: 10000, stock: 40, category: 'mie', isSpicy: true, spicyLevel: 2, description: 'Mie pedas signature level 2' },
  { id: '4', name: 'Mie Gacoan Level 3', price: 10000, stock: 35, category: 'mie', isSpicy: true, spicyLevel: 3, description: 'Mie pedas signature level 3' },
  { id: '5', name: 'Mie Gacoan Level 4', price: 10000, stock: 30, category: 'mie', isSpicy: true, spicyLevel: 4, description: 'Mie pedas signature level 4' },
  { id: '6', name: 'Mie Gacoan Level 5', price: 10000, stock: 25, category: 'mie', isSpicy: true, spicyLevel: 5, description: 'Mie pedas signature level 5 - EXTREME!' },
  { id: '7', name: 'Mie Gacoan Level 6', price: 10000, stock: 20, category: 'mie', isSpicy: true, spicyLevel: 6, description: 'Mie pedas signature level 6 - SUPER EXTREME!' },
  { id: '8', name: 'Mie Gacoan Level 7', price: 10000, stock: 15, category: 'mie', isSpicy: true, spicyLevel: 7, description: 'Mie pedas signature level 7 - ULTRA EXTREME!' },
  { id: '9', name: 'Mie Gacoan Level 8', price: 10000, stock: 10, category: 'mie', isSpicy: true, spicyLevel: 8, description: 'Mie pedas signature level 8 - GACOAN!' },
  { id: '10', name: 'Mie Hompimpa', price: 12000, stock: 30, category: 'mie', isSpicy: true, spicyLevel: 3, description: 'Mie dengan topping lengkap' },

  // Dimsum
  { id: '11', name: 'Udang Keju', price: 10000, stock: 60, category: 'dimsum', description: 'Dimsum udang dengan keju melted' },
  { id: '12', name: 'Udang Rambutan', price: 10000, stock: 55, category: 'dimsum', description: 'Dimsum udang crispy' },
  { id: '13', name: 'Siomay Ayam', price: 8000, stock: 70, category: 'dimsum', description: 'Siomay ayam original' },
  { id: '14', name: 'Pangsit Goreng', price: 8000, stock: 65, category: 'dimsum', description: 'Pangsit goreng crispy' },
  { id: '15', name: 'Lumpia Udang', price: 10000, stock: 50, category: 'dimsum', description: 'Lumpia dengan isian udang' },
  { id: '16', name: 'Gyoza', price: 12000, stock: 45, category: 'dimsum', description: 'Gyoza pan-fried' },

  // Minuman
  { id: '17', name: 'Es Genderuwo', price: 8000, stock: 100, category: 'minuman', description: 'Es coklat susu signature' },
  { id: '18', name: 'Es Pocong', price: 8000, stock: 90, category: 'minuman', description: 'Es vanilla susu' },
  { id: '19', name: 'Es Sundel Bolong', price: 8000, stock: 85, category: 'minuman', description: 'Es taro susu' },
  { id: '20', name: 'Es Tuyul', price: 8000, stock: 80, category: 'minuman', description: 'Es matcha susu' },
  { id: '21', name: 'Es Kuntilanak', price: 8000, stock: 75, category: 'minuman', description: 'Es strawberry susu' },
  { id: '22', name: 'Es Jeruk', price: 5000, stock: 120, category: 'minuman', description: 'Es jeruk segar' },
  { id: '23', name: 'Es Teh Manis', price: 4000, stock: 150, category: 'minuman', description: 'Es teh manis' },
  { id: '24', name: 'Air Mineral', price: 4000, stock: 200, category: 'minuman', description: 'Air mineral dingin' },

  // Topping
  { id: '25', name: 'Telur', price: 5000, stock: 100, category: 'topping', description: 'Telur rebus' },
  { id: '26', name: 'Bakso', price: 5000, stock: 80, category: 'topping', description: 'Bakso sapi' },
  { id: '27', name: 'Ceker', price: 6000, stock: 60, category: 'topping', description: 'Ceker ayam' },
  { id: '28', name: 'Sosis', price: 5000, stock: 70, category: 'topping', description: 'Sosis ayam' },
];

export const sampleUsers: User[] = [
  { id: '1', name: 'Ahmad Fauzi', email: 'ahmad@example.com', role: 'pembeli', balance: 150000 },
  { id: '2', name: 'Siti Nurhaliza', email: 'siti@example.com', role: 'pembeli', balance: 75000 },
  { id: '3', name: 'Budi Santoso', email: 'budi@example.com', role: 'pembeli', balance: 200000 },
  { id: '4', name: 'Dewi Lestari', email: 'dewi@example.com', role: 'pembeli', balance: 50000 },
  { id: '5', name: 'Admin Kasir', email: 'kasir@miegacoan.com', role: 'kasir', balance: 0 },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
