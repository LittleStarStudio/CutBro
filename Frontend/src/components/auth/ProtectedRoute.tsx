import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/context/AuthContext";

/* ================= TYPES ================= */
export type Role = "admin" | "owner" | "barber" | "customer";

type Props = {
  children: React.ReactNode;
  allow: Role[];
};

/* ================= ROLE → DASHBOARD MAP ================= */
export const ROLE_DASHBOARD: Record<Role, string> = {
  admin: "/admin",
  owner: "/owner",
  barber: "/barber",
  customer: "/customer",
};

export function getRoleDashboard(role?: string) {
  if (!role) return "/login";
  return ROLE_DASHBOARD[role as Role] ?? "/";
}

/* ================= COMPONENT ================= */
export default function ProtectedRoute({ children, allow }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Tunggu verifikasi token selesai sebelum redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ❌ belum login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const role = user.role as Role;

  // ❌ role tidak diizinkan → redirect ke dashboard role yang benar
  if (!allow.includes(role)) {
    return <Navigate to={getRoleDashboard(role)} replace />;
  }

  // ✅ boleh akses
  return <>{children}</>;
}
