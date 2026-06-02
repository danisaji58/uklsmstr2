"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flame,
  LogOut,
  UtensilsCrossed,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ServerCrash,
} from "lucide-react";
import {
  type User,
  type MenuItem,
  formatCurrency
} from "@/lib/data";
import { createMenu, deleteMenu, getMenus, getUsers, topUpUser, updateMenu } from "@/lib/api";

interface KasirDashboardProps {
  user: User;
  onLogout: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable loading / error / empty components
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSpinner({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      <p className="text-muted-foreground text-sm">{label}</p>
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
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <ServerCrash className="w-12 h-12 text-destructive opacity-60" />
      <div className="text-center">
        <p className="text-foreground font-medium">Gagal memuat data</p>
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
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function KasirDashboard({ user, onLogout }: KasirDashboardProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "topup">("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );

  // ── CRUD loading state ────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Top up state ─────────────────────────────────────────────────────────────
  const [selectedUserId, setSelectedUserId] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [topUpError, setTopUpError] = useState("");

  // ── Form state ───────────────────────────────────────────────────────────────
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuStock, setNewMenuStock] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState<
    "mie" | "dimsum" | "minuman" | "topping"
  >("mie");
  const [newMenuImageUrl, setNewMenuImageUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoadingData(true);
      setErrorMessage("");

      try {
        const [menus, userList] = await Promise.all([getMenus(), getUsers()]);
        if (isMounted) {
          setMenuItems(menus);
          setUsers(userList.filter((item) => item.role === "pembeli"));
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal mengambil data dari backend");
        }
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalMenu: menuItems.length,
      lowStock: menuItems.filter((m) => m.stock < 20).length,
      totalUsers: users.length,
      totalBalance: users.reduce((sum, u) => sum + u.balance, 0),
    };
  }, [menuItems, users]);

  const handleAddMenu = async () => {
    try {
      const newItem = await createMenu({
        name: newMenuName,
        price: parseInt(newMenuPrice) || 0,
        stock: parseInt(newMenuStock) || 0,
        category: newMenuCategory,
        imageUrl: newMenuImageUrl || undefined,
      });
      setMenuItems((current) => [...current, newItem]);
      setIsAddMenuOpen(false);
      resetMenuForm();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Gagal menambahkan menu");
    }
  };

  const handleEditMenu = async () => {
    if (!selectedMenuItem) return;

    try {
      const updatedItem = await updateMenu(selectedMenuItem.id, {
        price: parseInt(newMenuPrice) || selectedMenuItem.price,
        stock: parseInt(newMenuStock) || selectedMenuItem.stock,
        imageUrl: newMenuImageUrl || selectedMenuItem.imageUrl,
      });
      setMenuItems((current) => current.map((item) => (item.id === selectedMenuItem.id ? updatedItem : item)));
      setIsEditMenuOpen(false);
      setSelectedMenuItem(null);
      resetMenuForm();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengubah menu");
    }
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenuItem) return;

    try {
      await deleteMenu(selectedMenuItem.id);
      setMenuItems((current) => current.filter((item) => item.id !== selectedMenuItem.id));
      setIsDeleteMenuOpen(false);
      setSelectedMenuItem(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Gagal menghapus menu");
    }
  };

  const resetMenuForm = () => {
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuStock("");
    setNewMenuCategory("mie");
    setNewMenuImageUrl("");
    setSaveError("");
  };

  const openEditDialog = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setNewMenuPrice(item.price.toString());
    setNewMenuStock(item.stock.toString());
    setNewMenuImageUrl(item.imageUrl || "");
    setSaveError("");
    setIsEditMenuOpen(true);
  };

  const openDeleteDialog = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsDeleteMenuOpen(true);
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount) || 0;
    if (!selectedUserId || amount <= 0) return;

    try {
      const updatedUser = await topUpUser(selectedUserId, amount);
      setUsers((current) => current.map((item) => {
        if (item.id !== selectedUserId) return item;
        return updatedUser ? updatedUser : { ...item, balance: item.balance + amount };
      }));
      setTopUpSuccess(true);
      setSelectedUserId("");
      setTopUpAmount("");
      setTimeout(() => setTopUpSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Gagal top up saldo");
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-sidebar-foreground">
              Mie Gacoan
            </h1>
            <p className="text-[10px] text-muted-foreground">Kasir System</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={activeTab === "menu" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => setActiveTab("menu")}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />
            Menu
          </Button>
          <Button
            variant={activeTab === "topup" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => setActiveTab("topup")}
          >
            <Wallet className="w-3.5 h-3.5 mr-1" />
            Top Up
          </Button>
          <div className="w-[1px] h-4 bg-border/20 mx-1.5 shrink-0" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">Mie Gacoan</h1>
              <p className="text-xs text-muted-foreground">Kasir Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={activeTab === "menu" ? "secondary" : "ghost"}
            className={`w-full justify-start ${activeTab === "menu"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            onClick={() => setActiveTab("menu")}
          >
            <UtensilsCrossed className="w-4 h-4 mr-3" />
            Kelola Menu
          </Button>
          <Button
            variant={activeTab === "topup" ? "secondary" : "ghost"}
            className={`w-full justify-start ${activeTab === "topup"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            onClick={() => setActiveTab("topup")}
          >
            <Wallet className="w-4 h-4 mr-3" />
            Top Up Saldo
          </Button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-accent-foreground font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <Badge className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                KASIR
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {errorMessage && (
          <div className="m-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        {isLoadingData ? (
          <div className="p-6 text-muted-foreground">Memuat data dari backend...</div>
        ) : activeTab === "menu" ? (
          <MenuManagement
            menuItems={filteredMenu}
            menuLoading={menuLoading}
            menuError={menuError}
            onRetryMenu={fetchMenus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            stats={stats}
            isAddMenuOpen={isAddMenuOpen}
            setIsAddMenuOpen={setIsAddMenuOpen}
            isEditMenuOpen={isEditMenuOpen}
            setIsEditMenuOpen={setIsEditMenuOpen}
            isDeleteMenuOpen={isDeleteMenuOpen}
            setIsDeleteMenuOpen={setIsDeleteMenuOpen}
            selectedMenuItem={selectedMenuItem}
            newMenuName={newMenuName}
            setNewMenuName={setNewMenuName}
            newMenuPrice={newMenuPrice}
            setNewMenuPrice={setNewMenuPrice}
            newMenuStock={newMenuStock}
            setNewMenuStock={setNewMenuStock}
            newMenuCategory={newMenuCategory}
            setNewMenuCategory={setNewMenuCategory}
            newMenuImageUrl={newMenuImageUrl}
            setNewMenuImageUrl={setNewMenuImageUrl}
            handleAddMenu={handleAddMenu}
            handleEditMenu={handleEditMenu}
            handleDeleteMenu={handleDeleteMenu}
            openEditDialog={openEditDialog}
            openDeleteDialog={openDeleteDialog}
            isSaving={isSaving}
            saveError={saveError}
          />
        ) : (
          <TopUpSection
            users={users}
            usersLoading={usersLoading}
            usersError={usersError}
            onRetryUsers={fetchUsers}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            topUpAmount={topUpAmount}
            setTopUpAmount={setTopUpAmount}
            handleTopUp={handleTopUp}
            topUpLoading={topUpLoading}
            topUpSuccess={topUpSuccess}
            topUpError={topUpError}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu Management Component
// ─────────────────────────────────────────────────────────────────────────────

function MenuManagement({
  menuItems,
  menuLoading,
  menuError,
  onRetryMenu,
  searchQuery,
  setSearchQuery,
  stats,
  isAddMenuOpen,
  setIsAddMenuOpen,
  isEditMenuOpen,
  setIsEditMenuOpen,
  isDeleteMenuOpen,
  setIsDeleteMenuOpen,
  selectedMenuItem,
  newMenuName,
  setNewMenuName,
  newMenuPrice,
  setNewMenuPrice,
  newMenuStock,
  setNewMenuStock,
  newMenuCategory,
  setNewMenuCategory,
  newMenuImageUrl,
  setNewMenuImageUrl,
  handleAddMenu,
  handleEditMenu,
  handleDeleteMenu,
  openEditDialog,
  openDeleteDialog,
  isSaving,
  saveError,
}: {
  menuItems: MenuItem[];
  menuLoading: boolean;
  menuError: string;
  onRetryMenu: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  stats: {
    totalMenu: number;
    lowStock: number;
    totalUsers: number;
    totalBalance: number;
  };
  isAddMenuOpen: boolean;
  setIsAddMenuOpen: (open: boolean) => void;
  isEditMenuOpen: boolean;
  setIsEditMenuOpen: (open: boolean) => void;
  isDeleteMenuOpen: boolean;
  setIsDeleteMenuOpen: (open: boolean) => void;
  selectedMenuItem: MenuItem | null;
  newMenuName: string;
  setNewMenuName: (name: string) => void;
  newMenuPrice: string;
  setNewMenuPrice: (price: string) => void;
  newMenuStock: string;
  setNewMenuStock: (stock: string) => void;
  newMenuCategory: "mie" | "dimsum" | "minuman" | "topping";
  setNewMenuCategory: (cat: "mie" | "dimsum" | "minuman" | "topping") => void;
  newMenuImageUrl: string;
  setNewMenuImageUrl: (url: string) => void;
  handleAddMenu: () => void;
  handleEditMenu: () => void;
  handleDeleteMenu: () => void;
  openEditDialog: (item: MenuItem) => void;
  openDeleteDialog: (item: MenuItem) => void;
  isSaving: boolean;
  saveError: string;
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Menu</h1>
          <p className="text-muted-foreground">
            Tambah, edit, dan kelola stok menu restoran
          </p>
        </div>
        <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Tambah Menu Baru
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Isi form di bawah untuk menambahkan menu baru
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Nama Menu
                </Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama menu"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground">
                    Harga
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="10000"
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-foreground">
                    Stok
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="50"
                    value={newMenuStock}
                    onChange={(e) => setNewMenuStock(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
              {saveError && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {saveError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddMenuOpen(false)}
                className="border-border text-foreground"
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleAddMenu}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Menu</p>
                <p className="text-2xl font-bold text-foreground">
                  {menuLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats.totalMenu
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stok Rendah</p>
                <p className="text-2xl font-bold text-foreground">
                  {menuLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats.lowStock
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Pelanggan
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saldo</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(stats.totalBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        {menuLoading ? (
          <LoadingSpinner label="Memuat daftar menu..." />
        ) : menuError ? (
          <ErrorState message={menuError} onRetry={onRetryMenu} />
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-12 h-12 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">
              {searchQuery ? "Tidak ada menu yang cocok." : "Belum ada menu."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] w-full">
            <Table className="min-w-[650px] md:min-w-full">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    Nama Menu
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Harga
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Stok
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.isSpicy && (
                          <Badge className="bg-destructive/20 text-destructive text-xs">
                            <Flame className="w-3 h-3 mr-1" />
                            Lv.{item.spicyLevel}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-border text-muted-foreground capitalize"
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          item.stock > 20
                            ? "border-success/50 text-success"
                            : item.stock > 0
                              ? "border-warning/50 text-warning"
                              : "border-destructive/50 text-destructive"
                        }
                      >
                        {item.stock} pcs
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditMenuOpen} onOpenChange={setIsEditMenuOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Menu</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedMenuItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price" className="text-foreground">
                Harga
              </Label>
              <Input
                id="edit-price"
                type="number"
                value={newMenuPrice}
                onChange={(e) => setNewMenuPrice(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock" className="text-foreground">
                Stok
              </Label>
              <Input
                id="edit-stock"
                type="number"
                value={newMenuStock}
                onChange={(e) => setNewMenuStock(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl" className="text-foreground">
                URL Gambar
              </Label>
              <Input
                id="edit-imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newMenuImageUrl}
                onChange={(e) => setNewMenuImageUrl(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            {saveError && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {saveError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditMenuOpen(false)}
              className="border-border text-foreground"
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditMenu}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteMenuOpen} onOpenChange={setIsDeleteMenuOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-foreground">
                  Hapus Menu
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedMenuItem?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground text-center">
              Apakah kamu yakin ingin menghapus menu ini?
            </p>
            <p className="text-muted-foreground text-sm text-center mt-2">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            {saveError && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg mt-3 text-center">
                {saveError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteMenuOpen(false)}
              className="border-border text-foreground"
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteMenu}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top Up Section Component
// ─────────────────────────────────────────────────────────────────────────────

function TopUpSection({
  users,
  usersLoading,
  usersError,
  onRetryUsers,
  selectedUserId,
  setSelectedUserId,
  topUpAmount,
  setTopUpAmount,
  handleTopUp,
  topUpLoading,
  topUpSuccess,
  topUpError,
}: {
  users: User[];
  usersLoading: boolean;
  usersError: string;
  onRetryUsers: () => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  topUpAmount: string;
  setTopUpAmount: (amount: string) => void;
  handleTopUp: () => void;
  topUpLoading: boolean;
  topUpSuccess: boolean;
  topUpError: string;
}) {
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const quickAmounts = [50000, 100000, 150000, 200000];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Top Up Saldo</h1>
        <p className="text-muted-foreground">Tambah saldo untuk pelanggan</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Up Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Form Top Up
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Pilih pelanggan dan masukkan nominal top up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user" className="text-foreground">
                Pilih Pelanggan
              </Label>
              {usersLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 bg-secondary rounded-lg">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memuat daftar pelanggan...
                </div>
              ) : usersError ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-destructive">{usersError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetryUsers}
                    className="gap-2 w-fit"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Coba Lagi
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Pilih pelanggan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({user.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedUser.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                    <p className="text-sm text-primary font-semibold mt-1">
                      Saldo: {formatCurrency(selectedUser.balance)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">
                Nominal Top Up
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Masukkan nominal"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="bg-secondary border-border text-foreground text-lg font-semibold"
              />
            </div>

            {/* Quick Amounts */}
            <div className="space-y-2">
              <Label className="text-foreground">Pilih Cepat</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setTopUpAmount(amount.toString())}
                    className={`border-border text-foreground hover:bg-secondary ${topUpAmount === amount.toString()
                      ? "bg-primary/10 border-primary"
                      : ""
                      }`}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Error */}
            {topUpError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {topUpError}
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              size="lg"
              disabled={
                !selectedUserId ||
                !topUpAmount ||
                parseInt(topUpAmount) <= 0 ||
                topUpLoading
              }
              onClick={handleTopUp}
            >
              {topUpLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Proses Top Up"
              )}
            </Button>

            {/* Success Message */}
            {topUpSuccess && (
              <div className="flex items-center gap-2 p-4 bg-success/10 text-success rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Top up berhasil!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Daftar Pelanggan
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Semua pelanggan terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <LoadingSpinner label="Memuat daftar pelanggan..." />
            ) : usersError ? (
              <ErrorState message={usersError} onRetry={onRetryUsers} />
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Users className="w-10 h-10 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground text-sm">
                  Belum ada pelanggan terdaftar.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${selectedUserId === user.id
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary border-transparent hover:border-border"
                        }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Saldo</p>
                          <p className="font-bold text-primary">
                            {formatCurrency(user.balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
