import { Check } from "lucide-react";
import { SERVICES, BARBERS } from "@/components/entities/constants/BookConstants";
import { generateBookingRef } from "@/lib/utils/BookingUtils";
import { SummaryRow } from "@/components/ui/BookingUi";
import type { BookingState, Shop } from "@/type/BookingType";
import { useMemo } from "react";

interface Props {
  booking: BookingState;
  shop: Shop;
  onDone: () => void;
}

export function SuccessScreen({ booking, shop, onDone }: Props) {
  const service    = SERVICES.find((s) => s.id === booking.service);
  const barber     = booking.barber === "any" ? null : BARBERS.find((b) => b.id === booking.barber);
  const bookingRef = useMemo(() => generateBookingRef("RC"), []);

  return (
    <div className="text-center py-6">
      {/* Animated checkmark */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
          <Check size={32} className="text-green-400" strokeWidth={3} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
      <p className="text-zinc-400 mb-6 text-sm">
        Your appointment has been successfully booked.
      </p>

      {/* Receipt card */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 text-left mb-6 max-w-sm mx-auto">
        {/* Shop */}
        <div className="flex items-center gap-3 mb-4">
          <img src={shop.image} alt={shop.name} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <p className="font-bold text-white">{shop.name}</p>
            <p className="text-xs text-zinc-400">{shop.location}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <SummaryRow label="Date"    value={booking.date ?? "-"} />
          <SummaryRow label="Barber"  value={barber ? barber.name : "Any Available"} />
          <SummaryRow label="Time"    value={booking.time ?? "-"} />
          <SummaryRow label="Service" value={service ? `${service.icon} ${service.name}` : "-"} />
        </div>

        {/* Booking ID */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between font-bold">
          <span className="text-zinc-400">Booking ID</span>
          <span className="text-amber-400 font-mono text-sm">{bookingRef}</span>
        </div>
      </div>

      {/* Payment Info Badge */}
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-left max-w-sm mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 mt-0.5 shrink-0">
          <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" />
        </svg>
        <p className="text-blue-300/90 text-xs leading-relaxed">
          <span className="font-semibold text-blue-400">Payment Info:</span>{" "}
          Please complete your payment on the{" "}
          <span className="font-semibold text-blue-400">My Booking</span> page.
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all"
      >
        Back to Home
      </button>
    </div>
  );
}