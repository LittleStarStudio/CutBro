/* ================================================================
   src/context/AuthContext.tsx
   Context untuk auth agar komponen nav tidak perlu menerima
   user & onLogout sebagai props dari setiap halaman.
================================================================ */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { getUser, login, logout as authLogout, type User } from "@/lib/auth";

/* ── Types ── */
interface AuthContextValue {
  user: User | null;
  /** Refresh user dari localStorage (berguna setelah update profil) */
  refreshUser: () => void;
  logout: () => void;
  login: (user: User) => void;
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser());

  const refreshUser = useCallback(() => {
    setUser(getUser());
  }, []);

  const handleLogout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const handleLogin = useCallback((u: User) => {
    login(u);
    setUser(u);
  }, []);

  /* Sinkronisasi jika tab lain mengubah localStorage */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") setUser(getUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, refreshUser, logout: handleLogout, login: handleLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}