import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import {
  Play,
  AlertTriangle, Clock, Home,
} from "lucide-react";
import * as barberService from "@/services/barber.service";
import type { TodayAttendance, WeeklySchedule } from "@/services/barber.service";
import { useToast } from "@/components/ui/Toast";

import { useAuth } from "@/components/context/AuthContext";
import { barberLogo, barberMenu } from "@/components/config/Menu";

/* ================= TYPES ================= */
type ShiftType   = "morning" | "afternoon" | "evening";
type ShiftStatus = "scheduled" | "active" | "completed" | "off";

interface TimeLog {
  clockIn:  string | null;
  clockOut: string | null;
}

interface BarberShift {
  id:        number;
  date:      Date;
  shiftType: ShiftType | null;
  startTime: string;
  endTime:   string;
  status:    ShiftStatus;
  log:       TimeLog;
}

/* ================= CONSTANTS ================= */
const DAYS_EN   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SHIFT_CONFIG: Record<ShiftType, { label: string; start: string; end: string }> = {
  morning:   { label: "Morning Shift (08:00–13:00)",   start: "08:00", end: "13:00" },
  afternoon: { label: "Afternoon Shift (13:00–18:00)", start: "13:00", end: "18:00" },
  evening:   { label: "Evening Shift (18:00–22:00)",   start: "18:00", end: "22:00" },
};

const WEEKLY_PATTERN: (ShiftType | null)[] = [
  null,        // Sunday
  "afternoon", // Monday
  "morning",   // Tuesday
  "evening",   // Wednesday
  "afternoon", // Thursday
  "morning",   // Friday
  "morning",   // Saturday
];

const EMPTY_LOG: TimeLog = {
  clockIn: null,
  clockOut: null,
};

/* ================= ROW COLORS ================= */
const ROW_COLORS: Record<ShiftStatus, string> = {
  active:    "bg-green-500/10",
  completed: "bg-white/[0.02]",
  scheduled: "bg-white/[0.02]",
  off:       "bg-zinc-800/30",
};

const TODAY_ROW = "bg-[#D4AF37]/[0.06]";

/* ================= HELPERS ================= */
function getNowTime(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
}

function formatDDMMYYYY(date: Date): string {
  return `${String(date.getDate()).padStart(2,"0")}-${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}`;
}

function formatDateLabel(date: Date): string {
  return `${date.getDate().toString().padStart(2,"0")} ${MONTHS_EN[date.getMonth()]} ${date.getFullYear()}`;
}

function isToday(date: Date): boolean {
  const t = new Date();
  return date.getDate()===t.getDate() && date.getMonth()===t.getMonth() && date.getFullYear()===t.getFullYear();
}

function isPast(date: Date): boolean {
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return d < t;
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function calcTotalMinutes(log: TimeLog): number {
  if (!log.clockIn || !log.clockOut) return 0;
  const total = toMin(log.clockOut.slice(0,5)) - toMin(log.clockIn.slice(0,5));
  return Math.max(0, total);
}

function formatHHMMSS(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0)           return `${h}h`;
  return `${m}m`;
}

/* ================= GENERATE WEEKLY SHIFTS ================= */
function generateWeeklyShifts(): BarberShift[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const shiftType = WEEKLY_PATTERN[date.getDay()];
    let status: ShiftStatus = "scheduled";
    if (!shiftType)        status = "off";
    else if (isPast(date)) status = "completed";

    return {
      id: i + 1, date, shiftType,
      startTime: shiftType ? SHIFT_CONFIG[shiftType].start : "-",
      endTime:   shiftType ? SHIFT_CONFIG[shiftType].end   : "-",
      status,
      log: { ...EMPTY_LOG },
    } satisfies BarberShift;
  });
}

/* ================= STATUS TRACKER ITEM ================= */
interface TrackerItemProps {
  label:  string;
  value:  string | null;
  active: boolean;
}
function TrackerItem({ label, value, active }: TrackerItemProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
      <div className="flex items-center gap-1.5">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${active ? "bg-red-500 animate-pulse" : "bg-zinc-600"}`} />
        <span className={`text-xs font-semibold ${active ? "text-white" : "text-zinc-400"}`}>{label}</span>
      </div>
      <span className={`text-sm font-mono font-bold ${value ? "text-white" : "text-zinc-600"}`}>
        {value ?? "---"}
      </span>
    </div>
  );
}

/* ================= LEFT PANEL BUTTON ================= */
interface PanelButtonProps {
  label:    string;
  icon?:    React.ReactNode;
  onClick:  () => void;
  variant:  "dark" | "blue" | "red" | "outline";
  disabled?: boolean;
}
function PanelButton({ label, icon, onClick, variant, disabled }: PanelButtonProps) {
  const base = "w-fit mx-auto flex items-center justify-center gap-2 py-2.5 px-8 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer";
  const variants: Record<string, string> = {
    dark:    "bg-zinc-700 hover:bg-zinc-600 text-white",
    blue:    "bg-blue-600 hover:bg-blue-500 text-white",
    red:     "bg-red-600 hover:bg-red-500 text-white",
    outline: "border border-white/15 hover:bg-white/5 text-zinc-300",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${disabled ? "opacity-30 cursor-not-allowed" : variants[variant]}`}
    >
      {icon}{label}
    </button>
  );
}

/* ================= MAIN PAGE ================= */
export default function BarberSchedulePage() {
  const [shifts, setShifts]               = useState<BarberShift[]>([]);
  const [clock, setClock]                 = useState(getNowTime());
  const { user: currentUser, logout }     = useAuth();

  const toast = useToast();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  const fetchAttendance = () => {
    barberService.getTodayAttendance()
      .then(setTodayAttendance)
      .catch(() => {
        toast.error("Connection Error", "Failed to load attendance data. Please refresh.");
      });
  };

  useEffect(() => { fetchAttendance(); }, []);

  useEffect(() => { 
    barberService.getWeeklySchedule()
      .then((data) => {
        setWeeklySchedule(data);
        setIsLoadingSchedule(false);
      })
      .catch(() => {
        setIsLoadingSchedule(false);
      });
  }, []);

  /* ── Generate & clock tick ───────────────────────────────── */
  useEffect(() => { 
    const generated = generateWeeklyShifts();
    
    if (weeklySchedule) {
      generated.forEach((shift, i) => {
        const dayName = DAYS_EN[shift.date.getDay()];
        const apiData = weeklySchedule[dayName];
        if (apiData && apiData.shift_name) {
          generated[i] = {
            ...generated[i],
            shiftType: apiData.shift_name.toLowerCase() as ShiftType,
            startTime: apiData.start_time || generated[i].startTime,
            endTime:   apiData.end_time   || generated[i].endTime,
            log: {
              clockIn:  apiData.actual_checkin  ?? null,
              clockOut: apiData.actual_checkout ?? null,
            },
          };
        } else {
          generated[i] = {
            ...generated[i],
            shiftType: null,
            startTime: "-",
            endTime:   "-",
            status:    "off",
          };
        }
      });
    }
    
    setShifts(generated); 
  }, [weeklySchedule]);

  useEffect(() => {
    const t = setInterval(() => {
      setClock(getNowTime());
      setShifts((prev) =>
        prev.map((s) =>
          s.status === "scheduled" && isPast(s.date) && s.shiftType
            ? { ...s, status: "completed" } : s
        )
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Today's shift ───────────────────────────────────────── */
  const todayShift = useMemo(() => shifts.find((s) => isToday(s.date)) ?? null, [shifts]);

  const log = {
    clockIn:  todayAttendance?.actual_checkin  ?? null,
    clockOut: todayAttendance?.actual_checkout ?? null,
  };
  const shiftLabel  = todayAttendance?.shift?.label ?? "No Shift Today";
  const canClockIn  = !!(todayAttendance?.has_shift_today
                      && todayAttendance.assignment_status === "active"
                      && !todayAttendance.checked_in);
  const canClockOut = !!(todayAttendance?.checked_in && !todayAttendance?.checked_out);

  /* ── Total work minutes (today) ──────────────────────────── */
  const totalMinutes = useMemo(() => calcTotalMinutes(log), [log]);

  /* ── Attention notes — hanya deficit ────────────────────── */
  const attentionNotes = useMemo(() => {
    const notes: string[] = [];
    if (!todayAttendance?.has_shift_today || todayAttendance.assignment_status !== "active") return notes;

    const shiftStart    = log.clockIn ? toMin(log.clockIn.slice(0, 5)) : null;
    const shiftEnd      = todayAttendance.shift?.end_time
                            ? toMin(todayAttendance.shift.end_time)
                            : null;

    if (log.clockIn && log.clockOut && shiftStart !== null && shiftEnd !== null) {
      const worked  = calcTotalMinutes(log);
      const required = shiftEnd - toMin(todayAttendance.shift!.start_time);
      const deficit = required - worked;
      if (deficit > 0) notes.push(`You are short ${formatDuration(deficit)} of required hours.`);
    }

    return notes;
  }, [todayAttendance, log]);

  const handleClockIn = async () => {
    setIsSubmitting(true);
    try {
      await barberService.checkIn();
      fetchAttendance();
      toast.success("Checked In", "Your attendance has been recorded.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Check-in failed.";
      toast.error("Check-in Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    setIsSubmitting(true);
    try {
      await barberService.checkOut();
      fetchAttendance();
      toast.success("Checked Out", "Clock-out has been recorded.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Check-out failed.";
      toast.error("Check-out Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Week range ──────────────────────────────────────────── */
  const weekLabel = useMemo(() => {
    if (shifts.length < 2) return "";
    return `${formatDateLabel(shifts[0].date)} – ${formatDateLabel(shifts[shifts.length-1].date)}`;
  }, [shifts]);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <DashboardLayout
      title="My Schedule"
      subtitle={weekLabel}
      showSidebar
      menuItems={barberMenu}
      logo={barberLogo}
      userProfile={currentUser ?? { name: "John Barber", email: "john@barbershop.com", role: "barber" }}
      showNotification
      notificationCount={0}
      onLogout={logout}
    >
      <div className="w-full space-y-5">

        {/* ══════════════════════════════════════════════════════
            TOP SECTION: left panel + status tracker
        ══════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ── Left Panel ────────────────────────────────────── */}
          <div className="w-full lg:w-56 flex-shrink-0 rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col">
            {/* Shift info */}
            <div className="text-center pb-2 border-b border-white/8">
              <p className="text-[#D4AF37] font-bold text-sm leading-tight">{shiftLabel}</p>
              {todayShift?.shiftType && (
                <p className="text-zinc-500 text-xs mt-1 font-mono">{clock}</p>
              )}
            </div>

            {/* Button — centered in remaining space */}
            <div className="flex-1 flex items-center justify-center">
              {!log.clockIn || !log.clockOut ? (
                <PanelButton
                  label={log.clockIn ? "Clock Out" : "Clock In"}
                  icon={log.clockIn ? <Home size={14} /> : <Play size={14} />}
                  onClick={log.clockIn ? handleClockOut : handleClockIn}
                  variant={log.clockIn ? "red" : "dark"}
                  disabled={isSubmitting || (log.clockIn ? !canClockOut : !canClockIn)}
                />
              ) : (
                <PanelButton label="Clocked Out" icon={<Home size={14} />} onClick={() => {}} variant="dark" disabled />
              )}
            </div>
          </div>

          {/* ── Right: Status Tracker + bottom row ────────────── */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Status Tracker */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <div className="flex flex-wrap gap-x-6 gap-y-4 justify-around">
                <TrackerItem label="Clock In"  value={log.clockIn}  active={!!log.clockIn && !log.clockOut} />
                <TrackerItem label="Clock Out" value={log.clockOut} active={false} />
              </div>
            </div>

            {/* Bottom row: Attention + Total Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Attention */}
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-red-400" />
                  <h3 className="text-red-400 font-bold text-sm">Attention!</h3>
                </div>
                {attentionNotes.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">• No notes</p>
                ) : (
                  <ul className="space-y-1">
                    {attentionNotes.map((n, i) => (
                      <li key={i} className="text-red-300 text-xs flex items-start gap-1.5">
                        <span className="mt-0.5">•</span>{n}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Total Work Hours */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-emerald-400" />
                  <p className="text-emerald-400 text-xs font-semibold">Total Work Hours</p>
                </div>
                <p className="font-mono text-2xl font-bold text-white">
                  {formatHHMMSS(totalMinutes)}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            WEEKLY TABLE
        ══════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/8">
            <h2 className="text-sm font-bold text-white">Your Schedule This Week</h2>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Date","Day","Shift","Clock In","Clock Out"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  const today    = isToday(shift.date);
                  const rowBg    = today ? TODAY_ROW : ROW_COLORS[shift.status];
                  const shiftLbl = shift.shiftType ? SHIFT_CONFIG[shift.shiftType].label : "Day Off";
                  return (
                    <tr key={shift.id} className={`border-b border-white/5 transition-colors ${rowBg}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-mono ${today ? "text-[#D4AF37] font-bold" : "text-zinc-300"}`}>
                          {formatDDMMYYYY(shift.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm ${today ? "text-[#D4AF37] font-semibold" : "text-zinc-300"}`}>
                          {DAYS_EN[shift.date.getDay()]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isLoadingSchedule ? (
                          <span className="text-sm text-zinc-500">Loading...</span>
                        ) : shift.shiftType ? (
                          <span className="text-sm text-zinc-300 whitespace-nowrap">
                            {shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1)} Shift ({shift.startTime} - {shift.endTime})
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-500 italic">You don't have shift this day</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const val = today ? log.clockIn : shift.log.clockIn;
                          return (
                            <span className={`text-sm font-mono ${val ? "text-emerald-400" : "text-zinc-600"}`}>
                              {val ?? "---"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const val = today ? log.clockOut : shift.log.clockOut;
                          return (
                            <span className={`text-sm font-mono ${val ? "text-red-400" : "text-zinc-600"}`}>
                              {val ?? "---"}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="block md:hidden divide-y divide-white/5">
            {shifts.map((shift) => {
              const today    = isToday(shift.date);
              const shiftLbl = shift.shiftType ? SHIFT_CONFIG[shift.shiftType].label : "Day Off";
              return (
                <div key={shift.id} className={`p-4 ${today ? "bg-[#D4AF37]/[0.05]" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className={`text-sm font-semibold ${today ? "text-[#D4AF37]" : "text-white"}`}>
                        {DAYS_EN[shift.date.getDay()]}
                      </span>
                      <span className="text-zinc-500 text-xs ml-2 font-mono">{formatDDMMYYYY(shift.date)}</span>
                    </div>
                  </div>
                  {isLoadingSchedule ? (
                    <p className="text-xs text-zinc-500">Loading...</p>
                  ) : shift.shiftType ? (
                    <p className="text-xs text-zinc-400 mb-2">
                      {shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1)} Shift ({shift.startTime} - {shift.endTime})
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic mb-2">You don't have shift this day</p>
                  )}
                  <div className="flex gap-4 text-xs">
                    <div>
                      <p className="text-zinc-500">Clock In</p>
                      <p className={`font-mono ${(today ? log.clockIn : shift.log.clockIn) ? "text-emerald-400" : "text-zinc-600"}`}>
                        {(today ? log.clockIn : shift.log.clockIn) ?? "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Clock Out</p>
                      <p className={`font-mono ${(today ? log.clockOut : shift.log.clockOut) ? "text-red-400" : "text-zinc-600"}`}>
                        {(today ? log.clockOut : shift.log.clockOut) ?? "---"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}