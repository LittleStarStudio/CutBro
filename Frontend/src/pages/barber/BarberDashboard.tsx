import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useMemo } from "react";
import { Scissors, Users, Calendar, Store } from "lucide-react";

import { barberLogo, barberMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";

import Badge from "@/components/admin/Badge";
import StatsGrid from "@/components/admin/StatGrid";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ================= TYPES ================= */
type ActivityStatus = "completed" | "cancelled";
type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "gold" | "info";

interface ActivityItem {
  id: number;
  customer: string;
  service: string;
  time: string;
  date: string;
  duration: string;
  status: ActivityStatus;
}

/* ================= HELPERS ================= */
function calcEndTime(startTime: string, duration: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const durationMin = parseInt(duration, 10);
  const totalMin = hours * 60 + minutes + durationMin;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const [day, mon, year] = date.split(" ");
  return `${day.padStart(2, "0")}-${months[mon]}-${year}`;
}

/* ================= WORKPLACE ================= */
const WORKPLACE = {
  name: "CutBro",
  location: "Jl. Raya Darmo No. 12, Surabaya",
};

/* ================= DUMMY DATA ================= */
const MONTHLY_CUSTOMER_DATA = [
  { month: "Jan", customers: 45 },
  { month: "Feb", customers: 52 },
  { month: "Mar", customers: 48 },
  { month: "Apr", customers: 61 },
  { month: "May", customers: 58 },
  { month: "Jun", customers: 65 },
  { month: "Jul", customers: 72 },
  { month: "Aug", customers: 68 },
  { month: "Sep", customers: 75 },
  { month: "Oct", customers: 82 },
  { month: "Nov", customers: 78 },
  { month: "Dec", customers: 85 },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 1, customer: "Ahmad Fauzi",   service: "Haircut & Beard Trim", time: "09:00", date: "18 Mar 2026", duration: "45 min", status: "completed" },
  { id: 2, customer: "Budi Santoso",  service: "Classic Haircut",      time: "10:00", date: "18 Mar 2026", duration: "30 min", status: "completed" },
  { id: 3, customer: "Rizky Pratama", service: "Hair Wash & Style",    time: "11:15", date: "18 Mar 2026", duration: "40 min", status: "completed" },
  { id: 4, customer: "Doni Wijaya",   service: "Full Grooming",        time: "13:00", date: "18 Mar 2026", duration: "60 min", status: "cancelled" },
  { id: 5, customer: "Eko Nugroho",   service: "Beard Trim",           time: "14:30", date: "18 Mar 2026", duration: "20 min", status: "completed" },
];

/* ================= CONSTANTS ================= */
const STATUS_STYLES: Record<ActivityStatus, BadgeVariant> = {
  completed: "success",
  cancelled: "danger",
};

const STATUS_DOT_COLORS: Record<ActivityStatus, string> = {
  completed: "bg-emerald-400",
  cancelled: "bg-red-400",
};

/* ================= CUSTOM TOOLTIP ================= */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0A0A] border-2 border-[#D4AF37] rounded-xl px-4 py-2 shadow-lg shadow-[#D4AF37]/30">
      <p className="text-xs text-[#B8B8B8]">{label}</p>
      <p className="text-[#D4AF37] font-semibold">{payload[0].value} customers</p>
    </div>
  );
};

/* ================= COMPONENT ================= */
export default function BarberDashboard() {
  const { user: currentUser, logout } = useAuth();

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const totalJobs = MONTHLY_CUSTOMER_DATA.reduce((sum, data) => sum + data.customers, 0);
    const currentMonth = MONTHLY_CUSTOMER_DATA[MONTHLY_CUSTOMER_DATA.length - 1];
    return {
      totalJobs,
      currentMonthJobs: currentMonth.customers,
      averageMonthly: Math.round(totalJobs / MONTHLY_CUSTOMER_DATA.length),
    };
  }, []);

  /* ================= UI ================= */
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Your work summary"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={
        currentUser ?? {
          name: "John Barber",
          email: "john@barbershop.com",
        }
      }
      showNotification
      notificationCount={2}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: Store,    title: "Workplace",       value: WORKPLACE.name },
            { icon: Scissors, title: "Total Jobs Done", value: stats.totalJobs.toLocaleString() },
            { icon: Calendar, title: "This Month",      value: stats.currentMonthJobs },
            { icon: Users,    title: "Monthly Average", value: stats.averageMonthly },
          ]}
        />

        {/* ================= LINE CHART ================= */}
        <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              Monthly Customer <span className="text-[#D4AF37]">Statistics</span>
            </h2>
            <p className="text-sm text-[#B8B8B8]">Track customers served throughout the year</p>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_CUSTOMER_DATA}>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#B8B8B8" style={{ fontSize: "12px" }} />
                <YAxis stroke="#B8B8B8" allowDecimals={false} style={{ fontSize: "12px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: "#D4AF37", r: 5, strokeWidth: 2, stroke: "#0A0A0A" }}
                  activeDot={{ fill: "#E8C547", r: 8, strokeWidth: 2, stroke: "#0A0A0A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= ACTIVITY TABLE ================= */}
        <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              Recent <span className="text-[#D4AF37]">Activity</span>
            </h2>
            <p className="text-sm text-[#B8B8B8]">Latest 5 barber service activities</p>
          </div>

          {/* ── Desktop Table ─────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">Customer</th>
                  <th className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">Service</th>
                  <th className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">Start Time</th>
                  <th className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">End Time</th>
                  <th className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">Date</th>
                  <th className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">Duration</th>
                  <th className="text-left text-[#B8B8B8] font-medium pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#2A2A2A] last:border-0 hover:bg-[#242424] transition-colors duration-150"
                  >
                    <td className="py-4 pr-4 text-white font-medium">{item.customer}</td>
                    <td className="py-4 pr-4 text-[#B8B8B8]">{item.service}</td>
                    <td className="py-4 pr-4 text-[#D4AF37] font-semibold">{item.time}</td>
                    <td className="py-4 pr-4 text-[#D4AF37] font-semibold">{calcEndTime(item.time, item.duration)}</td>
                    <td className="py-4 pr-4 text-[#B8B8B8]">{formatDate(item.date)}</td>
                    <td className="py-4 pr-4 text-[#B8B8B8]">{item.duration}</td>
                    <td className="py-4">
                      <Badge
                        text={item.status === "completed" ? "Completed" : "Cancelled"}
                        variant={STATUS_STYLES[item.status]}
                        showDot
                        dotColor={STATUS_DOT_COLORS[item.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ──────────────────────────────────── */}
          <div className="md:hidden space-y-4">
            {RECENT_ACTIVITY.map((item) => (
              <div
                key={item.id}
                className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{item.customer}</p>
                    <p className="text-xs text-[#B8B8B8] mt-0.5">{item.service}</p>
                  </div>
                  <Badge
                    text={item.status === "completed" ? "Completed" : "Cancelled"}
                    variant={STATUS_STYLES[item.status]}
                    showDot
                    dotColor={STATUS_DOT_COLORS[item.status]}
                  />
                </div>

                {/* Card Fields */}
                <div className="text-xs space-y-1.5 pt-2 border-t border-[#2A2A2A]">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Start Time</span>
                    <span className="text-[#D4AF37] font-semibold">{item.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">End Time</span>
                    <span className="text-[#D4AF37] font-semibold">{calcEndTime(item.time, item.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Date</span>
                    <span className="text-[#B8B8B8]">{formatDate(item.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Duration</span>
                    <span className="text-[#B8B8B8]">{item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}