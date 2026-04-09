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
  id: number;
  name: string;
  owner: string;
  owner_id: number | null;
  location: string;
  plan: string;
  barbers: number;
  status: string;
  revenue: number;
  rate: number;
}

export interface BarbershopsResponse {
  data: AdminBarbershop[];
  total: number;
}

export interface UpdateBarbershopPayload {
  name?: string;
  owner_name?: string;
  city?: string;
  subscription_plan?: string;
  status?: string;
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

export interface SubscriptionPlan {
  id:           number;
  name:         string;
  display_name: string;
  price:        number;
  description:  string;
  max_barbers:  number | null;
}

export interface TransactionStats {
  total_transactions: number;
  subscription_count: number;   
  booking_count:      number;   
  success_rate:       number;
  total_revenue:      number;
  available_balance:  number;
}

export interface RefundRequestInfo {
  id:         number;
  status:     "pending" | "approved" | "rejected";
  reason:     string;
  admin_note: string | null;
}

export interface AdminTransaction {
  id: number;
  transaction_type: 'subscription' | 'booking';
  order_id: string;
  buyer_name: string;
  buyer_email: string;
  payment_channel: string;
  amount: number;
  status: 'success' | 'pending' | 'cancelled' | 'expired' | 'refunded' | 'refund_rejected' | 'refund_pending';
  subscription_status: string;   // untuk logic refund
  paid_at: string | null;
  created_at: string;
  refund_request: RefundRequestInfo | null;
}


export interface PaginatedTransactions {
  data:         AdminTransaction[];
  current_page: number;
  last_page:    number;
  per_page:     number;
  total:        number;
}

export interface AdminRefundRequest {
  id:               number;
  transaction_type: string;
  order_id:         string;
  barbershop_name:  string;
  requester_email:  string;
  refund_amount:    number;
  reason:           string;
  status:           "pending" | "approved" | "rejected";
  admin_note:       string | null;
  created_at:       string;
}

export interface PaginatedRefundRequests {
  data:         AdminRefundRequest[];
  current_page: number;
  last_page:    number;
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

export const getAdminBarbershops = () =>
  api
    .get<{ success: boolean; data: BarbershopsResponse }>("/admin/barbershops")
    .then(unwrap<BarbershopsResponse>);

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

/* ================================================================
   Subscription Plans MANAGEMENT (Admin)
================================================================ */

export const getSubscriptionPlans = (): Promise<SubscriptionPlan[]> =>
  api
    .get<{ success: boolean; data: SubscriptionPlan[] }>("/admin/subscription-plans")
    .then(unwrap<SubscriptionPlan[]>);

export const updateSubscriptionPlan = (
  id: number,
  payload: Partial<Pick<SubscriptionPlan, "display_name" | "price" | "description">>
): Promise<SubscriptionPlan> =>
  api
    .put<{ success: boolean; data: SubscriptionPlan }>(`/admin/subscription-plans/${id}`, payload)
    .then(unwrap<SubscriptionPlan>);

/* ================================================================
   Transaction MANAGEMENT (Admin)
================================================================ */

export const getTransactionStats = (): Promise<TransactionStats> =>
  api
    .get<{ success: boolean; data: TransactionStats }>("/admin/transactions/stats")
    .then(unwrap<TransactionStats>);

export const getAdminTransactions = (
  page = 1,
  filters?: {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
  }
): Promise<PaginatedTransactions> =>
  api
    .get<{ success: boolean; data: PaginatedTransactions }>("/admin/transactions", {
      params: { page, ...filters },
    })
    .then(unwrap<PaginatedTransactions>);

export const processSubscriptionRefund = (
  subscriptionId: number,
  reason: string
): Promise<void> =>
  api
    .post<{ success: boolean }>(`/admin/transactions/${subscriptionId}/refund`, { reason })
    .then(() => undefined);

export const rejectDirectRefund = (
  subscriptionId: number,
  reason: string
): Promise<void> =>
  api
    .post<{ success: boolean }>(`/admin/transactions/${subscriptionId}/reject-refund`, { reason })
    .then(() => undefined);

export const getAdminRefundRequests = (status?: string): Promise<PaginatedRefundRequests> =>
  api
    .get<{ success: boolean; data: PaginatedRefundRequests }>("/admin/refund-requests", {
      params: status ? { status } : {},
    })
    .then(unwrap<PaginatedRefundRequests>);

export const approveRefundRequest = (id: number, adminNote: string): Promise<void> =>
  api
    .patch<{ success: boolean }>(`/admin/refund-requests/${id}/approve`, { admin_note: adminNote })
    .then(() => undefined);

export const rejectRefundRequest = (id: number, adminNote: string): Promise<void> =>
  api
    .patch<{ success: boolean }>(`/admin/refund-requests/${id}/reject`, { admin_note: adminNote })
    .then(() => undefined);

export const syncPendingTransactions = (): Promise<{ synced: number }> =>
  api
    .post<{ success: boolean; data: { synced: number } }>("/admin/transactions/sync-pending")
    .then(unwrap<{ synced: number }>);

