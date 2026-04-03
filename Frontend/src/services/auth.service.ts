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

export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await api.post<{ success: boolean; data: AuthResponse }>(
    "/auth/login",
    payload
  );
  return saveSession(data.data);
}

export async function registerOwner(payload: RegisterOwnerPayload): Promise<void> {
  await api.post("/auth/register-owner", payload);
}

export async function registerCustomer(payload: RegisterCustomerPayload): Promise<void> {
  await api.post("/auth/register-customer", payload);
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ success: boolean; data: User }>("/auth/me");
  const user: User = {
    ...data.data,
    role: normalizeRole(data.data.role as string),
  };
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    storage.clear();
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
