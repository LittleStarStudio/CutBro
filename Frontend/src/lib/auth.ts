/* ================= TYPES ================= */

export type Role = "admin" | "owner" | "barber" | "customer";

export type User = {
  id: number;
  avatar?: string;
  name: string;
  email: string;
  role: Role;
  barbershop_id: number | null;
  status: string;
};

const STORAGE_KEY = "user";

/* ================= ROLE DASHBOARD ================= */

export const ROLE_DASHBOARD: Record<Role, string> = {
  admin: "/admin",
  owner: "/owner",
  barber: "/barber",
  customer: "/customer",
};

export function getRoleDashboard(role?: Role) {
  if (!role) return "/login";
  return ROLE_DASHBOARD[role] ?? "/";
}

/* ================= CORE AUTH ================= */

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function login(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("cutbro_token");
  localStorage.removeItem("cutbro_refresh_token");
  window.dispatchEvent(new Event("cutbro:logout"));
}

/* ================= HELPERS ================= */

export function isLoggedIn() {
  return !!getUser();
}

export function getRole(): Role | null {
  return getUser()?.role ?? null;
}
