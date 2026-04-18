import { useState, useEffect } from "react";
import { Scissors, Users, Calendar, Store, Loader2 } from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";

import Badge from "@/components/admin/Badge";
import StatsGrid from "@/components/admin/StatGrid";

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

import { getBarberDashboard, type BarberDashboardData } from "@/services/barber.service";

/* ── Helpers ── */
function getDurationMin(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0A0A] border-2 border-[#D4AF37] rounded-xl px-4 py-2 shadow-lg shadow-[#D4AF37]/30">
      <p className="text-xs text-[#B8B8B8]">{label}</p>
      <p className="text-[#D4AF37] font-semibold">{payload[0].value} customers</p>
    </div>
  );
};

/* ── Component ── */
export default function BarberDashboard() {
  const { user: currentUser, logout } = useAuth();
  const [data,    setData]    = useState<BarberDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBarberDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const layoutProps = {
    title: "Dashboard", subtitle: "Your work summary",
    showSidebar: true, menuItems: barberMenu, logo: barberLogo,
    userProfile: currentUser ?? { name: "Barber", email: "" },
    showNotification: true, onLogout: logout,
  };

  if (loading) return (
    <DashboardLayout {...layoutProps}>
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout {...layoutProps}>
      <div className="w-full space-y-6 lg:space-y-8">

        {/* Stats */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: Store,    title: "Workplace",       value: data?.workplace ?? "—" },
            { icon: Scissors, title: "Total Jobs Done", value: data?.total_done.toLocaleString() ?? "0" },
            { icon: Calendar, title: "This Month",      value: data?.this_month ?? 0 },
            { icon: Users,    title: "Monthly Average", value: data?.monthly_avg ?? 0 },
          ]}
        />

        {/* Line Chart */}
        <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Monthly Customer <span className="text-[#D4AF37]">Statistics</span></h2>
            <p className="text-sm text-[#B8B8B8]">Track customers served throughout the year</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.chart ?? []}>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#B8B8B8" style={{ fontSize: "12px" }} />
                <YAxis stroke="#B8B8B8" allowDecimals={false} style={{ fontSize: "12px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="customers" stroke="#D4AF37" strokeWidth={3}
                  dot={{ fill: "#D4AF37", r: 5, strokeWidth: 2, stroke: "#0A0A0A" }}
                  activeDot={{ fill: "#E8C547", r: 8, strokeWidth: 2, stroke: "#0A0A0A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Recent <span className="text-[#D4AF37]">Activity</span></h2>
            <p className="text-sm text-[#B8B8B8]">Latest 5 barber service activities</p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  {["Customer","Service","Start Time","End Time","Date","Duration","Status"].map((h) => (
                    <th key={h} className="text-left text-[#B8B8B8] font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.recent ?? []).map((item, i) => (
                  <tr key={i} className="border-b border-[#2A2A2A] last:border-0 hover:bg-[#242424] transition-colors duration-150">
                    <td className="py-4 pr-4 text-white font-medium">{item.customer_name}</td>
                    <td className="py-4 pr-4 text-[#B8B8B8]">{item.service_name}</td>
                    <td className="py-4 pr-4 text-[#D4AF37] font-semibold">{item.start_time}</td>
                    <td className="py-4 pr-4 text-[#D4AF37] font-semibold">{item.end_time}</td>
                    <td className="py-4 pr-4 text-[#B8B8B8]">{item.booking_date}</td>
                    <td className="py-4 pr-4 text-[#B8B8B8]">{getDurationMin(item.start_time, item.end_time)} min</td>
                    <td className="py-4">
                      <Badge text="Completed" variant="success" showDot dotColor="bg-emerald-400" />
                    </td>
                  </tr>
                ))}
                {(data?.recent ?? []).length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-[#666] text-sm">No activity yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {(data?.recent ?? []).length === 0 && (
              <p className="text-center text-[#666] text-sm py-8">No activity yet</p>
            )}
            {(data?.recent ?? []).map((item, i) => (
              <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 space-y-3 hover:border-[#D4AF37]/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{item.customer_name}</p>
                    <p className="text-xs text-[#B8B8B8] mt-0.5">{item.service_name}</p>
                  </div>
                  <Badge text="Completed" variant="success" showDot dotColor="bg-emerald-400" />
                </div>
                <div className="text-xs space-y-1.5 pt-2 border-t border-[#2A2A2A]">
                  <div className="flex justify-between"><span className="text-white font-medium">Start</span><span className="text-[#D4AF37] font-semibold">{item.start_time}</span></div>
                  <div className="flex justify-between"><span className="text-white font-medium">End</span><span className="text-[#D4AF37] font-semibold">{item.end_time}</span></div>
                  <div className="flex justify-between"><span className="text-white font-medium">Date</span><span className="text-[#B8B8B8]">{item.booking_date}</span></div>
                  <div className="flex justify-between"><span className="text-white font-medium">Duration</span><span className="text-[#B8B8B8]">{getDurationMin(item.start_time, item.end_time)} min</span></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
