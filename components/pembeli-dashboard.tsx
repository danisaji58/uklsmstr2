"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Flame,
  LogOut,
  Wallet,
  UtensilsCrossed,
  Cookie,
  Coffee,
  ChefHat,
  X,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  categoryPlaceholders,
  type User, 
  type MenuItem, 
  type CartItem, 
  formatCurrency 
} from "@/lib/data";
import { createTransaction, getMenus } from "@/lib/api";

interface PembeliDashboardProps {
  user: User;
  onLogout: () => void;
  onBalanceUpdate: (newBalance: number) => void;
}

const categoryIcons = {
  mie: UtensilsCrossed,
  dimsum: Cookie,
  minuman: Coffee,
  topping: ChefHat,
};

const categoryLabels = {
  mie: "Mie",
  dimsum: "Dimsum",
  minuman: "Minuman",
  topping: "Topping",
};

// Receipt data interface
interface ReceiptData {
  transactionId: string;
  date: Date;
  customerName: string;
  items: CartItem[];
  total: number;
}

export function PembeliDashboard({ user, onLogout, onBalanceUpdate }: PembeliDashboardProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMenus = async () => {
      setIsMenuLoading(true);
      setMenuError("");

      try {
        const menus = await getMenus();
        if (isMounted) setMenuItems(menus);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setMenuError(error instanceof Error ? error.message : "Gagal mengambil menu dari backend");
        }
      } finally {
        if (isMounted) setIsMenuLoading(false);
      }
    };

    loadMenus();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, activeCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    if (item.stock === 0) return;
    
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.stock) return item;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCheckout = async () => {
    if (cartTotal > user.balance) {
      alert("Saldo tidak mencukupi! Silakan top up saldo Anda.");
      return;
    }

    try {
      await createTransaction(user.id, cart.map((item) => ({ menuId: item.id, quantity: item.quantity })));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal membuat transaksi");
      return;
    }

    // Generate receipt data
    const receipt: ReceiptData = {
      transactionId: `TRX-${Date.now().toString(36).toUpperCase()}`,
      date: new Date(),
      customerName: user.name,
      items: [...cart],
      total: cartTotal,
    };

    // Update balance and clear cart
    const newBalance = user.balance - cartTotal;
    onBalanceUpdate(newBalance);
    setCart([]);
    
    // Show receipt modal
    setReceiptData(receipt);
    setIsReceiptOpen(true);
  };

  const categories = ["all", "mie", "dimsum", "minuman", "topping"] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-foreground">Mie Gacoan</h1>
                  <p className="text-xs text-muted-foreground">Kiosk System</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8 hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground">
                  PEMBELI
                </Badge>
              </div>
            </div>

            {/* Balance Card */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <Wallet className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Sisa Saldo</p>
                  <p className="font-bold text-primary">{formatCurrency(user.balance)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search & Categories */}
          <div className="mt-4 space-y-3 w-full max-w-full min-w-0 overflow-hidden">
            <div className="relative w-full max-w-full min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full max-w-full bg-secondary border-border text-foreground placeholder:text-muted-foreground min-w-0"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 w-full max-w-full flex-nowrap whitespace-nowrap scrollbar-none touch-pan-x select-none">
              {categories.map((cat) => {
                const Icon = cat === "all" ? UtensilsCrossed : categoryIcons[cat as keyof typeof categoryIcons];
                return (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className={
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 transition-colors"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 shrink-0 transition-colors"
                    }
                  >
                    <Icon className="w-4 h-4 mr-1 shrink-0" />
                    {cat === "all" ? "Semua" : categoryLabels[cat as keyof typeof categoryLabels]}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 min-w-0 max-w-full">
        {/* Product Area */}
        <section className="product-area min-w-0 flex flex-col gap-6 w-full pb-20 md:pb-4">
          {menuError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {menuError}
            </div>
          )}

          {isMenuLoading ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground font-medium">Memuat menu dari backend...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4 w-full">
            {filteredMenu.map((item) => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onAdd={addToCart}
                inCart={cart.find((c) => c.id === item.id)?.quantity || 0}
              />
            ))}
          </div>
          )}
          
          {!isMenuLoading && filteredMenu.length === 0 && (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Menu tidak ditemukan</p>
            </div>
          )}
        </section>

        {/* Cart Sidebar - Desktop & Tablet */}
        <aside className="cart-area min-w-0 hidden md:block xl:sticky xl:top-[100px] xl:h-[calc(100vh-130px)]">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <CartSidebar
              cart={cart}
              total={cartTotal}
              userBalance={user.balance}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onCheckout={handleCheckout}
            />
          </div>
        </aside>
      </main>

      {/* Cart Button & Drawer - Mobile */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <MobileCartButton
          itemCount={cartItemCount}
          total={cartTotal}
          cart={cart}
          userBalance={user.balance}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={receiptData}
      />
    </div>
  );
}

// Menu Card Component
function MenuCard({ 
  item, 
  onAdd, 
  inCart 
}: { 
  item: MenuItem; 
  onAdd: (item: MenuItem) => void;
  inCart: number;
}) {
  const isOutOfStock = item.stock === 0;

  return (
    <Card className={`h-full flex flex-col justify-between bg-card border-border overflow-hidden transition-all hover:border-primary/50 min-w-0 ${isOutOfStock ? 'opacity-60' : ''}`}>
      <CardContent className="p-3 flex flex-col flex-1 min-w-0">
        {/* Placeholder Image */}
        <div className="relative aspect-square bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden shrink-0">
          {item.isSpicy && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-destructive text-destructive-foreground text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Lv.{item.spicyLevel}
              </Badge>
            </div>
          )}
          {inCart > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-primary text-primary-foreground text-xs font-bold animate-in zoom-in duration-200">
                {inCart}
              </Badge>
            </div>
          )}
          <img 
            src={item.imageUrl || categoryPlaceholders[item.category] || '/placeholder.svg'} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 space-y-2 min-w-0">
          <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-2 min-h-[2.5rem] break-words">
            {item.name}
          </h3>
          <div className="flex items-center justify-between gap-1 mt-auto min-w-0">
            <p className="font-bold text-primary text-sm whitespace-nowrap shrink-0">
              {formatCurrency(item.price)}
            </p>
            <Badge 
              variant="outline" 
              className={`text-[10px] sm:text-xs truncate max-w-[65px] sm:max-w-none ${
                item.stock > 10 
                  ? 'border-success/50 text-success bg-success/5' 
                  : item.stock > 0 
                    ? 'border-warning/50 text-warning bg-warning/5' 
                    : 'border-destructive/50 text-destructive bg-destructive/5'
              }`}
            >
              {item.stock > 0 ? `${item.stock} pcs` : 'Habis'}
            </Badge>
          </div>
          <Button
            size="sm"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 mt-2 shrink-0 font-medium"
            onClick={() => onAdd(item)}
            disabled={isOutOfStock}
          >
            <Plus className="w-4 h-4 mr-1 shrink-0" />
            Tambah
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Cart Sidebar Component
function CartSidebar({
  cart,
  total,
  userBalance,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: {
  cart: CartItem[];
  total: number;
  userBalance: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  const canCheckout = cart.length > 0 && total <= userBalance;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Keranjang</h2>
          <Badge variant="secondary" className="ml-auto bg-secondary text-secondary-foreground">
            {cart.length} item
          </Badge>
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 min-h-[220px] max-h-[380px] xl:max-h-none">
        <div className="p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Keranjang kosong</p>
              <p className="text-muted-foreground text-xs">Tambahkan menu untuk memulai</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-secondary rounded-lg min-w-0"
              >
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={item.imageUrl || categoryPlaceholders[item.category] || '/placeholder.svg'} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h4 className="font-medium text-foreground text-sm truncate">
                    {item.name}
                  </h4>
                  <p className="text-primary text-sm font-semibold mt-0.5">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 min-w-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 border-border shrink-0"
                      onClick={() => onUpdateQuantity(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-foreground font-medium text-sm w-6 text-center shrink-0">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 border-border shrink-0"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Checkout */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{formatCurrency(total)}</span>
        </div>
        {total > userBalance && (
          <p className="text-destructive text-xs text-center">
            Saldo tidak mencukupi. Kurang {formatCurrency(total - userBalance)}
          </p>
        )}
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          size="lg"
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          Order Sekarang
        </Button>
      </div>
    </div>
  );
}

// Mobile Cart Button
function MobileCartButton({
  itemCount,
  total,
  cart,
  userBalance,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: {
  itemCount: number;
  total: number;
  cart: CartItem[];
  userBalance: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base font-semibold shadow-lg shadow-primary/25"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        <span>Lihat Keranjang</span>
        <Badge className="ml-2 bg-primary-foreground text-primary">{itemCount}</Badge>
        <span className="ml-auto">{formatCurrency(total)}</span>
      </Button>

      {/* Mobile Cart Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Keranjang</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="p-4 space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-secondary rounded-lg"
                  >
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={item.imageUrl || categoryPlaceholders[item.category] || '/placeholder.svg'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-primary text-sm font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-border"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-foreground font-medium text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-border"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onRemove(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
              {total > userBalance && (
                <p className="text-destructive text-xs text-center">
                  Saldo tidak mencukupi
                </p>
              )}
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                size="lg"
                disabled={cart.length === 0 || total > userBalance}
                onClick={() => {
                  onCheckout();
                  setIsOpen(false);
                }}
              >
                Order Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Receipt Modal Component
interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptModalProps) {
  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Flame className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Transaksi Berhasil!</DialogTitle>
          <p className="text-xs text-muted-foreground">Terima kasih atas pesanan Anda</p>
        </DialogHeader>

        {/* Receipt content structured like a classic print receipt */}
        <div className="bg-secondary/40 rounded-xl p-4 my-2 border border-border/50 text-xs font-mono space-y-3">
          <div className="text-center border-b border-dashed border-border pb-2 space-y-1">
            <h3 className="font-bold text-sm text-foreground">MIE GACOAN KIOSK</h3>
            <p className="text-muted-foreground">Kota Malang, Jawa Timur</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Transaksi:</span>
              <span className="font-semibold text-foreground">{receiptData.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal:</span>
              <span className="text-foreground">
                {receiptData.date.toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pelanggan:</span>
              <span className="text-foreground">{receiptData.customerName}</span>
            </div>
          </div>

          <Separator className="border-dashed border-border bg-transparent" />

          {/* Items */}
          <div className="space-y-2 py-1">
            {receiptData.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-foreground font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="text-foreground font-semibold shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="border-dashed border-border bg-transparent" />

          {/* Total */}
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="font-bold text-foreground">TOTAL BELANJA</span>
            <span className="font-extrabold text-primary text-base">
              {formatCurrency(receiptData.total)}
            </span>
          </div>
          
          <div className="text-center text-[10px] text-muted-foreground pt-2 border-t border-dashed border-border">
            <p>Metode Pembayaran: Saldo Kiosk</p>
            <p className="mt-1">Silakan tunjukkan struk ini ke bagian pengambilan makanan.</p>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-border text-foreground hover:bg-secondary w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak Struk
          </Button>
          <Button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto font-semibold"
          >
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
