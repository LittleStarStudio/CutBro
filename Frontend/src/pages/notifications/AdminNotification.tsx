import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCheck, Bell, AlertCircle, CheckCircle,
  XCircle, Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/ui/Pagination";
import type { AppNotification } from "@/services/notification.service";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notification.service";

/* ================= CATEGORY CONFIG ================= */
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  refund_request_received: {
    icon: AlertCircle,
    label: "Refund Request",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  refund_approved: {
    icon: CheckCircle,
    label: "Refund Approved",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    dot: "bg-green-400",
  },
  refund_rejected: {
    icon: XCircle,
    label: "Refund Declined",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
  default: {
    icon: Bell,
    label: "Notification",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
};

const getConfig = (type: string) => CATEGORY_CONFIG[type] ?? CATEGORY_CONFIG.default;

/* ================= HELPER ================= */
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ================= COMPONENT ================= */
export default function AdminNotification() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await getNotifications(page);
      const d   = res.data.data;
      setNotifications(d.data);
      setCurrentPage(d.current_page);
      setLastPage(d.last_page);
      setTotal(d.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(1); }, [fetchNotifications]);

  const handleMarkRead = async (notif: AppNotification) => {
    if (notif.read_at) return;
    try {
      await markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } catch { /* ignore */ }
  };

  const handlePageChange = (page: number) => {
    fetchNotifications(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const unread = notifications.filter(n => !n.read_at).length;

  return (
    <DashboardLayout
      logo={superAdminLogo}
      menuItems={superAdminMenu}
      onLogout={logout}
    >
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description={`${total} total · ${unread} unread`}
          actions={
            unread > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-[#B8B8B8] hover:text-white hover:bg-white/10 transition-all"
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
            ) : undefined
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#B8B8B8]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Bell size={36} className="text-[#444]" />
            <p className="text-[#B8B8B8]">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => {
              const cfg    = getConfig(notif.type);
              const Icon   = cfg.icon;
              const isRead = !!notif.read_at;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleMarkRead(notif)}
                  className={[
                    "rounded-2xl border p-4 transition-all cursor-pointer",
                    cfg.bg, cfg.border,
                    isRead ? "opacity-60" : "opacity-100",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${cfg.bg} shrink-0`}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 ${isRead ? "opacity-0" : ""}`} />
                          <span className="text-white font-semibold text-sm">{notif.title}</span>
                        </div>
                        <span className="text-[#666] text-xs shrink-0">{timeAgo(notif.created_at)}</span>
                      </div>
                      <p className="text-[#B8B8B8] text-sm leading-relaxed">{notif.body}</p>

                      {/* Action button */}
                      {notif.type === "refund_request_received" && (
                        <div className="mt-3">
                          <button
                            onClick={e => { e.stopPropagation(); navigate("/admin/transaction"); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-all"
                          >
                            View Transactions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <Pagination
              currentPage={currentPage}
              totalPages={lastPage}
              totalItems={total}
              itemsPerPage={20}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
