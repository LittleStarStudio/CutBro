import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Wallet, Scissors, FileSpreadsheet, Info, Copy, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

import { searchInObject, filterByField } from "@/lib/utils/AdminUtils";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

/* ================= TYPES ================= */
interface Transaction {
  id: number;
  invoiceNumber: string;
  customerName: string;
  service: string;
  barberName: string;
  price: number;
  date: string;
}


export default function SalesReport() {
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [searchQuery,  setSearchQuery]    = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterBarber,  setFilterBarber]  = useState("all");
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    ownerService.getTransactions().then((data) => {
      setTransactions(data.map((t) => ({
        id:            t.id,
        invoiceNumber: t.invoice_number,
        customerName:  t.customer_name,
        service:       t.service_name,
        barberName:    t.barber_name,
        price:         t.price,
        date:          t.date,
      })));
    }).catch(() => {});
  }, []);

  const serviceFilterOptions = useMemo(() => {
    const unique = [...new Set(transactions.map((t) => t.service))];
    return [{ value: "all", label: "All Services" }, ...unique.map((s) => ({ value: s, label: s }))];
  }, [transactions]);

  const barberFilterOptions = useMemo(() => {
    const unique = [...new Set(transactions.map((t) => t.barberName))];
    return [{ value: "all", label: "All Barbers" }, ...unique.map((b) => ({ value: b, label: b }))];
  }, [transactions]);

  /* ================= COPY INVOICE ================= */
  const handleCopyInvoice = (invoice: string) => {
    navigator.clipboard.writeText(invoice).then(() => {
      setCopiedInvoice(invoice);
      setTimeout(() => setCopiedInvoice(null), 1500);
    });
  };

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    totalTransactions: transactions.length,
    totalBalance: transactions.reduce((a, b) => a + b.price, 0),
    avgTransaction:
      transactions.length > 0
        ? transactions.reduce((a, b) => a + b.price, 0) / transactions.length
        : 0,
  }), [transactions]);

  /* ================= FILTER ================= */
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchesSearch = searchInObject(trx, searchQuery, ["customerName", "barberName"]);
      return (
        matchesSearch &&
        filterByField(trx, "service",    filterService) &&
        filterByField(trx, "barberName", filterBarber)
      );
    });
  }, [transactions, searchQuery, filterService, filterBarber]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  /* ================= EXPORT ================= */
  const handleExportExcel = () => {
    const exportData = filteredTransactions.map((trx) => ({
      "No":             trx.id,
      "Invoice Number": trx.invoiceNumber,
      "Customer Name":  trx.customerName,
      "Service":        trx.service,
      "Barber":         trx.barberName,
      "Price (IDR)":    trx.price,
      "Date":           trx.date,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { wch: 5  },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(workbook, `sales-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = useMemo(() => [
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (trx: Transaction) => (
        <div className="flex items-center gap-2">
          <span className="text-[#B8B8B8] font-mono text-xs">{trx.invoiceNumber}</span>
          <button
            onClick={() => handleCopyInvoice(trx.invoiceNumber)}
            className="text-[#B8B8B8] hover:text-white transition-colors"
            title="Copy invoice"
          >
            {copiedInvoice === trx.invoiceNumber ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (trx: Transaction) => (
        <span className="text-white font-semibold">{trx.customerName}</span>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (trx: Transaction) => (
        <span className="text-[#B8B8B8]">{trx.service}</span>
      ),
    },
    {
      key: "barberName",
      header: "Barber",
      render: (trx: Transaction) => (
        <span className="text-[#B8B8B8]">{trx.barberName}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (trx: Transaction) => (
        <span className="text-[#D4AF37] font-semibold">{formatCurrency(trx.price)}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (trx: Transaction) => (
        <span className="text-[#B8B8B8]">{trx.date}</span>
      ),
    },
  ], [copiedInvoice]);

  return (
    <DashboardLayout
      title="Salary Report"
      subtitle="Track barbershop transaction history"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={
        user ?? {
          name: "owner",
          email: "owner@cutbro.com",
          role: "owner",
        }
      }
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        {/* HEADER */}
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
        <StatsGrid
          stats={[
            { icon: ShoppingBag, title: "Total Transactions", value: stats.totalTransactions              },
            { icon: Scissors,    title: "Avg Transaction",    value: formatCurrency(stats.avgTransaction) },
            { icon: Wallet,      title: "Total Balance",      value: formatCurrency(stats.totalBalance)   },
          ]}
          columns={3}
        />

        {/* INFO BANNER */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Info size={15} />
            <span>This report contains:</span>
          </div>
          <p className="text-[#B8B8B8] text-sm leading-relaxed">
            Customer Name, Invoice Number, Service, Barber Name, Price, Payment Method, and Date.
            Default period shows all available transactions.
          </p>
          <p className="text-blue-400 text-sm">
            Data will be exported in Excel format.{" "}
            <span className="text-[#B8B8B8]">Total transactions —</span>{" "}
            Total items in this report:{" "}
            <span className="text-white font-bold">{filteredTransactions.length}</span>
          </p>
        </div>

        {/* TABLE CARD */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search customer or barber name..."
          filters={[
            { label: "Service", value: filterService, onChange: setFilterService, options: serviceFilterOptions },
            { label: "Barber",  value: filterBarber,  onChange: setFilterBarber,  options: barberFilterOptions  },
          ]}
          isEmpty={filteredTransactions.length === 0}
          emptyIcon={ShoppingBag}
          emptyTitle="No transactions found"
          emptyDescription="Try adjusting your filters"
        >
          {/* DESKTOP TABLE */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filteredTransactions} columns={columns} />
          </div>

          {/* MOBILE CARDS */}
          <div className="block md:hidden">
            <MobileCardList
              data={filteredTransactions}
              renderCard={(trx: Transaction) => (
                <MobileCard
                  title={trx.customerName}
                  subtitle={trx.service}
                  headerRight={<span className="text-xs text-[#B8B8B8]">{trx.date}</span>}
                  fields={[
                    {
                      label: "Invoice",
                      value: (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#B8B8B8]">{trx.invoiceNumber}</span>
                          <button onClick={() => handleCopyInvoice(trx.invoiceNumber)}>
                            {copiedInvoice === trx.invoiceNumber
                              ? <CheckCircle size={13} className="text-green-400" />
                              : <Copy size={13} className="text-[#B8B8B8]" />}
                          </button>
                        </div>
                      ),
                    },
                    { label: "Barber", value: trx.barberName },
                    { label: "Price",  value: <span className="text-[#D4AF37] font-semibold">{formatCurrency(trx.price)}</span> },
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