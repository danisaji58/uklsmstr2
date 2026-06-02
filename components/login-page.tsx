"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Flame, AlertCircle, RefreshCw } from "lucide-react";
import { type User } from "@/lib/data";
import { login } from "@/lib/auth";
import { getMe } from "@/lib/services/userService";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Login — dapatkan token
      const result = await login(email, password);

      // 2. Simpan token ke localStorage
      const token = result.accessToken ?? result.token ?? result.access_token;
      if (token) {
        localStorage.setItem("token", token);
      }

      // 3. Fetch data user terbaru (termasuk saldo) via /api/me
      let userData: User;
      try {
        userData = await getMe();
      } catch {
        // Fallback jika /api/me tidak tersedia: pakai data dari response login
        const raw = result.user ?? result;
        userData = {
          id: String(raw.id),
          name: raw.name,
          email: raw.email,
          role: String(raw.role).toLowerCase() === "kasir" ? "kasir" : "pembeli",
          balance: raw.balance ?? raw.saldo ?? 0,
        };
      }

      onLogin(userData);
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Coba lagi.";
      // Tampilkan pesan yang ramah
      setError(
        message.toLowerCase().includes("401") ||
          message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("salah") ||
          message.toLowerCase().includes("incorrect")
          ? "Email atau password salah."
          : `Gagal login: ${message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
            <Flame className="w-8 h-8 text-primary" />
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Mie Gacoan
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Point of Sale &amp; Kiosk System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}