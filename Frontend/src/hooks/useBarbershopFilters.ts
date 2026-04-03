import { useState, useMemo } from "react";
import type { Barbershop } from "@/type/typeBarbershop";

export function useBarbershopFilters(barbershops: Barbershop[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredShops = useMemo(() => {
    return barbershops.filter((shop) => {
      const matchSearch =
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = filterStatus === "all" || shop.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [barbershops, searchQuery, filterStatus]);

  return {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredShops,
  };
}