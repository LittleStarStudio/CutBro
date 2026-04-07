import api from "./api";

/* ================================================================
   TYPES
================================================================ */

export interface DashboardStats {
  total_booking: number;
  total_customer: number;
  total_barber: number;
  total_balance: number;
}

export interface MonthlyData {
  month: string;
  amount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  monthly_salary: MonthlyData[];
}

export interface OperationalHour {
  day: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface BarbershopProfile {
  name: string;
  slug: string;
  address: string;
  phone: string;
  description: string | null;
  photos: string[];
  operational_hours: OperationalHour[];
}

export interface Shift {
  id: number;
  name: string;
  label: string;
  start_time: string;
  end_time: string;
  status: "active" | "inactive";
}

export interface ShiftAssignment {
  id: number;
  barber_id: number;
  barber_name: string;
  shift_id: number;
  shift_label: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  status: "active" | "off" | "leave";
}

export interface ScheduleEntry {
  id: number;
  barber_id: number;
  barber_name: string;
  day: string;
  shift_label: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_checkin: string | null;
  status: "active" | "off" | "leave";
}

export interface Promo {
  id: number;
  name: string;
  original_price: number;
  discount_percent: number;
  final_price: number;
  is_active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  total_bookings: number;
  last_visit: string | null;
  total_spent: number;
  status: "active" | "banned";
  banned_reason: string | null;
}

export interface PaymentSetting {
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  qris_image_url: string | null;
}

export interface Transaction {
  id: number;
  invoice_number: string;
  customer_name: string;
  service_name: string;
  barber_name: string;
  price: number;
  date: string;
  status: string;
}

export interface RefundRow {
  id: string;
  date_time: string;
  order_id: string;
  payment: string;
  status: string;
  amount: number;
  email: string;
}

export interface BarberReport {
  id: number;
  barber_name: string;
  account: string;
  join_date: string;
  last_active_date: string;
  status: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category_id: number | null;
  category?: { id: number; name: string } | null;
}

export interface Barber {
  id: number;
  name: string;
  user_id: number | null;
  avatar?: string;
}

export interface Booking {
  id: number;
  customer_name: string;
  barber_name: string;
  service_name: string;
  booking_date: string;
  start_time: string;
  status: string;
  total_price: number;
}

export interface SubscriptionPlan {
  id:           number;
  name:         string;
  display_name: string;
  price:        number;
  description:  string;
  max_barbers:  number | null;
}

export interface ActiveSubscription {
  id:          number;
  plan:        string;
  plan_label:  string;
  status:      string;
  started_at:  string | null;
  expired_at:  string | null;
}

export interface SubscriptionData {
  active_subscription: ActiveSubscription | null;
  plans:               SubscriptionPlan[];
}

/* ================================================================
   HELPERS
================================================================ */

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

/* ================================================================
   DASHBOARD
================================================================ */

export const getDashboard = () =>
  api.get<{ success: boolean; data: DashboardData }>("/owner/dashboard").then(unwrap<DashboardData>);

/* ================================================================
   BARBERSHOP PROFILE
================================================================ */

export const getBarbershopProfile = () =>
  api.get<{ success: boolean; data: BarbershopProfile }>("/owner/barbershop").then(unwrap<BarbershopProfile>);

export const updateBarbershopProfile = (data: FormData) =>
  api.post("/owner/barbershop", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ================================================================
   SHIFTS
================================================================ */

export const getShifts = () =>
  api.get<{ success: boolean; data: Shift[] }>("/owner/shifts").then(unwrap<Shift[]>);

export const updateShifts = (shifts: Pick<Shift, "name" | "start_time" | "end_time" | "status">[]) =>
  api.put("/owner/shifts", { shifts });

/* ================================================================
   SHIFT ASSIGNMENTS
================================================================ */

export const getShiftAssignments = () =>
  api.get<{ success: boolean; data: ShiftAssignment[] }>("/owner/shift-assignments").then(unwrap<ShiftAssignment[]>);

export const createShiftAssignment = (data: {
  barber_id: number;
  shift_id: number;
  day_of_week: string;
  status?: string;
}) => api.post<{ success: boolean; data: ShiftAssignment }>("/owner/shift-assignments", data);

export const updateShiftAssignment = (id: number, data: {
  barber_id: number;
  shift_id: number;
  day_of_week: string;
  status?: string;
}) => api.put(`/owner/shift-assignments/${id}`, data);

export const deleteShiftAssignment = (id: number) =>
  api.delete(`/owner/shift-assignments/${id}`);

/* ================================================================
   SCHEDULE
================================================================ */

export const getSchedule = () =>
  api.get<{ success: boolean; data: ScheduleEntry[] }>("/owner/schedule").then(unwrap<ScheduleEntry[]>);

/* ================================================================
   PROMOS
================================================================ */

export const getPromos = () =>
  api.get<{ success: boolean; data: Promo[] }>("/owner/promos").then(unwrap<Promo[]>);

export const createPromo = (data: { name: string; original_price: number; discount_percent: number }) =>
  api.post<{ success: boolean; data: Promo }>("/owner/promos", data);

export const updatePromo = (id: number, data: { name: string; original_price: number; discount_percent: number }) =>
  api.put(`/owner/promos/${id}`, data);

export const deletePromo = (id: number) =>
  api.delete(`/owner/promos/${id}`);

/* ================================================================
   CUSTOMERS
================================================================ */

export const getCustomers = () =>
  api.get<{ success: boolean; data: Customer[] }>("/owner/customers").then(unwrap<Customer[]>);

export const updateCustomerStatus = (userId: number, data: { status: "active" | "banned"; banned_reason?: string }) =>
  api.patch(`/owner/customers/${userId}/status`, data);

/* ================================================================
   PAYMENT SETTINGS
================================================================ */

export const getPaymentSettings = () =>
  api.get<{ success: boolean; data: PaymentSetting }>("/owner/payment-settings").then(unwrap<PaymentSetting>);

export const updatePaymentSettings = (data: FormData) =>
  api.put("/owner/payment-settings", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ================================================================
   TRANSACTIONS
================================================================ */

export const getTransactions = (params?: { barber_id?: number; date_from?: string; date_to?: string }) =>
  api.get<{ success: boolean; data: Transaction[] }>("/owner/transactions", { params }).then(unwrap<Transaction[]>);

/* ================================================================
   REFUNDS
================================================================ */

export const getRefunds = () =>
  api.get<{ success: boolean; data: RefundRow[] }>("/owner/refunds").then(unwrap<RefundRow[]>);

export const updateRefundStatus = (bookingId: string, status: "refunded" | "failed") =>
  api.patch(`/owner/refunds/${bookingId}/status`, { status });

/* ================================================================
   BARBER REPORT
================================================================ */

export const getBarberReport = () =>
  api.get<{ success: boolean; data: BarberReport[] }>("/owner/barbers/report").then(unwrap<BarberReport[]>);

/* ================================================================
   SERVICE CATEGORIES
================================================================ */

export const getCategories = () =>
  api.get<{ success: boolean; data: ServiceCategory[] }>("/owner/service-categories").then(unwrap<ServiceCategory[]>);

export const createCategory = (data: { name: string; description?: string }) =>
  api.post<{ success: boolean; data: ServiceCategory }>("/owner/service-categories", data);

export const updateCategory = (id: number, data: { name: string; description?: string }) =>
  api.put(`/owner/service-categories/${id}`, data);

export const deleteCategory = (id: number) =>
  api.delete(`/owner/service-categories/${id}`);

/* ================================================================
   SERVICES
================================================================ */

export const getServices = () =>
  api.get<{ success: boolean; data: Service[] }>("/owner/services").then(unwrap<Service[]>);

export const createService = (data: { name: string; description?: string; price: number; duration_minutes: number; category_id?: number }) =>
  api.post<{ success: boolean; data: Service }>("/owner/services", data);

export const updateService = (id: number, data: { name: string; description?: string; price: number; duration_minutes: number; category_id?: number }) =>
  api.put(`/owner/services/${id}`, data);

export const deleteService = (id: number) =>
  api.delete(`/owner/services/${id}`);

/* ================================================================
   BARBERS
================================================================ */

export const getBarbers = () =>
  api.get<{ success: boolean; data: Barber[] }>("/owner/barbers").then(unwrap<Barber[]>);

export const createBarber = (data: FormData) =>
  api.post<{ success: boolean; data: Barber }>("/owner/barbers", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateBarber = (id: number, data: FormData) =>
  api.post<{ success: boolean; data: Barber }>(`/owner/barbers/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteBarber = (id: number) =>
  api.delete(`/owner/barbers/${id}`);

/* ================================================================
   BOOKINGS
================================================================ */

export const getBookings = () =>
  api.get<{ success: boolean; data: Booking[] }>("/owner/bookings").then(unwrap<Booking[]>);

export const updateBookingStatus = (id: number, status: string) =>
  api.patch(`/owner/bookings/${id}/status`, { status });

/* ================================================================
   SUBSCRIPTION
================================================================ */

export const getPublicPlans = (): Promise<SubscriptionPlan[]> =>
  api
    .get<{ success: boolean; data: SubscriptionPlan[] }>("/plans")
    .then(unwrap<SubscriptionPlan[]>);

export const getMySubscription = (): Promise<SubscriptionData> =>
  api
    .get<{ success: boolean; data: SubscriptionData }>("/owner/subscription")
    .then(unwrap<SubscriptionData>);

export const checkoutPlan = (planId: number): Promise<{
  snap_token?: string;
  redirect_url?: string;
  plan?: string;
}> =>
  api
    .post<{ success: boolean; data: { snap_token?: string; redirect_url?: string; plan?: string } }>(
      "/owner/subscription/checkout",
      { plan_id: planId }
    )
    .then(unwrap);