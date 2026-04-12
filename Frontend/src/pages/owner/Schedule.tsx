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
  UserX,
  X,
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
type AttendanceStatus = "on_time" | "late" | "absent";

interface ScheduleEntry {
  id:               number;
  attendanceId:     number | null;
  assignmentId:     number;
  barberId:         number;
  barberName:       string;
  barberEmail:      string;
  barberPhoto:      string | null;
  day:              string;
  date:             string;
  shiftLabel:       "Morning" | "Afternoon" | "Evening";
  scheduledStart:   string;
  scheduledEnd:     string;
  assignmentStatus: "active" | "off" | "leave";
  actualCheckin:    string | null;
  actualCheckout:   string | null;   
  status:           AttendanceStatus;
  lateMinutes:      number;
  hasAttendance:    boolean;
}

/* ================= HELPERS ================= */

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

/* ================= CONSTANTS ================= */
const STATUS_SORT_ORDER: Record<AttendanceStatus, number> = { absent: 0, late: 1, on_time: 2 };
const STATUS_BADGE: Record<AttendanceStatus, string>      = { on_time: "On Time", late: "Late", absent: "Absent" };
const STATUS_DOT: Record<AttendanceStatus, string>        = { on_time: "bg-emerald-500", late: "bg-amber-500", absent: "bg-zinc-500" };

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
  onSave: (entry: ScheduleEntry, actualCheckin: string | null, status: AttendanceStatus, lateMinutes: number) => Promise<void>;
  isLoading: boolean;
}

function EditAttendanceModal({ entry, onClose, onSave, isLoading }: EditAttendanceModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(entry.status);
  const [lateMinutes, setLateMinutes]       = useState(
    entry.status === "late" && entry.lateMinutes > 0 ? String(entry.lateMinutes) : ""
  );
  const [error, setError]   = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [actualCheckin, setActualCheckin] = useState<string | null>(entry.actualCheckin);

  useEffect(() => {
    setSelectedStatus(entry.status);
    setActualCheckin(entry.actualCheckin);  // ← tambahkan ini
    setLateMinutes(entry.status === "late" && entry.lateMinutes > 0 ? String(entry.lateMinutes) : "");
    setError(null);
    setIsDirty(false);
  }, [entry]);

  const parsedMins = parseInt(lateMinutes, 10);

  const isSaveDisabled =
  !isDirty ||
  (selectedStatus === "late" &&
    (!actualCheckin || !lateMinutes.trim() || isNaN(parsedMins) || parsedMins <= 0));

  const estimatedCheckin =
    selectedStatus === "late" && !isNaN(parsedMins) && parsedMins > 0
      ? addMinutes(entry.scheduledStart, parsedMins)
      : null;

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as AttendanceStatus;
    setSelectedStatus(newStatus);
    if (newStatus === "absent") {
      setLateMinutes("");
      setActualCheckin(null);   
    } else if (newStatus === "on_time") {
      setLateMinutes("");
    }
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
      if (!actualCheckin) {
        setError("Please enter the actual check-in time for a late status.");
        return;
      }
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
      onSave(entry, actualCheckin, "late", mins);
    } else if (selectedStatus === "absent") {
      onSave(entry, null, "absent", 0);
    } else {
      onSave(entry, actualCheckin, "on_time", 0);
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

          {/* Actual Check-in Time */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Actual Check-in Time
            </label>
            <input
              type="time"
              value={actualCheckin ?? ""}
              onChange={(e) => {
                const val = e.target.value || null;
                setActualCheckin(val);
                if (val) {
                  const diff = Math.max(0, parseMinutes(val) - parseMinutes(entry.scheduledStart));
                  if (diff > 5) { setSelectedStatus("late"); setLateMinutes(String(diff)); }
                  else           { setSelectedStatus("on_time"); setLateMinutes(""); }
                } else {
                  setSelectedStatus("absent");
                  setLateMinutes("");
                }
                setIsDirty(true);
              }}
              className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-4 py-3 text-sm text-white
                        focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/50"
            />
            <p className="text-xs text-zinc-500">Leave blank if the barber is not present (Absent).</p>
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
                <option value="on_time">On Time</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <span
                className={`absolute right-10 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none
                  ${selectedStatus === "on_time" ? "bg-emerald-500" : selectedStatus === "late" ? "bg-amber-500" : "bg-zinc-500"}`}
              />
            </div>

            <p className={`text-xs ${selectedStatus === "on_time" ? "text-emerald-500/70" : selectedStatus === "late" ? "text-amber-500/70" : "text-zinc-500/70"}`}>
              {selectedStatus === "on_time"
                ? "Clock-in will be recorded as on time."
                : selectedStatus === "late"
                ? "Enter the number of late minutes below."
                : "Barber will be marked as absent."}
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
            disabled={isSaveDisabled || isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isSaveDisabled || isLoading
                ? "bg-[#D4AF37]/30 text-black/40 cursor-not-allowed"
                : "bg-[#D4AF37] hover:bg-[#e0bb45] text-black cursor-pointer"
              }`}
          >
            {isLoading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= VIEW ATTENDANCE MODAL ================= */
function ViewAttendanceModal({ entry, onClose }: { entry: ScheduleEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold text-base">Attendance Detail</h3>
            <p className="text-zinc-400 text-sm mt-0.5">{entry.barberName} · {entry.date}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Barber */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/40">
            {entry.barberPhoto
              ? <img src={entry.barberPhoto} alt={entry.barberName} className="w-10 h-10 rounded-full object-cover border border-zinc-700 flex-shrink-0" />
              : <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-[#D4AF37]" />
                </div>
            }
            <div>
              <p className="font-semibold text-white text-sm">{entry.barberName}</p>
              <p className="text-xs text-zinc-400">{entry.barberEmail}</p>
            </div>
          </div>

          {/* Day & Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Day / Date</label>
            <div className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-sm text-white">
              {entry.day}, {entry.date}
            </div>
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Shift</label>
            <div className="flex items-center gap-2 w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5">
              <ShiftBadge label={entry.shiftLabel} />
              <span className="font-mono text-sm text-zinc-400">{entry.scheduledStart} – {entry.scheduledEnd}</span>
            </div>
          </div>

          {/* Actual Check-in */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Actual Check-in</label>
            <div className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-sm">
              {entry.actualCheckin
                ? <span className="font-mono text-white">{entry.actualCheckin}</span>
                : <span className="italic text-zinc-500">Not recorded</span>
              }
            </div>
          </div>

          {/* Actual Check-out */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Actual Check-out</label>
            <div className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-sm">
              {entry.actualCheckout
                ? <span className="font-mono text-white">{entry.actualCheckout}</span>
                : <span className="italic text-zinc-500">Not recorded</span>
              }
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</label>
            <div className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                ${entry.status === "on_time"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : entry.status === "late"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status]}`} />
                {STATUS_BADGE[entry.status]}
                {entry.status === "late" && ` (-${entry.lateMinutes} min)`}
              </span>
            </div>
          </div>

        </div>
        {/* Klik backdrop untuk tutup — tidak ada footer */}
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function OwnerBarberScheduleMonitor() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const now   = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries]           = useState<ScheduleEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ScheduleEntry | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);

  const loadSchedule = (date: string) => {
    setIsLoading(true);
    ownerService.getSchedule(date).then((data) => {
      setEntries(data.map((a) => ({
        id:               a.assignment_id,
        attendanceId:     a.attendance_id,
        assignmentId:     a.assignment_id,
        barberId:         a.barber_id,
        barberName:       a.barber_name,
        barberEmail:      a.barber_email,
        barberPhoto:      a.barber_photo,
        day:              a.day,
        date:             a.date,
        shiftLabel:       a.shift_label as "Morning" | "Afternoon" | "Evening",
        scheduledStart:   a.scheduled_start,
        scheduledEnd:     a.scheduled_end,
        assignmentStatus: a.assignment_status,
        actualCheckin:    a.actual_checkin,
        actualCheckout:   a.actual_checkout,   
        status:           a.status,
        lateMinutes:      a.late_minutes,
        hasAttendance:    a.has_attendance,
      })));
    }).catch(() => {
      toast.error("Load Failed", "Failed to load schedule data.");
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { loadSchedule(selectedDate); }, [selectedDate]);

  const [searchQuery, setSearchQuery]   = useState("");
  const [filterBarber, setFilterBarber] = useState("all");
  const [filterShift, setFilterShift]   = useState("all");

  const stats = useMemo(() => ({
    total:  entries.length,
    onTime: entries.filter((e) => e.status === "on_time").length,
    late:   entries.filter((e) => e.status === "late").length,
    absent: entries.filter((e) => e.status === "absent").length,
  }), [entries]);

  const barberFilterOptions = useMemo(() => {
    const unique = [...new Map(entries.map((r) => [r.barberId, r.barberName])).entries()];
    return [
      { value: "all", label: "All Barbers" },
      ...unique.map(([id, name]) => ({ value: String(id), label: name })),
    ];
  }, [entries]);

  const filteredSchedule = useMemo(() => {
    return entries
      .filter((entry) => {
        const matchSearch = searchInObject(entry, searchQuery, ["barberName", "day", "shiftLabel"]);
        const matchBarber = filterBarber === "all" || String(entry.barberId) === filterBarber;
        const matchShift  = filterShift  === "all" || entry.shiftLabel       === filterShift;
        return matchSearch && matchBarber && matchShift;
      })
      .sort((a, b) => {
        if (STATUS_SORT_ORDER[a.status] !== STATUS_SORT_ORDER[b.status])
          return STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
        return b.lateMinutes - a.lateMinutes;
      });
  }, [entries, searchQuery, filterBarber, filterShift]);

  const handleSaveAttendance = async (
    entry: ScheduleEntry,
    actualCheckin: string | null,
    status: AttendanceStatus,
    lateMinutes: number,
  ) => {
    setIsSaving(true);
    try {
      await ownerService.updateAttendance(entry.assignmentId, {
        date:           entry.date,
        actual_checkin: actualCheckin,
        status,
        late_minutes:   lateMinutes,
      });
      loadSchedule(selectedDate);
      setEditingEntry(null);
      if (status === "on_time") {
        toast.success("Attendance Updated", `${entry.barberName} marked as on time.`);
      } else if (status === "late") {
        toast.warning("Attendance Updated", `${entry.barberName} marked as late by ${lateMinutes} min.`);
      } else {
        toast.warning("Attendance Updated", `${entry.barberName} marked as absent.`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update attendance. Please try again.";
      toast.error("Update Failed", msg);
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Table columns ── */
  const columns = [
    {
      key: "barber",
      header: "Barber",
      render: (entry: ScheduleEntry) => (
        <div className="flex items-center gap-3">
          {entry.barberPhoto
            ? <img src={entry.barberPhoto} alt={entry.barberName}
                  className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0" />
            : <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-[#D4AF37]" />
              </div>
          }
          <div>
            <p className="font-semibold text-white">{entry.barberName}</p>
            <p className="text-xs text-zinc-400">{entry.barberEmail}</p>
          </div>
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
      key: "checkout",
      header: "Clock-Out",
      render: (entry: ScheduleEntry) =>
        entry.actualCheckout ? (
          <span className="font-mono text-sm text-white">{entry.actualCheckout}</span>
        ) : (
          <span className="text-sm text-zinc-500 italic">Not recorded</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (entry: ScheduleEntry) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit
            ${entry.status === "on_time"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : entry.status === "late"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status]}`} />
            {STATUS_BADGE[entry.status]}
          </span>
          {entry.status === "late" && (
            <span className="text-[11px] text-zinc-500 font-mono">-{entry.lateMinutes} min</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center", 
      className: "text-center",         
      render: (entry: ScheduleEntry) => (
        <ActionButtons actions={[
          { type: "view", onClick: () => setViewingEntry(entry) },
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

        {/* Live Clock */}
        <div className="flex justify-center md:justify-end items-center gap-2 text-zinc-400 text-base">
          <Clock size={16} />
          <LiveClock />
        </div>

        <StatsGrid
          stats={[
            { icon: Activity,      title: "Total Scheduled", value: stats.total  },
            { icon: CheckCircle2,  title: "On Time",         value: stats.onTime },
            { icon: AlertTriangle, title: "Late",            value: stats.late   },
            { icon: UserX,         title: "Absent",          value: stats.absent },
          ]}
          columns={4}
        />

        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by barber, day, or shift…"
          filters={[
            { label: "Barber", value: filterBarber, onChange: setFilterBarber, options: barberFilterOptions },
            { label: "Shift",  value: filterShift,  onChange: setFilterShift,  options: SHIFT_FILTER_OPTIONS  },
          ]}
          filtersExtra={
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm
                          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                          transition-all cursor-pointer"
              />
              {selectedDate !== today && (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="text-xs text-[#D4AF37] hover:text-[#e0bb45] transition-colors whitespace-nowrap"
                >
                  Today
                </button>
              )}
            </div>
          }
          isEmpty={!isLoading && filteredSchedule.length === 0}
          emptyIcon={TimerOff}
          emptyTitle="No schedule entries found"
          emptyDescription="Try adjusting your filters"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500 gap-3">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-[#D4AF37] rounded-full animate-spin" />
              <span className="text-sm">Loading schedule…</span>
            </div>
          ) : (
            <>
              <DataTable data={filteredSchedule} columns={columns} />

              <MobileCardList
                data={filteredSchedule}
                renderCard={(entry: ScheduleEntry) => (
                  <MobileCard
                    title={
                      <div className="flex items-center gap-2">
                        {entry.barberPhoto
                          ? <img src={entry.barberPhoto} alt={entry.barberName} className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0" />
                          : <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-[#D4AF37]" />
                            </div>
                        }
                        <div>
                          <p className="font-semibold text-white">{entry.barberName}</p>
                          <p className="text-xs text-zinc-400">{entry.barberEmail}</p>
                        </div>
                      </div>
                    }
                    headerRight={
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium
                        ${entry.status === "on_time"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : entry.status === "late"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[entry.status]}`} />
                        {STATUS_BADGE[entry.status]}
                      </span>
                    }
                    fields={[
                      { label: "Day / Date", value: `${entry.day}, ${entry.date}` },
                      { label: "Shift",      value: <ShiftBadge label={entry.shiftLabel} /> },
                      { label: "Scheduled",  value: <span className="font-mono text-sm">{entry.scheduledStart} – {entry.scheduledEnd}</span> },
                      { label: "Clock-In",   value: entry.actualCheckin
                          ? <span className="font-mono text-sm text-white">{entry.actualCheckin}</span>
                          : <span className="text-sm text-zinc-500 italic">Not recorded</span>
                      },
                      { label: "Clock-Out", value: entry.actualCheckout
                          ? <span className="font-mono text-sm text-white">{entry.actualCheckout}</span>
                          : <span className="text-sm text-zinc-500 italic">Not recorded</span>
                      },
                      ...(entry.status === "late" ? [{ label: "Late", value: <span className="font-mono text-sm text-amber-400">-{entry.lateMinutes} min</span> }] : []),
                    ]}
                    actions={
                      <div className="flex justify-end">
                        <ActionButtons actions={[
                          { type: "view", onClick: () => setViewingEntry(entry) },
                          { type: "edit", onClick: () => setEditingEntry(entry) },
                        ]} />
                      </div>
                    }
                  />
                )}
              />
            </>
          )}
        </TableCard>
      </div>

      {editingEntry && (
        <EditAttendanceModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveAttendance}
          isLoading={isSaving}
        />
      )}
      {viewingEntry && (
        <ViewAttendanceModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}

    </DashboardLayout>
  );
}