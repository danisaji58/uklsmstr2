import { apiFetch } from "./api";

export async function login(email: string, password: string) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}