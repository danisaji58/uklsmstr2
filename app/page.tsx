"use client";

import { useState, useEffect } from "react";
import { LoginPage } from "@/components/login-page";
import { PembeliDashboard } from "@/components/pembeli-dashboard";
import { KasirDashboard } from "@/components/kasir-dashboard";
import { type User } from "@/lib/data";
import { getMe } from "@/lib/services/userService";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Tandai bahwa sudah hydrated di client agar tidak ada mismatch SSR
  useEffect(() => {
    setIsHydrated(true);

    const restoreSession = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsAuthenticating(false);
        return;
      }

      try {
        const user = await getMe();
        setCurrentUser(user);
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      } finally {
        setIsAuthenticating(false);
      }
    };

    void restoreSession();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, balance: newBalance });
    }
  };

  // Tunggu hydration sebelum render untuk menghindari localStorage issues
  if (!isHydrated) {
    return null;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser.role === "kasir") {
    return <KasirDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <PembeliDashboard
      user={currentUser}
      onLogout={handleLogout}
      onBalanceUpdate={handleBalanceUpdate}
    />
  );
}
