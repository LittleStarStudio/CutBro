// File: src/pages/barber/ShiftManagement.tsx

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, RotateCcw, Save, Sun, Sunset, Moon } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ownerMenu, ownerLogo } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";
import { useShiftSchedule, type ShiftKey, type ShiftSchedule } from "@/components/context/ShiftContext";
import * as ownerService from "@/services/owner.service";

import { useToast } from "@/components/ui/Toast";

/* ================= CONSTANTS ================= */
const SHIFTS: { key: ShiftKey; label: string; icon: React.ReactNode }[] = [
  { key: "morning",   label: "Morning",   icon: <Sun size={16} />    },
  { key: "afternoon", label: "Afternoon", icon: <Sunset size={16} /> },
  { key: "evening",   label: "Evening",   icon: <Moon size={16} />   },
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

/* ================= COMPONENT ================= */
export default function ShiftManagement() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const { shiftSchedule, setShiftSchedule } = useShiftSchedule();
  const [current, setCurrent] = useState<ShiftSchedule>({ ...shiftSchedule });
  const [opWindow, setOpWindow] = useState<{ open: string; close: string } | null>(null);

  const hasChanges = useMemo(
    () => JSON.stringify(shiftSchedule) !== JSON.stringify(current),
    [shiftSchedule, current]
  );

  // Load shifts from API on mount and sync into ShiftContext
  useEffect(() => {
    ownerService.getShifts().then((shifts) => {
      const schedule: ShiftSchedule = { ...shiftSchedule };
      shifts.forEach((s) => {
        const key = s.name as ShiftKey;
        if (key === "morning" || key === "afternoon" || key === "evening") {
          schedule[key] = {
            enabled: s.status === "active",
            start:   s.start_time,
            end:     s.end_time,
          };
        }
      });
      setShiftSchedule(schedule);
      setCurrent({ ...schedule });
    }).catch(() => {
      toast.error("Load Failed", "Failed to load shift data. Please refresh the page.");
    });

    ownerService.getBarbershopProfile().then((data) => {
      const openDays = (data.operational_hours ?? []).filter(
        (h) => h.is_open && h.open_time && h.close_time
      );
      if (openDays.length > 0) {
        const earliestOpen = openDays.reduce(
          (min, h) => (h.open_time! < min ? h.open_time! : min),
          openDays[0].open_time!
        );
        const latestClose = openDays.reduce(
          (max, h) => (h.close_time! > max ? h.close_time! : max),
          openDays[0].close_time!
        );
        setOpWindow({ open: earliestOpen.slice(0, 5), close: latestClose.slice(0, 5) });
      }
    }).catch(() => {});

  }, []);

  const toggleShift = (shift: ShiftKey) => {
    setCurrent((prev) => ({
      ...prev,
      [shift]: { ...prev[shift], enabled: !prev[shift].enabled },
    }));
  };

  const updateTime = (shift: ShiftKey, field: "start" | "end", value: string) => {
    setCurrent((prev) => ({
      ...prev,
      [shift]: { ...prev[shift], [field]: value },
    }));
  };

  const handleSave = async () => {
    try {
      // Validate 1: end time must be after start time
      const invalidOrder = (["morning", "afternoon", "evening"] as ShiftKey[]).filter(
        (key) => current[key].enabled && current[key].start >= current[key].end
      );
      if (invalidOrder.length > 0) {
        toast.error("Invalid Time", "End time must be after start time for all active shifts.");
        return;
      }

      // Validate 2: shift must be within operational hours
      if (opWindow) {
        const outOfRange = (["morning", "afternoon", "evening"] as ShiftKey[]).filter(
          (key) =>
            current[key].enabled &&
            (current[key].start < opWindow.open || current[key].end > opWindow.close)
        );
        if (outOfRange.length > 0) {
          toast.error(
            "Outside Operating Hours",
            `Shift times must be within your operating hours (${opWindow.open} – ${opWindow.close}).`
          );
          return;
        }
      }

      const shifts = (["morning", "afternoon", "evening"] as ShiftKey[]).map((key) => ({
        name:       key,
        start_time: current[key].start,
        end_time:   current[key].end,
        status:     current[key].enabled ? "active" as const : "inactive" as const,
      }));
      await ownerService.updateShifts(shifts);
      setShiftSchedule(current);
      toast.success("Shift Schedule Saved", "Barber shift settings have been updated successfully.");
    } catch {
      toast.error("Save Failed", "Something went wrong. Please try again.");
    }
  };

  const handleCancel = () => {
    setCurrent({ ...shiftSchedule });
    toast.info("Changes Discarded", "Shift settings have been reset to saved values.");
  };

  return (
    <DashboardLayout
      title="Work Shifts"
      subtitle="Manage barber work shifts"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">

          <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            {SHIFTS.map((s) => {
              const data = current[s.key];
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    data.enabled ? "bg-zinc-900 border-zinc-800" : "bg-zinc-900/40 border-zinc-800/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                      {s.icon}
                      {s.label}
                    </div>
                    <Toggle enabled={data.enabled} onToggle={() => toggleShift(s.key)} />
                  </div>

                  {data.enabled ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <TimeSelect value={data.start} onChange={(v) => updateTime(s.key, "start", v)} />
                      <span className="text-zinc-500">–</span>
                      <TimeSelect value={data.end}   onChange={(v) => updateTime(s.key, "end",   v)} />
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-sm italic">Shift closed</p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2 bg-amber-500 text-black font-semibold rounded-xl disabled:opacity-40 text-sm"
            >
              <Save size={14} />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              disabled={!hasChanges}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:py-2 bg-zinc-800 rounded-xl disabled:opacity-40 text-sm font-medium"
            >
              <RotateCcw size={14} />
              Cancel
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= SUB COMPONENTS ================= */

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative w-11 h-6 rounded-full transition ${enabled ? "bg-amber-500" : "bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? "translate-x-5" : ""}`} />
    </button>
  );
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 pr-7 text-sm">
        {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
      </select>
      <Clock size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
    </div>
  );
}