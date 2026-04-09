import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingUp, Users, Building2, FileSpreadsheet, Loader2, Copy, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import { getTransactionStats, getAdminTransactions } from "@/services/admin.service";
import type { AdminTransaction, TransactionStats } from "@/services/admin.service";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  success:         { bg: "bg-blue-500/10 text-blue-400",     dot: "bg-blue-500",   label: "Success"         },
  pending:         { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500", label: "Pending"         },
  cancelled:       { bg: "bg-red-500/10 text-red-400",       dot: "bg-red-500",    label: "Cancelled"       },
  expired:         { bg: "bg-gray-500/10 text-gray-400",     dot: "bg-gray-500",   label: "Expired"         },
  refunded:        { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500",  label: "Refunded"        },
  refund_rejected: { bg: "bg-purple-500/10 text-purple-400", dot: "bg-purple-500", label: "Refund Rejected" },
  refund_pending:  { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500", label: "Refund Pending"  },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all",          label: "All Types"    },
  { value: "subscription", label: "Subscription" },
  { value: "booking",      label: "Booking"      },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",             label: "All Status"      },
  { value: "success",         label: "Success"         },
  { value: "pending",         label: "Pending"         },
  { value: "cancelled",       label: "Cancelled"       },
  { value: "expired",         label: "Expired"         },
  { value: "refunded",        label: "Refunded"        },
  { value: "refund_pending",  label: "Refund Pending"  },
  { value: "refund_rejected", label: "Refund Rejected" },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ReportRevenue() {
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [stats,        setStats]        = useState<TransactionStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);

  const currentUser = getUser();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, txRes] = await Promise.all([
        getTransactionStats(),
        getAdminTransactions(1, { per_page: 500 }),
      ]);
      setStats(statsRes);
      setTransactions(txRes.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── filtered ── */
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        tx.order_id?.toLowerCase().includes(q) ||
        tx.buyer_name?.toLowerCase().includes(q) ||
        tx.buyer_email?.toLowerCase().includes(q);

      const matchesType   = filterType   === "all" || tx.transaction_type === filterType;
      const matchesStatus = filterStatus === "all" || tx.status           === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchQuery, filterType, filterStatus]);

  /* ── helpers ── */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  /* ── export ── */
  const handleExportExcel = () => {
    const exportData = filtered.map((tx, i) => ({
      "No":          i + 1,
      "Order ID":    tx.order_id,
      "Type":        tx.transaction_type === "subscription" ? "Subscription" : "Booking",
      "Buyer Name":  tx.buyer_name,
      "Buyer Email": tx.buyer_email,
      "Channel":     tx.payment_channel ?? "-",
      "Amount":      tx.amount,
      "Status":      STATUS_CONFIG[tx.status]?.label ?? tx.status,
      "Paid At":     tx.paid_at ?? "-",
      "Created At":  tx.created_at,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [
      { wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 22 },
      { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
      { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
    XLSX.writeFile(wb, `salary-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ── columns ── */
  const columns = useMemo(() => [
    {
      key: "created_at",
      header: "Date",
      render: (tx: AdminTransaction) => (
        <div className="space-y-0.5">
          <p className="text-white text-xs font-medium">{tx.created_at}</p>
          {tx.paid_at && <p className="text-[#666] text-xs">Paid: {tx.paid_at}</p>}
        </div>
      ),
    },
    {
      key: "order_id",
      header: "Order ID",
      render: (tx: AdminTransaction) => (
        <div className="flex items-center gap-2">
          <span className="text-[#B8B8B8] text-xs font-mono">{tx.order_id}</span>
          <button
            onClick={() => handleCopy(tx.order_id)}
            className="text-[#B8B8B8] hover:text-white transition-colors"
          >
            {copiedId === tx.order_id
              ? <CheckCircle size={13} className="text-green-400" />
              : <Copy size={13} />}
          </button>
        </div>
      ),
    },
    {
      key: "transaction_type",
      header: "Type",
      render: (tx: AdminTransaction) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          tx.transaction_type === "subscription" ? "bg-blue-500/10 text-blue-400" : "bg-teal-500/10 text-teal-400"
        }`}>
          {tx.transaction_type === "subscription" ? "Subscription" : "Booking"}
        </span>
      ),
    },
    {
      key: "buyer",
      header: "Buyer",
      render: (tx: AdminTransaction) => (
        <div className="space-y-0.5">
          <p className="text-white text-xs font-medium">{tx.buyer_name}</p>
          <p className="text-[#666] text-xs truncate max-w-[160px]">{tx.buyer_email}</p>
        </div>
      ),
    },
    {
      key: "payment_channel",
      header: "Channel",
      render: (tx: AdminTransaction) => (
        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
          {tx.payment_channel}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (tx: AdminTransaction) => (
        <span className="text-[#D4AF37] font-semibold text-sm">{formatCurrency(tx.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (tx: AdminTransaction) => {
        const s = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        );
      },
    },
  ], [copiedId]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <DashboardLayout
      title="Salary Report"
      subtitle="Owner Subscription & Transaction Salary Report"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={currentUser ?? { name: "Super Admin", email: "admin@cutbro.com", role: "admin" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        <PageHeader
          title=""
          actions={
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49f30] text-black font-semibold text-sm transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#B8B8B8]" />
          </div>
        ) : (
          <>
            <StatsGrid
              stats={[
                { icon: Users,     title: "Users Transaction", value: stats?.booking_count      ?? 0 },
                { icon: Building2, title: "Owner Transaction",  value: stats?.subscription_count ?? 0 },
                { icon: TrendingUp, title: "Total Revenue",     value: formatCurrency(stats?.total_revenue ?? 0) },
              ]}
              columns={3}
            />

            {/* INFO BOX */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <span className="text-base">ⓘ</span>
                This report contains:
              </div>
              <p className="text-[#B8B8B8] text-sm leading-relaxed">
                Order ID, Transaction Type (Subscription / Booking), Buyer Name & Email, Payment Channel, Amount (IDR), Status, and Payment Date.
              </p>
              <p className="text-blue-400 text-sm">
                Data will be exported in Excel format. Total records in this report:{" "}
                <span className="font-bold">{filtered.length}</span>
              </p>
            </div>

            <TableCard
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchPlaceholder="Search order ID, buyer name, or email..."
              filters={[
                { label: "Type",   value: filterType,   onChange: setFilterType,   options: TYPE_FILTER_OPTIONS   },
                { label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_FILTER_OPTIONS },
              ]}
              isEmpty={filtered.length === 0}
              emptyIcon={TrendingUp}
              emptyTitle="No transactions found"
              emptyDescription="Try adjusting your filters"
            >
              {/* DESKTOP */}
              <div className="hidden md:block w-full overflow-x-auto">
                <DataTable data={filtered} columns={columns} />
              </div>

              {/* MOBILE */}
              <div className="block md:hidden">
                <MobileCardList
                  data={filtered}
                  renderCard={(tx: AdminTransaction) => {
                    const s = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
                    return (
                      <MobileCard
                        title={tx.buyer_name}
                        subtitle={<span className="text-[#B8B8B8] text-xs">{tx.buyer_email}</span>}
                        headerRight={
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        }
                        fields={[
                          { label: "Order ID", value: tx.order_id },
                          {
                            label: "Type",
                            value: (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                tx.transaction_type === "subscription" ? "bg-blue-500/10 text-blue-400" : "bg-teal-500/10 text-teal-400"
                              }`}>
                                {tx.transaction_type === "subscription" ? "Subscription" : "Booking"}
                              </span>
                            ),
                          },
                          { label: "Channel", value: tx.payment_channel ?? "-" },
                          { label: "Amount",  value: <span className="text-[#D4AF37] font-semibold">{formatCurrency(tx.amount)}</span> },
                          { label: "Paid At", value: tx.paid_at ?? "-" },
                        ]}
                      />
                    );
                  }}
                />
              </div>
            </TableCard>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
