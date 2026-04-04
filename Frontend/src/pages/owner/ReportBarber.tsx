import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Scissors, TrendingUp, Award, FileSpreadsheet, Info, Users } from "lucide-react";
import * as XLSX from "xlsx";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";

import { searchInObject, filterByField } from "@/lib/utils/AdminUtils";

import Badge from "@/components/admin/Badge";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

/* ================= TYPES ================= */
interface BarberReport {
  id: number;
  barberName: string;
  account: string;
  joinDate: string;
  lastActiveDate: string;
  status: "Active" | "Inactive";
}

/* ================= FILTER OPTIONS ================= */
const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "Active",   label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function BarberReport() {
  const [reports, setReports] = useState<BarberReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBarber, setFilterBarber] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { user, logout } = useAuth();

  useEffect(() => {
    ownerService.getBarberReport().then((data) => {
      setReports(data.map((r) => ({
        id:             r.id,
        barberName:     r.barber_name,
        account:        r.account,
        joinDate:       r.join_date,
        lastActiveDate: r.last_active_date,
        status:         r.status as "Active" | "Inactive",
      })));
    }).catch(() => {});
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const activeCount = reports.filter((r) => r.status === "Active").length;
    const inactiveCount = reports.filter((r) => r.status === "Inactive").length;
    const newest = [...reports].sort((a, b) => b.joinDate.localeCompare(a.joinDate))[0];
    return {
      totalBarbers: reports.length,
      activeBarbers: activeCount,
      inactiveBarbers: inactiveCount,
      newestBarber: newest?.barberName ?? "-",
    };
  }, [reports]);

  const barberFilterOptions = useMemo(() => [
    { value: "all", label: "All Barbers" },
    ...reports.map((r) => ({ value: r.barberName, label: r.barberName })),
  ], [reports]);

  /* ================= FILTER ================= */
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = searchInObject(r, searchQuery, ["barberName", "account"]);
      return (
        matchesSearch &&
        filterByField(r, "barberName", filterBarber) &&
        filterByField(r, "status", filterStatus)
      );
    });
  }, [reports, searchQuery, filterBarber, filterStatus]);

  /* ================= EXPORT ================= */
  const handleExportExcel = () => {
    const exportData = filteredReports.map((r) => ({
      "Barber Name":   r.barberName,
      "Account":       r.account,
      "Join Date":     r.joinDate,
      "Last Active":   r.lastActiveDate,
      "Status":        r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Barber Report");
    XLSX.writeFile(workbook, `barber-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "barberName",
      header: "Barber Name",
      render: (r: BarberReport) => (
        <span className="text-white font-semibold">{r.barberName}</span>
      ),
    },
    {
      key: "account",
      header: "Account",
      render: (r: BarberReport) => (
        <span className="text-[#B8B8B8]">@{r.account}</span>
      ),
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (r: BarberReport) => (
        <span className="text-[#B8B8B8]">{r.joinDate}</span>
      ),
    },
    {
      key: "lastActiveDate",
      header: "Last Active",
      render: (r: BarberReport) => (
        <span className="text-[#B8B8B8]">{r.lastActiveDate}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: BarberReport) => (
        <Badge text={r.status} variant={r.status === "Active" ? "success" : "warning"} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Barber Report"
      subtitle="Track individual barber performance"
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
          actions={<button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49f30] text-black font-semibold text-sm transition-colors duration-200 whitespace-nowrap"
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>} title={""}        />

        {/* STATS */}
        <StatsGrid
          stats={[
            {
              icon: Users,
              title: "Total Barbers",
              value: stats.totalBarbers,
            },
            {
              icon: Scissors,
              title: "Active Barbers",
              value: stats.activeBarbers,
            },
            {
              icon: TrendingUp,
              title: "Inactive Barbers",
              value: stats.inactiveBarbers,
            },
            {
              icon: Award,
              title: "Newest Barber",
              value: stats.newestBarber,
            },
          ]}
          columns={4}
        />

        {/* INFO BANNER */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Info size={15} />
            <span>This report contains:</span>
          </div>
          <p className="text-[#B8B8B8] text-sm leading-relaxed">
            Barber Name, Account, Join Date, Last Active Date, and Status.
          </p>
          <p className="text-blue-400 text-sm">
            Data will be exported in Excel format.{" "}
            <span className="text-[#B8B8B8]">Total barbers —</span>{" "}
            Total items in this report:{" "}
            <span className="text-white font-bold">{filteredReports.length}</span>
          </p>
        </div>

        {/* TABLE CARD */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search barber name or account..."
          filters={[
            {
              label: "Barber",
              value: filterBarber,
              onChange: setFilterBarber,
              options: barberFilterOptions,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredReports.length === 0}
          emptyIcon={Scissors}
          emptyTitle="No barbers found"
          emptyDescription="Try adjusting your filters"
        >
          {/* DESKTOP TABLE */}
          <DataTable data={filteredReports} columns={columns} />

          {/* MOBILE CARDS */}
          <MobileCardList
            data={filteredReports}
            renderCard={(r: BarberReport) => (
              <MobileCard
                title={r.barberName}
                subtitle={`@${r.account}`}
                headerRight={<Badge text={r.status} variant={r.status === "Active" ? "success" : "warning"} />}
                fields={[
                  { label: "Join Date",   value: r.joinDate },
                  { label: "Last Active", value: r.lastActiveDate },
                ]}
              />
            )}
          />
        </TableCard>
      </div>
    </DashboardLayout>
  );
}