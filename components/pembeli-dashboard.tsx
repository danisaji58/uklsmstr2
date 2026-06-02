"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
  RefreshCw,
  ServerCrash,
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
  formatCurrency,
} from "@/lib/data";
import { getMenus } from "@/lib/services/menuService";
import { createTransaction } from "@/lib/services/transactionService";
import { getMe } from "@/lib/services/userService";
import { logout } from "@/lib/auth";

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

interface ReceiptData {
  transactionId: string;
  date: Date;
  customerName: string;
  items: CartItem[];
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable states
// ─────────────────────────────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-4 w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-secondary" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-3 bg-secondary rounded w-1/2" />
            <div className="h-8 bg-secondary rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 bg-card rounded-xl border border-border">
      <ServerCrash className="w-12 h-12 text-destructive opacity-60" />
      <div className="text-center">
        <p className="text-foreground font-medium">Gagal memuat menu</p>
        <p className="text-muted-foreground text-sm mt-1">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Coba Lagi
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function PembeliDashboard({
  user,
  onLogout,
  onBalanceUpdate,
}: PembeliDashboardProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // ─── Fetch menus ──────────────────────────────────────────────────────────
  const fetchMenus = useCallback(async () => {
    setMenuLoading(true);
    setMenuError("");
    try {
      const data = await getMenus();
      setMenuItems(data);
    } catch (err) {
      setMenuError(
        err instanceof Error ? err.message : "Gagal memuat daftar menu."
      );
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // ─── Filtered menu ─────────────────────────────────────────────────────────
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, activeCategory]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // ─── Cart actions ──────────────────────────────────────────────────────────
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
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.stock) return item;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // ─── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cartTotal > user.balance) {
      setCheckoutError(
        "Saldo tidak mencukupi! Silakan top up saldo Anda di kasir."
      );
      return;
    }
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    setCheckoutError("");
    try {
      // Buat transaksi di backend
      const txn = await createTransaction(cart);

      // Generate receipt data dari response backend
      const receipt: ReceiptData = {
        transactionId:
          txn.transactionId ??
          txn.id ??
          `TRX-${Date.now().toString(36).toUpperCase()}`,
        date: txn.date ? new Date(txn.date) : new Date(),
        customerName: user.name,
        items: [...cart],
        total: cartTotal,
      };

      // Ambil saldo terbaru dari backend setelah transaksi
      try {
        const me = await getMe();
        onBalanceUpdate(me.balance);
      } catch {
        // Fallback: kurangi saldo secara lokal
        onBalanceUpdate(user.balance - cartTotal);
      }

      setCart([]);
      setReceiptData(receipt);
      setIsReceiptOpen(true);
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat checkout."
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const categories = ["all", "mie", "dimsum", "minuman", "topping"] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
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
                <p className="text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs bg-secondary text-secondary-foreground"
                >
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
                  <p className="font-bold text-primary">
                    {formatCurrency(user.balance)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
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
                const Icon =
                  cat === "all"
                    ? UtensilsCrossed
                    : categoryIcons[cat as keyof typeof categoryIcons];
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
                    {cat === "all"
                      ? "Semua"
                      : categoryLabels[cat as keyof typeof categoryLabels]}
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
          {menuLoading ? (
            <LoadingGrid />
          ) : menuError ? (
            <ErrorState message={menuError} onRetry={fetchMenus} />
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {searchQuery || activeCategory !== "all"
                  ? "Menu tidak ditemukan."
                  : "Belum ada menu tersedia."}
              </p>
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
        </section>

        {/* Cart Sidebar - Desktop */}
        <aside className="cart-area min-w-0 hidden md:block xl:sticky xl:top-[100px] xl:h-[calc(100vh-130px)]">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <CartSidebar
              cart={cart}
              total={cartTotal}
              userBalance={user.balance}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
              checkoutError={checkoutError}
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
          isCheckingOut={isCheckingOut}
          checkoutError={checkoutError}
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

// ─────────────────────────────────────────────────────────────────────────────
// Menu Card
// ─────────────────────────────────────────────────────────────────────────────

function MenuCard({
  item,
  onAdd,
  inCart,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  inCart: number;
}) {
  const isOutOfStock = item.stock === 0;

  return (
    <Card
      className={`h-full flex flex-col justify-between bg-card border-border overflow-hidden transition-all hover:border-primary/50 min-w-0 ${
        isOutOfStock ? "opacity-60" : ""
      }`}
    >
      <CardContent className="p-3 flex flex-col flex-1 min-w-0">
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
            src={
              item.imageUrl ||
              categoryPlaceholders[item.category] ||
              "/placeholder.svg"
            }
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

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
                  ? "border-success/50 text-success bg-success/5"
                  : item.stock > 0
                  ? "border-warning/50 text-warning bg-warning/5"
                  : "border-destructive/50 text-destructive bg-destructive/5"
              }`}
            >
              {item.stock > 0 ? `${item.stock} pcs` : "Habis"}
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

// ─────────────────────────────────────────────────────────────────────────────
// Cart Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function CartSidebar({
  cart,
  total,
  userBalance,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isCheckingOut,
  checkoutError,
}: {
  cart: CartItem[];
  total: number;
  userBalance: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
  checkoutError: string;
}) {
  const canCheckout = cart.length > 0 && total <= userBalance && !isCheckingOut;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Keranjang</h2>
          <Badge
            variant="secondary"
            className="ml-auto bg-secondary text-secondary-foreground"
          >
            {cart.length} item
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-[220px] max-h-[380px] xl:max-h-none">
        <div className="p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Keranjang kosong</p>
              <p className="text-muted-foreground text-xs">
                Tambahkan menu untuk memulai
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-secondary rounded-lg min-w-0"
              >
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={
                      item.imageUrl ||
                      categoryPlaceholders[item.category] ||
                      "/placeholder.svg"
                    }
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

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
        {total > userBalance && (
          <p className="text-destructive text-xs text-center">
            Saldo tidak mencukupi. Kurang {formatCurrency(total - userBalance)}
          </p>
        )}
        {checkoutError && (
          <p className="text-destructive text-xs text-center bg-destructive/10 p-2 rounded-lg">
            {checkoutError}
          </p>
        )}
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          size="lg"
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          {isCheckingOut ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            "Order Sekarang"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Cart Button
// ─────────────────────────────────────────────────────────────────────────────

function MobileCartButton({
  itemCount,
  total,
  cart,
  userBalance,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isCheckingOut,
  checkoutError,
}: {
  itemCount: number;
  total: number;
  cart: CartItem[];
  userBalance: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
  checkoutError: string;
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
        <Badge className="ml-2 bg-primary-foreground text-primary">
          {itemCount}
        </Badge>
        <span className="ml-auto">{formatCurrency(total)}</span>
      </Button>

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
                        src={
                          item.imageUrl ||
                          categoryPlaceholders[item.category] ||
                          "/placeholder.svg"
                        }
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
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
              {total > userBalance && (
                <p className="text-destructive text-xs text-center">
                  Saldo tidak mencukupi
                </p>
              )}
              {checkoutError && (
                <p className="text-destructive text-xs text-center bg-destructive/10 p-2 rounded-lg">
                  {checkoutError}
                </p>
              )}
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                size="lg"
                disabled={cart.length === 0 || total > userBalance || isCheckingOut}
                onClick={() => {
                  onCheckout();
                  if (!checkoutError) setIsOpen(false);
                }}
              >
                {isCheckingOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Order Sekarang"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Modal
// ─────────────────────────────────────────────────────────────────────────────

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
          <DialogTitle className="text-xl font-bold text-foreground">
            Transaksi Berhasil!
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Terima kasih atas pesanan Anda
          </p>
        </DialogHeader>

        <div className="bg-secondary/40 rounded-xl p-4 my-2 border border-border/50 text-xs font-mono space-y-3">
          <div className="text-center border-b border-dashed border-border pb-2 space-y-1">
            <h3 className="font-bold text-sm text-foreground">
              MIE GACOAN KIOSK
            </h3>
            <p className="text-muted-foreground">Kota Malang, Jawa Timur</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Transaksi:</span>
              <span className="font-semibold text-foreground">
                {receiptData.transactionId}
              </span>
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

          <div className="space-y-2 py-1">
            {receiptData.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start gap-4"
              >
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

          <div className="flex justify-between items-center text-sm pt-1">
            <span className="font-bold text-foreground">TOTAL BELANJA</span>
            <span className="font-extrabold text-primary text-base">
              {formatCurrency(receiptData.total)}
            </span>
          </div>

          <div className="text-center text-[10px] text-muted-foreground pt-2 border-t border-dashed border-border">
            <p>Metode Pembayaran: Saldo Kiosk</p>
            <p className="mt-1">
              Silakan tunjukkan struk ini ke bagian pengambilan makanan.
            </p>
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
