import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { LogIn, LogOut, UserPlus, Activity } from "lucide-react";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import type { LoginLog } from "@/type/AdminType";

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

/* ================= DUMMY DATA ================= */

const DUMMY_LOGS: LoginLog[] = [
  {
    id: 1,
    user: "John Doe",
    email: "john@example.com",
    action: "login",
    timestamp: "2024-02-12 09:30:00",
    ipAddress: "192.168.1.1",
    device: "Chrome on Windows",
    location: "Jakarta, Indonesia",
    status: "success",
  },
  {
    id: 2,
    user: "Jane Smith",
    email: "jane@example.com",
    action: "logout",
    timestamp: "2024-02-12 10:15:00",
    ipAddress: "192.168.1.2",
    device: "Safari on iPhone",
    location: "Bandung, Indonesia",
    status: "success",
  },
  {
    id: 3,
    user: "Alice Brown",
    email: "alice@example.com",
    action: "register",
    timestamp: "2024-02-12 11:00:00",
    ipAddress: "192.168.1.3",
    device: "Firefox on Mac",
    location: "Surabaya, Indonesia",
    status: "success",
  },
  {
    id: 4,
    user: "Bob Wilson",
    email: "bob@example.com",
    action: "login",
    timestamp: "2024-02-12 12:30:00",
    ipAddress: "192.168.1.4",
    device: "Edge on Windows",
    location: "Yogyakarta, Indonesia",
    status: "failed",
  },
];

/* ================= COMPONENT ================= */

export default function LoginLogs() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const currentUser = getUser();

  /* ================= FETCH ================= */

  useEffect(() => {
    setLogs(DUMMY_LOGS);
  }, []);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    return {
      login: logs.filter((l) => l.action === "login").length,
      logout: logs.filter((l) => l.action === "logout").length,
      register: logs.filter((l) => l.action === "register").length,
      total: logs.length,
    };
  }, [logs]);

  /* ================= FILTER ================= */

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = searchInObject(log, searchQuery, [
        "user",
        "email",
        "ipAddress",
        "location",
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
      render: (log: LoginLog) => (
        <div>
          <p className="text-white font-semibold">{log.user}</p>
          <p className="text-xs text-muted-foreground">{log.email}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log: LoginLog) => (
        <Badge
          text={capitalizeFirst(log.action)}
          variant={LOG_ACTION_STYLES[log.action]}
        />
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (log: LoginLog) => log.timestamp,
    },
    {
      key: "ip",
      header: "IP Address",
      render: (log: LoginLog) => log.ipAddress,
    },
    {
      key: "location",
      header: "Location",
      render: (log: LoginLog) => log.location,
    },
    {
      key: "device",
      header: "Device",
      render: (log: LoginLog) => log.device,
    },
    {
      key: "status",
      header: "Status",
      render: (log: LoginLog) => (
        <Badge
          text={capitalizeFirst(log.status)}
          variant={LOG_STATUS_STYLES[log.status]}
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
        currentUser ?? {
          name: "Super Admin",
          email: "admin@cutbro.com",
          role: "admin",
        }
      }
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="space-y-6 lg:space-y-8">

        {/* ================= SMALL STATS (compact) ================= */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: LogIn, title: "Login", value: stats.login },
            { icon: LogOut, title: "Logout", value: stats.logout },
            { icon: UserPlus, title: "Register", value: stats.register },
            { icon: Activity, title: "Total", value: stats.total },
          ]}
        />

        {/* ================= TABLE ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search logs..."
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
          <DataTable data={filteredLogs} columns={columns} />

          <MobileCardList
            data={filteredLogs}
            renderCard={(log) => (
              <MobileCard
                title={log.user}
                subtitle={<span className="text-xs">{log.email}</span>}
                headerRight={
                  <Badge
                    text={capitalizeFirst(log.status)}
                    variant={LOG_STATUS_STYLES[log.status]}
                    showDot
                    dotColor={STATUS_DOT_COLORS[log.status]}
                  />
                }
                fields={[
                  { label: "Action", value: capitalizeFirst(log.action) },
                  { label: "Time", value: log.timestamp },
                  { label: "IP", value: log.ipAddress },
                  { label: "Location", value: log.location },
                  { label: "Device", value: log.device },
                ]}
              />
            )}
          />
        </TableCard>
      </div>
    </DashboardLayout>
  );
}
