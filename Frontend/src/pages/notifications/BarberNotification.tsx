// File: src/pages/notifications/BarberNotification.tsx
import { useState, useMemo } from "react";
import { CheckCheck, Trash2, Bell, Clock, Scissors, CalendarCheck, XCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { logout, getUser } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import { barberLogo, barberMenu } from "@/components/config/Menu";
import Pagination from "@/components/ui/Pagination";

/* ================= TYPES ================= */
type NotifStatus = "unread" | "read";
type NotifCategory = "new_booking" | "completed" | "cancelled";

interface BarberNotif {
  id: number;
  category: NotifCategory;
  customerName: string;
  serviceName: string;
  bookingTime: string;
  bookingDate: string;
  message: string;
  time: string;
  status: NotifStatus;
}

/* ================= DUMMY DATA ================= */
const TODAY = "18 Feb 2026";
const DUMMY: BarberNotif[] = [
  { id: 1,  category: "new_booking", customerName: "Budi Santoso",    serviceName: "Haircut + Beard Trim", bookingTime: "09:00", bookingDate: TODAY, message: "New booking received for today at 09:00.", time: "5 minutes ago",  status: "unread" },
  { id: 2,  category: "new_booking", customerName: "Riko Pratama",    serviceName: "Skin Fade",            bookingTime: "10:30", bookingDate: TODAY, message: "New booking received for today at 10:30.", time: "20 minutes ago", status: "unread" },
  { id: 3,  category: "new_booking", customerName: "Hendra Gunawan",  serviceName: "Classic Cut",          bookingTime: "13:00", bookingDate: TODAY, message: "New booking received for today at 13:00.", time: "1 hour ago",     status: "unread" },
  { id: 4,  category: "completed",   customerName: "Ahmad Fauzi",     serviceName: "Haircut + Color",      bookingTime: "08:00", bookingDate: TODAY, message: "Service completed for Ahmad Fauzi.",       time: "2 hours ago",    status: "read"   },
  { id: 5,  category: "cancelled",   customerName: "Deni Susanto",    serviceName: "Beard Shaping",        bookingTime: "11:00", bookingDate: TODAY, message: "Booking was cancelled by the customer.",   time: "3 hours ago",    status: "read"   },
  { id: 6,  category: "new_booking", customerName: "Wahyu Saputra",   serviceName: "Pompadour Style",      bookingTime: "15:30", bookingDate: TODAY, message: "New booking received for today at 15:30.", time: "4 hours ago",    status: "read"   },
  { id: 7,  category: "completed",   customerName: "Irfan Maulana",   serviceName: "Undercut",             bookingTime: "07:30", bookingDate: TODAY, message: "Service completed for Irfan Maulana.",     time: "5 hours ago",    status: "read"   },
  { id: 8,  category: "new_booking", customerName: "Fajar Nugroho",   serviceName: "Taper Fade",           bookingTime: "14:00", bookingDate: TODAY, message: "New booking received for today at 14:00.", time: "6 hours ago",    status: "read"   },
  { id: 9,  category: "cancelled",   customerName: "Gilang Ramadhan", serviceName: "Crew Cut",             bookingTime: "12:00", bookingDate: TODAY, message: "Booking was cancelled by the customer.",   time: "7 hours ago",    status: "read"   },
  { id: 10, category: "completed",   customerName: "Andi Prasetyo",   serviceName: "Razor Shave",          bookingTime: "08:30", bookingDate: TODAY, message: "Service completed for Andi Prasetyo.",     time: "8 hours ago",    status: "read"   },
  { id: 11, category: "new_booking", customerName: "Rizki Hidayat",   serviceName: "Mohawk Style",         bookingTime: "16:00", bookingDate: TODAY, message: "New booking received for today at 16:00.", time: "9 hours ago",    status: "read"   },
  { id: 12, category: "completed",   customerName: "Dimas Arya",      serviceName: "French Crop",          bookingTime: "09:30", bookingDate: TODAY, message: "Service completed for Dimas Arya.",        time: "10 hours ago",   status: "read"   },
];

/* ================= CONFIG ================= */
const ITEMS_PER_PAGE = 10;

/* ================= CATEGORY CONFIG ================= */
const CATEGORY_CONFIG = {
  new_booking: {
    icon: Scissors,
    label: "New Booking",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  completed: {
    icon: CalendarCheck,
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
  },
};

type FilterKey = "new_booking" | NotifStatus;



/* ================= COMPONENT ================= */
export default function BarberNotification() {
  const [notifs, setNotifs]           = useState<BarberNotif[]>(DUMMY);
  const [filter, setFilter]           = useState<FilterKey>("new_booking");
  const [currentPage, setCurrentPage] = useState(1);

  const currentUser = getUser();

  const unreadCount   = notifs.filter((n) => n.status === "unread").length;
  const todayBookings = notifs.filter((n) => n.category === "new_booking" && n.bookingDate === TODAY).length;

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    if (filter === "unread") return notifs.filter((n) => n.status === "unread");
    if (filter === "read")   return notifs.filter((n) => n.status === "read");
    return notifs.filter((n) => n.category === "new_booking");
  }, [notifs, filter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleFilterChange = (key: FilterKey) => {
    setFilter(key);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= ACTIONS ================= */
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, status: "read" })));
  const markRead    = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, status: "read" } : n));
  const deleteNotif = (id: number) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (paginated.length === 1 && currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const clearAll = () => { setNotifs([]); setCurrentPage(1); };

  return (
    <DashboardLayout
      title="My Schedule"
      subtitle="Today's tasks"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={
        currentUser ?? {
          name: "John Barber",
          email: "john@barbershop.com",
          role: "barber",
        }
      }
      showNotification
      notificationCount={unreadCount}
      onLogout={logout}
    >
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

      <div className="notif-body w-full max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Booking"
          highlightedText="Notifications"
          description={`Your booking schedule and tasks for today — ${TODAY}`}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Unread",           value: unreadCount,   color: "text-rose-400",  bg: "bg-rose-500/10 border border-rose-500/20"   },
            { label: "Today's Bookings", value: todayBookings, color: "text-amber-400", bg: "bg-amber-500/10 border border-amber-500/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 text-center`}>
              <p className={`text-2xl font-bold notif-title ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[
              { key: "new_booking", label: "Booking" },
              { key: "unread",      label: "Unread"  },
              { key: "read",        label: "Read"    },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key as FilterKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.key
                    ? "bg-amber-500 text-black"
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
            <p className="text-sm text-zinc-600 mt-1">No bookings received today</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginated.map((notif, i) => {
                const cfg  = CATEGORY_CONFIG[notif.category];
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => markRead(notif.id)}
                    className={`notif-item group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      notif.status === "unread"
                        ? "bg-zinc-900 border-zinc-700 hover:border-amber-500/40"
                        : "bg-zinc-950 border-zinc-800/60 hover:border-zinc-700"
                    }`}
                  >
                    {notif.status === "unread" && (
                      <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${cfg.dot}`} />
                    )}

                    {notif.category === "new_booking" ? (
                      <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700">
                        <span className="text-xs font-bold text-amber-400 leading-none">{notif.bookingTime}</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5">WIB</span>
                      </div>
                    ) : (
                      <div className={`shrink-0 w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${notif.status === "unread" ? "text-white" : "text-zinc-300"}`}>
                          {notif.customerName}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{notif.serviceName}</p>
                      <p className={`text-sm mt-1 ${notif.status === "unread" ? "text-zinc-300" : "text-zinc-500"}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1">
                        <Clock size={11} /> {notif.time}
                      </p>
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
    </DashboardLayout>
  );
}