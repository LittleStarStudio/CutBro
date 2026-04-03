import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useMemo } from "react";
import {
  RefreshCcw,
  CheckCircle,
  Copy,
  RotateCcw,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import { capitalizeFirst } from "@/lib/utils/AdminUtils";

import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Modal from "@/components/admin/Modal";
import { useToast } from "@/components/ui/Toast";

/* =========================================================
   TYPES
========================================================= */

type RefundStatus = "success" | "pending" | "failed" | "refunded";

type RefundRow = {
  id:          string;
  dateTime:    string;
  orderId:     string;
  payment:     string;
  status:      RefundStatus;
  amount:      number;
  email:       string;
  refundedAt?: string;
};

/* =========================================================
   DUMMY DATA
========================================================= */

const DUMMY_REFUND_DATA: RefundRow[] = [
  { id: "1",  dateTime: "2026-02-01 09:14:22", orderId: "ORD-2026-0001", payment: "QRIS",     status: "success",  amount: 75000,  email: "rizky.pratama@gmail.com"    },
  { id: "2",  dateTime: "2026-02-02 11:30:05", orderId: "ORD-2026-0002", payment: "Transfer", status: "pending",  amount: 50000,  email: "eko.santoso@gmail.com"      },
  { id: "4",  dateTime: "2026-02-04 08:22:41", orderId: "ORD-2026-0004", payment: "QRIS",     status: "failed",   amount: 150000, email: "dimas.kurniawan@yahoo.com"  },
  { id: "6",  dateTime: "2026-02-07 10:12:33", orderId: "ORD-2026-0006", payment: "Ewallet",  status: "refunded", amount: 90000,  email: "galih.purnomo@gmail.com",   refundedAt: "2026-02-08 09:00:00" },
  { id: "7",  dateTime: "2026-02-08 16:04:58", orderId: "ORD-2026-0007", payment: "QRIS",     status: "success",  amount: 60000,  email: "hendro.saputra@hotmail.com" },
  { id: "9",  dateTime: "2026-02-11 11:19:44", orderId: "ORD-2026-0009", payment: "QRIS",     status: "success",  amount: 110000, email: "joko.widi@gmail.com"        },
  { id: "10", dateTime: "2026-02-12 15:07:13", orderId: "ORD-2026-0010", payment: "Ewallet",  status: "refunded", amount: 65000,  email: "kevin.aditya@gmail.com",    refundedAt: "2026-02-13 14:30:00" },
  { id: "12", dateTime: "2026-02-15 12:33:51", orderId: "ORD-2026-0012", payment: "QRIS",     status: "failed",   amount: 55000,  email: "mario.susanto@gmail.com"    },
  { id: "13", dateTime: "2026-02-17 10:01:39", orderId: "ORD-2026-0013", payment: "Ewallet",  status: "success",  amount: 85000,  email: "nanda.pratama@gmail.com"    },
  { id: "15", dateTime: "2026-02-19 09:17:52", orderId: "ORD-2026-0015", payment: "Transfer", status: "success",  amount: 40000,  email: "panji.wibowo@yahoo.com"     },
  { id: "16", dateTime: "2026-02-20 16:45:30", orderId: "ORD-2026-0016", payment: "Ewallet",  status: "refunded", amount: 50000,  email: "raka.setiawan@gmail.com",   refundedAt: "2026-02-21 10:15:00" },
  { id: "18", dateTime: "2026-02-22 08:44:07", orderId: "ORD-2026-0018", payment: "QRIS",     status: "success",  amount: 90000,  email: "tito.raharjo@gmail.com"     },
  { id: "19", dateTime: "2026-02-24 13:09:26", orderId: "ORD-2026-0019", payment: "Transfer", status: "failed",   amount: 55000,  email: "umar.farouq@gmail.com"      },
];

/* =========================================================
   FILTER OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "success",  label: "Success"    },
  { value: "pending",  label: "Pending"    },
  { value: "failed",   label: "Failed"     },
  { value: "refunded", label: "Refunded"   },
];

const METHOD_OPTIONS = [
  { value: "all",      label: "All Methods" },
  { value: "transfer", label: "Transfer"    },
  { value: "qris",     label: "QRIS"        },
  { value: "ewallet",  label: "Ewallet"     },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function OwnerReportRefund() {
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [copiedOrder,  setCopiedOrder]  = useState<string | null>(null);
  const [confirmItem,  setConfirmItem]  = useState<RefundRow | null>(null);
  const [transactions, setTransactions] = useState<RefundRow[]>(DUMMY_REFUND_DATA);

  /* ── Withdraw states ── */
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess,   setWithdrawSuccess]   = useState(false);
  const [withdrawnAmount,   setWithdrawnAmount]   = useState(0);
  const [withdrawInput,     setWithdrawInput]     = useState("");

  const toast = useToast();
  const currentUser = getUser();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  /* ── filtered ── */
  const filtered = useMemo(() => {
    return transactions.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.email?.toLowerCase().includes(q) ||
        item.orderId?.toLowerCase().includes(q);

      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesMethod = filterMethod === "all" || item.payment.toLowerCase() === filterMethod;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [searchQuery, filterStatus, filterMethod, transactions]);

  /* ── stats ── */
  const stats = useMemo(() => {
    const total       = transactions.length;
    const totalAmount = transactions.reduce((a, b) => a + b.amount, 0);
    const avg         = total > 0 ? Math.round(totalAmount / total) : 0;
    const refundedTotal = transactions
      .filter((t) => t.status === "refunded")
      .reduce((a, b) => a + b.amount, 0);
    const balance = totalAmount - refundedTotal - withdrawnAmount;
    return { total, avg, balance };
  }, [transactions, withdrawnAmount]);

  /* ── withdraw derived ── */
  const withdrawAmount  = Number(withdrawInput.replace(/\D/g, ""));
  const isWithdrawValid = withdrawAmount >= 1_000_000 && withdrawAmount <= stats.balance;
  const canWithdraw     = stats.balance >= 1_000_000;

  /* ── copy ── */
  const handleCopyOrder = (orderId: string) => {
    navigator.clipboard
      .writeText(orderId)
      .then(() => {
        setCopiedOrder(orderId);
        setTimeout(() => setCopiedOrder(null), 1500);
        toast.info("Copied!", `Order ID ${orderId} copied to clipboard.`, 2500);
      })
      .catch(() => {
        toast.error("Copy Failed", "Unable to copy Order ID. Please try again.");
      });
  };

  /* ── refund ── */
  const handleRefundClick = (item: RefundRow) => setConfirmItem(item);

  const handleConfirmRefund = () => {
    if (!confirmItem) return;
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === confirmItem.id
          ? { ...t, status: "refunded" as RefundStatus, refundedAt: now }
          : t,
      ),
    );
    toast.success(
      "Refund Processed",
      `Order ${confirmItem.orderId} (${formatCurrency(confirmItem.amount)}) has been successfully refunded.`,
    );
    setConfirmItem(null);
  };

  /* ── withdraw handler ── */
  const handleWithdraw = () => {
    const amount = Number(withdrawInput.replace(/\D/g, ""));
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawnAmount((prev) => prev + amount);
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
      setWithdrawInput("");
    }, 2000);
  };

  /* ── badges ── */
  const paymentBadge = (method: string) => {
    const map: Record<string, string> = {
      transfer: "bg-cyan-500/10 text-cyan-400",
      qris:     "bg-indigo-500/10 text-indigo-400",
      ewallet:  "bg-pink-500/10 text-pink-400",
    };
    return map[method.toLowerCase()] ?? "bg-gray-500/10 text-gray-400";
  };

  const statusConfig: Record<RefundStatus, { bg: string; dot: string }> = {
    success:  { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500"  },
    pending:  { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500" },
    failed:   { bg: "bg-red-500/10 text-red-400",       dot: "bg-red-500"    },
    refunded: { bg: "bg-amber-500/10 text-amber-400",   dot: "bg-amber-500"  },
  };

  /* ── columns ── */
  const columns = useMemo(() => [
    {
      key: "dateTime",
      header: "Date & Time",
      render: (item: RefundRow) => (
        <div className="space-y-0.5">
          <p className="text-white text-xs font-medium">{item.dateTime.split(" ")[0]}</p>
          <p className="text-[#666] text-xs">{item.dateTime.split(" ")[1]}</p>
        </div>
      ),
    },
    {
      key: "orderId",
      header: "Order ID",
      render: (item: RefundRow) => (
        <div className="flex items-center gap-2">
          <span className="text-[#B8B8B8] text-xs font-mono">{item.orderId}</span>
          <button
            onClick={() => handleCopyOrder(item.orderId)}
            className="text-[#B8B8B8] hover:text-white transition-colors"
            title="Copy order ID"
          >
            {copiedOrder === item.orderId ? (
              <CheckCircle size={13} className="text-green-400" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: () => (
        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400">
          Customer
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (item: RefundRow) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadge(item.payment)}`}>
          {item.payment}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: RefundRow) => {
        const s = statusConfig[item.status];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {capitalizeFirst(item.status)}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: RefundRow) => (
        <span className="text-[#D4AF37] font-semibold text-sm">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (item: RefundRow) => (
        <span className="text-[#B8B8B8] text-xs">{item.email}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (item: RefundRow) => {
        const isEligible = item.status === "success";
        return (
          <button
            onClick={() => isEligible && handleRefundClick(item)}
            disabled={!isEligible}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              isEligible
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black cursor-pointer"
                : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            <RotateCcw size={12} />
            Refund
          </button>
        );
      },
    },
  ], [copiedOrder, transactions]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      {/* ── Refund confirm modal ── */}
      <Modal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title="Confirm Refund"
        subtitle="You are about to process a refund for this customer. This action cannot be undone."
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmItem(null)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRefund}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
            >
              Process Refund
            </button>
          </div>
        }
      >
        {confirmItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto">
              <RotateCcw size={26} className="text-amber-400" />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800 text-sm">
              {[
                { label: "Order ID", value: confirmItem.orderId                                },
                { label: "Role",     value: "Customer"                                         },
                { label: "Email",    value: confirmItem.email                                  },
                { label: "Payment",  value: confirmItem.payment                                },
                { label: "Amount",   value: formatCurrency(confirmItem.amount), highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-zinc-400">{label}</span>
                  <span className={highlight ? "text-[#D4AF37] font-bold" : "text-white font-medium"}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Withdraw Modal ── */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !withdrawSuccess) setShowWithdrawModal(false);
          }}
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">

            {withdrawSuccess ? (
              /* SUCCESS STATE */
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle size={40} className="text-green-400" />
                </div>
                <p className="text-white font-bold text-lg mt-1">Withdrawal Successful!</p>
                <p className="text-[#D4AF37] font-bold text-xl">
                  {formatCurrency(Number(withdrawInput.replace(/\D/g, "")))}
                </p>
                <p className="text-[#B8B8B8] text-sm text-center leading-relaxed">
                  Your funds are being processed to your bank account within 1–3 business days.
                </p>
              </div>
            ) : (
              /* CONFIRM STATE */
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

                {/* Available balance */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-4 flex justify-between items-center">
                  <span className="text-[#B8B8B8] text-xs">Available Balance</span>
                  <span className="text-[#D4AF37] font-bold text-sm">{formatCurrency(stats.balance)}</span>
                </div>

                {/* Input nominal */}
                <div className="mb-2">
                  <label className="text-[#B8B8B8] text-xs mb-1.5 block">Withdrawal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B8B8] text-sm font-medium">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1.000.000"
                      value={withdrawInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const formatted = raw ? Number(raw).toLocaleString("id-ID") : "";
                        setWithdrawInput(formatted);
                      }}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm outline-none focus:border-[#D4AF37]/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Validation messages */}
                {withdrawInput !== "" && withdrawAmount < 1_000_000 && (
                  <p className="text-red-400 text-xs mb-3">
                    Minimum withdrawal is {formatCurrency(1_000_000)}
                  </p>
                )}
                {withdrawInput !== "" && withdrawAmount > stats.balance && (
                  <p className="text-red-400 text-xs mb-3">Amount exceeds available balance</p>
                )}
                {isWithdrawValid && (
                  <p className="text-green-400 text-xs mb-3">
                    ✓ Remaining balance after withdrawal:{" "}
                    {formatCurrency(stats.balance - withdrawAmount)}
                  </p>
                )}

                <p className="text-[#B8B8B8] text-xs leading-relaxed mb-5 mt-2">
                  Funds will be processed within{" "}
                  <span className="text-white">1–3 business days</span> to your registered bank
                  account. Please ensure your account details are correct.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawInput("");
                    }}
                    className="flex-1 py-2.5 rounded-lg border border-white/20 text-[#B8B8B8] text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!isWithdrawValid}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-150
                      ${isWithdrawValid
                        ? "bg-[#D4AF37] hover:bg-[#c49f30] active:scale-95 text-black"
                        : "bg-white/10 text-[#B8B8B8] cursor-not-allowed opacity-40"
                      }`}
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
        title="Customer Refund Transactions"
        subtitle="Manage and process refund requests from your customers"
        showSidebar
        menuItems={ownerMenu}
        logo={ownerLogo}
        userProfile={currentUser ?? {
          name: "Owner",
          email: "owner@cutbro.com",
          role: "owner",
        }}
        showNotification
        notificationCount={3}
        onLogout={logout}
      >
        <div className="w-full space-y-6 lg:space-y-8">

          {/* ── STATS GRID ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">

            {/* Total Transaction */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
                <Receipt size={20} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-xs font-medium truncate">Total Transaction</p>
                <p className="text-white text-xl font-bold mt-0.5 truncate">{stats.total}</p>
              </div>
            </div>

            {/* Avg Transaction */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
                <TrendingUp size={20} className="text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[#B8B8B8] text-xs font-medium truncate">Avg Transaction</p>
                <p className="text-white text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.avg)}</p>
              </div>
            </div>

            {/* Total Balance + Withdraw Button */}
            <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-5 flex flex-col gap-4 min-w-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 rounded-lg bg-[#D4AF37]/20 flex-shrink-0">
                  <Wallet size={20} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#B8B8B8] text-xs font-medium truncate">Total Balance</p>
                  <p className="text-[#D4AF37] text-xl font-bold mt-0.5 truncate">
                    {formatCurrency(stats.balance)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (canWithdraw) {
                    setWithdrawInput("");
                    setShowWithdrawModal(true);
                  }
                }}
                disabled={!canWithdraw}
                title={
                  !canWithdraw
                    ? "Minimum withdrawal is Rp 1,000,000"
                    : "Withdraw funds now"
                }
                className={`
                  w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${canWithdraw
                    ? "bg-[#D4AF37] hover:bg-[#c49f30] text-black cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-95"
                    : "bg-white/10 text-[#B8B8B8] cursor-not-allowed opacity-40"
                  }
                `}
              >
                {canWithdraw ? "Withdraw Funds" : "Withdraw Funds (min. Rp 1,000,000)"}
              </button>
            </div>
          </div>

          {/* ── TABLE ── */}
          <TableCard
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchPlaceholder="Search by email or order ID..."
            filters={[
              {
                label: "Status",
                value: filterStatus,
                onChange: setFilterStatus,
                options: STATUS_OPTIONS,
              },
              {
                label: "Payment",
                value: filterMethod,
                onChange: setFilterMethod,
                options: METHOD_OPTIONS,
              },
            ]}
            isEmpty={filtered.length === 0}
            emptyIcon={RefreshCcw}
            emptyTitle="No customer refund transactions found"
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
                renderCard={(item: RefundRow) => {
                  const s = statusConfig[item.status];
                  const isEligible = item.status === "success";
                  return (
                    <MobileCard
                      title={item.email}
                      subtitle={undefined}
                      headerRight={
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {capitalizeFirst(item.status)}
                        </span>
                      }
                      fields={[
                        {
                          label: "Order ID",
                          value: (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#B8B8B8]">{item.orderId}</span>
                              <button onClick={() => handleCopyOrder(item.orderId)}>
                                {copiedOrder === item.orderId
                                  ? <CheckCircle size={13} className="text-green-400" />
                                  : <Copy size={13} className="text-[#B8B8B8]" />}
                              </button>
                            </div>
                          ),
                        },
                        {
                          label: "Date & Time",
                          value: <span className="text-xs text-[#B8B8B8]">{item.dateTime}</span>,
                        },
                        {
                          label: "Role",
                          value: (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400">
                              Customer
                            </span>
                          ),
                        },
                        {
                          label: "Payment",
                          value: (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${paymentBadge(item.payment)}`}>
                              {item.payment}
                            </span>
                          ),
                        },
                        {
                          label: "Amount",
                          value: (
                            <span className="text-[#D4AF37] font-semibold">
                              {formatCurrency(item.amount)}
                            </span>
                          ),
                        },
                        {
                          label: "Action",
                          value: (
                            <button
                              onClick={() => isEligible && handleRefundClick(item)}
                              disabled={!isEligible}
                              className={[
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                isEligible
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-black cursor-pointer"
                                  : "bg-[#1A1A1A] text-[#444] border border-[#2A2A2A] cursor-not-allowed opacity-50",
                              ].join(" ")}
                            >
                              <RotateCcw size={12} />
                              Refund
                            </button>
                          ),
                        },
                      ]}
                    />
                  );
                }}
              />
            </div>
          </TableCard>

        </div>
      </DashboardLayout>
    </>
  );
}