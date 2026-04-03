import { useState, useMemo } from "react";

interface ActivityLog {
  id: number;
  user: string;
  email: string;
  action: string;
  type: "booking" | "login" | "payment" | "registration" | "cancellation";
  timestamp: string;
  status: "success" | "pending" | "failed";
  details?: string;
}

// Mock data for activity logs
const mockActivities: ActivityLog[] = [
  {
    id: 1,
    user: "John Doe",
    email: "john@example.com",
    action: "Created new booking",
    type: "booking",
    timestamp: "2 minutes ago",
    status: "success",
    details: "Classic Haircut at BarberShop A",
  },
  {
    id: 2,
    user: "Sarah Miller",
    email: "sarah@example.com",
    action: "Logged into account",
    type: "login",
    timestamp: "5 minutes ago",
    status: "success",
  },
  {
    id: 3,
    user: "Mike Johnson",
    email: "mike@example.com",
    action: "Payment processed",
    type: "payment",
    timestamp: "10 minutes ago",
    status: "success",
    details: "$25.00 - Credit Card",
  },
  {
    id: 4,
    user: "Emily Davis",
    email: "emily@example.com",
    action: "Registered new account",
    type: "registration",
    timestamp: "15 minutes ago",
    status: "success",
  },
  {
    id: 5,
    user: "David Wilson",
    email: "david@example.com",
    action: "Payment pending",
    type: "payment",
    timestamp: "20 minutes ago",
    status: "pending",
    details: "$30.00 - Bank Transfer",
  },
  {
    id: 6,
    user: "Lisa Anderson",
    email: "lisa@example.com",
    action: "Booking cancelled",
    type: "cancellation",
    timestamp: "25 minutes ago",
    status: "success",
    details: "Beard Trim - Refund issued",
  },
  {
    id: 7,
    user: "Tom Brown",
    email: "tom@example.com",
    action: "Login attempt failed",
    type: "login",
    timestamp: "30 minutes ago",
    status: "failed",
    details: "Invalid credentials",
  },
  {
    id: 8,
    user: "Jennifer Lee",
    email: "jennifer@example.com",
    action: "Created new booking",
    type: "booking",
    timestamp: "35 minutes ago",
    status: "success",
    details: "Haircut + Beard at BarberShop B",
  },
  {
    id: 9,
    user: "Robert Taylor",
    email: "robert@example.com",
    action: "Payment processed",
    type: "payment",
    timestamp: "40 minutes ago",
    status: "success",
    details: "$45.00 - Debit Card",
  },
  {
    id: 10,
    user: "Amanda White",
    email: "amanda@example.com",
    action: "Logged into account",
    type: "login",
    timestamp: "45 minutes ago",
    status: "success",
  },
  {
    id: 11,
    user: "Chris Martin",
    email: "chris@example.com",
    action: "Booking cancelled",
    type: "cancellation",
    timestamp: "50 minutes ago",
    status: "success",
    details: "Premium Package - Refund pending",
  },
  {
    id: 12,
    user: "Rachel Green",
    email: "rachel@example.com",
    action: "Created new booking",
    type: "booking",
    timestamp: "1 hour ago",
    status: "success",
    details: "Kids Haircut at BarberShop C",
  },
];

export function useActivityLog() {
  const [filterType, setFilterType] = useState<string>("all");

  const activities = useMemo(() => {
    if (filterType === "all") {
      return mockActivities;
    }
    return mockActivities.filter((activity) => activity.type === filterType);
  }, [filterType]);

  return {
    activities,
    filterType,
    setFilterType,
  };
}