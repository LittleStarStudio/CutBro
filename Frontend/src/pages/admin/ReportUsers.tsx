import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, User, UserX, ShieldBan, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";
import { getUserStats, getAdminUsers } from "@/services/admin.service";
import type { AdminUser, UserStats } from "@/services/admin.service";

import { capitalizeFirst } from "@/lib/utils/AdminUtils";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

/* =========================================================
   FILTER OPTIONS
========================================================= */

const ROLE_FILTER_OPTIONS = [
  { value: "all",      label: "All Roles" },
  { value: "customer", label: "Customer"  },
  { value: "barber",   label: "Barber"    },
  { value: "owner",    label: "Owner"     },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All Status" },
  { value: "active",   label: "Active"     },
  { value: "inactive", label: "Inactive"   },
  { value: "banned",   label: "Banned"     },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ReportUsers() {
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterRole, setFilterRole]     = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [stats, setStats]               = useState<UserStats>({ total: 0, customers: 0, barbers: 0, owners: 0 });
  const [loading, setLoading]           = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([getUserStats(), getAdminUsers()]);
      setStats(statsRes);
      setUsers(usersRes.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentUser = getUser();

  /* ── filtered ── */
  const filtered = useMemo(() => {
    return users.filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        String(user.id).includes(q);

      const matchesRole   = filterRole   === "all" || user.role?.toLowerCase()   === filterRole;
      const matchesStatus = filterStatus === "all" || user.status?.toLowerCase() === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  /* ── export ── */
  const handleExportExcel = () => {
    const exportData = filtered.map((user, i) => ({
      "No":         i + 1,
      "User ID":    user.id,
      "Name":       user.name,
      "Email":      user.email,
      "Role":       capitalizeFirst(user.role),
      "Status":     capitalizeFirst(user.status),
      "Join Date":  user.join_date ?? "-",
      "Last Login": user.last_login ?? "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [
      { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 28 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Users Report");
    XLSX.writeFile(wb, `users-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  /* ── role badge style ── */
  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      owner:    "bg-yellow-500/10 text-yellow-400",
      barber:   "bg-blue-500/10 text-blue-400",
      customer: "bg-gray-500/10 text-gray-400",
    };
    return map[role] ?? "bg-gray-500/10 text-gray-400";
  };

  /* ── status badge style ── */
  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; dot: string }> = {
      active:   { bg: "bg-green-500/10 text-green-400",   dot: "bg-green-500"  },
      inactive: { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-500" },
      banned:   { bg: "bg-red-500/10 text-red-400",       dot: "bg-red-500"    },
    };
    return map[status] ?? { bg: "bg-gray-500/10 text-gray-400", dot: "bg-gray-500" };
  };

  /* ── columns ── */
  const columns = useMemo(() => [
    {
      key: "name",
      header: "Nama",
      render: (user: any) => (
        <span className="text-white font-semibold">{user.name}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user: any) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
          {capitalizeFirst(user.role)}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user: any) => (
        <span className="text-[#B8B8B8]">{user.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: any) => {
        const s = statusBadge(user.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {capitalizeFirst(user.status)}
          </span>
        );
      },
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (user: any) => (
        <span className="text-[#B8B8B8] text-xs">{user.join_date ?? "-"}</span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (user: any) => (
        <span className="text-[#B8B8B8] text-xs">{user.last_login ?? "-"}</span>
      ),
    },
  ], []);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <DashboardLayout
      title="Users Report"
      subtitle="Export user registration & activity data"
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
                { icon: Users,     title: "Total Users",    value: stats.total },
                { icon: User,      title: "Active Users",   value: users.filter(u => u.status === "active").length },
                { icon: UserX,     title: "Inactive Users", value: users.filter(u => u.status === "inactive").length },
                { icon: ShieldBan, title: "Banned Users",   value: users.filter(u => u.status === "banned").length },
              ]}
              columns={4}
            />

            {/* INFO BOX */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <span className="text-base">ⓘ</span>
                This report contains:
              </div>
              <p className="text-[#B8B8B8] text-sm leading-relaxed">
                User ID, Name, Email, Role (Owner/Barber/Customer), Status (Active/Inactive/Banned), Join Date, and Last Login.
              </p>
              <p className="text-blue-400 text-sm">
                Data will be exported in Excel format. Total users — Total items in this report:{" "}
                <span className="font-bold">{filtered.length}</span>
              </p>
            </div>

            <TableCard
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchPlaceholder="Search name, email, or ID..."
              filters={[
                {
                  label: "Role",
                  value: filterRole,
                  onChange: setFilterRole,
                  options: ROLE_FILTER_OPTIONS,
                },
                {
                  label: "Status",
                  value: filterStatus,
                  onChange: setFilterStatus,
                  options: STATUS_FILTER_OPTIONS,
                },
              ]}
              isEmpty={filtered.length === 0}
              emptyIcon={Users}
              emptyTitle="No users found"
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
                  renderCard={(user: any) => {
                    const s = statusBadge(user.status);
                    return (
                      <MobileCard
                        title={user.name}
                        subtitle={<span className="text-[#B8B8B8] text-xs">{user.email}</span>}
                        headerRight={
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {capitalizeFirst(user.status)}
                          </span>
                        }
                        fields={[
                          {
                            label: "Role",
                            value: (
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                                {capitalizeFirst(user.role)}
                              </span>
                            ),
                          },
                          { label: "Join Date",  value: user.join_date  ?? "-" },
                          { label: "Last Login", value: user.last_login ?? "-" },
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