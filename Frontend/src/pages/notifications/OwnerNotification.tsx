// File: src/pages/notifications/OwnerNotification.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Trash2, Bell, Clock, AlertTriangle, CreditCard, XCircle, Star, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { logout } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import Pagination from "@/components/ui/Pagination";

/* ================= TYPES ================= */
type NotifStatus = "unread" | "read";
type NotifCategory = "expiring_soon" | "expired" | "renewed" | "review";

interface OwnerNotif {
  id: number;
  category: NotifCategory;
  planName?: string;
  barbershopName: string;
  daysLeft?: number;
  expiredDate?: string;
  customerName?: string;
  rating?: number;
  serviceName?: string;
  reviewText?: string;
  message: string;
  time: string;
  status: NotifStatus;
}

/* ================= DUMMY DATA ================= */
const DUMMY: OwnerNotif[] = [
  { id: 1,  category: "expiring_soon", planName: "Premium Plan", barbershopName: "Barber King Jogja", daysLeft: 3,  expiredDate: "21 Feb 2026", message: "Your Premium subscription expires in 3 days. Renew now to keep your features!",   time: "1 hour ago",   status: "unread" },
  { id: 2,  category: "review",        barbershopName: "Barber King Jogja", customerName: "Budi Santoso",   rating: 5, serviceName: "Haircut + Beard Trim", reviewText: "Amazing service! Will definitely come back.",           message: "Budi Santoso left a 5-star review.",    time: "2 hours ago",  status: "unread" },
  { id: 3,  category: "expiring_soon", planName: "Basic Plan",   barbershopName: "Style House",       daysLeft: 7,  expiredDate: "25 Feb 2026", message: "Your Basic subscription expires in 7 days.",                                      time: "3 hours ago",  status: "unread" },
  { id: 4,  category: "review",        barbershopName: "Style House",       customerName: "Siti Rahayu",    rating: 4, serviceName: "Skin Fade",            reviewText: "Great cut, very clean finish.",                        message: "Siti Rahayu left a 4-star review.",     time: "5 hours ago",  status: "unread" },
  { id: 5,  category: "expired",       planName: "Premium Plan", barbershopName: "Razor Bros",        daysLeft: 0,  expiredDate: "15 Feb 2026", message: "Your Premium subscription has expired. Features are now limited.",                time: "2 days ago",   status: "read"   },
  { id: 6,  category: "review",        barbershopName: "Barber King Jogja", customerName: "Hendra Gunawan", rating: 3, serviceName: "Classic Cut",          reviewText: "Decent, but had to wait longer than expected.",        message: "Hendra Gunawan left a 3-star review.",  time: "2 days ago",   status: "read"   },
  { id: 7,  category: "renewed",       planName: "Premium Plan", barbershopName: "Barber King Jogja", daysLeft: 30, expiredDate: "20 Mar 2026", message: "Premium subscription successfully renewed until March 20, 2026.",                time: "3 days ago",   status: "read"   },
  { id: 8,  category: "expiring_soon", planName: "Basic Plan",   barbershopName: "Urban Cut",         daysLeft: 5,  expiredDate: "23 Feb 2026", message: "Your Basic subscription expires in 5 days.",                                      time: "4 days ago",   status: "read"   },
  { id: 9,  category: "expired",       planName: "Basic Plan",   barbershopName: "Classic Fade",      daysLeft: 0,  expiredDate: "10 Feb 2026", message: "Your Basic subscription expired 8 days ago.",                                     time: "5 days ago",   status: "read"   },
  { id: 10, category: "review",        barbershopName: "Urban Cut",         customerName: "Riko Pratama",   rating: 5, serviceName: "Taper Fade",           reviewText: "Absolutely love the result!",                          message: "Riko Pratama left a 5-star review.",    time: "6 days ago",   status: "read"   },
  { id: 11, category: "renewed",       planName: "Basic Plan",   barbershopName: "Style House",       daysLeft: 30, expiredDate: "18 Mar 2026", message: "Basic subscription successfully renewed until March 18, 2026.",                  time: "7 days ago",   status: "read"   },
  { id: 12, category: "review",        barbershopName: "Razor Bros",        customerName: "Maya Sari",      rating: 2, serviceName: "Crew Cut",             reviewText: "Not what I expected, could be better.",               message: "Maya Sari left a 2-star review.",       time: "8 days ago",   status: "read"   },
];

/* ================= CONFIG ================= */
const ITEMS_PER_PAGE = 10;

/* ================= CATEGORY CONFIG ================= */
const CATEGORY_CONFIG = {
  expiring_soon: {
    icon: AlertTriangle,
    label: "Expiring Soon",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  expired: {
    icon: XCircle,
    label: "Expired",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
  },
  renewed: {
    icon: CreditCard,
    label: "Renewed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  review: {
    icon: Star,
    label: "New Review",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    dot: "bg-sky-400",
  },
};

/* ================= STAR RATING ================= */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < rating ? "text-amber-400 fill-amber-400" : "text-zinc-600"}
        />
      ))}
    </div>
  );
}

type FilterKey = "all" | NotifStatus | NotifCategory;



/* ================= COMPONENT ================= */
export default function OwnerNotification() {
  const navigate = useNavigate();
  const [notifs, setNotifs]           = useState<OwnerNotif[]>(DUMMY);
  const [filter, setFilter]           = useState<FilterKey>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const unreadCount = notifs.filter((n) => n.status === "unread").length;

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    if (filter === "all") return notifs;
    if (filter === "unread" || filter === "read") return notifs.filter((n) => n.status === filter);
    return notifs.filter((n) => n.category === filter);
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

  const handleRenew = (e: React.MouseEvent, notif: OwnerNotif) => {
    e.stopPropagation();
    markRead(notif.id);
    navigate("/billing");
  };

  return (
    <DashboardLayout
      title="Booking Management"
      subtitle="Manage all booking appointments"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={{
        name: "owner",
        email: "owner@cutbro.com",
        role: "owner",
      }}
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
          title="Subscription"
          highlightedText="Notifications"
          description="Monitor your barbershop subscription status and customer reviews"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total",         value: notifs.length,                                                color: "text-white",      bg: "bg-zinc-800" },
            { label: "Unread",        value: unreadCount,                                                  color: "text-amber-400",  bg: "bg-amber-500/10 border border-amber-500/20" },
            { label: "Expiring Soon", value: notifs.filter((n) => n.category === "expiring_soon").length,  color: "text-rose-400",   bg: "bg-rose-500/10 border border-rose-500/20" },
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
              { key: "all",           label: "All"           },
              { key: "unread",        label: "Unread"        },
              { key: "review",        label: "Reviews"       },
              { key: "expiring_soon", label: "Expiring Soon" },
              { key: "expired",       label: "Expired"       },
              { key: "renewed",       label: "Renewed"       },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key as FilterKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.key
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all">
                <CheckCheck size={13} /> Mark All as Read
              </button>
            )}
            {notifs.length > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-all border border-rose-500/20">
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
                const isSubscriptionAlert = notif.category === "expiring_soon" || notif.category === "expired";

                return (
                  <div
                    key={notif.id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => markRead(notif.id)}
                    className={`notif-item group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      notif.status === "unread"
                        ? "bg-zinc-900 border-zinc-700 hover:border-purple-500/40"
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
                          {notif.category === "review" ? notif.customerName : notif.barbershopName}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        {notif.planName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {notif.planName}
                          </span>
                        )}
                      </div>

                      {notif.category === "review" && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-zinc-500">{notif.serviceName} — {notif.barbershopName}</p>
                          <StarRating rating={notif.rating ?? 0} />
                          {notif.reviewText && (
                            <p className={`text-sm italic ${notif.status === "unread" ? "text-zinc-300" : "text-zinc-500"}`}>
                              "{notif.reviewText}"
                            </p>
                          )}
                        </div>
                      )}

                      {notif.category !== "review" && (
                        <p className={`text-sm mt-1 ${notif.status === "unread" ? "text-zinc-300" : "text-zinc-500"}`}>
                          {notif.message}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <p className="text-xs text-zinc-600 flex items-center gap-1">
                          <Clock size={11} /> {notif.time}
                        </p>
                        {notif.expiredDate && (
                          <p className="text-xs text-zinc-600">
                            Expires: <span className="text-zinc-400">{notif.expiredDate}</span>
                          </p>
                        )}
                        {notif.category === "expiring_soon" && notif.daysLeft !== undefined && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            {notif.daysLeft} days left
                          </span>
                        )}
                      </div>

                      {isSubscriptionAlert && (
                        <button
                          onClick={(e) => handleRenew(e, notif)}
                          className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            notif.category === "expired"
                              ? "bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 hover:border-rose-500/60"
                              : "bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 hover:border-amber-500/60"
                          }`}
                        >
                          <RefreshCw size={11} />
                          {notif.category === "expired" ? "Renew Now" : "Renew Plan"}
                        </button>
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
    </DashboardLayout>
  );
}