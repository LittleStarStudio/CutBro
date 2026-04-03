/* ================================================================
   src/pages/customer/Payment.tsx
================================================================ */

import { useState, useRef, useEffect }  from "react";
import { useLocation, useNavigate }      from "react-router-dom";
import {
  ChevronLeft, AlertCircle, CreditCard,
  Upload, X, ImageIcon, CheckCircle2, Clock,
  Calendar, MapPin, Clock as ClockIcon, AlertTriangle, Phone,
} from "lucide-react";

import CardForm        from "@/components/payment/CardForm";
import { GoldButton }  from "@/components/ui/BookingUi";
import { SHOP }        from "@/components/entities/constants/BookConstants";

import { useToast }        from "@/components/ui/Toast";
import type { Booking }    from "@/type/BookingType";
import { Navigate }        from "react-router-dom";

/* ── Helpers ── */
function parsePrice(price: string): number {
  const n = Number(price.replace(/[^0-9]/g, ""));
  if (import.meta.env.DEV && !n) {
    console.warn("[parsePrice] gagal parse harga:", price);
  }
  return n;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style:                 "currency",
    currency:              "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/* ── Payment methods — discriminated union ── */
type CardMethod = {
  id: "card";
  icon: string;
  label: string;
  color: string;
};

type EWalletMethod = {
  id: "gopay" | "ovo" | "dana";
  icon: string;
  label: string;
  accountNumber: string;
  accountName: string;
  color: string;
  qrPlaceholder: string;
};

type PaymentMethod = CardMethod | EWalletMethod;

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id:    "card",
    icon:  "💳",
    label: "Credit / Debit",
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/40",
  },
  {
    id:            "gopay",
    icon:          "🟢",
    label:         "GoPay",
    accountNumber: "0812-3456-7890",
    accountName:   "Royal Cuts Official",
    color:         "from-green-500/20 to-green-600/10 border-green-500/40",
    qrPlaceholder: "GoPay QR",
  },
  {
    id:            "ovo",
    icon:          "🟣",
    label:         "OVO",
    accountNumber: "0812-3456-7890",
    accountName:   "Royal Cuts Official",
    color:         "from-purple-500/20 to-purple-600/10 border-purple-500/40",
    qrPlaceholder: "OVO QR",
  },
  {
    id:            "dana",
    icon:          "🔵",
    label:         "DANA",
    accountNumber: "0812-3456-7890",
    accountName:   "Royal Cuts Official",
    color:         "from-blue-500/20 to-blue-600/10 border-blue-500/40",
    qrPlaceholder: "DANA QR",
  },
];

/* ── Pending / Done screen ── */
function PendingScreen({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  return (
    <div className="text-center py-6">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
          <Clock size={32} className="text-amber-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h2>
      <p className="text-zinc-400 mb-6 text-sm">
        Your payment is being verified. We'll notify you once it's confirmed.
      </p>

      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 text-left mb-4 max-w-sm mx-auto space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Shop</span>
          <span className="text-white font-semibold">{booking.shopName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Service</span>
          <span className="text-white">{booking.service}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Date</span>
          <span className="text-white">{booking.date} · {booking.time}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-zinc-800">
          <span className="text-zinc-400">Amount</span>
          <span className="text-amber-400 font-bold">{booking.price}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/40 bg-amber-500/10">
          <Clock size={14} className="text-amber-400" />
          <span className="text-amber-300 text-sm font-semibold">Pending Verification</span>
        </div>
      </div>

      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4 text-left mb-6 max-w-sm mx-auto">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">What's Next?</p>
        <div className="space-y-3">
          {[
            { icon: <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" />, text: "Screenshot uploaded successfully" },
            { icon: <Clock        size={14} className="text-amber-400 shrink-0 mt-0.5" />, text: "Admin will verify your payment (1×24 hours)" },
            { icon: <Clock        size={14} className="text-zinc-500 shrink-0 mt-0.5"  />, text: "Booking confirmed after verification" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <GoldButton onClick={onDone}>Back to My Bookings</GoldButton>
    </div>
  );
}

/* ================================================================
   Main component
================================================================ */
export default function PaymentPage() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const toast        = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const booking: Booking | undefined = location.state?.booking;

  const [step,          setStep]          = useState<"payment" | "upload" | "done">("payment");
  const [method,        setMethod]        = useState<PaymentMethod["id"]>("gopay");
  const [screenshot,    setScreenshot]    = useState<File | null>(null);
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);
  const [submitted,     setSubmitted]     = useState(false);
  const [cardValid,     setCardValid]     = useState(false);
  const [cardSubmitted, setCardSubmitted] = useState(false);

  /* Revoke blob URL on unmount */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* Redirect jika tidak ada data booking */
  if (!booking) {
    return <Navigate to="/customer/my-bookings" replace />;
  }

  /* ── Navigasi kembali ke MyBookings dengan payload update status ── */
  const handleDone = () => {
    navigate("/customer/my-bookings", {
      state: {
        updatedBooking: {
          ...booking,
          paymentStatus: "WAITING_VERIFICATION" as const,
        },
      },
    });
  };

  const subtotal       = parsePrice(booking.price);
  const tax            = Math.round(subtotal * 0.1);
  const total          = subtotal + tax;
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method)!;
  const isEWallet      = selectedMethod.id !== "card";

  /* Step label for header */
  const stepLabel = step === "payment" ? "Complete Payment" : "Upload Proof";
  const stepSub   = step === "payment" ? "Step 1 of 2 · Choose payment method"
                                       : "Step 2 of 2 · Upload screenshot";

  /* File handlers */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File", "Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File Too Large", "Maximum file size is 5MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshot(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProceedToUpload = () => {
    if (method === "card") {
      setCardSubmitted(true);
      if (!cardValid) return;
    }
    setStep("upload");
  };

  const handleSubmitProof = () => {
    setSubmitted(true);
    if (!screenshot) return;
    setStep("done");
    toast.success("Payment Submitted", "Your payment proof has been sent for verification.");
  };

  /* ── Done screen ── */
  if (step === "done") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[80px] pointer-events-none" />
        <div className="w-full max-w-lg relative z-10">
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-zinc-800 p-6">
            <PendingScreen
              booking={booking}
              onDone={handleDone}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center px-4 py-8">

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              if (step === "upload") { setStep("payment"); return; }
              navigate("/customer/my-bookings");
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <img src={SHOP.image} alt={SHOP.name} className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <p className="text-white font-bold text-sm leading-none">{SHOP.name}</p>
              <p className="text-zinc-500 text-xs">{SHOP.location}</p>
            </div>
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-2 mb-4">
          {(["payment", "upload"] as const).map((s, i) => {
            const isActive = step === s;
            const isDone   = i === 0 && step === "upload";
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isDone   ? "bg-green-500/20 text-green-400 border border-green-500/40"
                : isActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                           : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                }`}>
                  {isDone ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
                  {s === "payment" ? "Pay" : "Upload Proof"}
                </div>
                {i === 0 && (
                  <div className={`h-px w-6 transition-all ${step === "upload" ? "bg-amber-500/50" : "bg-zinc-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Cancellation Warning ── */}
        <div className="mt-0 mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300/90 text-xs leading-relaxed">
            <span className="font-semibold text-amber-400">Attention:</span>{" "}
            Reservations can only be cancelled up to{" "}
            <span className="font-semibold text-amber-400">1 day before</span> the scheduled time.
            {booking.phone ? (
              <>
                {" "}If you have trouble cancelling, contact us at{" "}
                <span className="font-semibold text-amber-400">{booking.phone}</span>.
              </>
            ) : null}
          </p>
        </div>

        {/* ── Main card ── */}
        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-zinc-800 p-6 min-h-[480px] flex flex-col">

          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">{stepLabel}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{stepSub}</p>
          </div>

          <div className="flex-1">

            {/* ═══════════════════════
                STEP 1 — PAYMENT
            ═══════════════════════ */}
            {step === "payment" && (
              <div className="space-y-5">

                {/* Order summary */}
                <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700/60 p-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Order Summary</p>
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-700/60 mb-3">
                    <img src={booking.image} alt={booking.shopName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div>
                      <p className="font-bold text-white text-sm">{booking.shopName}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1"><Calendar  size={10} /> {booking.date}</span>
                        <span className="flex items-center gap-1"><ClockIcon size={10} /> {booking.time}</span>
                        <span className="flex items-center gap-1"><MapPin    size={10} /> {booking.location}</span>
                        <span className="flex items-center gap-1"><Phone     size={10} /> {booking.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-300">
                      <span>{booking.service}</span>
                      <span className="font-semibold text-white">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Tax (10%)</span>
                      <span>{formatIDR(tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-zinc-700/60 mt-1">
                      <span className="text-white">Total</span>
                      <span className="text-amber-400">{formatIDR(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment method selector */}
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Payment Method
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={`p-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${
                          method === m.id
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        <span>{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* E-wallet info */}
                {isEWallet && (() => {
                  const ew = selectedMethod as EWalletMethod;
                  return (
                    <div className={`rounded-2xl border bg-gradient-to-br ${ew.color} p-4`}>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                        Transfer to {ew.label}
                      </p>
                      <div className="flex justify-center mb-4">
                        <div className="w-32 h-32 rounded-xl bg-white flex items-center justify-center">
                          <div className="text-center">
                            <div className="grid grid-cols-5 gap-0.5 mx-auto w-20 h-20">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`rounded-sm ${
                                    [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,6,12,18,7,17].includes(i)
                                      ? "bg-zinc-900" : "bg-white"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-zinc-500 text-[9px] mt-1">{ew.label}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-xl p-3 text-center mb-2">
                        <p className="text-xs text-zinc-400 mb-1">Account Number</p>
                        <p className="text-white font-mono font-bold text-lg tracking-widest">{ew.accountNumber}</p>
                        <p className="text-zinc-400 text-xs mt-1">a.n. {ew.accountName}</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-center">
                        <p className="text-amber-300 text-xs">
                          Transfer exactly{" "}
                          <span className="font-bold text-amber-400">{formatIDR(total)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Card form */}
                {method === "card" && (
                  <CardForm
                    submitted={cardSubmitted}
                    onChange={(_values, isValid) => setCardValid(isValid)}
                  />
                )}
              </div>
            )}

            {/* ═══════════════════════
                STEP 2 — UPLOAD
            ═══════════════════════ */}
            {step === "upload" && (
              <div className="space-y-4">

                <div className="flex items-start gap-2.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
                  <ImageIcon size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-blue-300/90 text-xs leading-relaxed">
                    <span className="font-semibold text-blue-400">Upload Payment Proof:</span>{" "}
                    Please upload a screenshot of your payment confirmation.
                    Accepted formats: JPG, PNG, WEBP (max 5MB).
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!previewUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-2xl p-8 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-amber-500/10 border border-zinc-700 group-hover:border-amber-500/40 flex items-center justify-center transition-all">
                        <Upload size={24} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-zinc-300 font-semibold text-sm">Click to upload screenshot</p>
                        <p className="text-zinc-500 text-xs mt-1">JPG, PNG, WEBP — max 5MB</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700">
                    <img src={previewUrl} alt="Payment proof" className="w-full object-cover max-h-72" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span className="text-white text-xs font-medium truncate max-w-[180px]">
                          {screenshot?.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="w-8 h-8 rounded-xl bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {submitted && !screenshot && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">
                      Please upload your payment screenshot before submitting.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer nav ── */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Step {step === "payment" ? 1 : 2} of 2
            </p>
            <GoldButton
              onClick={step === "payment" ? handleProceedToUpload : handleSubmitProof}
            >
              {step === "payment" ? (
                <><Upload size={14} className="inline mr-1.5" />I've Paid →</>
              ) : (
                <><CreditCard size={14} className="inline mr-1.5" />Submit Proof →</>
              )}
            </GoldButton>
          </div>

        </div>
      </div>
    </div>
  );
}