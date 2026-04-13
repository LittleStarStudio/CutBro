// File: src/pages/owner/OwnerBarberShifts.tsx

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Calendar, Clock, Plus, User, UserCheck, UserMinus, UserX, X } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { useAuth } from "@/components/context/AuthContext";

import { searchInObject } from "@/lib/utils/AdminUtils";

import DeleteModal from "@/components/admin/DeleteModal";
import ActionButtons from "@/components/admin/ActionButtons";

import PageHeader from "@/components/admin/PageHeader";
import StatsGrid from "@/components/admin/StatGrid";
import TableCard from "@/components/admin/TableCard";
import DataTable from "@/components/admin/DataTable";
import MobileCardList from "@/components/admin/MobileCardList";
import MobileCard from "@/components/admin/MobileCard";

import { useShiftSchedule, type ShiftKey } from "@/components/context/ShiftContext";
import { useToast } from "@/components/ui/Toast";
import * as ownerService from "@/services/owner.service";

/* ================= TYPES ================= */
interface BarberShift {
  id: number;
  barberName: string;
  barberId: number;
  day: string;
  startTime: string;
  endTime: string;
  shiftLabel: string;
  shiftId: number;
  status: "active" | "off" | "leave";
}

/* ================= CONSTANTS ================= */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ALL_SHIFT_PRESETS = [
  { value: "Morning",   label: "Morning",   shiftKey: "morning"   as ShiftKey },
  { value: "Afternoon", label: "Afternoon", shiftKey: "afternoon" as ShiftKey },
  { value: "Evening",   label: "Evening",   shiftKey: "evening"   as ShiftKey },
];

const DAY_FILTER_OPTIONS    = [{ value: "all", label: "All Days" }, ...DAYS.map((d) => ({ value: d, label: d }))];
const STATUS_FILTER_OPTIONS = [
  { value: "all",    label: "All Status" },
  { value: "active", label: "Active"     },
  { value: "off",    label: "Day Off"    },
  { value: "leave",  label: "On Leave"   },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  off:    "bg-zinc-700/50 text-zinc-400 border border-zinc-600",
  leave:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};
const STATUS_LABELS: Record<string, string> = { active: "Active", off: "Day Off", leave: "On Leave" };

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? ""}`}>{STATUS_LABELS[status] ?? status}</span>;
}

const SHIFT_COLORS: Record<string, string> = {
  Morning:   "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  Afternoon: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  Evening:   "bg-violet-500/10 text-violet-400 border border-violet-500/20",
};

function ShiftBadge({ label }: { label: string }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${SHIFT_COLORS[label] ?? "bg-zinc-700/50 text-zinc-300 border border-zinc-600"}`}>{label}</span>;
}

/* ================= SHIFT FORM MODAL ================= */
interface ShiftFormData {
  barberId: string;
  day: string;
  shiftLabel: string;
  startTime: string;
  endTime: string;
  status: "active" | "off" | "leave";
}

function ShiftFormModal({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  initialData,
  isLoading,
  saveButtonText,
  activeShiftPresets,
  shiftSchedule,
  barbers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ShiftFormData) => void;
  title: string;
  subtitle: string;
  initialData: Partial<ShiftFormData>;
  isLoading: boolean;
  saveButtonText: string;
  activeShiftPresets: typeof ALL_SHIFT_PRESETS;
  shiftSchedule: ReturnType<typeof useShiftSchedule>["shiftSchedule"];
  barbers: { id: number; name: string }[];
}) {
  const [form, setForm] = useState<ShiftFormData>({
    barberId:   "",
    day:        "Monday",
    shiftLabel: "",
    startTime:  "",
    endTime:    "",
    status:     "active",
  });

  // Sync initialData when modal opens / initialData changes
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      barberId:   initialData.barberId   ?? String(barbers[0]?.id ?? ""),
      day:        initialData.day        ?? "Monday",
      shiftLabel: initialData.shiftLabel ?? activeShiftPresets[0]?.value ?? "",
      startTime:  initialData.startTime  ?? "",
      endTime:    initialData.endTime    ?? "",
      status:     (initialData.status as "active" | "off" | "leave") ?? "active",
    });
  }, [isOpen, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-update times whenever shiftLabel changes
  useEffect(() => {
    if (!form.shiftLabel) return;
    const preset = ALL_SHIFT_PRESETS.find((s) => s.value === form.shiftLabel);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      startTime: shiftSchedule[preset.shiftKey]?.start ?? "",
      endTime:   shiftSchedule[preset.shiftKey]?.end   ?? "",
    }));
  }, [form.shiftLabel, shiftSchedule]);

  const set = (field: keyof ShiftFormData) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      [field]: field === "status"
        ? (e.target.value as "active" | "off" | "leave")
        : e.target.value,
    }));

  const hasNoActiveShift = activeShiftPresets.length === 0;
  const hasNoBarbers     = barbers.length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <p className="text-zinc-400 text-sm mt-0.5">{subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Barber */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Barber</label>
            {hasNoBarbers ? (
              <div className="w-full bg-zinc-900 border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm text-amber-400">
                No barbers available. Please add barbers in Barber Management first.
              </div>
            ) : (
              <select
                value={form.barberId}
                onChange={set("barberId")}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Day</label>
            <select
              value={form.day}
              onChange={set("day")}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Shift</label>
            {hasNoActiveShift ? (
              <div className="w-full bg-zinc-900 border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm text-amber-400">
                No active shifts. Please enable shifts in Shift Management.
              </div>
            ) : (
              <>
                <select
                  value={form.shiftLabel}
                  onChange={set("shiftLabel")}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  {activeShiftPresets.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {activeShiftPresets.length < ALL_SHIFT_PRESETS.length && (
                  <p className="text-xs text-zinc-500">Only active shifts shown. Enable more in Shift Management.</p>
                )}
              </>
            )}
          </div>

          {/* Time — read-only, auto-filled */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Start Time</label>
              <div className="relative">
                <input
                  readOnly
                  value={form.startTime}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-zinc-400 font-mono cursor-not-allowed select-none"
                />
                <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              </div>
              <p className="text-xs text-zinc-600">Auto from Shift Management</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">End Time</label>
              <div className="relative">
                <input
                  readOnly
                  value={form.endTime}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-zinc-400 font-mono cursor-not-allowed select-none"
                />
                <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              </div>
              <p className="text-xs text-zinc-600">Auto from Shift Management</p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Status</label>
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="active">Active</option>
              <option value="off">Day Off</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition rounded-xl text-sm font-medium text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isLoading || hasNoActiveShift || hasNoBarbers}
            className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#c9a72e] disabled:opacity-40 transition rounded-xl text-sm font-semibold text-black"
          >
            {isLoading ? "Saving…" : saveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= DUPLICATE WARNING MODAL ================= */
function DuplicateShiftModal({
  isOpen,
  barberName,
  day,
  existingShift,
  onClose,
}: {
  isOpen: boolean;
  barberName: string;
  day: string;
  existingShift: BarberShift | null;
  onClose: () => void;
}) {
  if (!isOpen || !existingShift) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <AlertTriangle size={26} className="text-amber-400" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <h3 className="text-white font-semibold text-lg">Shift Already Assigned</h3>
          <p className="text-zinc-400 text-sm">
            <span className="text-white font-medium">{barberName}</span> already has a shift on{" "}
            <span className="text-white font-medium">{day}</span>.
          </p>
        </div>

        {/* Existing shift detail */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 text-sm">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium mb-3">Existing Shift</p>
          <div className="flex justify-between">
            <span className="text-zinc-400">Shift</span>
            <ShiftBadge label={existingShift.shiftLabel} />
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Time</span>
            <span className="font-mono text-white">{existingShift.startTime} – {existingShift.endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Status</span>
            <StatusBadge status={existingShift.status} />
          </div>
        </div>

        <p className="text-zinc-500 text-xs text-center">
          Please delete or edit the existing shift before assigning a new one.
        </p>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 transition rounded-xl text-sm font-medium text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/* ================= VIEW SHIFT MODAL ================= */
function ViewShiftModal({
  isOpen,
  shift,
  onClose,
}: {
  isOpen: boolean;
  shift: BarberShift | null;
  onClose: () => void;
}) {
  if (!isOpen || !shift) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <h3 className="text-white font-semibold text-lg">Shift Detail</h3>
            <p className="text-zinc-400 text-sm mt-0.5">Assignment information</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors -mt-1 -mr-1 p-1 rounded-lg hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Barber */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Barber</label>
            <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white">
              {shift.barberName}
            </div>
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Day</label>
            <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white">
              {shift.day}
            </div>
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Shift</label>
            <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white">
              {shift.shiftLabel}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Start Time</label>
              <div className="relative">
                <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-zinc-400 font-mono">
                  {shift.startTime}
                </div>
                <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">End Time</label>
              <div className="relative">
                <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-zinc-400 font-mono">
                  {shift.endTime}
                </div>
                <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Status</label>
            <div className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white">
              {STATUS_LABELS[shift.status] ?? shift.status}
            </div>
          </div>

        </div>
        {/* Tidak ada footer — klik di luar untuk menutup */}
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function OwnerBarberShifts() {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [shifts, setShifts]             = useState<BarberShift[]>([]);
  const [barbers, setBarbers]           = useState<{ id: number; name: string; email: string; photoUrl: string | null }[]>([]);
  const [apiShifts, setApiShifts]       = useState<{ id: number; label: string }[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterDay, setFilterDay]       = useState("all");
  const [filterBarber, setFilterBarber] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [selectedShift, setSelectedShift]       = useState<BarberShift | null>(null);
  const [isLoading, setIsLoading]               = useState(false);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showViewModal, setShowViewModal]         = useState(false);
  const [selectedViewShift, setSelectedViewShift] = useState<BarberShift | null>(null);
  const [duplicateInfo, setDuplicateInfo]           = useState<{ barberName: string; day: string; existingShift: BarberShift | null }>({ barberName: "", day: "", existingShift: null });

  const { shiftSchedule, setShiftSchedule } = useShiftSchedule();

  const activeShiftPresets = useMemo(
    () => ALL_SHIFT_PRESETS.filter((s) => shiftSchedule[s.shiftKey]?.enabled),
    [shiftSchedule]
  );

  const stats = useMemo(() => ({
    total:  shifts.length,
    active: shifts.filter((s) => s.status === "active").length,
    off:    shifts.filter((s) => s.status === "off").length,
    leave:  shifts.filter((s) => s.status === "leave").length,
  }), [shifts]);

  const barberFilterOptions = useMemo(() => [
    { value: "all", label: "All Barbers" },
    ...barbers.map((b) => ({ value: String(b.id), label: b.name })),
  ], [barbers]);

  const loadAssignments = () => {
    ownerService.getShiftAssignments().then((data) => {
      setShifts(data.map((a) => ({
        id:         a.id,
        barberId:   a.barber_id,
        barberName: a.barber_name,
        day:        a.day_of_week,
        startTime:  a.start_time,
        endTime:    a.end_time,
        shiftLabel: a.shift_label,
        shiftId:    a.shift_id,
        status:     a.status,
      })));
    }).catch(() => {
      toast.error("Load Failed", "Failed to load assignments. Please refresh the page.");
    });
  };

  useEffect(() => {
    loadAssignments();
    ownerService.getBarbers().then((data) => {
      setBarbers((data as any[]).map((b: any) => ({
        id:       b.id,
        name:     b.user?.name ?? b.name ?? "-",
        email:    b.user?.email ?? "-",
        photoUrl: b.photo_url ?? null,
      })));
    }).catch(() => {
      toast.error("Load Failed", "Failed to load barbers. Please refresh the page.");
    });
    ownerService.getShifts().then((data) => {
      setApiShifts(data.map((s) => ({ id: s.id, label: s.label })));

      const schedule = { ...shiftSchedule };
      data.forEach((s) => {
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
    }).catch(() => {
      toast.error("Load Failed", "Failed to load shift data. Please refresh the page.");
    });

  }, []);

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const matchSearch = searchInObject(shift, searchQuery, ["barberName", "day", "shiftLabel"]);
      const matchDay    = filterDay    === "all" || shift.day              === filterDay;
      const matchBarber = filterBarber === "all" || String(shift.barberId) === filterBarber;
      const matchStatus = filterStatus === "all" || shift.status           === filterStatus;
      return matchSearch && matchDay && matchBarber && matchStatus;
    });
  }, [shifts, searchQuery, filterDay, filterBarber, filterStatus]);

  // Check if barber already has a shift on the given day (excluding a specific id for edit)
  const findDuplicateShift = (barberId: number, day: string, excludeId?: number): BarberShift | undefined =>
    shifts.find((s) => s.barberId === barberId && s.day === day && s.id !== excludeId);

  /* ================= VIEW ================= */
  const handleViewClick = (shift: BarberShift) => {
    setSelectedViewShift(shift);
    setShowViewModal(true);
  };

  /* ================= ADD ================= */
  const handleAddClick = () => setShowAddModal(true);

  const handleSaveAdd = async (data: ShiftFormData) => {
    const duplicate = findDuplicateShift(Number(data.barberId), data.day);
    if (duplicate) {
      const barber = barbers.find((b) => String(b.id) === String(data.barberId));
      setDuplicateInfo({ barberName: barber?.name ?? "", day: data.day, existingShift: duplicate });
      setShowDuplicateModal(true);
      return;
    }

    const apiShift = apiShifts.find((s) => s.label === data.shiftLabel);
    if (!apiShift) {
      toast.error("Add Failed", "Shift not found. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      await ownerService.createShiftAssignment({
        barber_id:   Number(data.barberId),
        shift_id:    apiShift.id,
        day_of_week: data.day,
        status:      data.status,
      });
      loadAssignments();
      setShowAddModal(false);
      const barber = barbers.find((b) => String(b.id) === String(data.barberId));
      toast.success("Shift Added", `${barber?.name}'s ${data.shiftLabel} shift on ${data.day} has been added.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Add Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEditClick = (shift: BarberShift) => {
    setSelectedShift(shift);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data: ShiftFormData) => {
    const duplicate = findDuplicateShift(Number(data.barberId), data.day, selectedShift?.id);
    if (duplicate) {
      const barber = barbers.find((b) => String(b.id) === String(data.barberId));
      setDuplicateInfo({ barberName: barber?.name ?? "", day: data.day, existingShift: duplicate });
      setShowDuplicateModal(true);
      return;
    }

    const apiShift = apiShifts.find((s) => s.label === data.shiftLabel);
    if (!apiShift) {
      toast.error("Update Failed", "Shift not found. Please try again.");
      return;
    }
    if (!selectedShift) return;

    setIsLoading(true);
    try {
      await ownerService.updateShiftAssignment(selectedShift.id, {
        barber_id:   Number(data.barberId),
        shift_id:    apiShift.id,
        day_of_week: data.day,
        status:      data.status,
      });
      loadAssignments();
      setShowEditModal(false);
      const barber = barbers.find((b) => String(b.id) === String(data.barberId));
      toast.success("Shift Updated", `${barber?.name}'s shift has been updated.`);
      setSelectedShift(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error("Update Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteClick = (shift: BarberShift) => {
    setSelectedShift(shift);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedShift) return;
    const label = `${selectedShift.barberName} – ${selectedShift.day} (${selectedShift.shiftLabel})`;
    setIsLoading(true);
    try {
      await ownerService.deleteShiftAssignment(selectedShift.id);
      loadAssignments();
      setShowDeleteModal(false);
      setSelectedShift(null);
      toast.success("Shift Deleted", `${label} has been removed.`);
    } catch {
      toast.error("Delete Failed", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedShift(null);
  };

  const columns = [
    {
      key: "barber",
      header: "Barber",
      render: (shift: BarberShift) => {
        const barberInfo = barbers.find((b) => b.id === shift.barberId);
        return (
          <div className="flex items-center gap-3">
            {barberInfo?.photoUrl
              ? <img src={barberInfo.photoUrl} alt={shift.barberName} className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0" />
              : <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-[#D4AF37]" />
                </div>
            }
            <div>
              <p className="text-white font-semibold">{shift.barberName}</p>
              <p className="text-xs text-zinc-400">{barberInfo?.email ?? "-"}</p>
            </div>
          </div>
        );
      },
    },
    { key: "day",    header: "Day",    render: (shift: BarberShift) => <span className="text-[#B8B8B8] font-medium">{shift.day}</span> },
    { key: "shift",  header: "Shift",  render: (shift: BarberShift) => <ShiftBadge label={shift.shiftLabel} /> },
    { key: "time",   header: "Time",   render: (shift: BarberShift) => <span className="font-mono text-sm text-[#B8B8B8]">{shift.startTime} – {shift.endTime}</span> },
    { key: "status", header: "Status", render: (shift: BarberShift) => <StatusBadge status={shift.status} /> },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      className: "text-center",
      render: (shift: BarberShift) => (
        <ActionButtons actions={[
          { type: "view",   onClick: () => handleViewClick(shift)   },
          { type: "edit",   onClick: () => handleEditClick(shift)   },
          { type: "delete", onClick: () => handleDeleteClick(shift) },
        ]} />
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Shift Schedule"
      subtitle="Assign barbers to their work shifts"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={user ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">
        <PageHeader actionButton={{ label: "Add Shift", onClick: handleAddClick, icon: Plus }} title={""} />

        <StatsGrid
          stats={[
            { icon: Calendar,  title: "Total Assignments", value: stats.total  },
            { icon: UserCheck, title: "Active",            value: stats.active },
            { icon: UserMinus, title: "Day Off",           value: stats.off    },
            { icon: UserX,     title: "On Leave",          value: stats.leave  },
          ]}
          columns={4}
        />
        
        <TableCard
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by barber, day, or shift..."
          filters={[
            { label: "Day",    value: filterDay,    onChange: setFilterDay,    options: DAY_FILTER_OPTIONS    },
            { label: "Barber", value: filterBarber, onChange: setFilterBarber, options: barberFilterOptions   },
            { label: "Status", value: filterStatus, onChange: setFilterStatus, options: STATUS_FILTER_OPTIONS },
          ]}
          isEmpty={filteredShifts.length === 0}
          emptyIcon={Clock}
          emptyTitle="No shifts found"
          emptyDescription="Try adjusting your filters or add a new shift"
        >
          <DataTable data={filteredShifts} columns={columns} />
          <MobileCardList
            data={filteredShifts}
            renderCard={(shift: BarberShift) => {
              const barberInfo = barbers.find((b) => b.id === shift.barberId);
              return (
                <MobileCard
                  title={
                    <div className="flex items-center gap-2">
                      {barberInfo?.photoUrl
                        ? <img src={barberInfo.photoUrl} alt={shift.barberName} className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-[#D4AF37]" />
                          </div>
                      }
                      <div>
                        <p className="font-semibold text-white">{shift.barberName}</p>
                        <p className="text-xs text-zinc-400">{barberInfo?.email ?? "-"}</p>
                      </div>
                    </div>
                  }
                  headerRight={<StatusBadge status={shift.status} />}
                  fields={[
                    { label: "Day",   value: shift.day },
                    { label: "Shift", value: <ShiftBadge label={shift.shiftLabel} /> },
                    { label: "Time",  value: <span className="font-mono text-sm">{shift.startTime} – {shift.endTime}</span> },
                  ]}
                  actions={
                    <div className="flex justify-end">
                      <ActionButtons actions={[
                        { type: "view",   onClick: () => handleViewClick(shift)   },
                        { type: "edit",   onClick: () => handleEditClick(shift)   },
                        { type: "delete", onClick: () => handleDeleteClick(shift) },
                      ]} />
                    </div>
                  }
                />
              );
            }}
          />
        </TableCard>
      </div>

      <ShiftFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveAdd}
        title="Add New Shift"
        subtitle="Assign a work shift to a barber"
        initialData={{
          barberId:   String(barbers[0]?.id ?? ""),
          day:        "Monday",
          shiftLabel: activeShiftPresets[0]?.value ?? "",
          status:     "active",
        }}
        isLoading={isLoading}
        saveButtonText="Add Shift"
        activeShiftPresets={activeShiftPresets}
        shiftSchedule={shiftSchedule}
        barbers={barbers}
      />
      <ShiftFormModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedShift(null); }}
        onSave={handleSaveEdit}
        title="Edit Shift"
        subtitle="Update barber shift information"
        initialData={
          selectedShift
            ? { ...selectedShift, barberId: String(selectedShift.barberId) }
            : {}
        }
        isLoading={isLoading}
        saveButtonText="Save Changes"
        activeShiftPresets={activeShiftPresets}
        shiftSchedule={shiftSchedule}
        barbers={barbers}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Shift"
        itemName={selectedShift ? `${selectedShift.barberName} – ${selectedShift.day} (${selectedShift.shiftLabel})` : ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isLoading}
      />
      <DuplicateShiftModal
        isOpen={showDuplicateModal}
        barberName={duplicateInfo.barberName}
        day={duplicateInfo.day}
        existingShift={duplicateInfo.existingShift}
        onClose={() => setShowDuplicateModal(false)}
      />
      <ViewShiftModal
        isOpen={showViewModal}
        shift={selectedViewShift}
        onClose={() => { setShowViewModal(false); setSelectedViewShift(null); }}
      />
    </DashboardLayout>
  );
}
