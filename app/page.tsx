"use client";

import { useState } from "react";
import { LoginPage } from "@/components/login-page";
import { PembeliDashboard } from "@/components/pembeli-dashboard";
import { KasirDashboard } from "@/components/kasir-dashboard";
import { type User } from "@/lib/data";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // Show login page if not logged in
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show appropriate dashboard based on user role
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
