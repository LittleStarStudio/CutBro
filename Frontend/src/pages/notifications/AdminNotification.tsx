// File: src/pages/notifications/AdminNotification.tsx
import { useState, useMemo } from "react";
import { CheckCheck, Trash2, Bell, UserPlus, ShieldCheck, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/ui/Pagination";

/* ================= TYPES ================= */
type NotifStatus = "unread" | "read";
type NotifCategory = "new_user" | "verified" | "pending";

interface AdminNotif {
  id: number;
  category: NotifCategory;
  userName: string;
  userEmail: string;
  userRole: string;
  message: string;
  time: string;
  status: NotifStatus;
  avatar?: string;
}

/* ================= DUMMY DATA ================= */
const DUMMY: AdminNotif[] = [
  { id: 1,  category: "new_user", userName: "Budi Santoso",    userEmail: "budi@email.com",    userRole: "customer", message: "A new user has registered as a Customer.",                              time: "2 minutes ago",  status: "unread" },
  { id: 2,  category: "new_user", userName: "Siti Rahayu",     userEmail: "siti@email.com",     userRole: "owner",    message: "A new user has registered as a Barbershop Owner.",                    time: "15 minutes ago", status: "unread" },
  { id: 3,  category: "verified", userName: "Ahmad Fauzi",     userEmail: "ahmad@email.com",    userRole: "barber",   message: "Barber has been successfully verified and is now active.",             time: "1 hour ago",     status: "unread" },
  { id: 4,  category: "new_user", userName: "Dewi Lestari",    userEmail: "dewi@email.com",     userRole: "customer", message: "A new user has registered as a Customer.",                              time: "2 hours ago",    status: "read"   },
  { id: 5,  category: "pending",  userName: "Riko Pratama",    userEmail: "riko@email.com",     userRole: "owner",    message: "Owner registration is awaiting document verification.",                time: "3 hours ago",    status: "read"   },
  { id: 6,  category: "new_user", userName: "Maya Sari",       userEmail: "maya@email.com",     userRole: "barber",   message: "A new user has registered as a Barber.",                               time: "5 hours ago",    status: "read"   },
  { id: 7,  category: "verified", userName: "Hendra Gunawan",  userEmail: "hendra@email.com",   userRole: "owner",    message: "Barbershop Owner has been successfully verified.",                     time: "1 day ago",      status: "read"   },
  { id: 8,  category: "pending",  userName: "Lia Permata",     userEmail: "lia@email.com",      userRole: "barber",   message: "New barber is awaiting admin approval.",                               time: "1 day ago",      status: "read"   },
  { id: 9,  category: "new_user", userName: "Farhan Aditya",   userEmail: "farhan@email.com",   userRole: "customer", message: "A new user has registered as a Customer.",                              time: "2 days ago",     status: "read"   },
  { id: 10, category: "verified", userName: "Nisa Aulia",      userEmail: "nisa@email.com",     userRole: "barber",   message: "Barber has been successfully verified and is now active.",             time: "2 days ago",     status: "read"   },
  { id: 11, category: "pending",  userName: "Bagas Wicaksono", userEmail: "bagas@email.com",    userRole: "owner",    message: "Owner registration is awaiting document verification.",                time: "3 days ago",     status: "read"   },
  { id: 12, category: "new_user", userName: "Putri Handayani", userEmail: "putri@email.com",    userRole: "customer", message: "A new user has registered as a Customer.",                              time: "3 days ago",     status: "read"   },
];

/* ================= CONFIG ================= */
const ITEMS_PER_PAGE = 10;

/* ================= CATEGORY CONFIG ================= */
const CATEGORY_CONFIG = {
  new_user: {
    icon: UserPlus,
    label: "New User",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
  },
};

const ROLE_COLOR: Record<string, string> = {
  customer: "text-sky-400 bg-sky-500/10 border border-sky-500/20",
  owner:    "text-purple-400 bg-purple-500/10 border border-purple-500/20",
  barber:   "text-amber-400 bg-amber-500/10 border border-amber-500/20",
};

/* ================= FILTER TYPE ================= */
type FilterKey = "all" | NotifStatus | "new_user";



/* ================= COMPONENT ================= */
export default function AdminNotification() {
  const user = getUser();
  const [notifs, setNotifs]       = useState<AdminNotif[]>(DUMMY);
  const [filter, setFilter]       = useState<FilterKey>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const unreadCount = notifs.filter((n) => n.status === "unread").length;

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    if (filter === "all")      return notifs;
    if (filter === "unread")   return notifs.filter((n) => n.status === "unread");
    if (filter === "read")     return notifs.filter((n) => n.status === "read");
    if (filter === "new_user") return notifs.filter((n) => n.category === "new_user");
    return notifs;
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
  const markAllRead  = () => setNotifs((prev) => prev.map((n) => ({ ...n, status: "read" })));
  const markRead     = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, status: "read" } : n));
  const deleteNotif  = (id: number) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    // jika hapus item terakhir di halaman ini, mundur 1 halaman
    if (paginated.length === 1 && currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const clearAll = () => { setNotifs([]); setCurrentPage(1); };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="User registration activity"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      notificationCount={unreadCount}
      onLogout={logout}
      userProfile={{
        name:  user?.name  ?? "Admin",
        email: user?.email ?? "",
        role:  user?.role  ?? "admin",
      }}
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

        {/* Page Header */}
        <PageHeader
          title="Notifications"
          highlightedText="Admin"
          description="Monitor user registration and verification activity on the platform"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total",  value: notifs.length,                color: "text-white",       bg: "bg-zinc-800" },
            { label: "Unread", value: unreadCount,                  color: "text-amber-400",   bg: "bg-amber-500/10 border border-amber-500/20" },
            { label: "Read",   value: notifs.length - unreadCount,  color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 text-center`}>
              <p className={`text-2xl font-bold notif-title ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all",      label: "All"      },
              { key: "unread",   label: "Unread"   },
              { key: "read",     label: "Read"     },
              { key: "new_user", label: "New User" },
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

        {/* Notification List */}
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

                    <div className={`shrink-0 w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                      <Icon size={18} className={cfg.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${notif.status === "unread" ? "text-white" : "text-zinc-300"}`}>
                          {notif.userName}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[notif.userRole] ?? "text-zinc-400 bg-zinc-800"}`}>
                          {notif.userRole}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{notif.userEmail}</p>
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