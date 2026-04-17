import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Activity, CheckCircle, XCircle } from "lucide-react";

import { useAuth } from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";

import { searchInObject } from "@/lib/utils/AdminUtils";

import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import Badge from "@/components/admin/Badge";

/* ================= TYPES ================= */
type ActivityStatus = "completed" | "cancelled";
type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "gold" | "info";

interface BarberActivity {
  id: number;
  customerName: string;
  service: string;
  date: string;
  time: string;
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

/* ================= DUMMY DATA ================= */
const DUMMY_ACTIVITY: BarberActivity[] = [
  { id: 1,  customerName: "Ahmad Fauzi",    service: "Haircut & Beard Trim", date: "18 Mar 2026", time: "09:00", duration: "45 min", status: "completed"  },
  { id: 2,  customerName: "Budi Santoso",   service: "Classic Haircut",      date: "18 Mar 2026", time: "10:00", duration: "30 min", status: "completed"  },
  { id: 3,  customerName: "Rizky Pratama",  service: "Hair Wash & Style",    date: "18 Mar 2026", time: "11:15", duration: "40 min", status: "completed"  },
  { id: 4,  customerName: "Doni Wijaya",    service: "Full Grooming",        date: "18 Mar 2026", time: "13:00", duration: "60 min", status: "cancelled"  },
  { id: 5,  customerName: "Eko Nugroho",    service: "Beard Trim",           date: "18 Mar 2026", time: "14:30", duration: "20 min", status: "completed"  },
  { id: 6,  customerName: "Fajar Ramadhan", service: "Basic Haircut",        date: "17 Mar 2026", time: "09:00", duration: "30 min", status: "completed"  },
  { id: 7,  customerName: "Gilang Nugroho", service: "Premium Haircut",      date: "17 Mar 2026", time: "10:30", duration: "45 min", status: "completed"  },
  { id: 8,  customerName: "Hendra Kusuma",  service: "Haircut & Beard Trim", date: "17 Mar 2026", time: "12:00", duration: "60 min", status: "completed"  },
  { id: 9,  customerName: "Irfan Hakim",    service: "Classic Haircut",      date: "16 Mar 2026", time: "09:30", duration: "30 min", status: "cancelled"  },
  { id: 10, customerName: "Joko Widodo",    service: "Hair Coloring",        date: "16 Mar 2026", time: "11:00", duration: "90 min", status: "completed"  },
  { id: 11, customerName: "Kevin Pratama",  service: "Beard Trim",           date: "16 Mar 2026", time: "13:30", duration: "20 min", status: "completed"  },
  { id: 12, customerName: "Lukman Hakim",   service: "Full Grooming",        date: "15 Mar 2026", time: "10:00", duration: "60 min", status: "cancelled"  },
  { id: 13, customerName: "Muhamad Rizal",  service: "Premium Haircut",      date: "15 Mar 2026", time: "14:00", duration: "45 min", status: "completed"  },
  { id: 14, customerName: "Nanang Kosim",   service: "Hair Wash & Style",    date: "14 Mar 2026", time: "09:00", duration: "40 min", status: "completed"  },
  { id: 15, customerName: "Ogi Pramana",    service: "Basic Haircut",        date: "14 Mar 2026", time: "11:30", duration: "30 min", status: "cancelled"  },
];

/* ================= FILTER OPTIONS ================= */
const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "All Status" },
  { value: "completed", label: "Completed"  },
  { value: "cancelled", label: "Cancelled"  },
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

/* ================= MAIN PAGE ================= */
export default function BarberActivityPage() {
  const [activities, setActivities]     = useState<BarberActivity[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { user: currentUser, logout }   = useAuth();

  useEffect(() => {
    setActivities(DUMMY_ACTIVITY);
  }, []);

  /* ── Stats ────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const completed = activities.filter((a) => a.status === "completed").length;
    const cancelled = activities.filter((a) => a.status === "cancelled").length;
    return { total: activities.length, completed, cancelled };
  }, [activities]);

  /* ── Filter + Search ──────────────────────────────────────── */
  const filteredActivities = useMemo(() => {
    return activities
      .filter((a) => filterStatus === "all" || a.status === filterStatus)
      .filter((a) =>
        searchInObject(a, searchQuery, ["customerName", "service", "date", "time"])
      );
  }, [activities, searchQuery, filterStatus]);

  /* ── Table Columns ────────────────────────────────────────── */
  const columns = useMemo(
    () => [
      {
        key: "customerName",
        header: "Customer",
        render: (activity: BarberActivity) => (
          <span className="text-white font-medium whitespace-nowrap">
            {activity.customerName}
          </span>
        ),
      },
      {
        key: "service",
        header: "Service",
        render: (activity: BarberActivity) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {activity.service}
          </span>
        ),
      },
      {
        key: "startTime",
        header: "Start Time",
        render: (activity: BarberActivity) => (
          <span className="text-[#D4AF37] font-semibold whitespace-nowrap">
            {activity.time}
          </span>
        ),
      },
      {
        key: "endTime",
        header: "End Time",
        render: (activity: BarberActivity) => (
          <span className="text-[#D4AF37] font-semibold whitespace-nowrap">
            {calcEndTime(activity.time, activity.duration)}
          </span>
        ),
      },
      {
        key: "date",
        header: "Date",
        render: (activity: BarberActivity) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDate(activity.date)}
          </span>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        render: (activity: BarberActivity) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {activity.duration}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (activity: BarberActivity) => (
          <Badge
            text={activity.status === "completed" ? "Completed" : "Cancelled"}
            variant={STATUS_STYLES[activity.status]}
            showDot
            dotColor={STATUS_DOT_COLORS[activity.status]}
          />
        ),
      },
    ],
    [filteredActivities]
  );

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <DashboardLayout
      title="My Activity"
      subtitle="History of your completed sessions"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={
        currentUser ?? {
          name: "John Barber",
          email: "john@barbershop.com",
          role: "barber",
        }
      }
      showNotification
      notificationCount={0}
      onLogout={logout}
    >
      <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">

        {/* ── Stats ───────────────────────────────────────────── */}
        <StatsGrid
          columns={3}
          stats={[
            { icon: Activity,    title: "Total Sessions", value: stats.total     },
            { icon: CheckCircle, title: "Completed",      value: stats.completed },
            { icon: XCircle,     title: "Cancelled",      value: stats.cancelled },
          ]}
        />

        {/* ── Table Card ──────────────────────────────────────── */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by customer, service, or date..."
          filters={[
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: STATUS_FILTER_OPTIONS,
            },
          ]}
          isEmpty={filteredActivities.length === 0}
          emptyIcon={Activity}
          emptyTitle="No activity found"
          emptyDescription="Try adjusting your search or filter"
        >
          {/* ── Desktop Table ─────────────────────────────────── */}
          <div className="hidden md:block w-full overflow-x-auto">
            <DataTable data={filteredActivities} columns={columns} />
          </div>

          {/* ── Mobile Cards ──────────────────────────────────── */}
          <div className="block md:hidden">
            <MobileCardList
              data={filteredActivities}
              renderCard={(activity: BarberActivity) => (
                <MobileCard
                  title={activity.customerName}
                  subtitle={activity.service}
                  headerRight={
                    <Badge
                      text={activity.status === "completed" ? "Completed" : "Cancelled"}
                      variant={STATUS_STYLES[activity.status]}
                      showDot
                      dotColor={STATUS_DOT_COLORS[activity.status]}
                    />
                  }
                  fields={[
                    { label: "Start Time", value: activity.time                              },
                    { label: "End Time",   value: calcEndTime(activity.time, activity.duration) },
                    { label: "Date",       value: formatDate(activity.date)                          },
                    { label: "Duration",   value: activity.duration                          },
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