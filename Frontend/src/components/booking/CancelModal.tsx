/* ================================================================
   src/components/bookings/CancelModal.tsx
================================================================ */

import { X, AlertTriangle, Calendar, MapPin } from "lucide-react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import type { Booking } from "@/type/BookingType";

/* ── Animation variants ── */
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:   { opacity: 0, scale: 0.94, y: 8,  transition: { duration: 0.18 } },
};

/* ── Props ── */
export interface CancelModalProps {
  booking: Booking;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CancelModal({ booking, onConfirm, onClose }: CancelModalProps) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        variants={overlayVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        variants={modalVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
      >
        <div
          className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-end mb-1">
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition p-1 rounded-lg hover:bg-zinc-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={26} className="text-red-400" />
            </div>
          </div>

          <h2 className="text-white font-bold text-center mb-1">Cancel Reservation?</h2>
          <p className="text-zinc-400 text-sm text-center mb-5">
            Are you sure you want to cancel your reservation at{" "}
            <span className="text-white font-semibold">{booking.shopName}</span>?
          </p>

          {/* Booking summary */}
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mb-6 space-y-2 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-zinc-500 shrink-0" />
              <span>{booking.date} · {booking.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-zinc-500 shrink-0" />
              <span>{booking.location}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-700/50 mt-1">
              <span className="text-zinc-400">{booking.service}</span>
              <span className="text-amber-500 font-bold">{booking.price}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-white hover:bg-zinc-700 transition"
            >
              Keep Booking
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-sm text-white font-semibold transition"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}