import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, CheckCircle, User } from "lucide-react";

import { useAuth } from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";

import {
  searchInObject,
  capitalizeFirst,
} from "@/lib/utils/AdminUtils";

import Badge from "@/components/admin/Badge";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
type TaskStatus = "pending" | "done";

interface ScheduleTask {
  id: number;
  customerName: string;
  category: string;
  time: string;
  status: TaskStatus;
}

/* ================= DUMMY DATA ================= */
const DUMMY_SCHEDULE: ScheduleTask[] = [
  { id: 1, customerName: "Ahmad Wijaya",   category: "Premium Haircut",      time: "09:00", status: "pending" },
  { id: 2, customerName: "Budi Santoso",   category: "Haircut + Beard Trim", time: "10:30", status: "done"    },
  { id: 3, customerName: "Chandra Putra",  category: "Basic Haircut",        time: "11:00", status: "pending" },
  { id: 4, customerName: "Dimas Pratama",  category: "Hair Coloring",        time: "13:00", status: "pending" },
  { id: 5, customerName: "Eko Saputra",    category: "Premium Haircut",      time: "14:30", status: "done"    },
  { id: 6, customerName: "Fajar Ramadhan", category: "Basic Haircut",        time: "15:30", status: "pending" },
];

/* ================= CONSTANTS ================= */
const STATUS_STYLES: Record<TaskStatus, "warning" | "success"> = {
  pending: "warning",
  done: "success",
};

const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  pending: "bg-yellow-500",
  done: "bg-green-500",
};

/* ================= SUBCOMPONENT: Done Button ================= */
function DoneButton({ task, onDone }: { task: ScheduleTask; onDone: (id: number) => void }) {
  return (
    <button
      onClick={() => onDone(task.id)}
      disabled={task.status === "done"}
      className={`
        w-full px-4 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-200 active:scale-95
        ${task.status === "done"
          ? "bg-[#2A2A2A] text-[#666] cursor-not-allowed"
          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30"
        }
      `}
    >
      {task.status === "done" ? "✓ Completed" : "Mark as Done"}
    </button>
  );
}

/* ================= SUBCOMPONENT: Mobile Task Card ================= */
function MobileTaskCard({ task, index, onDone }: { task: ScheduleTask; index: number; onDone: (id: number) => void }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[#555] font-mono shrink-0">
            {(index + 1).toString().padStart(2, "0")}
          </span>
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-white text-sm font-semibold truncate">{task.customerName}</span>
        </div>
        <Badge
          text={capitalizeFirst(task.status)}
          variant={STATUS_STYLES[task.status]}
          showDot
          dotColor={STATUS_DOT_COLORS[task.status]}
        />
      </div>
      <div className="flex items-center justify-between text-sm text-[#888] px-1">
        <span>{task.category}</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{task.time}</span>
        </div>
      </div>
      <DoneButton task={task} onDone={onDone} />
    </div>
  );
}

/* ================= COMPONENT ================= */
export default function BarberSchedule() {
  const toast = useToast();

  const [schedule, setSchedule]         = useState<ScheduleTask[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");

  const { user: currentUser, logout }   = useAuth();

  useEffect(() => {
    setSchedule(DUMMY_SCHEDULE);
  }, []);

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    const totalToday  = schedule.length;
    const pending     = schedule.filter((t) => t.status === "pending").length;
    const completed   = schedule.filter((t) => t.status === "done").length;
    return {
      totalToday,
      pending,
      completed,
      completionRate: totalToday > 0 ? Math.round((completed / totalToday) * 100) : 0,
    };
  }, [schedule]);

  /* ================= FILTER ================= */
  const filteredSchedule = useMemo(() => {
    return schedule.filter((task) =>
      searchInObject(task, searchQuery, ["customerName", "category", "time"])
    );
  }, [schedule, searchQuery]);

  const hasData         = schedule.length > 0;
  const hasFilteredData = filteredSchedule.length > 0;

  /* ================= MARK DONE ================= */
  const handleMarkAsDone = (taskId: number) => {
    const task = schedule.find((t) => t.id === taskId);
    if (!task || task.status === "done") return;

    setSchedule((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: "done" } : t)
    );

    toast.success("Task Completed", `${task.customerName}'s appointment has been marked as done.`);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      key: "no",
      header: "No",
      render: (_: ScheduleTask, index: number) => (
        <span className="text-xs text-[#888] font-mono">{(index + 1).toString().padStart(2, "0")}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (task: ScheduleTask) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-white text-sm font-medium truncate">{task.customerName}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (task: ScheduleTask) => (
        <span className="text-sm text-[#B8B8B8] whitespace-nowrap">{task.category}</span>
      ),
    },
    {
      key: "time",
      header: "Time",
      render: (task: ScheduleTask) => (
        <div className="flex items-center gap-2 text-sm text-[#B8B8B8] whitespace-nowrap">
          <Clock className="w-4 h-4 shrink-0" />
          {task.time}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (task: ScheduleTask) => (
        <Badge
          text={capitalizeFirst(task.status)}
          variant={STATUS_STYLES[task.status]}
          showDot
          dotColor={STATUS_DOT_COLORS[task.status]}
        />
      ),
    },
    {
      key: "action",
      header: "",
      render: (task: ScheduleTask) => (
        <button
          onClick={() => handleMarkAsDone(task.id)}
          disabled={task.status === "done"}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            task.status === "done"
              ? "bg-[#2A2A2A] text-[#666] cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {task.status === "done" ? "Completed" : "Done"}
        </button>
      ),
    },
  ];

  /* ================= UI ================= */
  return (
    <DashboardLayout
      title="My Schedule"
      subtitle="Today's tasks"
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={
        currentUser ?? {
          name:  "John Barber",
          email: "john@barbershop.com",
        }
      }
      showNotification
      notificationCount={2}
      onLogout={logout}
    >
      <div className="w-full space-y-4 sm:space-y-6">

        {/* ================= STATS ================= */}
        <StatsGrid
          columns={4}
          stats={[
            { icon: Calendar,     title: "Total",           value: stats.totalToday          },
            { icon: Clock,        title: "Pending",         value: stats.pending             },
            { icon: CheckCircle,  title: "Done",            value: stats.completed           },
            { icon: Calendar,     title: "Completion Rate", value: `${stats.completionRate}%` },
          ]}
        />

        {/* ================= TABLE ================= */}
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search tasks..."
          isEmpty={!hasData}
          emptyIcon={Calendar}
          emptyTitle="No tasks today"
          emptyDescription="Enjoy your free time 🎉"
        >
          <div className="hidden lg:block w-full">
            {!hasFilteredData ? (
              <p className="text-center text-[#666] text-sm py-8">
                Tidak ada hasil untuk &quot;{searchQuery}&quot;
              </p>
            ) : (
              <DataTable data={filteredSchedule} columns={columns} />
            )}
          </div>

          <div className="flex lg:hidden flex-col gap-3 p-3">
            {!hasFilteredData ? (
              <p className="text-center text-[#666] text-sm py-6">
                Tidak ada hasil untuk &quot;{searchQuery}&quot;
              </p>
            ) : (
              filteredSchedule.map((task, index) => (
                <MobileTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onDone={handleMarkAsDone}
                />
              ))
            )}
          </div>
        </TableCard>

      </div>
    </DashboardLayout>
  );
}