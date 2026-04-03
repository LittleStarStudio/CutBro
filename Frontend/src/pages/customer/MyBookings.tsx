/* ================================================================
   src/pages/customer/MyBookings.tsx
================================================================ */

import { useState, useMemo, useEffect } from "react";
import {
  Search, Calendar, Clock, MapPin, Star,
  Filter, X, CreditCard, Phone,
} from "lucide-react";
import { motion, type Variants, AnimatePresence } from "framer-motion";

import NavbarLayout   from "@/components/layout/Navbar";
import BottomNav      from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";
import Pagination     from "@/components/ui/Pagination";
import CancelModal    from "@/components/booking/CancelModal";

import { customerMenu }      from "@/components/config/Menu";
import { useAuth }           from "@/components/context/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast }          from "@/components/ui/Toast";
import { useNavigate, useLocation } from "react-router-dom";
import type { Booking, BookingStatus } from "@/type/BookingType";
import { PAYMENT_STATUS_CONFIG }       from "@/type/BookingType";

/* ── Config ── */
const ITEMS_PER_PAGE = 5;

/* ── Mock data ── */
const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 1,
    shopName: "Royal Cuts",
    location: "South Jakarta",
    date: "2026-02-18",
    time: "14:00",
    service: "Haircut + Beard",
    price: "Rp 550.000",
    phone: "+62 812-3456-7890",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800",
    status: "upcoming",
    paymentStatus: "PENDING_PAYMENT",
  },
  {
    id: 2,
    shopName: "Modern Barber",
    location: "Central Jakarta",
    date: "2026-02-10",
    time: "10:30",
    service: "Premium Cut",
    price: "Rp 700.000",
    phone: "+62 821-9876-5432",
    rating: 5,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    status: "upcoming",
    paymentStatus: "WAITING_VERIFICATION",
  },
  {
    id: 3,
    shopName: "Classic Style",
    location: "West Jakarta",
    date: "2026-02-05",
    time: "09:00",
    service: "Hair Treatment",
    price: "Rp 475.000",
    phone: "+62 813-1122-3344",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800",
    status: "upcoming",
    paymentStatus: "PAID",
  },
  {
    id: 4,
    shopName: "Gentleman's Club",
    location: "North Jakarta",
    date: "2026-01-28",
    time: "13:00",
    service: "Full Grooming",
    price: "Rp 850.000",
    phone: "+62 857-5566-7788",
    rating: 5,
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
    status: "completed",
    paymentStatus: "DONE",
  },
  {
    id: 5,
    shopName: "Urban Cuts",
    location: "East Jakarta",
    date: "2026-01-20",
    time: "11:00",
    service: "Haircut",
    price: "Rp 350.000",
    phone: "+62 878-9900-1122",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800",
    status: "cancelled",
    paymentStatus: "CANCELLED",
  },
  {
    id: 6,
    shopName: "Royal Cuts",
    location: "South Jakarta",
    date: "2026-01-15",
    time: "15:00",
    service: "Beard Trim",
    price: "Rp 200.000",
    phone: "+62 811-2233-4455",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800",
    status: "upcoming",
    paymentStatus: "REFUND_REQUESTED",
  },
  {
    id: 7,
    shopName: "Modern Barber",
    location: "Central Jakarta",
    date: "2026-01-10",
    time: "10:00",
    service: "Premium Cut",
    price: "Rp 700.000",
    phone: "+62 831-6677-8899",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    status: "cancelled",
    paymentStatus: "REFUNDED",
  },
];

/* ── Status styles untuk kartu (upcoming/completed/cancelled) ── */
const STATUS_STYLES: Record<BookingStatus, string> = {
  completed: "text-green-300 border-green-400/50 bg-green-500/15",
  cancelled:  "text-red-300 border-red-400/50 bg-red-500/15",
  upcoming:   "text-amber-300 border-amber-400/50 bg-amber-500/15",
};

const CAN_PAY    = new Set(["PENDING_PAYMENT"]);
const CAN_CANCEL = new Set(["PENDING_PAYMENT", "WAITING_VERIFICATION", "PAID"]);

/* ── Animation variants ── */
const listVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ================================================================
   Component
================================================================ */
export default function MyBookings() {
  const { user, logout } = useAuth();
  const toast            = useToast();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [bookings,     setBookings]     = useState<Booking[]>(INITIAL_BOOKINGS);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  /* ── Terima update status dari Payment.tsx ── */
  useEffect(() => {
    const updated: Booking | undefined = location.state?.updatedBooking;
    if (!updated) return;

    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );

    // Bersihkan state agar tidak re-apply saat refresh
    navigate(location.pathname, { replace: true, state: {} });
  }, []);

  /* ── Filter + search ── */
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.shopName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.service.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchFilter = filter === "all" || b.status === filter;
      return matchSearch && matchFilter;
    });
  }, [debouncedSearch, filter, bookings]);

  /* ── Pagination ── */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  /* ── Handlers ── */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    const { shopName, id, paymentStatus } = cancelTarget;

    const needsRefund = paymentStatus === "PAID";

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status:        needsRefund ? ("upcoming" as const)          : ("cancelled" as const),
              paymentStatus: needsRefund ? ("REFUND_REQUESTED" as const)  : ("CANCELLED" as const),
            }
          : b
      )
    );

    setCancelTarget(null);

    if (needsRefund) {
      toast.success(
        "Refund Requested",
        `Permintaan refund untuk ${shopName} telah dikirim. Mohon tunggu proses dari owner.`
      );
    } else {
      toast.success(
        "Booking Cancelled",
        `Reservasi kamu di ${shopName} telah dibatalkan.`
      );
    }
  };

  const handlePay = (booking: Booking) => {
    navigate("/customer/payment", { state: { booking } });
  };

  /* ================================================================
     Render
  ================================================================ */
  return (
    <PageTransition>
      <NavbarLayout user={user} notificationCount={2} onLogout={logout} />

      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      <div className="min-h-screen bg-zinc-950 text-white pb-20 md:pb-0">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">

          {/* ── Heading ── */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8"
          >
            My <span className="text-amber-500">Bookings</span>
          </motion.h1>

          {/* ── Search + Filter ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-7 sm:mb-10"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search booking..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-400 shrink-0" />
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="flex-1 sm:flex-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </motion.div>

          {/* ── List ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`page-${currentPage}-${debouncedSearch}-${filter}`}
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              className="space-y-4 sm:space-y-6"
            >
              {paginated.map((b) => {
                const psConfig  = PAYMENT_STATUS_CONFIG[b.paymentStatus];
                const canPay    = CAN_PAY.has(b.paymentStatus);
                const canCancel = CAN_CANCEL.has(b.paymentStatus);

                return (
                  <motion.div
                    key={b.id}
                    variants={itemVariants}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="w-full sm:w-40 h-40 sm:h-auto shrink-0">
                        <img src={b.image} alt={b.shopName} className="w-full h-full object-cover" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base sm:text-xl font-bold">{b.shopName}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold border rounded-full capitalize shrink-0 ${STATUS_STYLES[b.status]}`}>
                            {b.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-zinc-400 mb-3">
                          <span className="flex items-center gap-1"><MapPin   size={13} /> {b.location}</span>
                          <span className="flex items-center gap-1"><Calendar size={13} /> {b.date}</span>
                          <span className="flex items-center gap-1"><Clock    size={13} /> {b.time}</span>
                          <span className="flex items-center gap-1"><Phone    size={13} /> {b.phone}</span>
                        </div>

                        <p className="text-zinc-300 text-sm mb-2">{b.service}</p>

                        {b.rating && (
                          <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                            <Star size={13} fill="currentColor" /> {b.rating}/5
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                          {/* Price + payment status badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-amber-500 font-bold text-base sm:text-lg">{b.price}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${psConfig.color}`}>
                              {psConfig.label}
                            </span>
                          </div>

                          {/* Action buttons */}
                          {(canPay || canCancel) && (
                            <div className="flex items-center gap-2 shrink-0">
                              {canPay && (
                                <button
                                  onClick={() => handlePay(b)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium
                                    text-amber-400 border border-amber-400/30 bg-amber-400/5
                                    hover:bg-amber-400/15 hover:border-amber-400/60 transition"
                                >
                                  <CreditCard size={14} />
                                  Pay
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  onClick={() => setCancelTarget(b)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium
                                    text-red-400 border border-red-400/30 bg-red-400/5
                                    hover:bg-red-400/15 hover:border-red-400/60 transition"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Empty state */}
              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-center py-14 sm:py-16"
                >
                  <p className="text-zinc-500 mb-4 text-sm sm:text-base">No booking history found</p>
                  <button
                    onClick={() => { handleSearchChange(""); handleFilterChange("all"); }}
                    className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-white rounded-xl hover:border-amber-500/50 transition text-sm"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <BottomNav menuItems={customerMenu} user={user} onLogout={logout} />
    </PageTransition>
  );
}