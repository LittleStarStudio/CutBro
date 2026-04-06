/* ================= EXISTING CONSTANTS ================= */

// Barbershop Plan Filters
export const PLAN_FILTER_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "Free", label: "Free" },
  { value: "Pro", label: "Pro" },
  { value: "Premium", label: "Premium" },
];

// Status Filters
export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Badge Styles for Plans
export const PLAN_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold" | "purple"> = {
  Free:    "primary",
  Pro:     "warning",
  Premium: "purple",
};

// Badge Styles for Status
export const STATUS_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold"> = {
  active: "success",
  inactive: "default",
  banned: "danger",
  pending: "warning",
  success: "success",
  failed: "danger",
};

// Status Dot Colors
export const STATUS_DOT_COLORS: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  banned: "bg-red-500",
  pending: "bg-yellow-500",
  success: "bg-green-500",
  failed: "bg-red-500",
};

/* ================= NEW CONSTANTS ================= */

// User Role Filters
export const USER_ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "customer", label: "Customer" },
  { value: "barber", label: "Barber" },
  { value: "owner", label: "Owner" },
];

// User Status Filters
export const USER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "banned", label: "Banned" },
];

// Badge Styles for User Roles
export const USER_ROLE_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold" | "purple"> = {
  customer: "primary",
  barber: "gold",
  owner: "purple",
};

// Badge Styles for User Status
export const USER_STATUS_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold"> = {
  active: "success",
  inactive: "default",
  banned: "danger",
};

// Activity Type Filters
export const ACTIVITY_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Activities" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "register", label: "Register" },
  { value: "create_booking", label: "Create Booking" },
  { value: "update_profile", label: "Update Profile" },
  { value: "delete_account", label: "Delete Account" },
];

// Badge Styles for Activity Types
export const ACTIVITY_TYPE_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold"> = {
  login: "success",
  logout: "default",
  register: "primary",
  create_booking: "success",
  update_profile: "warning",
  delete_account: "danger",
};

// Activity Type Icons (for Badge component)
import { LogIn, LogOut, UserPlus, Calendar, Edit, Trash2, type LucideIcon } from "lucide-react";

export const ACTIVITY_TYPE_ICONS: Record<string, LucideIcon> = {
  login: LogIn,
  logout: LogOut,
  register: UserPlus,
  create_booking: Calendar,
  update_profile: Edit,
  delete_account: Trash2,
};

// Login Log Action Filters
export const LOG_ACTION_FILTER_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "register", label: "Register" },
];

// Badge Styles for Log Actions
export const LOG_ACTION_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold"> = {
  login: "success",
  logout: "primary",
  register: "gold",
};

// Log Status Filters
export const LOG_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

// Badge Styles for Log Status
export const LOG_STATUS_STYLES: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "gold"> = {
  success: "success",
  failed: "danger",
};