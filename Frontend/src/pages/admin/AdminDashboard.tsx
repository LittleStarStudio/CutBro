import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Store,
  Calendar,
  Activity,
  Wallet,
} from "lucide-react";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { superAdminLogo, superAdminMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import type { UserActivity } from "@/type/AdminType";

import {
  capitalizeFirst,
  formatDateTime,
  formatCompactNumber,
  formatCurrency,
} from "@/lib/utils/AdminUtils";

import {
  ACTIVITY_TYPE_STYLES,
  ACTIVITY_TYPE_ICONS,
} from "@/components/entities/constants/AdminConstants";

import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";

/* ================= DUMMY DATA ================= */
const DUMMY_ACTIVITIES: UserActivity[] = [
  { id: 1, user: "John Doe",      email: "john@example.com",    activity: "login",          timestamp: "2024-02-12 09:30:00", ipAddress: "192.168.1.1", device: "Chrome on Windows" },
  { id: 2, user: "Jane Smith",    email: "jane@example.com",    activity: "create_booking", timestamp: "2024-02-12 10:15:00", ipAddress: "192.168.1.2", device: "Safari on iPhone"  },
  { id: 3, user: "Alice Brown",   email: "alice@example.com",   activity: "update_profile", timestamp: "2024-02-12 11:00:00", ipAddress: "192.168.1.3", device: "Firefox on Mac"    },
  { id: 4, user: "Bob Wilson",    email: "bob@example.com",     activity: "logout",         timestamp: "2024-02-12 12:30:00", ipAddress: "192.168.1.4", device: "Edge on Windows"   },
  { id: 5, user: "Charlie Davis", email: "charlie@example.com", activity: "create_booking", timestamp: "2024-02-12 13:15:00", ipAddress: "192.168.1.5", device: "Chrome on Mac"     },
  { id: 6, user: "Diana Prince",  email: "diana@example.com",   activity: "login",          timestamp: "2024-02-12 14:00:00", ipAddress: "192.168.1.6", device: "Safari on iPad"    },
];

/* ================= ROLE DATA ================= */
const ROLE_DATA = [
  { color: "#EF9F27", label: "Owner",    value: 45,  pct: 4  },
  { color: "#639922", label: "Barber",   value: 213, pct: 17 },
  { color: "#378ADD", label: "Customer", value: 992, pct: 79 },
];

const TOTAL_USERS = ROLE_DATA.reduce((sum, r) => sum + r.value, 0);

/* ================= CUSTOM TOOLTIP ================= */
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-[#1f1f1f] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-lg">
      <span className="font-medium">{name}</span>: {value.toLocaleString()}
    </div>
  );
}

/* ================= COMPONENT ================= */
export default function AdminDashboard() {
  const [activities, setActivities] = useState<UserActivity[]>([]);

  const user = getUser();

  useEffect(() => {
    setActivities(DUMMY_ACTIVITIES);
    // Sambungkan ke API nyata dengan auto-refresh:
    // const interval = setInterval(() => fetchActivities(), 10000);
    // return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    totalUsers:       1250,
    totalBarbershops: 45,
    totalBookings:    3890,
    totalBalance:     450000000,
  }), []);

  const latestActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [activities]);

  const columns = [
    {
      key: "user", header: "User",
      render: (activity: UserActivity) => (
        <div className="text-white">
          <p className="font-semibold text-sm md:text-base truncate">{activity.user}</p>
          <p className="text-xs text-[#B8B8B8] truncate">{activity.email}</p>
        </div>
      ),
    },
    {
      key: "activity", header: "Activity",
      render: (activity: UserActivity) => {
        const ActivityIcon = ACTIVITY_TYPE_ICONS[activity.activity];
        return (
          <Badge
            icon={ActivityIcon}
            text={capitalizeFirst(activity.activity.replace(/_/g, " "))}
            variant={ACTIVITY_TYPE_STYLES[activity.activity]}
          />
        );
      },
    },
    {
      key: "timestamp", header: "Timestamp",
      render: (activity: UserActivity) => (
        <span className="text-[#B8B8B8] text-sm md:text-base">{formatDateTime(activity.timestamp)}</span>
      ),
    },
    {
      key: "ipAddress", header: "IP Address",
      render: (activity: UserActivity) => (
        <span className="text-[#B8B8B8] text-sm md:text-base">{activity.ipAddress}</span>
      ),
    },
    {
      key: "device", header: "Device",
      render: (activity: UserActivity) => (
        <span className="text-[#B8B8B8] text-sm md:text-base truncate block">{activity.device}</span>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview of your platform"
      showSidebar
      menuItems={superAdminMenu}
      logo={superAdminLogo}
      showNotification
      notificationCount={3}
      onLogout={logout}
      userProfile={{
        name:  user?.name  ?? "Admin",
        email: user?.email ?? "",
        role:  user?.role  ?? "admin",
      }}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        {/* ================= TOP SECTION: STATS + DONUT CHART ================= */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">

          {/* Stat Cards */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Users,    title: "Total Users",    value: stats.totalUsers,       accent: "#F5A623", compact: true,  fontSize: "clamp(1.25rem, 4vw, 1.875rem)" },
              { icon: Store,    title: "Barbershops",    value: stats.totalBarbershops, accent: "#F5A623", compact: true,  fontSize: "clamp(1.25rem, 4vw, 1.875rem)" },
              { icon: Calendar, title: "Total Bookings", value: stats.totalBookings,    accent: "#F5A623", compact: true,  fontSize: "clamp(1.25rem, 4vw, 1.875rem)" },
              { icon: Wallet,   title: "Total Balance",  value: stats.totalBalance,     accent: "#F5A623", compact: false, fontSize: "clamp(1rem, 3vw, 1.375rem)"    },
            ].map(({ icon: Icon, title, value, accent, compact, fontSize }) => (
              <div
                key={title}
                className="bg-[#141414] border border-white/10 rounded-xl p-5 flex flex-col min-h-[110px] min-w-0"
              >
                <span className="text-sm font-semibold text-[#B8B8B8] leading-none mb-auto truncate">
                  {title}
                </span>
                <div className="flex flex-row items-center justify-between flex-1 mt-3 gap-2 min-w-0">
                  <span
                    className="font-bold text-white tracking-tight leading-none truncate min-w-0"
                    style={{ fontSize }}
                  >
                    {compact
                      ? formatCompactNumber(value)
                      : typeof value === "number"
                        ? formatCurrency(value)
                        : value
                    }
                  </span>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accent}1A` }}
                  >
                    <Icon className="w-8 h-8 shrink-0" style={{ color: accent }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Donut chart */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 flex flex-col items-center lg:w-[400px] shrink-0">
            <p className="text-sm font-semibold text-white self-start mb-4">User Roles</p>

            <div className="relative w-[240px] h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ROLE_DATA}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={76}
                    outerRadius={108}
                    strokeWidth={0}
                    paddingAngle={2}
                  >
                    {ROLE_DATA.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-semibold text-white">
                  {TOTAL_USERS.toLocaleString()}
                </span>
                <span className="text-xs text-[#B8B8B8]">total</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-5 self-start w-full">
              {ROLE_DATA.map(({ color, label, value, pct }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-[#B8B8B8]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-white font-medium">{label}</span>
                  <span className="ml-auto">{value.toLocaleString()} ({pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= ACTIVITY MONITOR ================= */}
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <Activity className="w-4 h-4 text-[#F5A623]" />
            <p className="text-sm font-semibold text-white">Recent Activity</p>
          </div>

          <DataTable
            data={latestActivities}
            columns={columns}
            hidePagination={true}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}