import { Clock2, CalendarDays, Timer } from "lucide-react";
import type { BookingState } from "@/type/BookingType";
import { SERVICES, BARBERS } from "@/components/entities/constants/BookConstants";

type Props = {
  booking: BookingState;
};

function formatPrice(price: number): string {
  return "Rp " + price.toLocaleString("id-ID");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StepVerification({ booking }: Props) {
  const service = SERVICES.find((s) => s.id === booking.service) ?? null;
  const barber  = BARBERS.find((b) => b.id === booking.barber)   ?? null;

  const discountedPrice =
    service?.discount
      ? Math.round(service.price * (1 - service.discount / 100))
      : null;

  const finalPrice = discountedPrice ?? service?.price ?? null;

  return (
    <div className="flex flex-col gap-5">

      {/* Title */}
      <div>
        <h2 className="text-white font-bold text-lg">Review Your Order</h2>
        <p className="text-zinc-500 text-sm mt-0.5">
          Confirm your booking details before proceeding.
        </p>
      </div>

      {/* ── Service card ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="text-zinc-500 text-xs uppercase tracking-wider px-1">Service</p>
        {service ? (
          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-xl">
              {service.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{service.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Timer size={11} className="text-zinc-500" />
                <span className="text-zinc-500 text-xs">{service.duration}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {service.discount ? (
                <>
                  <p className="text-zinc-500 text-xs line-through">{formatPrice(service.price)}</p>
                  <p className="text-amber-400 font-bold text-base">{formatPrice(discountedPrice!)}</p>
                  <p className="text-green-400 text-xs">{service.discount}% off</p>
                </>
              ) : (
                <p className="text-amber-400 font-bold text-base">{formatPrice(service.price)}</p>
              )}
            </div>
          </div>
        ) : (
          <EmptyRow label="No service selected" />
        )}
      </div>

      {/* ── Barber card ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="text-zinc-500 text-xs uppercase tracking-wider px-1">Barber</p>
        {barber ? (
          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/50 p-4 flex items-center gap-4">
  <img
    src={barber.avatar}
    alt={barber.name}
    className="w-11 h-11 rounded-xl object-cover shrink-0"
  />
  <div className="flex-1 min-w-0">
    <p className="text-white font-semibold text-sm">{barber.name}</p>
    <p className="text-zinc-500 text-xs mt-0.5">{barber.specialty}</p>
  </div>
</div>
        ) : (
          <EmptyRow label="No barber selected" />
        )}
      </div>

      {/* ── Schedule card ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="text-zinc-500 text-xs uppercase tracking-wider px-1">Schedule</p>
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/50 divide-y divide-zinc-700/40 overflow-hidden">
          {/* Date */}
          <div className="flex items-center gap-3 px-4 py-3">
            <CalendarDays size={15} className="text-amber-400 shrink-0" />
            <span className="text-zinc-400 text-sm w-10 shrink-0">Date</span>
            <span className="text-white text-sm font-medium">
              {booking.date ? formatDate(booking.date) : (
                <span className="text-zinc-600">—</span>
              )}
            </span>
          </div>
          {/* Time */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Clock2 size={15} className="text-amber-400 shrink-0" />
            <span className="text-zinc-400 text-sm w-10 shrink-0">Time</span>
            <span className="text-white text-sm font-medium">
              {booking.time ?? <span className="text-zinc-600">—</span>}
            </span>
          </div>
        </div>
      </div>

      {/* ── Total ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-zinc-400 text-sm">Total</span>
        <span className="text-white font-bold text-base">
          {finalPrice !== null ? formatPrice(finalPrice) : "—"}
        </span>
      </div>

      <div className="border-t border-zinc-800" />

      <p className="text-zinc-500 text-xs text-center">
        By confirming, you agree to our cancellation policy.
      </p>

    </div>
  );
}

// ── Helper ───────────────────────────────────────────────────────────────────
function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/50 p-4 text-zinc-600 text-sm text-center">
      {label}
    </div>
  );
}