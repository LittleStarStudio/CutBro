/* ================================================================
   src/type/BookingType.ts
================================================================ */

import type { ReactNode } from "react";
import type React from "react";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Shop {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  icon: string;
  popular: boolean;
  discount?: number;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: string;
  avatar: string;
  available: boolean;
}

// ─── Booking State ─────────────────────────────────────────────────────────────

export type BookingState = {
  phone: ReactNode;
  service: string;
  barber: string | null;
  date: string | null;
  time: string | null;
};

// ─── Step Config ───────────────────────────────────────────────────────────────

export type StepId = 1 | 2 | 3 | 4;

export interface StepConfig {
  id: StepId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// ─── Payment Status ────────────────────────────────────────────────────────────

/**
 * PENDING_PAYMENT     — booking dibuat, belum upload bukti bayar
 * WAITING_VERIFICATION — bukti sudah diupload, owner belum approve
 * PAID                — owner sudah approve, slot terkunci
 * DONE                — haircut selesai
 * CANCELLED           — dibatalkan, tanpa refund
 * REFUND_REQUESTED    — customer minta refund, owner harus proses
 * REFUNDED            — owner sudah kirim uang kembali
 */
export type PaymentStatus =
  | "PENDING_PAYMENT"
  | "WAITING_VERIFICATION"
  | "PAID"
  | "DONE"
  | "CANCELLED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

export type BookingStatus = "upcoming" | "completed" | "cancelled";

export interface Booking {
  id: number;
  shopName: string;
  location: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  price: string;
  rating?: number;
  image: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map paymentStatus → BookingStatus untuk tampilan kartu.
 * Berguna saat data datang dari API dan perlu di-normalize.
 */
export function toBookingStatus(ps: PaymentStatus): BookingStatus {
  switch (ps) {
    case "DONE":
      return "completed";
    case "CANCELLED":
    case "REFUNDED":
      return "cancelled";
    default:
      return "upcoming";
  }
}

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  PENDING_PAYMENT:      { label: "Pending Payment",      color: "text-zinc-300 border-zinc-500/50 bg-zinc-500/15"   },
  WAITING_VERIFICATION: { label: "Waiting Verification", color: "text-amber-300 border-amber-400/50 bg-amber-500/15" },
  PAID:                 { label: "Paid",                 color: "text-green-300 border-green-400/50 bg-green-500/15" },
  DONE:                 { label: "Done",                 color: "text-blue-300 border-blue-400/50 bg-blue-500/15"    },
  CANCELLED:            { label: "Cancelled",            color: "text-red-300 border-red-400/50 bg-red-500/15"       },
  REFUND_REQUESTED:     { label: "Refund Requested",     color: "text-orange-300 border-orange-400/50 bg-orange-500/15" },
  REFUNDED:             { label: "Refunded",             color: "text-purple-300 border-purple-400/50 bg-purple-500/15" },
};