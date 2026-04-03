/* ================= EXISTING TYPES ================= */
export type Barbershop = {
  id: number;
  name: string;
  owner: string;
  location: string;
  plan: string;
  barbers: number;
  status: string;
  revenue: string;
  rate: number;
};

/* ================= NEW TYPES ================= */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "barber" | "owner";
  status: "active" | "inactive" | "banned";
  joinDate: string;
}

export interface UserActivity {
  id: number;
  user: string;
  email: string;
  activity: "login" | "logout" | "register" | "create_booking" | "update_profile" | "delete_account";
  timestamp: string;
  ipAddress: string;
  device: string;
}

export interface LoginLog {
  id: number;
  user: string;
  email: string;
  action: "login" | "logout" | "register";
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  status: "success" | "failed";
}