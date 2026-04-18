import { useState, useEffect, useCallback, useMemo, } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Bell, Clock, CalendarCheck, XCircle, Scissors, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { customerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import Pagination from "@/components/ui/Pagination";
import { Star } from "lucide-react";
import { rateBooking } from "@/services/customer.service";
import { useToast } from "@/components/ui/Toast";
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  type AppNotification,
} from "@/services/notification.service";

/* ── Category config — key = notif.type dari backend ── */
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType; label: string;
  color: string; bg: string; border: string; dot: string;
}> = {
  booking_done: {
    icon: Scissors, label: "Completed",
    color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", dot: "bg-violet-400",
  },
  booking_cancelled: {
    icon: XCircle, label: "Cancelled",
    color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-400",
  },
  default: {
    icon: CalendarCheck, label: "Notification",
    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400",
  },
};

const getConfig = (type: string) => CATEGORY_CONFIG[type] ?? CATEGORY_CONFIG.default;

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ITEMS_PER_PAGE = 10;

export default function CustomerNotification() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();

  const [notifs,      setNotifs]      = useState<AppNotification[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage,    setLastPage]    = useState(1);
  const [filter,      setFilter]      = useState<"all" | "unread" | "read">("all");

  const toast = useToast();
  const [ratingModal,     setRatingModal]     = useState<AppNotification | null>(null);
  const [starHover,       setStarHover]       = useState(0);
  const [starValue,       setStarValue]       = useState(0);
  const [reviewText,      setReviewText]      = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [ratedBookingIds, setRatedBookingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getNotifications(page);
      setNotifs(res.data.data.data);
      setLastPage(res.data.data.last_page);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    load(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markRead = async (id: number) => {
    await markNotificationRead(id).catch(() => {});
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    load(currentPage);
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || starValue === 0) return;
    const bookingId = ratingModal.data?.booking_id as number | undefined;
    if (!bookingId) return;

    setSubmitting(true);
    try {
      await rateBooking(bookingId, { rating: starValue, review: reviewText || undefined });
      toast.success("Rating Submitted", "Thank you for your feedback!");
      setRatedBookingIds((prev) => new Set([...prev, bookingId]));
      markRead(ratingModal.id);
      setRatingModal(null);
      setStarValue(0);
      setReviewText("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to submit rating.";
      toast.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "unread") return notifs.filter((n) => n.read_at === null);
    if (filter === "read")   return notifs.filter((n) => n.read_at !== null);
    return notifs;
  }, [notifs, filter]);

  const unreadCount     = notifs.filter((n) => n.read_at === null).length;
  const completedCount  = notifs.filter((n) => n.type === "booking_done").length;

  const handleLogout = () => { authLogout(); navigate("/login"); };

  return (
    <>
      <style>{`
        @keyframes slide-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .notif-item { animation: slide-in 0.2s ease both; }
      `}</style>

      <Navbar
        user={user ? { name: user.name, email: user.email, role: user.role } : undefined}
        notificationCount={unreadCount}
        onLogout={handleLogout}
      />

      <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">
              Booking <span className="text-emerald-400">Notifications</span>
            </h1>
            <p className="text-sm text-zinc-500">Track the status of your bookings</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",     value: notifs.length,  color: "text-white",      bg: "bg-zinc-800" },
              { label: "Completed", value: completedCount, color: "text-violet-400", bg: "bg-violet-500/10 border border-violet-500/20" },
              { label: "Unread",    value: unreadCount,    color: "text-amber-400",  bg: "bg-amber-500/10 border border-amber-500/20"  },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl px-3 py-3 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["all","unread","read"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                    filter === f ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f === "all" ? "All" : f === "unread" ? "Unread" : "Read"}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >
                <CheckCheck size={13} /> Mark All as Read
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-emerald-400" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                <Bell size={28} className="text-zinc-600" />
              </div>
              <p className="text-lg font-bold text-zinc-400">No notifications</p>
              <p className="text-sm text-zinc-600 mt-1">You're all caught up</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {filtered.map((notif, i) => {
                  const cfg = getConfig(notif.type);
                  const Icon = cfg.icon;
                  const isUnread = notif.read_at === null;
                  return (
                    <div
                      key={notif.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => isUnread && markRead(notif.id)}
                      className={`notif-item group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isUnread
                          ? "bg-zinc-900 border-zinc-700 hover:border-emerald-500/40"
                          : "bg-zinc-950 border-zinc-800/60 hover:border-zinc-700"
                      }`}
                    >
                      {isUnread && <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${cfg.dot}`} />}

                      <div className={`shrink-0 w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                        <Icon size={18} className={cfg.color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${isUnread ? "text-white" : "text-zinc-300"}`}>
                            {notif.title}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isUnread ? "text-zinc-300" : "text-zinc-500"}`}>
                          {notif.body}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1">
                          <Clock size={11} /> {timeAgo(notif.created_at)}
                        </p>
                        {notif.type === "booking_done" &&
                          notif.data?.booking_id &&
                          !ratedBookingIds.has(notif.data.booking_id as number) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(notif.id);
                              setRatingModal(notif);
                              setStarHover(0);
                              setStarValue(0);
                              setReviewText("");
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5
                              bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30
                              hover:border-amber-500/60 text-amber-400 rounded-xl text-xs font-semibold transition-all"
                          >
                            <Star size={12} className="fill-amber-400" /> Rate Barbershop
                          </button>
                        )}
                        {notif.type === "booking_done" &&
                          notif.data?.booking_id &&
                          ratedBookingIds.has(notif.data.booking_id as number) && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5
                            bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                            <CheckCheck size={12} /> Rated
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={lastPage}
                totalItems={notifs.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </>
          )}

        </div>
      </div>

      <BottomNav menuItems={customerMenu} user={user} onLogout={handleLogout} />

      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-1">Rate Your Experience</h3>
            <p className="text-sm text-zinc-400 mb-5">{ratingModal.title}</p>

            {/* Stars */}
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
                        : "text-zinc-700"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Review */}
            <textarea
              rows={3}
              placeholder="Write a review (optional)..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm
                placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:text-white transition"
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
          </div>
        </div>
      )}

    </>
  );
}
