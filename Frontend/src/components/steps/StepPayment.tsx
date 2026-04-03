import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { SERVICES, BARBERS, SHOP, PAYMENT_METHODS } from "@/components/entities/constants/BookConstants";
import { calcTax, calcTotal, formatCardNumber, formatExpiry } from "@/lib/utils/BookingUtils";
import { StepHeading, SummaryRow, FormField } from "@/components/ui/BookingUi";
import type { BookingState } from "@/type/BookingType";

interface Props {
  booking: BookingState;
  onConfirm: () => void;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/* ── Reusable field warning (sama persis seperti OwnerBarbershop) ────────── */
function FieldWarning({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

/* ── Input class helper (border merah saat submitted + ada error) ────────── */
function inputCls(hasError: boolean, extra = "") {
  return `w-full p-3 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${
    hasError
      ? "border-red-500"
      : "border-zinc-700 focus:border-amber-500"
  } ${extra}`;
}

export function StepPayment({ booking, onConfirm }: Props) {
  const [method, setMethod] = useState("card");

  const [cardNum, setCardNum] = useState("");
  const [expiry,  setExpiry]  = useState("");
  const [cvv,     setCvv]     = useState("");
  const [name,    setName]    = useState("");

  // Hanya menjadi true saat tombol Confirm diklik — sama seperti `submitted` di OwnerBarbershop
  const [submitted, setSubmitted] = useState(false);

  const service  = SERVICES.find((s) => s.id === booking.service);
  const barber   = booking.barber === "any" ? null : BARBERS.find((b) => b.id === booking.barber);
  const subtotal = service ? service.price : 0;
  const tax      = calcTax(subtotal);
  const total    = calcTotal(subtotal);

  /* ── Computed errors (sama seperti `errors` useMemo di OwnerBarbershop) ── */
  const errors = useMemo(() => {
    if (method !== "card") return {};

    const e: Record<string, string> = {};

    if (!name.trim())                          e.name    = "Cardholder name is required";
    else if (name.trim().length < 3)           e.name    = "Name is too short";
    else if (!/^[a-zA-Z\s]+$/.test(name.trim())) e.name = "Name must contain letters and spaces only";

    const digits = cardNum.replace(/\s/g, "");
    if (!digits)                               e.cardNum = "Card number is required";
    else if (digits.length !== 16)             e.cardNum = "Card number must be 16 digits";

    if (!expiry)                               e.expiry  = "Expiry date is required";
    else if (expiry.length < 5)                e.expiry  = "Format must be MM/YY";
    else {
      const [mm, yy] = expiry.split("/").map(Number);
      if (mm < 1 || mm > 12)                   e.expiry  = "Invalid month (01–12)";
      else {
        const now = new Date();
        const expDate = new Date(2000 + yy, mm - 1, 1);
        if (expDate < new Date(now.getFullYear(), now.getMonth(), 1))
          e.expiry = "Card has expired";
      }
    }

    if (!cvv)                                  e.cvv = "CVV is required";
    else if (cvv.length !== 3)                 e.cvv = "CVV must be 3 digits";

    return e;
  }, [method, name, cardNum, expiry, cvv]);

  const isValid = Object.keys(errors).length === 0;

  /* ── Confirm handler — set submitted dulu, baru lanjut jika valid ──────── */
  const handleConfirm = () => {
    setSubmitted(true);
    if (!isValid) return;
    onConfirm();
  };

  return (
    <div>
      <StepHeading title="Payment" subtitle="Review your booking and complete payment" />

      {/* ── Banner error (muncul setelah klik Confirm, sama seperti OwnerBarbershop) */}
      {submitted && !isValid && (
        <div className="flex items-start gap-3 p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">Please fix the highlighted fields before continuing.</p>
        </div>
      )}

      {/* ── Order Summary ──────────────────────────────────────────────── */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-4">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          Order Summary
        </p>
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800 mb-3">
          <img src={SHOP.image} alt={SHOP.name} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <p className="font-bold text-white text-sm">{SHOP.name}</p>
            <p className="text-zinc-400 text-xs">{booking.date} · {booking.time}</p>
            <p className="text-zinc-400 text-xs">
              {barber ? `Barber: ${barber.name}` : "Any available barber"}
            </p>
          </div>
        </div>
        {service && (
          <div className="flex justify-between text-sm py-1">
            <span className="text-zinc-300">{service.icon} {service.name}</span>
            <span className="text-white font-semibold">{formatIDR(service.price)}</span>
          </div>
        )}
        <div className="border-t border-zinc-800 mt-3 pt-3 space-y-1">
          <SummaryRow label="Subtotal"  value={formatIDR(subtotal)} />
          <SummaryRow label="Tax (10%)" value={formatIDR(tax)} />
          <SummaryRow label="Total"     value={formatIDR(total)} bold />
        </div>
      </div>

      {/* ── Payment Method ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`p-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${
              method === m.id
                ? "border-amber-500 bg-amber-500/10 text-amber-400"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Card Form ──────────────────────────────────────────────────── */}
      {method === "card" ? (
        <div className="space-y-3 mb-4">
          <FormField label="Cardholder Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={inputCls(submitted && !!errors.name)}
            />
            {submitted && errors.name && <FieldWarning message={errors.name} />}
          </FormField>

          <FormField label="Card Number">
            <input
              value={cardNum}
              onChange={(e) => setCardNum(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className={inputCls(submitted && !!errors.cardNum, "font-mono")}
            />
            {submitted && errors.cardNum && <FieldWarning message={errors.cardNum} />}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Expiry">
              <input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className={inputCls(submitted && !!errors.expiry, "font-mono")}
              />
              {submitted && errors.expiry && <FieldWarning message={errors.expiry} />}
            </FormField>

            <FormField label="CVV">
              <input
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="•••"
                type="password"
                className={inputCls(submitted && !!errors.cvv, "font-mono")}
              />
              {submitted && errors.cvv && <FieldWarning message={errors.cvv} />}
            </FormField>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 text-center">
          <p className="text-zinc-400 text-sm">
            You'll be redirected to{" "}
            <span className="text-white font-semibold">
              {PAYMENT_METHODS.find((m) => m.id === method)?.label}
            </span>{" "}
            to complete payment.
          </p>
        </div>
      )}

      {/* ── Confirm Button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-[0_4px_24px_rgba(251,191,36,0.35)] hover:shadow-[0_4px_32px_rgba(251,191,36,0.5)] cursor-pointer"
      >
        Confirm &amp; Pay {formatIDR(total)}
      </button>
    </div>
  );
}