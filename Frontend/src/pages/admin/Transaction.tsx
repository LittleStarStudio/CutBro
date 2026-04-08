import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  RefreshCcw,
  CheckCircle,
  Copy,
  RotateCcw,
  TrendingUp,
  Wallet,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import { capitalizeFirst } from "@/lib/utils/AdminUtils";

import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/ui/Toast";

import {
  getTransactionStats,
  getAdminTransactions,
  getAdminRefundRequests,
  processSubscriptionRefund,
  approveRefundRequest,
  rejectRefundRequest,
  type TransactionStats,
  type AdminTransaction,
  type AdminRefundRequest,
  syncPendingTransactions,
} from "@/services/admin.service";

/* =========================================================
   TYPES & CONSTANTS
========================================================= */

type TxStatus = "success" | "pending" | "cancelled" | "expired";

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  success:   { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500",  label: "Success"  },
  pending:   { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500", label: "Pending"  },
  cancelled: { bg: "bg-red-500/10 text-red-400",    dot: "bg-red-500",   label: "Cancelled" },
  expired:   { bg: "bg-gray-500/10 text-gray-400",     dot: "bg-gray-500",   label: "Expired"  },
};

const REFUND_STATUS_CONFIG: Record<string, { bg: string; label: string }> = {
  pending:  { bg: "bg-yellow-500/10 text-yellow-400", label: "Refund Pending"  },
  approved: { bg: "bg-green-500/10 text-green-400",   label: "Refunded"        },
  rejected: { bg: "bg-red-500/10 text-red-400",       label: "Refund Rejected" },
};

const STATUS_OPTIONS = [
  { value: "all",       label: "All Status" },
  { value: "success",   label: "Success"    },
  { value: "pending",   label: "Pending"    },
  { value: "cancelled", label: "Cancelled"  },
  { value: "expired",   label: "Expired"    },  
];

const TYPE_OPTIONS = [
  { value: "all",          label: "All Types"    },
  { value: "subscription", label: "Subscription" },
  { value: "booking",      label: "Booking"      },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TransactionPage() {
  const toast       = useToast();
  const currentUser = getUser();

  // ── Data states ──
  const [statsData,    setStatsData]    = useState<TransactionStats | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [refundReqs,   setRefundReqs]   = useState<AdminRefundRequest[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [lastPage,     setLastPage]     = useState(1);
  const [total,        setTotal]        = useState(0);

  // ── Filter states ──
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType,   setFilterType]   = useState("all");

  // ── UI states ──
  const [copiedOrder,       setCopiedOrder]      = useState<string | null>(null);
  const [refundModal,       setRefundModal]       = useState<AdminTransaction | null>(null);
  const [refundReason,      setRefundReason]      = useState("");
  const [refundLoading,     setRefundLoading]     = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess,   setWithdrawSuccess]   = useState(false);
  const [withdrawInput,     setWithdrawInput]     = useState("");

  const [syncing, setSyncing] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR", minimumFractionDigits: 0,
    }).format(amount);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await getTransactionStats();
      setStatsData(data);
    } catch {
      toast.error("Error", "Failed to load transaction stats.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /* ── Fetch transactions ── */
  const fetchTransactions = useCallback(async (page = 1) => {
    try {
      setLoadingTable(true);
      const res = await getAdminTransactions(page, {
        search: searchQuery || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      });
      setTransactions(res.data);
      setCurrentPage(res.current_page);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error("Error", "Failed to load transactions.");
    } finally {
      setLoadingTable(false);
    }
  }, [searchQuery, filterStatus]);

  /* ── Fetch pending refund requests ── */
  const fetchRefundRequests = useCallback(async () => {
    try {
      const res = await getAdminRefundRequests("pending");
      setRefundReqs(res.data);
    } catch {
      // silent — section hides if empty
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRefundRequests();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchTransactions(1), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus]);

  /* ── Client-side type filter ── */
  const filtered = useMemo(() => {
    if (filterType === "all") return transactions;
    return transactions.filter((t) => t.transaction_type === filterType);
  }, [transactions, filterType]);

  /* ── Handlers ── */
  const handleCopyOrder = (orderId: string) => {
    navigator.clipboard.writeText(orderId)
      .then(() => {
        setCopiedOrder(orderId);
        setTimeout(() => setCopiedOrder(null), 1500);
        toast.info("Copied!", `Order ID ${orderId} copied to clipboard.`, 2500);
      })
      .catch(() => toast.error("Copy Failed", "Unable to copy Order ID."));
  };

  const handleRefundClick = (item: AdminTransaction) => {
    setRefundModal(item);
    setRefundReason("");
  };

  const handleApproveRefund = async () => {
    if (!refundModal || !refundReason.trim()) return;
    try {
      setRefundLoading(true);
      await processSubscriptionRefund(refundModal.id, refundReason.trim());
      toast.success("Refund Processed", `Order ${refundModal.order_id} refunded successfully.`);
      setRefundModal(null);
      setRefundReason("");
      fetchTransactions(currentPage);
      fetchStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Refund failed. Please try again.";
      toast.error("Refund Failed", msg);
    } finally {
      setRefundLoading(false);
    }
  };

  const handleRejectRefund = () => {
    toast.info("Cancelled", "Refund action was cancelled.");
    setRefundModal(null);
    setRefundReason("");
  };

  const handleApproveRequest = async (req: AdminRefundRequest, adminNote: string) => {
    try {
      await approveRefundRequest(req.id, adminNote);
      toast.success("Approved", `Refund request ${req.order_id} approved.`);
      fetchRefundRequests();
      fetchStats();
      fetchTransactions(currentPage);
    } catch {
      toast.error("Error", "Failed to approve refund request.");
    }
  };

  const handleRejectRequest = async (req: AdminRefundRequest, adminNote: string) => {
    try {
      await rejectRefundRequest(req.id, adminNote);
      toast.success("Rejected", `Refund request ${req.order_id} rejected.`);
      fetchRefundRequests();
    } catch {
      toast.error("Error", "Failed to reject refund request.");
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await syncPendingTransactions();
      toast.success("Synced!", `${res.synced} transaction(s) updated from Midtrans.`);
      fetchTransactions(currentPage);
      fetchStats();
    } catch {
      toast.error("Sync Failed", "Could not sync transactions from Midtrans.");
    } finally {
      setSyncing(false);
    }
  };

  /* ── Withdraw derived ── */
  const availableBalance = statsData?.available_balance ?? 0;
  const withdrawAmount   = Number(withdrawInput.replace(/\D/g, ""));
  const isWithdrawValid  = withdrawAmount >= 1_000_000 && withdrawAmount <= availableBalance;
  const canWithdraw      = availableBalance >= 1_000_000;

  const handleWithdraw = () => {
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
      setWithdrawInput("");
    }, 2000);
  };

  /* ── Badges ── */
  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      subscription: "bg-blue-500/10 text-blue-400",
      booking:      "bg-teal-500/10 text-teal-400",
    };
    return map[type] ?? "bg-gray-500/10 text-gray-400";
  };

  /* ── Table columns ── */
  const columns = useMemo(() => [
    {
      key: "created_at",
      header: "Date",
      render: (item: AdminTransaction) => (
        <div className="space-y-0.5">
          <p className="text-white text-xs font-medium">{item.created_at}</p>
          {item.paid_at && <p className="text-[#666] text-xs">Paid: {item.paid_at}</p>}
        </div>
      ),
    },
    {
      key: "order_id",
      header: "Order ID",
      render: (item: AdminTransaction) => (
        <div className="flex items-center gap-2">
          <span className="text-[#B8B8B8] text-xs font-mono">{item.order_id}</span>
          <button
            onClick={() => handleCopyOrder(item.order_id)}
            className="text-[#B8B8B8] hover:text-white transition-colors"
          >
            {copiedOrder === item.order_id
              ? <CheckCircle size={13} className="text-green-400" />
              : <Copy size={13} />}
          </button>
        </div>
      ),
    },
    {
      key: "transaction_type",
      header: "Type",
      render: (item: AdminTransaction) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge(item.transaction_type)}`}>
          {capitalizeFirst(item.transaction_type)}
        </span>
      ),
    },
    {
      key: "buyer",
      header: "Buyer",
      render: (item: AdminTransaction) => (
        <div className="space-y-0.5">
          <p className="text-white text-xs font-medium">{item.buyer_name}</p>
          <p className="text-[#666] text-xs truncate max-w-[160px]">{item.buyer_email}</p>
        </div>
      ),
    },
    {
      key: "payment_channel",
      header: "Channel",
      render: (item: AdminTransaction) => (
        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
          {item.payment_channel}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: AdminTransaction) => (
        <span className="text-[#D4AF37] font-semibold text-sm">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: AdminTransaction) => {
        if (item.refund_request) {
          const rc = REFUND_STATUS_CONFIG[item.refund_request.status];
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rc.bg}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {rc.label}
            </span>
          );
        }
        const s = STATUS_CONFIG[item.status as TxStatus] ?? STATUS_CONFIG.pending;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (item: AdminTransaction) => {
        if (item.refund_request?.status === "pending") {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <RotateCcw size={12} /> Pending
            </span>
          );
        }
        if (item.refund_request?.status === "approved") {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle size={12} /> Refunded
            </span>
          );
        }
        const canRefund = item.subscription_status === "active" && !item.refund_request;
        return (
          <button
            onClick={() => canRefund && handleRefundClick(item)}
            disabled={!canRefund}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              canRefund
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black cursor-pointer"
                : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            <RotateCcw size={12} /> Refund
          </button>
        );
      },
    },
  ], [copiedOrder]);

  const isReasonFilled = refundReason.trim().length > 0;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* ── Refund Confirm Modal ── */}
      <Modal
        isOpen={!!refundModal}
        onClose={() => { if (!refundLoading) { setRefundModal(null); setRefundReason(""); } }}
        title="Confirm Refund"
        centerHeader
        subtitle="Review the transaction details and enter a reason for this refund."
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleRejectRefund}
              disabled={!isReasonFilled || refundLoading}
              className={[
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                isReasonFilled && !refundLoading
                  ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
                  : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-40",
              ].join(" ")}
            >
              Reject
            </button>
            <button
              onClick={handleApproveRefund}
              disabled={!isReasonFilled || refundLoading}
              className={[
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                isReasonFilled && !refundLoading
                  ? "bg-green-500 hover:bg-green-400 text-white"
                  : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-40",
              ].join(" ")}
            >
              {refundLoading ? "Processing..." : "Approve & Refund"}
            </button>
          </div>
        }
      >
        {refundModal && (
          <div className="space-y-4">

            {/* Detail transaksi */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800 text-sm">
              {[
                { label: "Order ID",      value: refundModal.order_id },
                { label: "Buyer",    value: refundModal.buyer_name },
                { label: "Channel",  value: refundModal.payment_channel },
                { label: "Payment Date",   value: refundModal.paid_at ?? refundModal.created_at },
                { label: "Status",         value: capitalizeFirst(refundModal.status) },
                { label: "Refund Amount",  value: formatCurrency(refundModal.amount), highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-zinc-400">{label}</span>
                  <span className={highlight ? "text-[#D4AF37] font-bold" : "text-white font-medium text-right max-w-[55%]"}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Reason input */}
            <div>
              <label className="text-[#B8B8B8] text-xs font-medium mb-1.5 block">
                Admin Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter refund reason..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#D4AF37]/60 transition-colors resize-none"
              />
              {!isReasonFilled && (
                <p className="text-amber-400 text-xs mt-1">* Required before buttons are enabled</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Withdraw Modal ── */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !withdrawSuccess) setShowWithdrawModal(false); }}
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            {withdrawSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle size={40} className="text-green-400" />
                </div>
                <p className="text-white font-bold text-lg mt-1">Withdrawal Successful!</p>
                <p className="text-[#D4AF37] font-bold text-xl">{formatCurrency(withdrawAmount)}</p>
                <p className="text-[#B8B8B8] text-sm text-center leading-relaxed">
                  Your funds are being processed to your bank account within 1–3 business days.
                </p>
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
                  <span className="text-[#B8B8B8] text-xs">Available Balance</span>
                  <span className="text-[#D4AF37] font-bold text-sm">{formatCurrency(availableBalance)}</span>
                </div>

                <div className="mb-2">
                  <label className="text-[#B8B8B8] text-xs mb-1.5 block">Withdrawal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B8B8] text-sm font-medium">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1.000.000"
                      value={withdrawInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setWithdrawInput(raw ? Number(raw).toLocaleString("id-ID") : "");
                      }}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
                    />
                  </div>
                </div>

                {withdrawInput !== "" && withdrawAmount < 1_000_000 && (
                  <p className="text-red-400 text-xs mb-3">Minimum withdrawal is {formatCurrency(1_000_000)}</p>
                )}
                {withdrawInput !== "" && withdrawAmount > availableBalance && (
                  <p className="text-red-400 text-xs mb-3">Amount exceeds available balance</p>
                )}
                {isWithdrawValid && (
                  <p className="text-green-400 text-xs mb-3">
                    ✓ Remaining balance after withdrawal: {formatCurrency(availableBalance - withdrawAmount)}
                  </p>
                )}

                <p className="text-[#B8B8B8] text-xs leading-relaxed mb-5 mt-2">
                  Funds will be processed within <span className="text-white">1–3 business days</span> to your registered bank account.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowWithdrawModal(false); setWithdrawInput(""); }}
                    className="flex-1 py-2.5 rounded-lg border border-white/20 text-[#B8B8B8] text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!isWithdrawValid}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 ${isWithdrawValid ? "bg-[#D4AF37] hover:bg-[#c49f30] active:scale-95 text-black" : "bg-white/10 text-[#B8B8B8] cursor-not-allowed opacity-40"}`}
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <DashboardLayout
        title="Transaction Management"
        subtitle="Monitor all platform transactions and manage refunds"
        showSidebar
        menuItems={superAdminMenu}
        logo={superAdminLogo}
        userProfile={currentUser ?? { name: "Super Admin", email: "admin@cutbro.com", role: "admin" }}
        showNotification
        notificationCount={refundReqs.length}
        onLogout={logout}
      >
        <div className="w-full space-y-6 lg:space-y-8">

          {/* ── STATS GRID (4 cards) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

            {/* 1. Total Transactions */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-5 flex items-center gap-3 lg:gap-4 min-w-0">
              <div className="p-2.5 lg:p-3 rounded-lg bg-white/10 flex-shrink-0">
                <TrendingUp size={18} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-[11px] lg:text-xs font-medium truncate">Total Transactions</p>
                <p className="text-white text-lg lg:text-xl font-bold mt-0.5">
                  {loadingStats ? "—" : (statsData?.total_transactions ?? 0)}
                </p>
              </div>
            </div>

            {/* 2. Success Rate */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-5 flex items-center gap-3 lg:gap-4 min-w-0">
              <div className="p-2.5 lg:p-3 rounded-lg bg-white/10 flex-shrink-0">
                <ShieldCheck size={18} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-[11px] lg:text-xs font-medium truncate">Success Rate</p>
                <p className="text-white text-lg lg:text-xl font-bold mt-0.5">
                  {loadingStats ? "—" : `${statsData?.success_rate ?? 0}%`}
                </p>
              </div>
            </div>

            {/* 3. Total Revenue */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-5 flex items-center gap-3 lg:gap-4 min-w-0 col-span-2 lg:col-span-1">
              <div className="p-2.5 lg:p-3 rounded-lg bg-white/10 flex-shrink-0">
                <DollarSign size={18} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-[11px] lg:text-xs font-medium truncate">Total Revenue</p>
                <p className="text-white text-lg lg:text-xl font-bold mt-0.5 truncate">
                  {loadingStats ? "—" : formatCurrency(statsData?.total_revenue ?? 0)}
                </p>
              </div>
            </div>

            {/* 4. Available Balance + Withdraw (full width on mobile) */}
            <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4 lg:p-5 flex flex-col gap-3 min-w-0 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                <div className="p-2.5 lg:p-3 rounded-lg bg-[#D4AF37]/20 flex-shrink-0">
                  <Wallet size={18} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#B8B8B8] text-[11px] lg:text-xs font-medium truncate">Available Balance</p>
                  <p className="text-[#D4AF37] text-lg lg:text-xl font-bold mt-0.5 truncate">
                    {loadingStats ? "—" : formatCurrency(availableBalance)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { if (canWithdraw) { setWithdrawInput(""); setShowWithdrawModal(true); } }}
                disabled={!canWithdraw}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  canWithdraw
                    ? "bg-[#D4AF37] hover:bg-[#c49f30] text-black cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-95"
                    : "bg-white/10 text-[#B8B8B8] cursor-not-allowed opacity-40"
                }`}
              >
                {canWithdraw ? "Withdraw Funds" : "Withdraw Funds (min. Rp 1.000.000)"}
              </button>
            </div>

          </div>

          {/* ── TABLE ── */}
          <div className="flex justify-center md:justify-end">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-[#B8B8B8] border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <RefreshCcw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync Midtrans"}
            </button>
          </div>

          <TableCard
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Search by order ID or barbershop..."
            filters={[
              { label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_OPTIONS },
              { label: "Type",   value: filterType,   onChange: setFilterType,   options: TYPE_OPTIONS   },
            ]}
            isEmpty={!loadingTable && filtered.length === 0}
            emptyIcon={RefreshCcw}
            emptyTitle="No transactions found"
            emptyDescription="Try adjusting your search or filters"
          >
            {/* DESKTOP */}
            <div className="hidden md:block w-full overflow-x-auto">
              <DataTable data={filtered} columns={columns} />
            </div>

            {/* MOBILE */}
            <div className="block md:hidden">
              <MobileCardList
                data={filtered}
                renderCard={(item: AdminTransaction) => {
                  const s = STATUS_CONFIG[item.status as TxStatus] ?? STATUS_CONFIG.pending;
                  const canRefund = item.subscription_status === "active" && !item.refund_request;
                  return (
                    <MobileCard
                      title={item.buyer_name}
                      subtitle={item.buyer_email}
                      headerRight={
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      }
                      fields={[
                        {
                          label: "Order ID",
                          value: (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#B8B8B8]">{item.order_id}</span>
                              <button onClick={() => handleCopyOrder(item.order_id)}>
                                {copiedOrder === item.order_id
                                  ? <CheckCircle size={13} className="text-green-400" />
                                  : <Copy size={13} className="text-[#B8B8B8]" />}
                              </button>
                            </div>
                          ),
                        },
                        { label: "Type",    value: <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(item.transaction_type)}`}>{capitalizeFirst(item.transaction_type)}</span> },
                        { label: "Channel", value: <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">{item.payment_channel}</span> },
                        { label: "Amount",  value: <span className="text-[#D4AF37] font-semibold">{formatCurrency(item.amount)}</span> },
                        { label: "Date",    value: <span className="text-xs text-[#B8B8B8]">{item.created_at}</span> },
                      ]}
                      actions={
                        canRefund ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleRefundClick(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black transition-all"
                            >
                              <RotateCcw size={12} /> Refund
                            </button>
                          </div>
                        ) : undefined
                      }
                    />
                  );
                }}
              />
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => fetchTransactions(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#B8B8B8] border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-[#B8B8B8] text-xs">
                  Page {currentPage} of {lastPage} ({total} total)
                </span>
                <button
                  onClick={() => fetchTransactions(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#B8B8B8] border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </TableCard>

          {/* ── PENDING REFUND REQUESTS ── */}
          {refundReqs.length > 0 && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <div className="px-5 py-4 border-b border-yellow-500/10 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm">Pending Refund Requests</h3>
                  <p className="text-[#B8B8B8] text-xs mt-0.5">
                    Owner-submitted refund requests awaiting admin review
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                  {refundReqs.length}
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {refundReqs.map((req) => (
                  <RefundRequestRow
                    key={req.id}
                    req={req}
                    formatCurrency={formatCurrency}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </>
  );
}

/* =========================================================
   SUB-COMPONENT: Refund Request Row
========================================================= */

function RefundRequestRow({
  req,
  formatCurrency,
  onApprove,
  onReject,
}: {
  req:            AdminRefundRequest;
  formatCurrency: (n: number) => string;
  onApprove:      (req: AdminRefundRequest, note: string) => Promise<void>;
  onReject:       (req: AdminRefundRequest, note: string) => Promise<void>;
}) {
  const [showAction, setShowAction] = useState(false);
  const [adminNote,  setAdminNote]  = useState("");
  const [loading,    setLoading]    = useState(false);

  const noteOk = adminNote.trim().length > 0;

  const handleApprove = async () => {
    if (!noteOk) return;
    setLoading(true);
    await onApprove(req, adminNote.trim());
    setLoading(false);
  };

  const handleReject = async () => {
    if (!noteOk) return;
    setLoading(true);
    await onReject(req, adminNote.trim());
    setLoading(false);
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium">{req.barbershop_name}</span>
            <span className="text-[#B8B8B8] text-xs font-mono">{req.order_id}</span>
          </div>
          <p className="text-[#B8B8B8] text-xs">{req.requester_email}</p>
          <p className="text-[#B8B8B8] text-xs mt-1">
            <span className="text-zinc-500">Reason: </span>{req.reason}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[#D4AF37] font-bold text-sm">{formatCurrency(req.refund_amount)}</span>
            <span className="text-[#666] text-xs">{req.created_at}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAction((v) => !v)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-[#B8B8B8] border border-white/10 hover:bg-white/10 transition-colors"
        >
          {showAction ? "Close" : "Review"}
        </button>
      </div>

      {showAction && (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          <div>
            <label className="text-[#B8B8B8] text-xs font-medium mb-1.5 block">
              Admin Note <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Enter admin note..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#D4AF37]/60 transition-colors resize-none"
            />
            {!noteOk && <p className="text-amber-400 text-xs mt-1">* Required</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={!noteOk || loading}
              className={[
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                noteOk && !loading
                  ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
                  : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-40",
              ].join(" ")}
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={!noteOk || loading}
              className={[
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                noteOk && !loading
                  ? "bg-green-500 hover:bg-green-400 text-white"
                  : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-40",
              ].join(" ")}
            >
              {loading ? "Processing..." : "Approve & Refund"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

