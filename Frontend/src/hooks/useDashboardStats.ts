import { useMemo } from "react";
import type { Barbershop, DashboardStats } from "@/type/typeBarbershop";

export function useDashboardStats(barbershops: Barbershop[]): DashboardStats {
  return useMemo(() => {
    const totalShops = barbershops.length;
    const activeShops = barbershops.filter((s) => s.status === "active").length;
    const suspendedShops = barbershops.filter((s) => s.status === "suspended").length;
    const pendingShops = barbershops.filter((s) => s.status === "pending").length;
    const totalRevenue = barbershops.reduce((sum, shop) => sum + shop.revenue, 0);
    const totalBookings = barbershops.reduce((sum, shop) => sum + shop.bookings, 0);
    const averageRating =
      barbershops.reduce((sum, shop) => sum + shop.rating, 0) / totalShops || 0;

    return {
      totalShops,
      activeShops,
      suspendedShops,
      pendingShops,
      totalRevenue,
      totalBookings,
      averageRating: Number(averageRating.toFixed(1)),
    };
  }, [barbershops]);
}