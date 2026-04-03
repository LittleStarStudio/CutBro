// File: src/pages/notifications/CustomerNotification.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCheck, Trash2, Bell, Clock, CalendarCheck,
  Star, XCircle, Scissors, X, Send,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { customerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import Pagination from "@/components/ui/Pagination";

/* ================= TYPES ================= */
type NotifStatus = "unread" | "read";
type NotifCategory =
  | "booking_success"
  | "booking_cancelled"
  | "booking_reminder"
  | "booking_completed"
  | "review_request";

interface CustomerNotif {
  id: number;
  category: NotifCategory;
  barbershopName: string;
  barberName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  message: string;
  time: string;
  status: NotifStatus;
  reviewed?: boolean;
}

interface ReviewModal {
  notifId: number;
  barbershopName: string;
  barberName: string;
  serviceName: string;
}

/* ================= DUMMY DATA ================= */
const DUMMY: CustomerNotif[] = [
  { id: 1,  category: "booking_success",   barbershopName: "Barber King Jogja", barberName: "Pak Andi",  serviceName: "Haircut + Beard Trim", bookingDate: "18 Feb 2026", bookingTime: "14:00", message: "Your booking has been confirmed! Please arrive on time.",                         time: "5 minutes ago",  status: "unread" },
  { id: 2,  category: "booking_reminder",  barbershopName: "Style House",       barberName: "Kak Reza",  serviceName: "Skin Fade",            bookingDate: "18 Feb 2026", bookingTime: "16:30", message: "Reminder: You have a haircut scheduled in 2 hours!",                            time: "30 minutes ago", status: "unread" },
  { id: 3,  category: "booking_completed", barbershopName: "Urban Cut",         barberName: "Pak Bowo",  serviceName: "Classic Cut",          bookingDate: "17 Feb 2026", bookingTime: "10:00", message: "Your haircut session is done! How was the experience? Leave your review.",      time: "1 hour ago",     status: "unread" },
  { id: 4,  category: "booking_completed", barbershopName: "Razor Bros",        barberName: "Kak Dimas", serviceName: "Pompadour Style",      bookingDate: "17 Feb 2026", bookingTime: "11:00", message: "Session completed! Share your feedback to help others choose.",                 time: "3 hours ago",    status: "unread", reviewed: false },
  { id: 5,  category: "review_request",    barbershopName: "Razor Bros",        barberName: "Kak Dimas", serviceName: "Pompadour Style",      bookingDate: "17 Feb 2026", bookingTime: "11:00", message: "How was your experience? Leave a rating for Kak Dimas!",                       time: "1 day ago",      status: "read"   },
  { id: 6,  category: "booking_cancelled", barbershopName: "Classic Fade",      barberName: "Pak Joko",  serviceName: "Undercut",             bookingDate: "16 Feb 2026", bookingTime: "09:00", message: "Unfortunately your booking was cancelled. Please reschedule.",                  time: "2 days ago",     status: "read"   },
  { id: 7,  category: "booking_success",   barbershopName: "Barber King Jogja", barberName: "Pak Andi",  serviceName: "Beard Shaping",        bookingDate: "15 Feb 2026", bookingTime: "13:00", message: "Booking confirmed! Thank you for choosing us.",                                 time: "3 days ago",     status: "read"   },
  { id: 8,  category: "booking_reminder",  barbershopName: "Urban Cut",         barberName: "Pak Bowo",  serviceName: "Taper Fade",           bookingDate: "14 Feb 2026", bookingTime: "10:00", message: "Reminder: You have a haircut scheduled in 1 hour!",                            time: "4 days ago",     status: "read"   },
  { id: 9,  category: "booking_completed", barbershopName: "Style House",       barberName: "Kak Reza",  serviceName: "Crew Cut",             bookingDate: "13 Feb 2026", bookingTime: "15:00", message: "Your haircut session is done! Leave your review.",                              time: "5 days ago",     status: "read",   reviewed: true  },
  { id: 10, category: "booking_cancelled", barbershopName: "Razor Bros",        barberName: "Kak Dimas", serviceName: "French Crop",          bookingDate: "12 Feb 2026", bookingTime: "09:30", message: "Your booking was cancelled. Please reschedule at your convenience.",            time: "6 days ago",     status: "read"   },
  { id: 11, category: "booking_success",   barbershopName: "Classic Fade",      barberName: "Pak Joko",  serviceName: "Mohawk Style",         bookingDate: "11 Feb 2026", bookingTime: "11:00", message: "Booking confirmed! We look forward to seeing you.",                             time: "7 days ago",     status: "read"   },
  { id: 12, category: "review_request",    barbershopName: "Urban Cut",         barberName: "Pak Bowo",  serviceName: "Classic Cut",          bookingDate: "10 Feb 2026", bookingTime: "14:00", message: "Don't forget to leave a review for your recent visit!",                         time: "8 days ago",     status: "read"   },
];

/* ================= CONFIG ================= */
const ITEMS_PER_PAGE = 10;

/* ================= CATEGORY CONFIG ================= */
const CATEGORY_CONFIG = {
  booking_success: {
    icon: CalendarCheck,
    label: "Booking Confirmed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  booking_cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
  },
  booking_reminder: {
    icon: Clock,
    label: "Reminder",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  booking_completed: {
    icon: Scissors,
    label: "Completed",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    dot: "bg-violet-400",
  },
  review_request: {
    icon: Star,
    label: "Leave a Review",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    dot: "bg-sky-400",
  },
};

/* ================= STAR RATING ================= */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={28}
            className={`transition-colors ${
              star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-zinc-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const STAR_LABELS: Record<number, string> = {
  1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent!",
};

/* ================= REVIEW MODAL ================= */
function ReviewModalComponent({
  data, onClose, onSubmit,
}: {
  data: ReviewModal;
  onClose: () => void;
  onSubmit: (notifId: number, rating: number, comment: string) => void;
}) {
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    setTimeout(() => { onSubmit(data.notifId, rating, comment); onClose(); }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-5 shadow-2xl"
        style={{ animation: "modal-up 0.25s ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modal-up {
            from { opacity:0; transform:translateY(24px) scale(0.97); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          @keyframes check-pop {
            0%   { transform: scale(0); opacity:0; }
            70%  { transform: scale(1.2); }
            100% { transform: scale(1); opacity:1; }
          }
          .check-pop { animation: check-pop 0.4s ease both; }
        `}</style>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="check-pop w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCheck size={28} className="text-emerald-400" />
            </div>
            <p className="notif-title text-xl font-bold text-white">Review Sent!</p>
            <p className="text-sm text-zinc-500">Thanks for your feedback 🙌</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="notif-title text-lg font-bold text-white">Rate Your Experience</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{data.serviceName} — {data.barberName}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-800/60 rounded-2xl border border-zinc-700/50">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Scissors size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{data.barbershopName}</p>
                <p className="text-xs text-zinc-500">with {data.barberName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Your Rating</p>
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && <span className="text-sm font-semibold text-amber-400">{STAR_LABELS[rating]}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                Comment <span className="normal-case text-zinc-600">(optional)</span>
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience — was the cut perfect? Any notes for the barber?"
                rows={3}
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
                rating === 0
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-violet-500 hover:bg-violet-400 text-white active:scale-[0.98]"
              }`}
            >
              <Send size={14} />
              Submit Review
            </button>
          </>
        )}
      </div>
    </div>
  );
}



/* ================= PAGE ================= */
export default function CustomerNotification() {
  const navigate = useNavigate();
  const user = getUser();

  const [notifs, setNotifs]           = useState<CustomerNotif[]>(DUMMY);
  const [filter, setFilter]           = useState<"all" | NotifStatus>("all");
  const [reviewModal, setReviewModal] = useState<ReviewModal | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const unreadCount = notifs.filter((n) => n.status === "unread").length;

  const handleLogout = () => { logout(); navigate("/login"); };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    if (filter === "all") return notifs;
    return notifs.filter((n) => n.status === filter);
  }, [notifs, filter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleFilterChange = (value: "all" | NotifStatus) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= ACTIONS ================= */
  const markAllRead = () => setNotifs((p) => p.map((n) => ({ ...n, status: "read" })));
  const markRead    = (id: number) => setNotifs((p) => p.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
  const deleteNotif = (id: number) => {
    setNotifs((p) => p.filter((n) => n.id !== id));
    if (paginated.length === 1 && currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const clearAll = () => { setNotifs([]); setCurrentPage(1); };

  const openReview = (notif: CustomerNotif, e: React.MouseEvent) => {
    e.stopPropagation();
    markRead(notif.id);
    setReviewModal({
      notifId: notif.id,
      barbershopName: notif.barbershopName,
      barberName: notif.barberName,
      serviceName: notif.serviceName,
    });
  };

  const handleReviewSubmit = (notifId: number, _rating: number, _comment: string) => {
    setNotifs((p) => p.map((n) => n.id === notifId ? { ...n, reviewed: true, status: "read" } : n));
    setReviewModal(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .notif-title { font-family: 'Syne', sans-serif; }
        .notif-body  { font-family: 'DM Sans', sans-serif; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .notif-item { animation: slide-in 0.2s ease both; }
      `}</style>

      {reviewModal && (
        <ReviewModalComponent
          data={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      <Navbar
        user={user ? { name: user.name, email: user.email, role: user.role } : undefined}
        notificationCount={unreadCount}
        onLogout={handleLogout}
      />

      <div className="notif-body min-h-screen bg-zinc-950 text-white px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="space-y-1">
            <h1 className="notif-title text-2xl font-bold text-white">
              Booking <span className="text-emerald-400">Notifications</span>
            </h1>
            <p className="text-sm text-zinc-500">Track the status of your bookings and orders</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",     value: notifs.length,                                                   color: "text-white",      bg: "bg-zinc-800" },
              { label: "Confirmed", value: notifs.filter((n) => n.category === "booking_success").length,   color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20" },
              { label: "Completed", value: notifs.filter((n) => n.category === "booking_completed").length, color: "text-violet-400",  bg: "bg-violet-500/10 border border-violet-500/20" },
              { label: "Unread",    value: unreadCount,                                                     color: "text-amber-400",   bg: "bg-amber-500/10 border border-amber-500/20" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl px-3 py-3 text-center`}>
                <p className={`text-2xl font-bold notif-title ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {[
                { key: "all",    label: "All"    },
                { key: "unread", label: "Unread" },
                { key: "read",   label: "Read"   },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleFilterChange(f.key as "all" | NotifStatus)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === f.key
                      ? "bg-emerald-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <CheckCheck size={13} /> Mark All as Read
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-all border border-rose-500/20"
                >
                  <Trash2 size={13} /> Clear All
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                <Bell size={28} className="text-zinc-600" />
              </div>
              <p className="notif-title text-lg font-bold text-zinc-400">No notifications</p>
              <p className="text-sm text-zinc-600 mt-1">You're all caught up</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginated.map((notif, i) => {
                  const cfg = CATEGORY_CONFIG[notif.category];
                  const Icon = cfg.icon;
                  const isCompleted = notif.category === "booking_completed";

                  return (
                    <div
                      key={notif.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => markRead(notif.id)}
                      className={`notif-item group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        notif.status === "unread"
                          ? "bg-zinc-900 border-zinc-700 hover:border-emerald-500/40"
                          : "bg-zinc-950 border-zinc-800/60 hover:border-zinc-700"
                      }`}
                    >
                      {notif.status === "unread" && (
                        <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${cfg.dot}`} />
                      )}

                      <div className={`shrink-0 w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                        <Icon size={18} className={cfg.color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${notif.status === "unread" ? "text-white" : "text-zinc-300"}`}>
                            {notif.barbershopName}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 mt-0.5">
                          {notif.serviceName} — by {notif.barberName}
                        </p>

                        <p className={`text-sm mt-1 ${notif.status === "unread" ? "text-zinc-300" : "text-zinc-500"}`}>
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <p className="text-xs text-zinc-600 flex items-center gap-1">
                            <Clock size={11} /> {notif.time}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {notif.bookingDate} • <span className="text-zinc-400">{notif.bookingTime}</span>
                          </p>
                        </div>

                        {isCompleted && !notif.reviewed && (
                          <button
                            onClick={(e) => openReview(notif, e)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/60 text-violet-400 hover:text-violet-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
                          >
                            <Star size={12} className="fill-violet-400" />
                            Leave a Review
                          </button>
                        )}

                        {isCompleted && notif.reviewed && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                            <CheckCheck size={12} />
                            Review Submitted
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-600 hover:text-rose-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </>
          )}

        </div>
      </div>

      <BottomNav
        menuItems={customerMenu}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}