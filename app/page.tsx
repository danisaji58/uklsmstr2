"use client";

import { useEffect, useState } from "react";
import { LoginPage } from "@/components/login-page";
import { PembeliDashboard } from "@/components/pembeli-dashboard";
import { KasirDashboard } from "@/components/kasir-dashboard";
import { type User } from "@/lib/data";
import { clearAuthToken, getAuthToken, getProfile } from "@/lib/api";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!getAuthToken()) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const profile = await getProfile();
        if (isMounted) setCurrentUser(profile);
      } catch (error) {
        console.error(error);
        clearAuthToken();
      } finally {
        if (isMounted) setIsRestoringSession(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, balance: newBalance });
    }
  };

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Memulihkan sesi...
      </div>
    );
  }

  // Show login page if not logged in
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
