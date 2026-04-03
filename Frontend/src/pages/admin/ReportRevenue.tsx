import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  CheckCircle,
  FileSpreadsheet,
  Copy,
  Users,
  Store,
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import { capitalizeFirst } from "@/lib/utils/AdminUtils";

import PageHeader from "@/components/admin/PageHeader";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

/* =========================================================
   TYPES
========================================================= */

type TransactionRow = {
  id:          string;
  paymentDate: string;
  invoice:     string;
  name:        string;
  relatedName: string;
  role:        "owner" | "customer";
  service:     string | null;
  period:      string | null;
  method:      string;
  amount:      number;
  status:      "paid" | "pending";
};

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (raw: string): string => {
  const [dd, mm, yy] = raw.split("/");
  return `20${yy}-${mm}-${dd}`;
};

/* =========================================================
   DUMMY DATA — OWNER SUBSCRIPTIONS
========================================================= */

const DUMMY_REVENUE_DATA = [
  { id: 1,  paymentDate: "01/02/26", invoice: "INV-2026-001", barbershop: "Barber King",       owner: "Andi",    package: "Pro",     period: "Feb 2026", method: "Transfer", amount: 299000, status: "paid"    },
  { id: 2,  paymentDate: "03/02/26", invoice: "INV-2026-002", barbershop: "Sharp Cuts",        owner: "Nina",    package: "Premium", period: "Feb 2026", method: "Ewallet",  amount: 599000, status: "paid"    },
  { id: 3,  paymentDate: "04/02/26", invoice: "INV-2026-003", barbershop: "Classic Cuts",      owner: "Fajar",   package: "Pro",     period: "Feb 2026", method: "Transfer", amount: 299000, status: "paid"    },
  { id: 4,  paymentDate: "05/02/26", invoice: "INV-2026-004", barbershop: "Prestige Barber",   owner: "Gilang",  package: "Premium", period: "Feb 2026", method: "QRIS",     amount: 599000, status: "paid"    },
  { id: 5,  paymentDate: "07/02/26", invoice: "INV-2026-005", barbershop: "Razor Sharp",       owner: "Lukman",  package: "Premium", period: "Feb 2026", method: "Transfer", amount: 599000, status: "paid"    },
  { id: 6,  paymentDate: "10/02/26", invoice: "INV-2026-006", barbershop: "King's Barber",     owner: "Tegar",   package: "Pro",     period: "Feb 2026", method: "QRIS",     amount: 299000, status: "pending" },
  { id: 7,  paymentDate: "12/02/26", invoice: "INV-2026-007", barbershop: "Next Level Cuts",   owner: "Kevin",   package: "Premium", period: "Feb 2026", method: "Transfer", amount: 599000, status: "pending" },
  { id: 8,  paymentDate: "14/02/26", invoice: "INV-2026-008", barbershop: "Elite Barbers",     owner: "Mike",    package: "Pro",     period: "Feb 2026", method: "QRIS",     amount: 299000, status: "paid"    },
  { id: 9,  paymentDate: "17/02/26", invoice: "INV-2026-009", barbershop: "Urban Cuts",        owner: "Doni",    package: "Pro",     period: "Feb 2026", method: "Transfer", amount: 299000, status: "paid"    },
  { id: 10, paymentDate: "19/02/26", invoice: "INV-2026-010", barbershop: "The Barber Lounge", owner: "Agus",    package: "Premium", period: "Feb 2026", method: "QRIS",     amount: 599000, status: "pending" },
  { id: 11, paymentDate: "21/02/26", invoice: "INV-2026-011", barbershop: "The Grooming Club", owner: "Budi",    package: "Pro",     period: "Feb 2026", method: "Ewallet",  amount: 299000, status: "pending" },
  { id: 12, paymentDate: "23/02/26", invoice: "INV-2026-012", barbershop: "The Blade House",   owner: "Hendra",  package: "Pro",     period: "Feb 2026", method: "Ewallet",  amount: 299000, status: "paid"    },
  { id: 13, paymentDate: "25/02/26", invoice: "INV-2026-013", barbershop: "Scissors & Style",  owner: "Wahyu",   package: "Premium", period: "Feb 2026", method: "Transfer", amount: 599000, status: "paid"    },
];

/* =========================================================
   DUMMY DATA — USER (CUSTOMER) TRANSACTIONS
========================================================= */

const DUMMY_USER_TRANSACTION_DATA = [
  { id: 1,  paymentDate: "01/02/26", invoice: "TRX-2026-001", customer: "Rizky Pratama",    barbershop: "Barber King",       service: "Haircut + Wash",  method: "QRIS",     amount: 75000,  status: "paid"    },
  { id: 2,  paymentDate: "02/02/26", invoice: "TRX-2026-002", customer: "Eko Santoso",      barbershop: "Sharp Cuts",        service: "Haircut",         method: "Transfer", amount: 50000,  status: "paid"    },
  { id: 3,  paymentDate: "03/02/26", invoice: "TRX-2026-003", customer: "Bagas Nugroho",    barbershop: "Classic Cuts",      service: "Shave",           method: "Ewallet",  amount: 40000,  status: "paid"    },
  { id: 4,  paymentDate: "04/02/26", invoice: "TRX-2026-004", customer: "Dimas Kurniawan",  barbershop: "Prestige Barber",   service: "Haircut + Color", method: "QRIS",     amount: 150000, status: "paid"    },
  { id: 5,  paymentDate: "05/02/26", invoice: "TRX-2026-005", customer: "Farel Wijaya",     barbershop: "Razor Sharp",       service: "Haircut",         method: "Transfer", amount: 55000,  status: "paid"    },
  { id: 6,  paymentDate: "07/02/26", invoice: "TRX-2026-006", customer: "Galih Purnomo",    barbershop: "King's Barber",     service: "Haircut + Beard", method: "Ewallet",  amount: 90000,  status: "pending" },
  { id: 7,  paymentDate: "08/02/26", invoice: "TRX-2026-007", customer: "Hendro Saputra",   barbershop: "Elite Barbers",     service: "Haircut",         method: "QRIS",     amount: 60000,  status: "paid"    },
  { id: 8,  paymentDate: "10/02/26", invoice: "TRX-2026-008", customer: "Irfan Maulana",    barbershop: "Urban Cuts",        service: "Haircut + Wash",  method: "Transfer", amount: 75000,  status: "paid"    },
  { id: 9,  paymentDate: "11/02/26", invoice: "TRX-2026-009", customer: "Joko Widiantoro",  barbershop: "Next Level Cuts",   service: "Shave + Mask",    method: "QRIS",     amount: 110000, status: "pending" },
  { id: 10, paymentDate: "12/02/26", invoice: "TRX-2026-010", customer: "Kevin Aditya",     barbershop: "The Barber Lounge", service: "Haircut",         method: "Ewallet",  amount: 65000,  status: "paid"    },
  { id: 11, paymentDate: "14/02/26", invoice: "TRX-2026-011", customer: "Lutfi Hakim",      barbershop: "The Grooming Club", service: "Haircut + Color", method: "Transfer", amount: 145000, status: "paid"    },
  { id: 12, paymentDate: "15/02/26", invoice: "TRX-2026-012", customer: "Mario Susanto",    barbershop: "The Blade House",   service: "Haircut",         method: "QRIS",     amount: 55000,  status: "paid"    },
  { id: 13, paymentDate: "17/02/26", invoice: "TRX-2026-013", customer: "Nanda Pratama",    barbershop: "Scissors & Style",  service: "Haircut + Beard", method: "Ewallet",  amount: 85000,  status: "pending" },
  { id: 14, paymentDate: "18/02/26", invoice: "TRX-2026-014", customer: "Oscar Firmansyah", barbershop: "Barber King",       service: "Haircut + Wash",  method: "Transfer", amount: 75000,  status: "paid"    },
  { id: 15, paymentDate: "19/02/26", invoice: "TRX-2026-015", customer: "Panji Wibowo",     barbershop: "Sharp Cuts",        service: "Shave",           method: "QRIS",     amount: 40000,  status: "paid"    },
  { id: 16, paymentDate: "20/02/26", invoice: "TRX-2026-016", customer: "Raka Setiawan",    barbershop: "Classic Cuts",      service: "Haircut",         method: "Ewallet",  amount: 50000,  status: "pending" },
  { id: 17, paymentDate: "21/02/26", invoice: "TRX-2026-017", customer: "Sandi Hermawan",   barbershop: "Prestige Barber",   service: "Haircut + Color", method: "QRIS",     amount: 155000, status: "paid"    },
  { id: 18, paymentDate: "22/02/26", invoice: "TRX-2026-018", customer: "Tito Raharjo",     barbershop: "Razor Sharp",       service: "Haircut + Beard", method: "Transfer", amount: 90000,  status: "paid"    },
  { id: 19, paymentDate: "24/02/26", invoice: "TRX-2026-019", customer: "Umar Farouq",      barbershop: "Urban Cuts",        service: "Haircut",         method: "QRIS",     amount: 55000,  status: "paid"    },
  { id: 20, paymentDate: "25/02/26", invoice: "TRX-2026-020", customer: "Vino Saputra",     barbershop: "King's Barber",     service: "Shave + Mask",    method: "Ewallet",  amount: 110000, status: "pending" },
];

/* =========================================================
   MERGE — normalise to a single shape
========================================================= */

const ALL_TRANSACTIONS: TransactionRow[] = [
  ...DUMMY_REVENUE_DATA.map((d) => ({
    id:          `owner-${d.id}`,
    paymentDate: formatDate(d.paymentDate),
    invoice:     d.invoice,
    name:        d.owner,
    relatedName: d.barbershop,
    role:        "owner" as const,
    service:     null,
    period:      d.period,
    method:      d.method,
    amount:      d.amount,
    status:      d.status as "paid" | "pending",
  })),
  ...DUMMY_USER_TRANSACTION_DATA.map((d) => ({
    id:          `customer-${d.id}`,
    paymentDate: formatDate(d.paymentDate),
    invoice:     d.invoice,
    name:        d.customer,
    relatedName: d.barbershop,
    role:        "customer" as const,
    service:     d.service,
    period:      null,
    method:      d.method,
    amount:      d.amount,
    status:      d.status as "paid" | "pending",
  })),
];

/* =========================================================
   FILTER OPTIONS
========================================================= */

const ROLE_FILTER_OPTIONS = [
  { value: "all",      label: "All Roles" },
  { value: "owner",    label: "Owner"     },
  { value: "customer", label: "Customer"  },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",     label: "All Status" },
  { value: "paid",    label: "Paid"       },
  { value: "pending", label: "Pending"    },
];

const METHOD_FILTER_OPTIONS = [
  { value: "all",      label: "All Methods" },
  { value: "transfer", label: "Transfer"    },
  { value: "qris",     label: "QRIS"        },
  { value: "ewallet",  label: "Ewallet"     },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ReportRevenue() {
  const [searchQuery,   setSearchQuery]   = useState("");
  const [filterRole,    setFilterRole]    = useState("all");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterMethod,  setFilterMethod]  = useState("all");
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  const currentUser = getUser();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  /* ── filtered ── */
  const filtered = useMemo(() => {
    return ALL_TRANSACTIONS.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q)        ||
        item.relatedName?.toLowerCase().includes(q) ||
        item.invoice?.toLowerCase().includes(q);

      const matchesRole   = filterRole   === "all" || item.role === filterRole;
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesMethod = filterMethod === "all" || item.method.toLowerCase() === filterMethod;

      return matchesSearch && matchesRole && matchesStatus && matchesMethod;
    });
  }, [searchQuery, filterRole, filterStatus, filterMethod]);

  /* ── stats (always from full dataset) ── */
  const stats = useMemo(() => {
    const ownerRows    = ALL_TRANSACTIONS.filter((t) => t.role === "owner");
    const customerRows = ALL_TRANSACTIONS.filter((t) => t.role === "customer");

    const totalBalance =
      ALL_TRANSACTIONS
        .filter((t) => t.status === "paid")
        .reduce((a, b) => a + b.amount, 0);

    return {
      userTransactions:  customerRows.length,
      ownerTransactions: ownerRows.length,
      totalBalance,
    };
  }, []);

  /* ── copy invoice ── */
  const handleCopyInvoice = (invoice: string) => {
    navigator.clipboard.writeText(invoice).then(() => {
      setCopiedInvoice(invoice);
      setTimeout(() => setCopiedInvoice(null), 1500);
    });
  };

  /* ── export ── */
  const handleExportExcel = () => {
    const exportData = filtered.map((item, i) => ({
      "No":             i + 1,
      "Payment Date":   item.paymentDate,
      "Invoice":        item.invoice,
      "Role":           capitalizeFirst(item.role),
      "Name":           item.name,
      "Barbershop":     item.relatedName,
      "Service":        item.service ?? "-",
      "Period":         item.period  ?? "-",
      "Payment Method": item.method,
      "Amount (IDR)":   item.amount,
      "Status":         capitalizeFirst(item.status),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [
      { wch: 4 }, { wch: 13 }, { wch: 18 }, { wch: 10 }, { wch: 22 },
      { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
    XLSX.writeFile(wb, `revenue-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ── badges ── */
  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      owner:    "bg-blue-500/10 text-blue-400",
      customer: "bg-teal-500/10 text-teal-400",
    };
    return map[role] ?? "bg-gray-500/10 text-gray-400";
  };

  const metodeBadge = (metode: string) => {
    const map: Record<string, string> = {
      transfer: "bg-cyan-500/10 text-cyan-400",
      qris:     "bg-indigo-500/10 text-indigo-400",
      ewallet:  "bg-pink-500/10 text-pink-400",
    };
    return map[metode.toLowerCase()] ?? "bg-gray-500/10 text-gray-400";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; dot: string }> = {
      paid:    { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500"  },
      pending: { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500" },
    };
    return map[status] ?? { bg: "bg-gray-500/10 text-gray-400", dot: "bg-gray-500" };
  };

  /* ── columns ── */
  const columns = useMemo(() => [
    {
      key: "invoice",
      header: "Invoice",
      render: (item: TransactionRow) => (
        <div className="flex items-center gap-2">
          <span className="text-[#B8B8B8] text-xs font-mono">{item.invoice}</span>
          <button
            onClick={() => handleCopyInvoice(item.invoice)}
            className="text-[#B8B8B8] hover:text-white transition-colors"
            title="Copy invoice"
          >
            {copiedInvoice === item.invoice ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      render: (item: TransactionRow) => (
        <span className="text-[#B8B8B8] text-xs">{item.paymentDate}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item: TransactionRow) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(item.role)}`}>
          {capitalizeFirst(item.role)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (item: TransactionRow) => (
        <p className="text-white font-semibold">{item.name}</p>
      ),
    },
    {
      key: "method",
      header: "Payment",
      render: (item: TransactionRow) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${metodeBadge(item.method)}`}>
          {item.method}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: TransactionRow) => (
        <span className="text-[#D4AF37] font-semibold">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: TransactionRow) => {
        const s = statusBadge(item.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {capitalizeFirst(item.status)}
          </span>
        );
      },
    },
  ], [copiedInvoice]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <DashboardLayout
      title="Revenue Report"
      subtitle="Owner Subscription & Customer Transaction Revenue Report"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={currentUser ?? {
        name: "Super Admin",
        email: "admin@cutbro.com",
        role: "admin",
      }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        <PageHeader
          actions={
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49f30] text-black font-semibold text-sm transition-colors duration-200 whitespace-nowrap"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          }
          title={""}
        />

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">

          {/* User Transactions */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
              <Users size={20} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#B8B8B8] text-xs font-medium truncate">User Transactions</p>
              <p className="text-white text-xl font-bold mt-0.5 truncate">{stats.userTransactions}</p>
            </div>
          </div>

          {/* Owner Transactions */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
              <Store size={20} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#B8B8B8] text-xs font-medium truncate">Owner Transactions</p>
              <p className="text-white text-xl font-bold mt-0.5 truncate">{stats.ownerTransactions}</p>
            </div>
          </div>

          {/* Total Balance */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-lg bg-white/10 flex-shrink-0">
              <Wallet size={20} className="text-[#D4AF37]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#B8B8B8] text-xs font-medium truncate">Total Balance</p>
              <p className="text-white text-xl font-bold mt-0.5 truncate">
                {formatCurrency(stats.totalBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* INFO BOX */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <span className="text-base">ⓘ</span>
            This report contains:
          </div>
          <p className="text-[#B8B8B8] text-sm leading-relaxed">
            Combined transactions from{" "}
            <span className="text-blue-400 font-medium">Owners</span> (subscription packages: Pro Rp299K / Premium Rp599K)
            and{" "}
            <span className="text-teal-400 font-medium">Customers</span> (barbershop service payments).
            Columns: Invoice, Payment Date, Role, Name, Payment Method, Amount, Status.
          </p>
          <p className="text-blue-400 text-sm">
            Data can be exported in Excel format. Total transactions in this report:{" "}
            <span className="font-bold">{filtered.length}</span>
          </p>
        </div>

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search name, barbershop, or invoice..."
          filters={[
            { label: "Role",   value: filterRole,   onChange: setFilterRole,   options: ROLE_FILTER_OPTIONS   },
            { label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_FILTER_OPTIONS },
            { label: "Method", value: filterMethod, onChange: setFilterMethod, options: METHOD_FILTER_OPTIONS },
          ]}
          isEmpty={filtered.length === 0}
          emptyIcon={TrendingUp}
          emptyTitle="No data found"
          emptyDescription="Try adjusting your search filters"
        >
          {/* DESKTOP */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filtered} columns={columns} />
          </div>

          {/* MOBILE */}
          <div className="block md:hidden">
            <MobileCardList
              data={filtered}
              renderCard={(item: TransactionRow) => {
                const s = statusBadge(item.status);
                return (
                  <MobileCard
                    title={item.name}
                    subtitle={undefined}
                    headerRight={
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {capitalizeFirst(item.status)}
                      </span>
                    }
                    fields={[
                      {
                        label: "Invoice",
                        value: (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#B8B8B8]">{item.invoice}</span>
                            <button onClick={() => handleCopyInvoice(item.invoice)}>
                              {copiedInvoice === item.invoice
                                ? <CheckCircle size={13} className="text-green-400" />
                                : <Copy size={13} className="text-[#B8B8B8]" />}
                            </button>
                          </div>
                        ),
                      },
                      {
                        label: "Role",
                        value: (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(item.role)}`}>
                            {capitalizeFirst(item.role)}
                          </span>
                        ),
                      },
                      {
                        label: "Payment Method",
                        value: (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${metodeBadge(item.method)}`}>
                            {item.method}
                          </span>
                        ),
                      },
                      {
                        label: "Amount",
                        value: <span className="text-[#D4AF37] font-semibold">{formatCurrency(item.amount)}</span>,
                      },
                      { label: "Payment Date", value: item.paymentDate },
                    ]}
                  />
                );
              }}
            />
          </div>
        </TableCard>

      </div>
    </DashboardLayout>
  );
}