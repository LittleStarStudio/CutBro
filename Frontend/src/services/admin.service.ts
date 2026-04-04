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
