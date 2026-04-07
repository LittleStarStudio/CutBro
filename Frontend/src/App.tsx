// File: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Home from "@/pages/Home";
import RoleSelect from "@/pages/RoleSelect";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PricingSection from "./pages/PricingSection";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBarbershops from "./pages/admin/Barbershops";
import Users from "./pages/admin/Users";
import LoginLogs from "./pages/admin/LoginLogs";
import ReportUsers from "./pages/admin/ReportUsers";
import ReportRevenue from "./pages/admin/ReportRevenue";

import OwnerDashboard from "@/pages/owner/OwnerDashboard";
import OwnerBooking from "./pages/owner/Booking";
import OwnerServices from "./pages/owner/Services";
import OwnerBarbers from "./pages/owner/Barber";
import OwnerPayment from "./pages/owner/Payment";
import OwnerPromos from "./pages/owner/Promos";
import OwnerCustomers from "./pages/owner/Customer";
import ReportSalary from "./pages/owner/ReportSallary";
import Billing from "./pages/Billing";
import SubscriptionPayment from "@/pages/SubscriptionPayment";

import BarberDashboard from "@/pages/barber/BarberDashboard";
import BarberBarbershops from "./pages/barber/MyWorkplace";

import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import CustomerBookings from "./pages/customer/Booking";
import MyBookings from "./pages/customer/MyBookings";
import BookingDetail from "./pages/customer/BookingDetail";

import NotificationRouter from "./pages/notifications/NotificationRouter";
import OwnerCategories from "./pages/owner/Categories";
import OwnerBarberShifts from "./pages/owner/Shift";
import OwnerBarbershop from "./pages/owner/Barbershops";
import ShiftManagement from "./pages/owner/ShiftManagement";

import { ShiftProvider } from "@/components/context/ShiftContext";
import { ToastProvider } from "@/components/ui/Toast";
import BarberReport from "./pages/owner/ReportBarber";
import UsersActivity from "./pages/admin/UserActivity";
import SubscribePage from "./pages/admin/Subscribe";
import AdminActivity from "./pages/admin/AdminActivity";
import BarberActivityPage from "./pages/barber/MyHistory";
import BarberSchedule from "./pages/barber/MyActivity";
import BarberSchedulePage from "./pages/barber/MySchedule";
import OwnerBarberScheduleMonitor from "./pages/owner/Schedule";
import PaymentPage from "./pages/customer/Payment";

import { AuthProvider } from "@/components/context/AuthContext";
import ReportRefund from "./pages/admin/Transaction";
import OwnerReportRefund from "./pages/owner/Transaction";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ===== LANDING PAGE (PUBLIC) ===== */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* ===== AUTH ROUTES (PUBLIC) ===== */}
        <Route path="/roleselect" element={<RoleSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<PricingSection />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/billing" element={<ProtectedRoute allow={["owner"]}><Billing /></ProtectedRoute>} />
        <Route path="/subscription/pay" element={<ProtectedRoute allow={["owner"]}><SubscriptionPayment /></ProtectedRoute>} />

        <Route path="/notifications" element={<NotificationRouter />} />

        {/* ===== ADMIN ===== */}
        <Route path="/admin" element={<ProtectedRoute allow={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/barbershops" element={<ProtectedRoute allow={["admin"]}><AdminBarbershops /></ProtectedRoute>} />
        <Route path="/admin/transaction" element={<ProtectedRoute allow={["admin"]}><ReportRefund /></ProtectedRoute>} />
        <Route path="/admin/subscribe" element={<ProtectedRoute allow={["admin"]}><SubscribePage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allow={["admin"]}><Users /></ProtectedRoute>} />
        <Route path="/admin/login-logs" element={<ProtectedRoute allow={["admin"]}><LoginLogs /></ProtectedRoute>} />
        <Route path="/admin/users-activity" element={<ProtectedRoute allow={["admin"]}><UsersActivity /></ProtectedRoute>} />
        <Route path="/admin/admin-activity" element={<ProtectedRoute allow={["admin"]}><AdminActivity /></ProtectedRoute>} />
        <Route path="/admin/reports/users" element={<ProtectedRoute allow={["admin"]}><ReportUsers /></ProtectedRoute>} />
        <Route path="/admin/reports/revenue" element={<ProtectedRoute allow={["admin"]}><ReportRevenue /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allow={["admin"]}><NotificationRouter /></ProtectedRoute>} />

        {/* ===== OWNER ===== */}
        <Route path="/owner" element={<ProtectedRoute allow={["owner"]}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/barbershop" element={<ProtectedRoute allow={["owner"]}><OwnerBarbershop /></ProtectedRoute>} />
        <Route path="/owner/transaction" element={<ProtectedRoute allow={["owner"]}><OwnerReportRefund /></ProtectedRoute>} />
        <Route path="/owner/booking" element={<ProtectedRoute allow={["owner"]}><OwnerBooking /></ProtectedRoute>} />
        <Route path="/owner/services" element={<ProtectedRoute allow={["owner"]}><OwnerServices /></ProtectedRoute>} />
        <Route path="/owner/categories" element={<ProtectedRoute allow={["owner"]}><OwnerCategories /></ProtectedRoute>} />
        <Route path="/owner/barbers" element={<ProtectedRoute allow={["owner"]}><OwnerBarbers /></ProtectedRoute>} />
        <Route path="/owner/shift" element={<ProtectedRoute allow={["owner"]}><OwnerBarberShifts /></ProtectedRoute>} />
        <Route path="/owner/shift-management" element={<ProtectedRoute allow={["owner"]}><ShiftManagement /></ProtectedRoute>} />
        <Route path="/owner/schedule" element={<ProtectedRoute allow={["owner"]}><OwnerBarberScheduleMonitor /></ProtectedRoute>} />
        <Route path="/owner/customers" element={<ProtectedRoute allow={["owner"]}><OwnerCustomers /></ProtectedRoute>} />
        <Route path="/owner/payment" element={<ProtectedRoute allow={["owner"]}><OwnerPayment /></ProtectedRoute>} />
        <Route path="/owner/promos" element={<ProtectedRoute allow={["owner"]}><OwnerPromos /></ProtectedRoute>} />
        <Route path="/owner/reports" element={<ProtectedRoute allow={["owner"]}><ReportSalary /></ProtectedRoute>} />
        <Route path="/owner/barber-report" element={<ProtectedRoute allow={["owner"]}><BarberReport /></ProtectedRoute>} />

        {/* ===== BARBER ===== */}
        <Route path="/barber" element={<ProtectedRoute allow={["barber"]}><BarberDashboard /></ProtectedRoute>} />
        <Route path="/barber/barbershops" element={<ProtectedRoute allow={["barber"]}><BarberBarbershops /></ProtectedRoute>} />
        <Route path="/barber/activity" element={<ProtectedRoute allow={["barber"]}><BarberSchedule /></ProtectedRoute>} />
        <Route path="/barber/my-history" element={<ProtectedRoute allow={["barber"]}><BarberActivityPage /></ProtectedRoute>} />
        <Route path="/barber/my-schedule" element={<ProtectedRoute allow={["barber"]}><BarberSchedulePage /></ProtectedRoute>} />

        {/* ===== CUSTOMER ===== */}
        <Route path="/customer" element={<ProtectedRoute allow={["customer"]}><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/booking/:id" element={<ProtectedRoute allow={["customer"]}><BookingDetail /></ProtectedRoute>} />
        <Route path="/customer/booking" element={<ProtectedRoute allow={["customer"]}><CustomerBookings /></ProtectedRoute>} />
        <Route path="/customer/my-bookings" element={<ProtectedRoute allow={["customer"]}><MyBookings /></ProtectedRoute>} />
        <Route path="/customer/payment" element={<ProtectedRoute allow={["customer"]}><PaymentPage /></ProtectedRoute>} />

        {/* ===== 404 ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ShiftProvider>
            <AnimatedRoutes />
          </ShiftProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}