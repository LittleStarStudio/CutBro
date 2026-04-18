import api from "./api";

export interface PublicBarbershop {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  address: string;
  city: string;
  phone: string;
  status: string;
  average_rating: number | null;
  is_open_now: boolean;       
  min_price: number | null;   
}


export interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  promo?: { discount_percent: number; final_price: number } | null;  
}

export interface BarberItem {
  id: number;
  name: string;
  bio: string | null;
  photo_url: string | null;
}

export interface OperationalHour {
  day_of_week: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface BarbershopDetail extends PublicBarbershop {
  operational_hours: OperationalHour[];
  services: ServiceItem[];
  barbers: BarberItem[];
}

export interface CustomerBooking {
  id: number;
  barbershop_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  service?: { id: number; name: string };
  barber?: { id: number; user?: { name: string } };
  barbershop?: { id: number; name: string; logo_url?: string | null };
  payment?: { status: string; snap_token?: string | null };
  rating?: { id: number; rating: number; review: string | null } | null;
}

export interface CreateBookingResponse {
  booking: CustomerBooking;
  snap_token: string;
  order_id: string;
}

// ── Public (tidak perlu auth) ──────────────────────────────────────────

export const getBarbershops = (params?: { search?: string; city?: string }) =>
  api
    .get<{ success: boolean; data: PublicBarbershop[] }>("/barbershops", { params })
    .then((r) => r.data.data);

export const getBarbershopDetail = (id: number) =>
  api
    .get<{ success: boolean; data: BarbershopDetail }>(`/barbershops/${id}`)
    .then((r) => r.data.data);

export const getPublicAvailableSlots = (
  id: number,
  params: { service_id: number; barber_id: number; booking_date: string }
) =>
  api
    .get<{ success: boolean; data: { time: string; available: boolean }[] }>(
      `/barbershops/${id}/available-slots`,
      { params }
    )
    .then((r) => r.data.data);

// ── Auth required ──────────────────────────────────────────────────────

export const createBooking = (data: {
  service_id: number;
  barber_id: number;
  booking_date: string;
  start_time: string;
}) =>
  api
    .post<{ success: boolean; data: CreateBookingResponse }>("/customer/bookings", data)
    .then((r) => r.data.data);

export const activateBooking = (id: number) =>
  api.post(`/customer/bookings/${id}/activate`).then((r) => r.data);

export const getMyBookings = (filter?: "upcoming" | "history") =>
  api
    .get<{ success: boolean; data: CustomerBooking[] }>("/customer/bookings", {
      params: filter ? { filter } : undefined,
    })
    .then((r) => r.data.data);

export const cancelMyBooking = (id: number) =>
  api.patch(`/customer/bookings/${id}/cancel`).then((r) => r.data);

export const rateBooking = (bookingId: number, data: { rating: number; review?: string }) =>
  api
    .post<{ success: boolean; data: unknown }>(`/customer/bookings/${bookingId}/rate`, data)
    .then((r) => r.data);
