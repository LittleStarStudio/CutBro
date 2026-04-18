/* ================= TYPES ================= */

export type Role = "admin" | "owner" | "barber" | "customer";

export type User = {
  id: number;
  avatar?: string;     
  avatar_url?: string;   
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
  const token    = localStorage.getItem("cutbro_token");
  const location = localStorage.getItem("cutbro_location") ?? "-";
  if (token) {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ location }),
    }).catch(() => { /* silent */ });
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("cutbro_token");
  localStorage.removeItem("cutbro_refresh_token");
  localStorage.removeItem("cutbro_location");
  window.dispatchEvent(new Event("cutbro:logout"));
}

/* ================= HELPERS ================= */

export function isLoggedIn() {
  return !!getUser();
}

export function getRole(): Role | null {
  return getUser()?.role ?? null;
}
