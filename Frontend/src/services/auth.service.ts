import api, { storage } from "./api";
import type { User } from "@/lib/auth";

/* ── Types ── */
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterOwnerPayload {
  name: string;
  email: string;
  password: string;
  barbershop_name: string;
  phone: string;
  address: string;
  city: string;
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/* ── Helpers ── */

/**
 * Backend menggunakan "super_admin", frontend menggunakan "admin".
 * Normalisasi di sini agar seluruh codebase frontend konsisten.
 */
function normalizeRole(role: string): User["role"] {
  if (role === "super_admin") return "admin";
  return role as User["role"];
}

function saveSession(data: AuthResponse): User {
  storage.setToken(data.access_token);
  storage.setRefresh(data.refresh_token);

  const user: User = {
    ...data.user,
    role: normalizeRole(data.user.role as string),
  };
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

/* ── Auth functions ── */

async function getIpLocation(): Promise<string> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json() as { city?: string; country_name?: string };
    if (data.city && data.country_name) return `${data.city}, ${data.country_name}`;
    if (data.country_name) return data.country_name;
  } catch { /* silent */ }
  return "-";
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    {
      headers: { "Accept-Language": "en" },
      signal: AbortSignal.timeout(4000),
    }
  );
    const data = await res.json() as {
    address?: {
      city?: string; town?: string; village?: string;
      county?: string; state?: string; country?: string;
    }
  };
  const city = data.address?.city || data.address?.state;
  const country = data.address?.country;
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return "-";
}

function getLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      getIpLocation().then(resolve);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          resolve(await reverseGeocode(pos.coords.latitude, pos.coords.longitude));
        } catch {
          resolve("-");
        }
      },
      async () => {
        resolve(await getIpLocation());
      },
      { timeout: 8000, maximumAge: 300_000 }
    );
  });
}

export async function login(payload: LoginPayload): Promise<User> {
  const location = await getLocation();
  localStorage.setItem("cutbro_location", location);
  const { data } = await api.post<{ success: boolean; data: AuthResponse }>(
    "/auth/login",
    { ...payload, location }
  );
  return saveSession(data.data);
}

export async function registerOwner(payload: RegisterOwnerPayload): Promise<void> {
  const location = await getLocation();
  await api.post("/auth/register-owner", { ...payload, location });
}

export async function registerCustomer(payload: RegisterCustomerPayload): Promise<void> {
  const location = await getLocation();
  await api.post("/auth/register-customer", { ...payload, location });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ success: boolean; data: any }>("/auth/me");
  const raw = data.data;
  return {
    ...raw,
    avatar: raw.avatar_url ?? undefined,
  };
}

export const updateProfile = (data: { name?: string; password?: string }) =>
  api.patch("/auth/profile", data).then((res) => res.data.data.user as User);

export const uploadAvatar = (file: File): Promise<{ avatar_url: string }> => {
  const fd = new FormData();
  fd.append("avatar", file);
  return api
    .post<{ success: boolean; data: { avatar_url: string } }>(
      "/auth/profile/avatar",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    .then((res) => res.data.data);
};


export async function logout(): Promise<void> {
  const location = localStorage.getItem("cutbro_location") ?? "-";
  try {
    await api.post("/auth/logout", { location });
  } finally {
    storage.clear();
    localStorage.removeItem("cutbro_location");
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(payload: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await api.post("/auth/reset-password", payload);
}
