import { Navigate, useLocation } from "react-router-dom";
import { getUser } from "@/lib/auth";

/* ================= TYPES ================= */
export type Role = "admin" | "owner" | "barber" | "customer";

type Props = {
  children: React.ReactNode;
  allow: Role[];
};

/* ================= ROLE → DASHBOARD MAP ================= */
// single source of truth
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
  const user = getUser();
  const location = useLocation();

  // ❌ belum login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }} // biar bisa balik lagi setelah login
      />
    );
  }

  const role = user.role as Role;

  // ❌ role tidak diizinkan
  if (!allow.includes(role)) {
    return <Navigate to={getRoleDashboard(role)} replace />;
  }

  // ✅ boleh
  return <>{children}</>;
}
