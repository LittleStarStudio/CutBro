import { Calendar, DollarSign, Users, Scissors, TrendingUp, BarChart2, Award } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";

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
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getDashboard, type DashboardData } from "@/services/owner.service";

/* ================= HELPERS ================= */

const formatCurrency = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatM = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)}M`;

/* ================= CUSTOM TOOLTIP ================= */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0A0A] border-2 border-[#D4AF37] rounded-xl px-4 py-2 shadow-lg shadow-[#D4AF37]/30">
      <p className="text-xs text-[#B8B8B8]">{label}</p>
      <p className="text-[#D4AF37] font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

/* ================= COMPONENT ================= */

export default function OwnerDashboard() {
  const { user, logout } = useAuth();

  const [data, setData]       = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => {}) // silently fail — halaman tetap render dengan data null
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;

    const monthly = data.monthly_salary;
    const current = monthly.at(-1);
    const prev    = monthly.at(-2);
    const growth  = current && prev && prev.amount > 0
      ? (((current.amount - prev.amount) / prev.amount) * 100).toFixed(1)
      : "0.0";

    const totalBalance = data.stats.total_balance;
    const avgMonthly   = monthly.length ? Math.round(totalBalance / monthly.length) : 0;
    const bestMonth    = monthly.reduce(
      (max, d) => d.amount > max.amount ? d : max,
      monthly[0] ?? { month: "-", amount: 0 }
    );

    return { growth, avgMonthly, bestMonth, totalBalance };
  }, [data]);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Manage all registered barbershops"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="space-y-6 lg:space-y-8">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: Calendar,  title: "Total Booking",  value: isLoading ? "..." : (data?.stats.total_booking ?? 0).toLocaleString() },
            { icon: Users,     title: "Total Customer", value: isLoading ? "..." : (data?.stats.total_customer ?? 0).toLocaleString() },
            { icon: Scissors,  title: "Total Barber",   value: isLoading ? "..." : (data?.stats.total_barber ?? 0) },
            {
              icon: DollarSign,
              title: "Total Balance",
              value: isLoading ? "..." : (stats ? formatM(stats.totalBalance) : "Rp 0"),
              trend: stats ? { value: `${stats.growth}% from last month`, isPositive: Number(stats.growth) >= 0 } : undefined,
            },
          ]}
        />

        {/* ================= LINE CHART ================= */}
        <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-4 sm:p-6 lg:p-8 relative overflow-hidden">

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              Monthly Salary <span className="text-[#D4AF37]">Overview</span>
            </h2>
            <p className="text-sm text-[#B8B8B8]">Track salary expenses throughout the year</p>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly_salary ?? []}>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#B8B8B8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#B8B8B8" tickFormatter={(v) => `${v / 1000000}M`} style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: '#D4AF37', r: 5, strokeWidth: 2, stroke: '#0A0A0A' }}
                  activeDot={{ fill: '#E8C547', r: 8, strokeWidth: 2, stroke: '#0A0A0A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ================= SUMMARY ================= */}
          {stats && (
            <div className="mt-6 pt-6 border-t border-[#2A2A2A]">
              <StatsGrid
                columns={4}
                stats={[
                  {
                    icon: DollarSign,
                    title: "Total Year",
                    value: formatM(stats.totalBalance),
                  },
                  {
                    icon: Award,
                    title: "Highest Month",
                    value: `${stats.bestMonth.month} (${formatM(stats.bestMonth.amount)})`,
                  },
                  {
                    icon: BarChart2,
                    title: "Monthly Avg",
                    value: formatM(stats.avgMonthly),
                  },
                  {
                    icon: TrendingUp,
                    title: "Growth",
                    value: `${parseFloat(stats.growth) >= 0 ? "▲" : "▼"} ${stats.growth}%`,
                    trend: {
                      value: parseFloat(stats.growth) >= 0 ? "Positive growth" : "Negative growth",
                      isPositive: parseFloat(stats.growth) >= 0,
                    },
                  },
                ]}
              />
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
