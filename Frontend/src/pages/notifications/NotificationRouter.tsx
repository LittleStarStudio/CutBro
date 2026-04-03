// File: src/pages/notifications/NotificationRouter.tsx
import { Navigate } from "react-router-dom";
import { getUser } from "@/lib/auth";

import AdminNotification from "./AdminNotification";
import OwnerNotification from "./OwnerNotification";
import BarberNotification from "./BarberNotification";
import CustomerNotification from "./CustomerNotification";

export default function NotificationRouter() {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin")    return <AdminNotification />;
  if (user.role === "owner")    return <OwnerNotification />;
  if (user.role === "barber")   return <BarberNotification />;
  if (user.role === "customer") return <CustomerNotification />;

  return <Navigate to="/" replace />;
}