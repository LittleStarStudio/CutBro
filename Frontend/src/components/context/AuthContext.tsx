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
import { getUser, type User } from "@/lib/auth";
import { getMe, logout as apiLogout } from "@/services/auth.service";
import { storage } from "@/services/api";

/* ── Types ── */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Refresh user dari backend (berguna setelah update profil) */
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* Verifikasi token saat app pertama dibuka */
  useEffect(() => {
    const token = storage.getToken();

    if (!token) {
      // Tidak ada token → tidak perlu panggil backend
      setLoading(false);
      return;
    }

    // Ada token → validasi ke backend
    getMe()
      .then((u) => setUser(u))
      .catch(() => {
        // Token tidak valid / expired dan gagal refresh → bersihkan session
        storage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getMe();
      setUser(u);
    } catch {
      // Biarkan interceptor yang handle jika 401
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  /* Sinkronisasi jika tab lain mengubah localStorage (misalnya logout di tab lain) */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cutbro_token" && !e.newValue) {
        setUser(null);
      }
      if (e.key === "user") {
        setUser(getUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout: handleLogout, setUser }}
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
