import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Receipt, TrendingUp, CheckCircle, Copy } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth }              from "@/components/context/AuthContext";
import * as ownerService        from "@/services/owner.service";
import type { Transaction }     from "@/services/owner.service";

import TableCard     from "@/components/admin/TableCard";
import DataTable     from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard    from "@/components/admin/MobileCard";
import { useToast }  from "@/components/ui/Toast";

/* ── Status config ── */
const STATUS_OPTIONS = [
  { value: "all",       label: "All Status" },
  { value: "paid",      label: "Paid"       },
  { value: "done",      label: "Done"       },
  { value: "cancelled", label: "Cancelled"  },
  { value: "no_show",   label: "No Show"    },
];

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  paid:      { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500",  label: "Paid"      },
  done:      { bg: "bg-blue-500/10 text-blue-400",     dot: "bg-blue-500",   label: "Done"      },
  cancelled: { bg: "bg-zinc-500/10 text-zinc-400",     dot: "bg-zinc-500",   label: "Cancelled" },
  no_show:   { bg: "bg-orange-500/10 text-orange-400", dot: "bg-orange-500", label: "No Show"   },
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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

/* ── Component ── */
export default function OwnerReportRefund() {
  const toast             = useToast();
  const { user, logout }  = useAuth();

  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [copiedOrder,   setCopiedOrder]   = useState<string | null>(null);

  const load = () => {
    ownerService.getTransactions().then(setTransactions).catch(() => {
      toast.error("Failed to Load", "Could not fetch transactions. Please refresh the page.");
    });
  };

  useEffect(() => { load(); }, []);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const revenue      = transactions.filter((t) => ["paid", "done"].includes(t.display_status));
    const grossRevenue = revenue.reduce((s, t) => s + t.gross_amount, 0);
    const totalFee     = revenue.reduce((s, t) => s + t.platform_fee, 0);
    const netRevenue   = revenue.reduce((s, t) => s + t.net_amount, 0);
    return { total: transactions.length, grossRevenue, totalFee, netRevenue };
  }, [transactions]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      const matchSearch = !q
        || t.order_id.toLowerCase().includes(q)
        || t.customer_name.toLowerCase().includes(q)
        || t.customer_email.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || t.display_status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, searchQuery, filterStatus]);

  /* ── Copy order ID ── */
  const handleCopy = (orderId: string) => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopiedOrder(orderId);
      setTimeout(() => setCopiedOrder(null), 1500);
      toast.info("Copied!", `Order ID ${orderId} copied.`, 2500);
    });
  };

  /* ── Table columns ── */
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
          <button onClick={() => handleCopy(t.order_id)} className="text-[#B8B8B8] hover:text-white">
            {copiedOrder === t.order_id
              ? <CheckCircle size={13} className="text-green-400" />
              : <Copy size={13} />}
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
      key: "service",
      header: "Service",
      render: (t: Transaction) => <span className="text-[#B8B8B8] text-xs">{t.service_name}</span>,
    },
    {
      key: "barber",
      header: "Barber",
      render: (t: Transaction) => <span className="text-[#B8B8B8] text-xs">{t.barber_name ?? "-"}</span>,
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
      key: "status",
      header: "Status",
      render: (t: Transaction) => <StatusBadge status={t.display_status} />,
    },
  ], [copiedOrder]);

  /* ── Render ── */
  return (
    <DashboardLayout
      title="Transactions"
      subtitle="View all booking transactions"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "Owner", email: "", role: "owner" }}
      showNotification
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/10 shrink-0">
              <Receipt size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#B8B8B8] text-xs font-medium">Total Transactions</p>
              <p className="text-white text-xl font-bold mt-0.5">{stats.total}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/10 shrink-0">
              <TrendingUp size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#B8B8B8] text-xs font-medium">Gross Revenue</p>
              <p className="text-white text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.grossRevenue)}</p>
              <p className="text-red-400 text-xs mt-0.5">- {formatCurrency(stats.totalFee)} (2% fee)</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#D4AF37]/20 shrink-0">
              <CheckCircle size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#B8B8B8] text-xs font-medium">Net Revenue (98%)</p>
              <p className="text-[#D4AF37] text-xl font-bold mt-0.5 truncate">{formatCurrency(stats.netRevenue)}</p>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by order ID, name, or email..."
          filters={[{ label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_OPTIONS }]}
          isEmpty={filtered.length === 0}
          emptyIcon={Receipt}
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
                    { label: "Order ID", value: t.order_id },
                    { label: "Date",     value: t.booking_date },
                    { label: "Service",  value: t.service_name },
                    { label: "Gross",    value: formatCurrency(t.gross_amount) },
                    { label: "Net",      value: formatCurrency(t.net_amount) },
                  ]}
                />
              )}
            />
          </div>
        </TableCard>

      </div>
    </DashboardLayout>
  );
}
