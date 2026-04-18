import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCheck, Bell, AlertTriangle, CheckCircle,
  XCircle, Loader2, Star
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { logout } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import Pagination from "@/components/ui/Pagination";
import type { AppNotification } from "@/services/notification.service";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notification.service";
import { requestSubscriptionRefund } from "@/services/owner.service";

/* ================= CATEGORY CONFIG ================= */
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  subscription_active: {
    icon: CheckCircle,
    label: "Subscription Active",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    dot: "bg-green-400",
  },
  subscription_expiring: {
    icon: AlertTriangle,
    label: "Expiring Soon",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
    subscription_expired: {
    icon: XCircle,
    label: "Subscription Expired",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
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
  new_rating: {
    icon: Star,
    label: "New Rating",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
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

function isRefundable(notif: AppNotification): boolean {
  if (notif.type !== "subscription_active") return false;
  const until = notif.data?.refundable_until;
  if (!until) return false;
  return new Date(until) >= new Date();
}

/* ================= COMPONENT ================= */
export default function OwnerNotification() {
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);

  // Refund modal state
  const [refundNotif, setRefundNotif]     = useState<AppNotification | null>(null);
  const [refundReason, setRefundReason]   = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundSent, setRefundSent] = useState<Set<number>>(() => {
    try {
      const saved = sessionStorage.getItem("refundSent");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

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

  const handleSubmitRefund = async () => {
    if (!refundNotif || !refundReason.trim()) return;
    setRefundLoading(true);
    try {
      await requestSubscriptionRefund(refundReason.trim());
      setRefundSent(prev => {
        const updated = new Set(prev).add(refundNotif.id);
        sessionStorage.setItem("refundSent", JSON.stringify([...updated]));
        return updated;
      });
      setRefundNotif(null);
      setRefundReason("");
    } catch (err: any) {
      toast.error("Request Failed", err?.response?.data?.message ?? "Failed to submit refund request.");
    } finally {
      setRefundLoading(false);
    }
  };

  const unread = notifications.filter(n => !n.read_at).length;

  return (
    <DashboardLayout
      logo={ownerLogo}
      menuItems={ownerMenu}
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

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-[#666] font-medium">Total</span>
              <span className="text-2xl font-bold text-white">{total}</span>
              <span className="text-xs text-[#B8B8B8]">notifications</span>
            </div>
            <div className="bg-[#141414] border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-xs text-[#666] font-medium">Unread</span>
              <span className="text-2xl font-bold text-amber-400">{unread}</span>
              <span className="text-xs text-[#B8B8B8]">pending</span>
            </div>
          </div>
        )}

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
              const cfg     = getConfig(notif.type);
              const Icon    = cfg.icon;
              const isRead  = !!notif.read_at;
              const canRefund  = isRefundable(notif) && !refundSent.has(notif.id);
              const sentRefund = refundSent.has(notif.id);

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

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {/* Cancel & Refund button */}
                        {notif.type === "subscription_active" && (
                          canRefund ? (
                            <button
                              onClick={e => { e.stopPropagation(); setRefundNotif(notif); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
                            >
                              Cancel & Refund
                            </button>
                          ) : sentRefund ? (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-[#666] border border-white/10">
                              Request Submitted
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-[#666] border border-white/10">
                              Refund Period Expired
                            </span>
                          )
                        )}

                        {/* Renew button */}
                        {notif.type === "subscription_expiring" && (
                          <button
                            onClick={e => { e.stopPropagation(); navigate("/owner/subscription"); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-all"
                          >
                            Renew Now
                          </button>
                        )}
                      </div>
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

      {/* Refund Confirm Modal */}
      {refundNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget && !refundLoading) setRefundNotif(null); }}
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-white font-bold text-base mb-1">Cancel & Request Refund</h3>
            <p className="text-[#B8B8B8] text-xs mb-4">
              Your subscription will remain active until admin reviews your request.
              Please provide a reason below.
            </p>
            <textarea
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="Reason for refund request..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#555] resize-none outline-none focus:border-[#D4AF37]/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRefundNotif(null); setRefundReason(""); }}
                disabled={refundLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-[#B8B8B8] hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRefund}
                disabled={!refundReason.trim() || refundLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  refundReason.trim() && !refundLoading
                    ? "bg-red-500 hover:bg-red-400 text-white"
                    : "bg-white/10 text-[#444] cursor-not-allowed opacity-40"
                }`}
              >
                {refundLoading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
