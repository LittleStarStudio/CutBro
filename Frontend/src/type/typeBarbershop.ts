export interface Barbershop {
  id: number;
  name: string;
  owner: string;
  location: string;
  status: "active" | "suspended" | "pending";
  revenue: number;
  bookings: number;
  rating: number;
  joinDate: string;
}

export interface DashboardStats {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  pendingShops: number;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
}