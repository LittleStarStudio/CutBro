import {
  LayoutDashboard,
  Users,
  BarChart3,
  Store,
  Calendar,
  Scissors,
  DollarSign,
  User,
  Percent,
  User2Icon,
  Clock10Icon,
  ClipboardCheck,
  SlidersHorizontal,
  HandHelping,
  ArrowLeftRight,
  CalendarSync,
  CalendarClock,
  History,
  ReceiptIcon,
} from "lucide-react";

import type { MenuItem } from "@/components/layout/SideBar";

/* ================= SUPER ADMIN ================= */

export const superAdminMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },

  { icon: Store, label: "Barbershops", href: "/admin/barbershops" },

  { icon: Users, label: "Users", href: "/admin/users" },

  { icon: ReceiptIcon, label: "Transaction", href: "/admin/transaction" },

  { icon: CalendarSync, label: "Subscribe", href: "/admin/subscribe" },

  {
    icon: Users,
    label: "Activity",
    children: [
      {
        icon: ArrowLeftRight, 
        label: "Login Logs", 
        href: "/admin/login-logs",
      },
      {
        icon: Users, 
        label: "Users Activity", 
        href: "/admin/users-activity",
      },
    ],
  },

  {
    icon: BarChart3,
    label: "Reports",
    children: [
      {
        icon: Users,
        label: "User",
        href: "/admin/reports/users",
      },
      {
        icon: DollarSign,
        label: "Salary",
        href: "/admin/reports/salary"
      },
    ],
  },
];

/* ================= OWNER ================= */

export const ownerMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/owner" },
  {
    icon: Store,
    label: "Barbershops",
    children: [
      {
        icon: SlidersHorizontal,
        label: "Management",
        href: "/owner/barbershop",
      },
      {
        icon: DollarSign,
        label: "Payment Method",
        href: "/owner/payment",
      },
    ],
  },
  { icon: ReceiptIcon, label: "Transaction", href: "/owner/transaction" },
  {
    icon: Scissors,
    label: "Barbers",
    children: [
      {
        icon: Clock10Icon,
        label: "Shift",
        href: "/owner/shift-Management",
      },
      {
        icon: SlidersHorizontal,
        label: "Management",
        href: "/owner/barbers",
      },
      {
        icon: ClipboardCheck,
        label: "Assignment",
        href: "/owner/shift",
      },
      {
        icon: CalendarClock,
        label: "Schedule",
        href: "/owner/schedule",
      },
    ],
  },
  { icon: Calendar, label: "Booking", href: "/owner/booking" },
  { icon: User, label: "Customers", href: "/owner/customers" },
  {
    icon: HandHelping,
    label: "Services",
    children: [
      {
        icon: Percent,
        label: "Promos",
        href: "/owner/promos",
      },
      {
        icon: SlidersHorizontal,
        label: "Management",
        href: "/owner/services",
      },
      {
        icon: Calendar,
        label: "Categories",
        href: "/owner/categories",
      },
    ],
  },
  {
    icon: BarChart3,
    label: "Reports",
    children: [
      {
        icon: DollarSign,
        label: "Salary",
        href: "/owner/reports",
      },
      {
        icon: Calendar,
        label: "Barber",
        href: "/owner/barber-report",
      },
    ],
  },
];

/* ================= BARBER ================= */

export const barberMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/barber" },
  { icon: Store,           label: "My Workplace",  href: "/barber/barbershops" },
  { icon: Calendar, label: "My Activity", href: "/barber/activity" },
  { icon: History, label: "My History", href: "/barber/my-history" },
  { icon: CalendarClock, label: "My Schedule", href: "/barber/my-schedule" },
];

export const customerMenu: MenuItem[] = [
  { icon: Calendar,  label: "Bookings",    href: "/customer/booking" },
  { icon: Calendar,  label: "My Bookings", href: "/customer/my-bookings" },
  { icon: User2Icon, label: "Profile",     href: "/customer/profile" },
];

/* ================= LOGOS ================= */

export const superAdminLogo = {
  icon: Scissors,
  text: "Admin",
};

export const ownerLogo = {
  icon: Scissors,
  text: "Owner",
};

export const barberLogo = {
  icon: Scissors,
  text: "Barber",
};

export const customerLogo = {
  icon: Scissors,
  text: "Customer",
};