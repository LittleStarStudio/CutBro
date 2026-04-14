import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { RefreshCcw, CheckCircle, Copy, Receipt, TrendingUp, Wallet, ArrowRight, X } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";
import type { Transaction } from "@/services/owner.service";

import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/ui/Toast";

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS = [
  { value: "all",              label: "All Status"        },
  { value: "paid",             label: "Paid"              },
  { value: "done",             label: "Done"              },
  { value: "cancelled",        label: "Cancelled"         },
  { value: "refund_requested", label: "Refund Requested"  },
  { value: "forwarded",        label: "Forwarded to Admin"},
  { value: "refunded",         label: "Refunded"          },
  { value: "refund_rejected",  label: "Refund Rejected"   },
  { value: "no_show",          label: "No Show"           },
];

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  paid:             { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500",  label: "Paid"               },
  done:             { bg: "bg-blue-500/10 text-blue-400",     dot: "bg-blue-500",   label: "Done"               },
  cancelled:        { bg: "bg-zinc-500/10 text-zinc-400",     dot: "bg-zinc-500",   label: "Cancelled"          },
  refund_requested: { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500", label: "Refund Requested"   },
  forwarded:        { bg: "bg-purple-500/10 text-purple-400", dot: "bg-purple-500", label: "Forwarded to Admin" },
  refunded:         { bg: "bg-teal-500/10 text-teal-400",     dot: "bg-teal-500",   label: "Refunded"           },
  refund_rejected:  { bg: "bg-red-500/10 text-red-400",       dot: "bg-red-500",    label: "Refund Rejected"    },
  no_show:          { bg: "bg-orange-500/10 text-orange-400", dot: "bg-orange-500", label: "No Show"            },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { bg: "bg-gray-500/10 text-gray-400", dot: "bg-gray-500", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function OwnerReportRefund() {
  const [transactions,      setTransactions]      = useState<Transaction[]>([]);
  const [searchQuery,       setSearchQuery]       = useState("");
  const [filterStatus,      setFilterStatus]      = useState("all");
  const [copiedOrder,       setCopiedOrder]       = useState<string | null>(null);

  const [forwardItem,       setForwardItem]       = useState<Transaction | null>(null);
  const [isForwarding,      setIsForwarding]      = useState(false);

  const [rejectItem,        setRejectItem]        = useState<Transaction | null>(null);
  const [rejectReason,      setRejectReason]      = useState("");
  const [isRejecting,       setIsRejecting]       = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess,   setWithdrawSuccess]   = useState(false);
  const [withdrawnAmount,   setWithdrawnAmount]   = useState(0);
  const [withdrawInput,     setWithdrawInput]     = useState("");

  const toast = useToast();
  const { user, logout } = useAuth();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const loadTransactions = () => {
    ownerService.getTransactions().then(setTransactions).catch(() => {
      toast.error("Failed to Load", "Could not fetch transactions. Please refresh the page.");
    });
  };

  useEffect(() => { loadTransactions(); }, []);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const revenue       = transactions.filter(t => ["paid", "done"].includes(t.display_status));
    const grossRevenue  = revenue.reduce((s, t) => s + t.gross_amount, 0);
    const totalFee      = revenue.reduce((s, t) => s + t.platform_fee, 0);
    const refundedTotal = transactions.filter(t => t.display_status === "refunded").reduce((s, t) => s + t.gross_amount, 0);
    const netBalance    = grossRevenue - totalFee - refundedTotal - withdrawnAmount;
    return { total: transactions.length, grossRevenue, totalFee, netBalance };
  }, [transactions, withdrawnAmount]);

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => {
      const matchSearch = !q || t.order_id.toLowerCase().includes(q) || t.customer_email.toLowerCase().includes(q) || t.customer_name.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || t.display_status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, searchQuery, filterStatus]);

  /* ── Copy ── */
  const handleCopyOrder = (orderId: string) => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopiedOrder(orderId);
      setTimeout(() => setCopiedOrder(null), 1500);
      toast.info("Copied!", `Order ID ${orderId} copied.`, 2500);
    });
  };

  /* ── Forward ── */
  const handleConfirmForward = async () => {
    if (!forwardItem?.refund_request_id) return;
    setIsForwarding(true);
    try {
      await ownerService.forwardRefundToAdmin(forwardItem.refund_request_id);
      loadTransactions();
      toast.success("Forwarded", `Refund request for ${forwardItem.order_id} forwarded to admin.`);
    } catch (err: any) {
      toast.error("Failed", err?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setIsForwarding(false);
      setForwardItem(null);
    }
  };

  /* ── Reject ── */
  const handleConfirmReject = async () => {
    if (!rejectItem?.refund_request_id) return;
    setIsRejecting(true);
    try {
      await ownerService.ownerRejectRefund(rejectItem.refund_request_id, rejectReason || undefined);
      loadTransactions();
      toast.success("Rejected", `Refund request for ${rejectItem.order_id} has been rejected.`);
    } catch (err: any) {
      toast.error("Failed", err?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setIsRejecting(false);
      setRejectItem(null);
      setRejectReason("");
    }
  };

  /* ── Withdraw ── */
  const withdrawAmount  = Number(withdrawInput.replace(/\D/g, ""));
  const isWithdrawValid = withdrawAmount >= 1_000_000 && withdrawAmount <= stats.netBalance;
  const canWithdraw     = stats.netBalance >= 1_000_000;

  const handleWithdraw = () => {
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawnAmount(prev => prev + withdrawAmount);
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
      setWithdrawInput("");
    }, 2000);
  };

  /* ── Columns ── */
  const columns = useMemo(() => [
    {
      key: "booking_date",
      header: "Date",
      render: (t: Transaction) => <span className="text-[#B8B8B8] text-xs">{t.booking_date}</span>,
    },
    {
      key: "order_id",
      header: "Order ID",
      render: (t: Transaction) => (
        <div className="flex items-center gap-2">
          <span className="text-[#B8B8B8] text-xs font-mono">{t.order_id}</span>
          <button onClick={() => handleCopyOrder(t.order_id)} className="text-[#B8B8B8] hover:text-white">
            {copiedOrder === t.order_id ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (t: Transaction) => (
        <div className="space-y-0.5">
          <p className="text-white text-xs font-medium">{t.customer_name}</p>
          <p className="text-[#666] text-xs">{t.customer_email}</p>
        </div>
      ),
    },
    {
      key: "service_name",
      header: "Service",
      render: (t: Transaction) => <span className="text-[#B8B8B8] text-xs">{t.service_name}</span>,
    },
    {
      key: "payment_method",
      header: "Payment",
      render: (t: Transaction) => <span className="text-[#B8B8B8] text-xs">{t.payment_method ?? "-"}</span>,
    },
    {
      key: "gross_amount",
      header: "Gross",
      render: (t: Transaction) => <span className="text-white text-xs font-medium">{formatCurrency(t.gross_amount)}</span>,
    },
    {
      key: "net_amount",
      header: "Net (98%)",
      render: (t: Transaction) => <span className="text-[#D4AF37] text-xs font-semibold">{formatCurrency(t.net_amount)}</span>,
    },
    {
      key: "display_status",
      header: "Status",
      render: (t: Transaction) => (
        <div className="space-y-1">
          <StatusBadge status={t.display_status} />
          {t.display_status === "refund_requested" && t.refund_reason && (
            <p className="text-xs text-yellow-400/70 max-w-[180px] truncate" title={t.refund_reason}>{t.refund_reason}</p>
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      render: (t: Transaction) => {
        if (t.display_status !== "refund_requested" || !t.refund_request_id) return null;
        return (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setForwardItem(t)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white transition-all"
            >
              <ArrowRight size={11} /> Forward
            </button>
            <button
              onClick={() => { setRejectItem(t); setRejectReason(""); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={11} /> Reject
            </button>
          </div>
        );
      },
    },
  ], [copiedOrder]);

  /* =========================================================
     UI
  ========================================================= */
  return (
    <>
      {/* ── Forward Modal ── */}
      <Modal
        isOpen={!!forwardItem}
        onClose={() => !isForwarding && setForwardItem(null)}
        title="Forward Refund to Admin"
        subtitle="The customer's refund request will be sent to admin for review."
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setForwardItem(null)} disabled={isForwarding}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-medium disabled:opacity-40">
              Cancel
            </button>
            <button onClick={handleConfirmForward} disabled={isForwarding}
              className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-colors disabled:opacity-40">
              {isForwarding ? "Forwarding..." : "Forward to Admin"}
            </button>
          </div>
        }
      >
        {forwardItem && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800 text-sm">
            {[
              { label: "Order ID", value: forwardItem.order_id },
              { label: "Customer", value: forwardItem.customer_name },
              { label: "Service",  value: forwardItem.service_name },
              { label: "Amount",   value: formatCurrency(forwardItem.gross_amount), highlight: true },
              { label: "Reason",   value: forwardItem.refund_reason ?? "-" },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-start justify-between px-4 py-3 gap-4">
                <span className="text-zinc-400 flex-shrink-0">{label}</span>
                <span className={`text-right ${highlight ? "text-[#D4AF37] font-bold" : "text-white font-medium"}`}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal
        isOpen={!!rejectItem}
        onClose={() => !isRejecting && setRejectItem(null)}
        title="Reject Refund Request"
        subtitle="The customer's refund request will be rejected. This action cannot be undone."
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setRejectItem(null)} disabled={isRejecting}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm font-medium disabled:opacity-40">
              Cancel
            </button>
            <button onClick={handleConfirmReject} disabled={isRejecting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-colors disabled:opacity-40">
              {isRejecting ? "Rejecting..." : "Reject Request"}
            </button>
          </div>
        }
      >
        {rejectItem && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800 text-sm">
              {[
                { label: "Order ID", value: rejectItem.order_id },
                { label: "Customer", value: rejectItem.customer_name },
                { label: "Amount",   value: formatCurrency(rejectItem.gross_amount), highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-zinc-400">{label}</span>
                  <span className={highlight ? "text-[#D4AF37] font-bold" : "text-white font-medium"}>{value}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="text-[#B8B8B8] text-xs block mb-1.5">Reason for Rejection (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejecting this refund..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm outline-none focus:border-red-500/60 transition-colors resize-none placeholder:text-[#555]"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Withdraw Modal ── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget && !withdrawSuccess) setShowWithdrawModal(false); }}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            {withdrawSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle size={40} className="text-green-400" />
                </div>
                <p className="text-white font-bold text-lg mt-1">Withdrawal Successful!</p>
                <p className="text-[#D4AF37] font-bold text-xl">{formatCurrency(withdrawAmount)}</p>
                <p className="text-[#B8B8B8] text-sm text-center">Funds processed to your bank within 1–3 business days.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                    <Wallet size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Withdraw Funds</h3>
                    <p className="text-[#B8B8B8] text-xs">Confirm balance withdrawal</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-4 flex justify-between items-center">
                  <span className="text-[#B8B8B8] text-xs">Net Balance</span>
                  <span className="text-[#D4AF37] font-bold text-sm">{formatCurrency(stats.netBalance)}</span>
                </div>
                <div className="mb-2">
                  <label className="text-[#B8B8B8] text-xs mb-1.5 block">Withdrawal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B8B8] text-sm">Rp</span>
                    <input type="text" inputMode="numeric" placeholder="1.000.000" value={withdrawInput}
                      onChange={e => { const r = e.target.value.replace(/\D/g, ""); setWithdrawInput(r ? Number(r).toLocaleString("id-ID") : ""); }}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
                    />
                  </div>
                </div>
                {withdrawInput !== "" && withdrawAmount < 1_000_000 && <p className="text-red-400 text-xs mb-3">Minimum {formatCurrency(1_000_000)}</p>}
                {withdrawInput !== "" && withdrawAmount > stats.netBalance && <p className="text-red-400 text-xs mb-3">Exceeds available balance</p>}
                {isWithdrawValid && <p className="text-green-400 text-xs mb-3">✓ Remaining: {formatCurrency(stats.netBalance - withdrawAmount)}</p>}
                <p className="text-[#B8B8B8] text-xs leading-relaxed mb-5 mt-2">Funds processed within <span className="text-white">1–3 business days</span>.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setShowWithdrawModal(false); setWithdrawInput(""); }}
                    className="flex-1 py-2.5 rounded-lg border border-white/20 text-[#B8B8B8] text-sm hover:bg-white/5 transition-colors">Cancel</button>
                  <button onClick={handleWithdraw} disabled={!isWithdrawValid}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isWithdrawValid ? "bg-[#D4AF37] hover:bg-[#c49f30] text-black active:scale-95" : "bg-white/10 text-[#B8B8B8] cursor-not-allowed opacity-40"}`}>
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <DashboardLayout
        title="Customer Transactions"
        subtitle="View all booking transactions and manage customer refund requests"
        showSidebar
        menuItems={ownerMenu}
        logo={ownerLogo}
        userProfile={user ?? { name: "Owner", email: "owner@cutbro.com", role: "owner" }}
        showNotification
        notificationCount={3}
        onLogout={logout}
      >
        <div className="w-full space-y-6 lg:space-y-8">

          {/* ── STATS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">

            <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
                <Receipt size={20} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-xs font-medium">Total Transactions</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.total}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
                <TrendingUp size={20} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-xs font-medium">Gross Revenue</p>
                <p className="text-white text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.grossRevenue)}</p>
                <p className="text-red-400 text-xs mt-0.5">- {formatCurrency(stats.totalFee)} (2% fee)</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#D4AF37]/20 flex-shrink-0">
                  <Wallet size={20} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#B8B8B8] text-xs font-medium">Net Balance</p>
                  <p className="text-[#D4AF37] text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.netBalance)}</p>
                </div>
              </div>
              <button
                onClick={() => { if (canWithdraw) { setWithdrawInput(""); setShowWithdrawModal(true); } }}
                disabled={!canWithdraw}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${canWithdraw ? "bg-[#D4AF37] hover:bg-[#c49f30] text-black cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-95" : "bg-white/10 text-[#B8B8B8] cursor-not-allowed opacity-40"}`}
              >
                {canWithdraw ? "Withdraw Funds" : "Withdraw Funds (min. Rp 1,000,000)"}
              </button>
            </div>
          </div>

          {/* ── TABLE ── */}
          <TableCard
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Search by order ID, name, or email..."
            filters={[{ label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_OPTIONS }]}
            isEmpty={filtered.length === 0}
            emptyIcon={RefreshCcw}
            emptyTitle="No transactions found"
            emptyDescription="Try adjusting your search or filters"
          >
            <div className="hidden md:block w-full overflow-x-auto">
              <DataTable data={filtered} columns={columns} />
            </div>
            <div className="block md:hidden">
              <MobileCardList
                data={filtered}
                renderCard={(t: Transaction) => (
                  <MobileCard
                    title={t.customer_name}
                    subtitle={<p className="text-xs text-[#B8B8B8]">{t.customer_email}</p>}
                    headerRight={<StatusBadge status={t.display_status} />}
                    fields={[
                      { label: "Order ID", value: (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{t.order_id}</span>
                          <button onClick={() => handleCopyOrder(t.order_id)}>
                            {copiedOrder === t.order_id ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} className="text-[#B8B8B8]" />}
                          </button>
                        </div>
                      )},
                      { label: "Date",    value: t.booking_date },
                      { label: "Service", value: t.service_name },
                      { label: "Gross",   value: formatCurrency(t.gross_amount) },
                      { label: "Net",     value: <span className="text-[#D4AF37] font-semibold">{formatCurrency(t.net_amount)}</span> },
                    ]}
                    actions={
                      t.display_status === "refund_requested" && t.refund_request_id ? (
                        <div className="flex gap-2">
                          <button onClick={() => setForwardItem(t)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">Forward</button>
                          <button onClick={() => { setRejectItem(t); setRejectReason(""); }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">Reject</button>
                        </div>
                      ) : undefined
                    }
                  />
                )}
              />
            </div>
          </TableCard>
        </div>
      </DashboardLayout>
    </>
  );
}
