import { useState, useEffect, useCallback, useMemo } from "react";
import { CheckCheck, Bell, Clock, Scissors, CalendarCheck, XCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/components/context/AuthContext";
import PageHeader from "@/components/admin/PageHeader";
import { barberLogo, barberMenu } from "@/components/config/Menu";
import Pagination from "@/components/ui/Pagination";
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  type AppNotification,
} from "@/services/notification.service";

/* ── Category config — key = notif.type dari backend ── */
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType; label: string;
  color: string; bg: string; border: string; dot: string;
}> = {
  new_booking: {
    icon: Scissors, label: "New Booking",
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400",
  },
  booking_done: {
    icon: CalendarCheck, label: "Completed",
    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400",
  },
  default: {
    icon: Bell, label: "Notification",
    color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400",
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
type FilterKey = "all" | "new_booking" | "unread" | "read";

export default function BarberNotification() {
  const { user: currentUser, logout } = useAuth();

  const [notifs,      setNotifs]      = useState<AppNotification[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage,    setLastPage]    = useState(1);
  const [filter,      setFilter]      = useState<FilterKey>("all");

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

  const handleFilterChange = (key: FilterKey) => {
    setFilter(key);
    setCurrentPage(1);
  };

  const markRead = async (id: number) => {
    await markNotificationRead(id).catch(() => {});
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    load(currentPage);
  };

  /* ── Filter client-side dalam halaman yang dimuat ── */
  const filtered = useMemo(() => {
    if (filter === "new_booking") return notifs.filter((n) => n.type === "new_booking");
    if (filter === "unread")      return notifs.filter((n) => n.read_at === null);
    if (filter === "read")        return notifs.filter((n) => n.read_at !== null);
    return notifs;
  }, [notifs, filter]);

  const unreadCount     = notifs.filter((n) => n.read_at === null).length;
  const newBookingCount = notifs.filter((n) => n.type === "new_booking").length;

  const today = new Date().toDateString();

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Booking updates"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={currentUser ?? { name: "Barber", email: "" }}
      showNotification
      notificationCount={unreadCount}
      onLogout={logout}
    >
      <style>{`
        @keyframes slide-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .notif-item { animation: slide-in 0.2s ease both; }
      `}</style>

      <div className="w-full max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Booking"
          highlightedText="Notifications"
          description="Your booking updates and activity"
        />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Unread",        value: unreadCount,     color: "text-rose-400",  bg: "bg-rose-500/10 border border-rose-500/20"   },
            { label: "New Bookings",  value: newBookingCount, color: "text-amber-400", bg: "bg-amber-500/10 border border-amber-500/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {([
              { key: "all",         label: "All"     },
              { key: "new_booking", label: "Booking" },
              { key: "unread",      label: "Unread"  },
              { key: "read",        label: "Read"    },
            ] as { key: FilterKey; label: string }[]).map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.key ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {f.label}
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
            <Loader2 className="animate-spin text-amber-400" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <Bell size={28} className="text-zinc-600" />
            </div>
            <p className="text-lg font-bold text-zinc-400">No notifications</p>
            <p className="text-sm text-zinc-600 mt-1">Nothing here yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filtered.map((notif, i) => {
                const cfg  = getConfig(notif.type);
                const Icon = cfg.icon;
                const isUnread = notif.read_at === null;
                return (
                  <div
                    key={notif.id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => isUnread && markRead(notif.id)}
                    className={`notif-item group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isUnread
                        ? "bg-zinc-900 border-zinc-700 hover:border-amber-500/40"
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
    </DashboardLayout>
  );
}
