import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Scissors, Loader2, AlertCircle,
  CreditCard, X, CheckCircle, Ban, Star, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import NavbarLayout   from "@/components/layout/Navbar";
import BottomNav      from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

import { customerMenu } from "@/components/config/Menu";
import { useAuth }      from "@/components/context/AuthContext";
import { useToast }     from "@/components/ui/Toast";
import {
  getMyBookings,
  cancelMyBooking,
  activateBooking,  
  rateBooking,
  type CustomerBooking,
} from "@/services/customer.service";

/* ── Status badge config ── */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Awaiting Payment",  color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  paid:            { label: "Paid",     color: "text-blue-400 border-blue-400/40 bg-blue-400/10"   },
  done:            { label: "Done",          color: "text-green-400 border-green-400/40 bg-green-400/10" },
  cancelled:       { label: "Cancelled",       color: "text-red-400 border-red-400/40 bg-red-400/10"     },
  no_show:         { label: "No Show",      color: "text-neutral-400 border-neutral-400/40 bg-neutral-400/10" },
  expired:         { label: "Expired",      color: "text-neutral-400 border-neutral-400/40 bg-neutral-400/10" },
};

const formatPrice = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

const formatDate  = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

/* ── Midtrans type declared in src/type/midtrans.d.ts ── */

export default function MyBookings() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const toast            = useToast();

  
  const [tab,    setTab]    = useState<"upcoming" | "history">("upcoming");
  const [search, setSearch] = useState("");  
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CustomerBooking | null>(null);
  const [paying,     setPaying]     = useState<number | null>(null);
  const [ratingModal, setRatingModal] = useState<CustomerBooking | null>(null);
  const [starHover,   setStarHover]   = useState(0);
  const [starValue,   setStarValue]   = useState(0);
  const [reviewText,  setReviewText]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);


  /* ── Load bookings ── */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyBookings(tab);
      setBookings(data);
    } catch {
      setError("Failed to load booking data.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  /* ── Load Midtrans script ── */
  useEffect(() => {
    if (document.getElementById("midtrans-snap-script")) return;
    const s = document.createElement("script");
    s.id  = "midtrans-snap-script";
    s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    s.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? "");
    document.body.appendChild(s);
  }, []);

  /* ── Cancel ── */
  /* ── Cancel: buka modal konfirmasi dulu ── */
  const handleCancel = (b: CustomerBooking) => {
    setCancelTarget(b);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    setCancelling(target.id);
    try {
      await cancelMyBooking(target.id);
      toast.success("Booking Cancelled", "Your reservation has been cancelled.");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to cancel booking.";
      toast.error("Error", msg);
    } finally {
      setCancelling(null);
    }
  };

  /* ── Bayar ulang (jika masih pending_payment & ada snap_token) ── */
  const handleRepay = (b: CustomerBooking) => {
    const token = b.payment?.snap_token;
    if (!token) { toast.error("Token not available", "Please create a new booking."); return; }
    if (!window.snap) { toast.error("Payment system not ready", "Please refresh the page and try again."); return; }
    setPaying(b.id);
    window.snap.pay(token, {
      onSuccess: async () => {
        await activateBooking(b.id).catch(() => {});  
        setPaying(null);
        load();
      },
      onPending: () => { setPaying(null); load(); },
      onError:   () => { setPaying(null); toast.error("Payment failed", "Please try again."); },
      onClose:   () => { setPaying(null); },
    });
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || starValue === 0) return;
    setSubmitting(true);
    try {
      await rateBooking(ratingModal.id, { rating: starValue, review: reviewText || undefined });
      toast.success("Rating Submitted", "Thank you for your feedback!");
      setRatingModal(null);
      setStarValue(0);
      setReviewText("");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to submit rating.";
      toast.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Computed filtered list ── */
  const filteredBookings = bookings.filter((b) =>
    b.barbershop?.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Render ── */
  return (
    <PageTransition>
      <NavbarLayout user={user} onLogout={logout} />

      <div className="min-h-screen bg-neutral-950 text-white pb-24 md:pb-0 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-8">

          <h1 className="text-3xl font-bold mb-6">
            My <span className="text-amber-500">Bookings</span>
          </h1>

          {/* ── Tabs ── */}
          <div className="flex gap-2 mb-6">
            {(["upcoming", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-amber-500 text-black"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                {t === "upcoming" ? "Active" : "History"}
              </button>
            ))}
          </div>

          {/* ── Search ── */}
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by barbershop name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl
                text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-amber-400" size={32} />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 py-8">
              <AlertCircle size={18} /> {error}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">
              <Scissors size={40} className="mx-auto mb-3 opacity-40" />
              <p>No booking {tab === "upcoming" ? "active" : "history"}.</p>
              {tab === "upcoming" && (
                <button
                  onClick={() => navigate("/booking")}
                  className="mt-4 px-5 py-2 bg-amber-500 text-black rounded-xl text-sm font-semibold hover:bg-amber-400 transition"
                >
                  Book Now
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {filteredBookings.map((b) => {
                  const cfg       = STATUS_CONFIG[b.status] ?? STATUS_CONFIG["cancelled"];
                  const canCancel = b.status === "pending_payment" || b.status === "paid";
                  const canPay    = b.status === "pending_payment" && !!b.payment?.snap_token;

                  return (
                    <motion.div
                      key={b.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-500/40 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          {/* Logo barbershop */}
                          <div className="w-11 h-11 rounded-xl bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center border border-neutral-700">
                            {b.barbershop?.logo_url
                              ? <img src={b.barbershop.logo_url} alt={b.barbershop.name} className="w-full h-full object-cover" />
                              : <Scissors size={18} className="text-neutral-500" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {b.barbershop?.name ?? "Barbershop"}
                            </p>
                            <p className="text-sm text-neutral-400">
                              {b.service?.name ?? "-"}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold border rounded-full shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(b.booking_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                          Barber: {b.barber?.user?.name ?? "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                        <span className="text-amber-400 font-bold">
                          {formatPrice(b.total_price)}
                        </span>

                        <div className="flex gap-2">
                          {canPay && (
                            <button
                              onClick={() => handleRepay(b)}
                              disabled={paying === b.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                                text-amber-400 border border-amber-400/30 bg-amber-400/5
                                hover:bg-amber-400/15 hover:border-amber-400/60 transition disabled:opacity-50"
                            >
                              {paying === b.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <CreditCard size={13} />}
                              Pay
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(b)}
                              disabled={cancelling === b.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                                text-red-400 border border-red-400/30 bg-red-400/5
                                hover:bg-red-400/15 hover:border-red-400/60 transition disabled:opacity-50"
                            >
                              {cancelling === b.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <X size={13} />}
                              Cancel
                            </button>
                          )}
                          {b.status === "done" && !b.rating && (
                            <button
                              onClick={() => { setRatingModal(b); setStarHover(0); setStarValue(0); setReviewText(""); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                                text-amber-400 border border-amber-400/30 bg-amber-400/5
                                hover:bg-amber-400/15 hover:border-amber-400/60 transition"
                            >
                              <Star size={13} /> Rate
                            </button>
                          )}
                          {b.status === "done" && b.rating && (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                              {"★".repeat(b.rating.rating)} Rated
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-bold text-white mb-1">Rate Your Experience</h3>
            <p className="text-sm text-neutral-400 mb-5">
              {ratingModal.barbershop?.name}
            </p>

            <div className="flex gap-2 mb-5 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setStarHover(n)}
                  onMouseLeave={() => setStarHover(0)}
                  onClick={() => setStarValue(n)}
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      n <= (starHover || starValue)
                        ? "text-amber-400 fill-amber-400"
                        : "text-neutral-700"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Write a review (optional)..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm
                placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-neutral-400 border border-neutral-700 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={starValue === 0 || submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ════ Cancel Confirmation Modal ════ */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                <X size={28} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-1">Cancel Booking?</h3>
            <p className="text-sm text-neutral-400 text-center mb-5">
              Are you sure you want to cancel your booking at{" "}
              <span className="text-white font-medium">{cancelTarget.barbershop?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-neutral-300 border border-neutral-700 hover:text-white transition"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition"
              >
                Yes, Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav menuItems={customerMenu} user={user} onLogout={logout} />
    </PageTransition>
  );
}
