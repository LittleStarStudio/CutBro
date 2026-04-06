import api from "./api";

/* ================================================================
   INTERFACES
================================================================ */

export interface BarbershopStats {
  total:   number;
  free:    number;
  pro:     number;
  premium: number;
}

export interface AdminBarbershop {
  id:       number;
  name:     string;
  owner:    string;
  owner_id: number | null;
  location: string;
  plan:     string;
  barbers:  number;
  status:   string;
  revenue:  number;
  rate:     number;
}

export interface PaginatedBarbershops {
  data:         AdminBarbershop[];
  current_page: number;
  last_page:    number;
  per_page:     number;
  total:        number;
}

export interface UpdateBarbershopPayload {
  name?:              string;
  owner_name?:        string;
  city?:              string;
  subscription_plan?: string;
  status?:            string;
}

export interface UserStats {
  total: number;
  customers: number;
  barbers: number;
  owners: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  join_date: string;
  last_login: string | null;
}

export interface PaginatedUsers {
  data: AdminUser[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

export interface LoginLogStats {
  login:    number;
  logout:   number;
  register: number;
  total:    number;
}

export interface AdminLoginLog {
  id:        number;
  user:      string;
  email:     string;
  action:    string;
  timestamp: string;
  ipAddress: string;
  location:  string;
  device:    string;
  status:    string;
}

export interface PaginatedLoginLogs {
  data:         AdminLoginLog[];
  current_page: number;
  last_page:    number;
  per_page:     number;
  total:        number;
}

/* ================================================================
   HELPERS
================================================================ */

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

/* ================================================================
   BARBERSHOP MANAGEMENT (Admin)
================================================================ */

export const getBarbershopStats = () =>
  api
    .get<{ success: boolean; data: BarbershopStats }>("/admin/barbershops/stats")
    .then(unwrap<BarbershopStats>);

export const getAdminBarbershops = (page = 1) =>
  api
    .get<{ success: boolean; data: PaginatedBarbershops }>("/admin/barbershops", {
      params: { page },
    })
    .then(unwrap<PaginatedBarbershops>);

export const updateAdminBarbershop = (id: number, data: UpdateBarbershopPayload) =>
  api.put(`/admin/barbershops/${id}`, data);

export const deleteAdminBarbershop = (id: number) =>
  api.delete(`/admin/barbershops/${id}`);

/* ================================================================
   Users MANAGEMENT (Admin)
================================================================ */

export const getUserStats = (): Promise<UserStats> =>
  api
    .get<{ success: boolean; data: UserStats }>("/admin/users/stats")
    .then(unwrap<UserStats>);

export const getAdminUsers = (): Promise<PaginatedUsers> =>
  api
    .get<{ success: boolean; data: PaginatedUsers }>("/admin/users", { params: { page: 1, per_page: 500 } })
    .then(unwrap<PaginatedUsers>);

export const updateAdminUser = (id: number, data: UpdateUserPayload) =>
  api.put(`/admin/users/${id}`, data);

export const deleteAdminUser = (id: number) =>
  api.delete(`/admin/users/${id}`);

/* ================================================================
   LoginLogs MANAGEMENT (Admin)
================================================================ */

export const getLoginLogStats = (): Promise<LoginLogStats> =>
  api
    .get<{ success: boolean; data: LoginLogStats }>("/admin/login-logs/stats")
    .then(unwrap<LoginLogStats>);

export const getAdminLoginLogs = (): Promise<PaginatedLoginLogs> =>
  api
    .get<{ success: boolean; data: PaginatedLoginLogs }>("/admin/login-logs", {
      params: { page: 1, per_page: 500 },
    })
    .then(unwrap<PaginatedLoginLogs>);
