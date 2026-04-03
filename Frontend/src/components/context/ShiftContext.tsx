// src/context/ShiftContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

export type ShiftKey = "morning" | "afternoon" | "evening";

interface ShiftConfig {
  enabled: boolean;
  start: string;
  end: string;
}

export type ShiftSchedule = Record<ShiftKey, ShiftConfig>;

const DEFAULT: ShiftSchedule = {
  morning:   { enabled: true, start: "07:00", end: "13:00" },
  afternoon: { enabled: true, start: "13:00", end: "19:00" },
  evening:   { enabled: true, start: "19:00", end: "22:00" },
};

interface ShiftContextValue {
  shiftSchedule: ShiftSchedule;
  setShiftSchedule: (s: ShiftSchedule) => void;
}

const ShiftContext = createContext<ShiftContextValue | null>(null);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule>(DEFAULT);
  return (
    <ShiftContext.Provider value={{ shiftSchedule, setShiftSchedule }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShiftSchedule() {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error("useShiftSchedule must be used inside ShiftProvider");
  return ctx;
}