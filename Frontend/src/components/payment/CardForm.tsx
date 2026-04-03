/* ================================================================
   src/components/payment/CardForm.tsx
   Form kartu kredit/debit yang berdiri sendiri.
   Mengelola state-nya sendiri dan memanggil onChange
   setiap kali nilai atau validitas berubah.
================================================================ */

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

/* ── Types ── */
export interface CardValues {
  name: string;
  cardNum: string;
  expiry: string;
  cvv: string;
}

interface CardFormProps {
  /** Dipanggil setiap nilai berubah */
  onChange: (values: CardValues, isValid: boolean) => void;
  /** True setelah user menekan tombol "Proceed" agar error baru muncul */
  submitted: boolean;
}

/* ── Helpers ── */
function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function FieldWarning({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

function inputCls(hasError: boolean, extra = "") {
  return `w-full p-3 rounded-lg bg-zinc-800 border-2 text-white placeholder-zinc-500 focus:outline-none transition-colors ${
    hasError ? "border-red-500" : "border-zinc-700 focus:border-amber-500"
  } ${extra}`;
}

/* ── Validation ── */
function validate(values: CardValues): Record<string, string> {
  const e: Record<string, string> = {};
  const { name, cardNum, expiry, cvv } = values;

  if (!name.trim())                              e.name    = "Cardholder name is required";
  else if (name.trim().length < 3)               e.name    = "Name is too short";
  else if (!/^[a-zA-Z\s]+$/.test(name.trim()))  e.name    = "Letters and spaces only";

  const digits = cardNum.replace(/\s/g, "");
  if (!digits)                                   e.cardNum = "Card number is required";
  else if (digits.length !== 16)                 e.cardNum = "Must be 16 digits";

  if (!expiry)                                   e.expiry  = "Expiry date is required";
  else if (expiry.length < 5)                    e.expiry  = "Format must be MM/YY";
  else {
    const [mm, yy] = expiry.split("/").map(Number);
    if (mm < 1 || mm > 12)                       e.expiry  = "Invalid month (01–12)";
    else {
      const now     = new Date();
      const expDate = new Date(2000 + yy, mm - 1, 1);
      if (expDate < new Date(now.getFullYear(), now.getMonth(), 1))
        e.expiry = "Card has expired";
    }
  }

  if (!cvv)                                      e.cvv = "CVV is required";
  else if (cvv.length !== 3)                     e.cvv = "Must be 3 digits";

  return e;
}

/* ── Component ── */
export default function CardForm({ onChange, submitted }: CardFormProps) {
  const [name,    setName]    = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry,  setExpiry]  = useState("");
  const [cvv,     setCvv]     = useState("");

  const errors  = useMemo(() => validate({ name, cardNum, expiry, cvv }), [name, cardNum, expiry, cvv]);
  const isValid = Object.keys(errors).length === 0;

  /* Notify parent setiap nilai berubah */
  const notify = (next: CardValues) => {
    const e = validate(next);
    onChange(next, Object.keys(e).length === 0);
  };

  const handleName = (v: string) => {
    setName(v);
    notify({ name: v, cardNum, expiry, cvv });
  };
  const handleCardNum = (v: string) => {
    const formatted = formatCardNumber(v);
    setCardNum(formatted);
    notify({ name, cardNum: formatted, expiry, cvv });
  };
  const handleExpiry = (v: string) => {
    const formatted = formatExpiry(v);
    setExpiry(formatted);
    notify({ name, cardNum, expiry: formatted, cvv });
  };
  const handleCvv = (v: string) => {
    const cleaned = v.replace(/\D/g, "").slice(0, 3);
    setCvv(cleaned);
    notify({ name, cardNum, expiry, cvv: cleaned });
  };

  return (
    <>
      {submitted && !isValid && (
        <div className="flex items-start gap-3 p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">
            Please fix the highlighted fields before continuing.
          </p>
        </div>
      )}

      <div className="space-y-3 mb-5">
        {/* Cardholder Name */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Cardholder Name</label>
          <input
            value={name}
            onChange={(e) => handleName(e.target.value)}
            placeholder="John Doe"
            className={inputCls(submitted && !!errors.name)}
          />
          {submitted && errors.name && <FieldWarning message={errors.name} />}
        </div>

        {/* Card Number */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Card Number</label>
          <input
            value={cardNum}
            onChange={(e) => handleCardNum(e.target.value)}
            placeholder="0000 0000 0000 0000"
            className={inputCls(submitted && !!errors.cardNum, "font-mono")}
          />
          {submitted && errors.cardNum && <FieldWarning message={errors.cardNum} />}
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Expiry</label>
            <input
              value={expiry}
              onChange={(e) => handleExpiry(e.target.value)}
              placeholder="MM/YY"
              className={inputCls(submitted && !!errors.expiry, "font-mono")}
            />
            {submitted && errors.expiry && <FieldWarning message={errors.expiry} />}
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">CVV</label>
            <input
              value={cvv}
              onChange={(e) => handleCvv(e.target.value)}
              placeholder="•••"
              type="password"
              className={inputCls(submitted && !!errors.cvv, "font-mono")}
            />
            {submitted && errors.cvv && <FieldWarning message={errors.cvv} />}
          </div>
        </div>
      </div>
    </>
  );
}