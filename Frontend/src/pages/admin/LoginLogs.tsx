import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { LogIn, LogOut, UserPlus, Activity } from "lucide-react";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as adminService from "@/services/admin.service";
import type { AdminLoginLog } from "@/services/admin.service";

import {
  searchInObject,
  filterByField,
  capitalizeFirst,
} from "@/lib/utils/AdminUtils";

import {
  LOG_ACTION_FILTER_OPTIONS,
  LOG_ACTION_STYLES,
  LOG_STATUS_FILTER_OPTIONS,
  LOG_STATUS_STYLES,
  STATUS_DOT_COLORS,
} from "@/components/entities/constants/AdminConstants";

import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Badge from "@/components/admin/Badge";

export default function LoginLogs() {
  const { user, logout } = useAuth();

  const [logs, setLogs]   = useState<AdminLoginLog[]>([]);
  const [stats, setStats] = useState({ login: 0, logout: 0, register: 0, total: 0 });
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ================= LOAD ================= */

  const loadStats = async () => {
    try {
      const data = await adminService.getLoginLogStats();
      setStats(data);
    } catch { /* silent */ }
  };

  const loadLogs = async () => {
    try {
      const result = await adminService.getAdminLoginLogs();
      setLogs(result.data);
    } catch { /* silent */ }
  };

  useEffect(() => { loadStats(); loadLogs(); }, []);

  /* ================= FILTER ================= */

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = searchInObject(log, searchQuery, [
        "user", "email", "ipAddress", "location", "device",
      ]);
      return (
        matchesSearch &&
        filterByField(log, "action", filterAction) &&
        filterByField(log, "status", filterStatus)
      );
    });
  }, [logs, searchQuery, filterAction, filterStatus]);

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      key: "user",
      header: "User",
      headerClassName: "text-left w-[180px]",
      render: (log: AdminLoginLog) => (
        <div>
          <p className="text-white font-semibold truncate max-w-[160px]">{log.user}</p>
          <p className="text-xs text-muted-foreground">{log.email}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      headerClassName: "text-left w-[90px]",
      render: (log: AdminLoginLog) => (
        <Badge
          text={capitalizeFirst(log.action)}
          variant={LOG_ACTION_STYLES[log.action] ?? "default"}
        />
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      headerClassName: "text-left w-[140px]",
      render: (log: AdminLoginLog) => {
        const d = new Date(log.timestamp);
        const formatted = d.toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        }) + ", " + d.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit",
        });
        return <span className="text-xs text-muted-foreground whitespace-nowrap">{formatted}</span>;
      },
    },
    {
      key: "ip",
      header: "IP Address",
      headerClassName: "text-left w-[120px]",
      render: (log: AdminLoginLog) => (
        <span className="text-xs text-muted-foreground">{log.ipAddress}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      headerClassName: "text-left w-[140px]",
      render: (log: AdminLoginLog) => (
        <span className="text-xs text-muted-foreground">{log.location}</span>
      ),
    },
    {
      key: "device",
      header: "Device",
      headerClassName: "text-left w-[120px]",
      render: (log: AdminLoginLog) => (
        <span className="text-xs text-muted-foreground">{log.device}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center w-[90px]",
      className: "text-center",
      render: (log: AdminLoginLog) => (
        <Badge
          text={capitalizeFirst(log.status)}
          variant={LOG_STATUS_STYLES[log.status] ?? "default"}
          showDot
          dotColor={STATUS_DOT_COLORS[log.status]}
        />
      ),
    },
  ];

  /* ================= UI ================= */

  return (
    <DashboardLayout
      title="Login Logs"
      subtitle="Authentication history"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      userProfile={
        user ?? {
          name:  "Super Admin",
          email: "admin@cutbro.com",
          role:  "admin",
        }
      }
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="space-y-6 lg:space-y-8">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: LogIn,    title: "Login",    value: stats.login,    iconBgColor: "bg-[#22C55E1A]", iconColor: "text-[#22C55E]" },
            { icon: LogOut,   title: "Logout",   value: stats.logout,   iconBgColor: "bg-[#60A5FA1A]", iconColor: "text-[#60A5FA]" },
            { icon: UserPlus, title: "Register", value: stats.register, iconBgColor: "bg-[#F59E0B1A]", iconColor: "text-[#F59E0B]" },
            { icon: Activity, title: "Total",    value: stats.total,    iconBgColor: "bg-[#C084FC1A]", iconColor: "text-[#C084FC]" },
          ]}
        />

        {/* ================= TABLE ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search logs by user, email, IP, location..."
          filters={[
            {
              label: "Action",
              value: filterAction,
              onChange: setFilterAction,
              options: LOG_ACTION_FILTER_OPTIONS,
            },
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: LOG_STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredLogs.length === 0}
          emptyIcon={Activity}
          emptyTitle="No logs found"
          emptyDescription="Try adjusting your filters"
        >
          {/* DESKTOP TABLE */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filteredLogs} columns={columns} />
          </div>

          {/* MOBILE CARDS */}
          <div className="block md:hidden">
            <MobileCardList
              data={filteredLogs}
              renderCard={(log) => (
                <MobileCard
                  title={log.user}
                  subtitle={<span className="text-xs text-muted-foreground">{log.email}</span>}
                  headerRight={
                    <Badge
                      text={capitalizeFirst(log.status)}
                      variant={LOG_STATUS_STYLES[log.status] ?? "default"}
                      showDot
                      dotColor={STATUS_DOT_COLORS[log.status]}
                    />
                  }
                  fields={[
                    {
                      label: "Action",
                      value: (
                        <Badge
                          text={capitalizeFirst(log.action)}
                          variant={LOG_ACTION_STYLES[log.action] ?? "default"}
                        />
                      ),
                    },
                    { label: "Time",     value: log.timestamp               },
                    { label: "IP",       value: log.ipAddress               },
                    { label: "Location", value: log.location                },
                    { label: "Device",   value: log.device                  },
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
