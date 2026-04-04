// File: src/pages/owner/OwnerBarberScheduleMonitor.tsx

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TimerOff,
  User,
  ChevronDown,
} from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import * as ownerService from "@/services/owner.service";
import { searchInObject } from "@/lib/utils/AdminUtils";

import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";
import ActionButtons from "@/components/admin/ActionButtons";

import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */
type AttendanceStatus = "on-time" | "late";

interface ScheduleEntry {
  id: number;
  barberId: number;
  barberName: string;
  day: string;
  date: string;
  shiftLabel: "Morning" | "Afternoon" | "Evening";
  scheduledStart: string;
  scheduledEnd: string;
  actualCheckin: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
}

/* ================= HELPERS ================= */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(base: string, minutes: number): string {
  const total = parseMinutes(base) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function deriveInitialStatus(
  scheduledStart: string,
  scheduledEnd: string,
  actualCheckin: string | null
): Pick<ScheduleEntry, "status" | "lateMinutes"> {
  if (actualCheckin) {
    const late = Math.max(0, parseMinutes(actualCheckin) - parseMinutes(scheduledStart));
    return { status: late > 5 ? "late" : "on-time", lateMinutes: late };
  }
  const shiftDuration = parseMinutes(scheduledEnd) - parseMinutes(scheduledStart);
  return { status: "late", lateMinutes: Math.max(0, shiftDuration) };
}

type RawEntry = {
  id: number;
  barberId: number;
  barberName: string;
  day: string;
  date: string;
  shiftLabel: "Morning" | "Afternoon" | "Evening";
  scheduledStart: string;
  scheduledEnd: string;
  actualCheckin: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
};

function makeRaw(base: Omit<RawEntry, "status" | "lateMinutes">): RawEntry {
  return { ...base, ...deriveInitialStatus(base.scheduledStart, base.scheduledEnd, base.actualCheckin) };
}

function buildSchedule(raw: RawEntry[]): ScheduleEntry[] {
  return raw.map((r) => ({ ...r }));
}

/* ================= CONSTANTS ================= */
const STATUS_SORT_ORDER: Record<AttendanceStatus, number> = { late: 0, "on-time": 1 };
const STATUS_BADGE: Record<AttendanceStatus, string>      = { "on-time": "On Time", late: "Late" };
const STATUS_DOT: Record<AttendanceStatus, string>        = { "on-time": "bg-emerald-500", late: "bg-amber-500" };

const SHIFT_BADGE_COLOR: Record<string, string> = {
  Morning:   "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  Afternoon: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  Evening:   "bg-violet-500/10 text-violet-400 border border-violet-500/20",
};

function ShiftBadge({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${SHIFT_BADGE_COLOR[label] ?? "bg-zinc-700/50 text-zinc-300 border border-zinc-600"}`}>
      {label}
    </span>
  );
}

/* ================= FILTER OPTIONS ================= */
const DAY_FILTER_OPTIONS = [
  { value: "all", label: "All Days" },
  ...DAYS.map((d) => ({ value: d, label: d })),
];
const SHIFT_FILTER_OPTIONS = [
  { value: "all",       label: "All Shifts" },
  { value: "Morning",   label: "Morning"    },
  { value: "Afternoon", label: "Afternoon"  },
  { value: "Evening",   label: "Evening"    },
];

/* ================= LIVE CLOCK ================= */
function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  useEffect(() => {
    const t = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })),
      1000
    );
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-[#D4AF37] tabular-nums">{time}</span>;
}

/* ================= EDIT ATTENDANCE MODAL ================= */
interface EditAttendanceModalProps {
  entry: ScheduleEntry;
  onClose: () => void;
  onSave: (id: number, status: AttendanceStatus, lateMinutes: number) => void;
}

function EditAttendanceModal({ entry, onClose, onSave }: EditAttendanceModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(entry.status);
  const [lateMinutes, setLateMinutes]       = useState(
    entry.status === "late" && entry.lateMinutes > 0 ? String(entry.lateMinutes) : ""
  );
  const [error, setError]   = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSelectedStatus(entry.status);
    setLateMinutes(entry.status === "late" && entry.lateMinutes > 0 ? String(entry.lateMinutes) : "");
    setError(null);
    setIsDirty(false);
  }, [entry]);

  const parsedMins = parseInt(lateMinutes, 10);

  const isSaveDisabled =
    !isDirty ||
    (selectedStatus === "late" &&
      (!lateMinutes.trim() || isNaN(parsedMins) || parsedMins <= 0));

  const estimatedCheckin =
    selectedStatus === "late" && !isNaN(parsedMins) && parsedMins > 0
      ? addMinutes(entry.scheduledStart, parsedMins)
      : null;

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as AttendanceStatus;
    setSelectedStatus(newStatus);
    if (newStatus === "on-time") setLateMinutes("");
    setError(null);
    setIsDirty(true);
  }

  function handleLateMinutesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLateMinutes(e.target.value);
    setError(null);
    setIsDirty(true);
  }

  function handleSave() {
    setError(null);
    if (selectedStatus === "late") {
      const mins = parseInt(lateMinutes, 10);
      if (!lateMinutes.trim() || isNaN(mins)) {
        setError("Please enter the number of late minutes.");
        return;
      }
      if (mins <= 0) {
        setError("Late minutes must be greater than 0.");
        return;
      }
      const shiftDuration = parseMinutes(entry.scheduledEnd) - parseMinutes(entry.scheduledStart);
      if (mins > shiftDuration) {
        setError(`Cannot exceed shift duration (${shiftDuration} minutes).`);
        return;
      }
      onSave(entry.id, "late", mins);
    } else {
      onSave(entry.id, "on-time", 0);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <h3 className="text-white font-semibold text-base">Edit Attendance</h3>
          <p className="text-zinc-400 text-sm mt-0.5">
            {entry.barberName} · {entry.shiftLabel} shift · {entry.day}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Shift info */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
            <span className="text-xs text-zinc-500">Scheduled</span>
            <span className="font-mono text-sm text-[#B8B8B8]">
              {entry.scheduledStart} – {entry.scheduledEnd}
            </span>
          </div>

          {/* Status dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Attendance Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-full appearance-none bg-zinc-800/60 border border-zinc-700/40 rounded-xl
                           px-4 py-3 pr-10 text-sm font-medium
                           focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50
                           transition-all duration-150 cursor-pointer
                           text-white"
              >
                <option value="on-time">On Time</option>
                <option value="late">Late</option>
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <span
                className={`absolute right-10 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none
                  ${selectedStatus === "on-time" ? "bg-emerald-500" : "bg-amber-500"}`}
              />
            </div>

            <p className={`text-xs ${selectedStatus === "on-time" ? "text-emerald-500/70" : "text-amber-500/70"}`}>
              {selectedStatus === "on-time"
                ? "Clock-in will be recorded as on time."
                : "Enter the number of late minutes below."}
            </p>
          </div>

          {/* Late minutes */}
          {selectedStatus === "late" && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Minutes Late <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={lateMinutes}
                  onChange={handleLateMinutesChange}
                  placeholder="e.g. 15"
                  className={`w-full bg-zinc-800/60 border rounded-xl px-4 py-3 pr-20 text-sm text-white placeholder:text-zinc-600
                    focus:outline-none focus:ring-1 transition-all duration-150
                    ${error
                      ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50"
                      : "border-zinc-700/40 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50"
                    }`}
                />
                {/* pr-20 ensures the label does not overlap the input text */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none select-none">
                  minutes
                </span>
              </div>

              {estimatedCheckin && !error && (
                <p className="text-xs text-zinc-500">
                  Estimated clock-in:{" "}
                  <span className="font-mono text-amber-400">{estimatedCheckin}</span>
                </p>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300
                       border border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-800
                       transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isSaveDisabled
                ? "bg-[#D4AF37]/30 text-black/40 cursor-not-allowed"
                : "bg-[#D4AF37] hover:bg-[#e0bb45] text-black cursor-pointer"
              }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function OwnerBarberScheduleMonitor() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [rawEntries, setRawEntries]     = useState<RawEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    ownerService.getSchedule().then((data) => {
      setRawEntries(data.map((a) => makeRaw({
        id:             a.id,
        barberId:       a.barber_id,
        barberName:     a.barber_name,
        day:            a.day,
        date:           today,
        shiftLabel:     a.shift_label as "Morning" | "Afternoon" | "Evening",
        scheduledStart: a.scheduled_start,
        scheduledEnd:   a.scheduled_end,
        actualCheckin:  a.actual_checkin,
      })));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const schedule = useMemo(() => buildSchedule(rawEntries), [rawEntries]);

  const [searchQuery, setSearchQuery]   = useState("");
  const [filterBarber, setFilterBarber] = useState("all");
  const [filterDay, setFilterDay]       = useState("all");
  const [filterShift, setFilterShift]   = useState("all");

  const stats = useMemo(() => ({
    total:  schedule.length,
    onTime: schedule.filter((e) => e.status === "on-time").length,
    late:   schedule.filter((e) => e.status === "late").length,
  }), [schedule]);

  const barberFilterOptions = useMemo(() => {
    const unique = [...new Map(rawEntries.map((r) => [r.barberId, r.barberName])).entries()];
    return [
      { value: "all", label: "All Barbers" },
      ...unique.map(([id, name]) => ({ value: String(id), label: name })),
    ];
  }, [rawEntries]);

  const filteredSchedule = useMemo(() => {
    return schedule
      .filter((entry) => {
        const matchSearch = searchInObject(entry, searchQuery, ["barberName", "day", "shiftLabel"]);
        const matchBarber = filterBarber === "all" || String(entry.barberId) === filterBarber;
        const matchDay    = filterDay    === "all" || entry.day              === filterDay;
        const matchShift  = filterShift  === "all" || entry.shiftLabel       === filterShift;
        return matchSearch && matchBarber && matchDay && matchShift;
      })
      .sort((a, b) => {
        if (STATUS_SORT_ORDER[a.status] !== STATUS_SORT_ORDER[b.status])
          return STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
        return b.lateMinutes - a.lateMinutes;
      });
  }, [schedule, searchQuery, filterBarber, filterDay, filterShift]);

  function handleSaveAttendance(id: number, status: AttendanceStatus, lateMinutes: number) {
    const target = rawEntries.find((r) => r.id === id);
    setRawEntries((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const checkin =
          status === "on-time"
            ? r.scheduledStart
            : addMinutes(r.scheduledStart, lateMinutes);
        return { ...r, actualCheckin: checkin, status, lateMinutes };
      })
    );
    setEditingEntry(null);
    if (target) {
      if (status === "on-time") {
        toast.success("Attendance Updated", `${target.barberName} marked as on time.`);
      } else {
        toast.warning("Attendance Updated", `${target.barberName} marked as late by ${lateMinutes} min.`);
      }
    }
  }

  /* ── Table columns ── */
  const columns = [
    {
      key: "barber",
      header: "Barber",
      render: (entry: ScheduleEntry) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-[#D4AF37]" />
          </div>
          <p className="font-semibold text-white">{entry.barberName}</p>
        </div>
      ),
    },
    {
      key: "day",
      header: "Day",
      render: (entry: ScheduleEntry) => (
        <span className="text-sm text-[#B8B8B8]">{entry.day}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (entry: ScheduleEntry) => (
        <span className="text-sm text-[#B8B8B8]">
          {entry.date}
        </span>
      ),
    },
    {
      key: "shift",
      header: "Shift",
      render: (entry: ScheduleEntry) => <ShiftBadge label={entry.shiftLabel} />,
    },
    {
      key: "schedule",
      header: "Scheduled",
      render: (entry: ScheduleEntry) => (
        <span className="font-mono text-sm text-[#B8B8B8]">
          {entry.scheduledStart} – {entry.scheduledEnd}
        </span>
      ),
    },
    {
      key: "checkin",
      header: "Clock-In",
      render: (entry: ScheduleEntry) =>
        entry.actualCheckin ? (
          <span className="font-mono text-sm text-white">{entry.actualCheckin}</span>
        ) : (
          <span className="text-sm text-zinc-500 italic">Not recorded</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (entry: ScheduleEntry) => (
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit
              ${entry.status === "on-time"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status]}`} />
            {STATUS_BADGE[entry.status]}
          </span>
          {entry.status === "late" && (
            <span className="text-[11px] text-zinc-500 font-mono">
              -{entry.lateMinutes} min
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (entry: ScheduleEntry) => (
        <ActionButtons actions={[
          { type: "edit", onClick: () => setEditingEntry(entry) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Barbers Schedule"
      subtitle="Real-time barber attendance tracking"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={stats.late}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock size={12} />
          <LiveClock />
        </div>

        <StatsGrid
          stats={[
            { icon: Activity,      title: "Total Scheduled", value: stats.total  },
            { icon: CheckCircle2,  title: "On Time",         value: stats.onTime },
            { icon: AlertTriangle, title: "Late",            value: stats.late   },
          ]}
          columns={3}
        />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by barber, day, or shift…"
          filters={[
            { label: "Barber", value: filterBarber, onChange: setFilterBarber, options: barberFilterOptions },
            { label: "Day",    value: filterDay,    onChange: setFilterDay,    options: DAY_FILTER_OPTIONS    },
            { label: "Shift",  value: filterShift,  onChange: setFilterShift,  options: SHIFT_FILTER_OPTIONS  },
          ]}
          isEmpty={filteredSchedule.length === 0}
          emptyIcon={TimerOff}
          emptyTitle="No schedule entries found"
          emptyDescription="Try adjusting your filters"
        >
          <DataTable data={filteredSchedule} columns={columns} />

          <MobileCardList
            data={filteredSchedule}
            renderCard={(entry: ScheduleEntry) => (
              <MobileCard
                title={entry.barberName}
                subtitle={
                  <p className="text-xs text-[#B8B8B8]">
                    {entry.day},{" "}
                    {entry.date}
                  </p>
                }
                badge={<ShiftBadge label={entry.shiftLabel} />}
                headerRight={
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium
                        ${entry.status === "on-time"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status]}`} />
                      {STATUS_BADGE[entry.status]}
                    </span>
                    <ActionButtons actions={[
                      { type: "edit", onClick: () => setEditingEntry(entry) },
                    ]} />
                  </div>
                }
                fields={[
                  {
                    label: "Scheduled",
                    value: (
                      <span className="font-mono text-sm">
                        {entry.scheduledStart} – {entry.scheduledEnd}
                      </span>
                    ),
                  },
                  {
                    label: "Clock-In",
                    value: entry.actualCheckin
                      ? <span className="font-mono text-sm text-white">{entry.actualCheckin}</span>
                      : <span className="text-sm text-zinc-500 italic">Not recorded</span>,
                  },
                  ...(entry.status === "late"
                    ? [{
                        label: "Late",
                        value: (
                          <span className="font-mono text-sm text-amber-400">
                            -{entry.lateMinutes} min
                          </span>
                        ),
                      }]
                    : []),
                ]}
              />
            )}
          />
        </TableCard>
      </div>

      {editingEntry && (
        <EditAttendanceModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveAttendance}
        />
      )}
    </DashboardLayout>
  );
}