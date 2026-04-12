import api from "./api";

export interface TodayAttendance {
  has_shift_today:    boolean;
  assignment_status?: "active" | "off" | "leave";
  shift?: {
    label:      string;
    start_time: string;
    end_time:   string;
  };
  checked_in:      boolean;
  checked_out:     boolean;
  actual_checkin:  string | null;
  actual_checkout: string | null;
  status:          "on_time" | "late" | "absent" | null;
  late_minutes:    number;
}

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

export const getTodayAttendance = () =>
  api.get<{ success: boolean; data: TodayAttendance }>("/barber/attendance/today")
     .then(unwrap<TodayAttendance>);

export const checkIn = () =>
  api.post("/barber/attendance/checkin");

export const checkOut = () =>
  api.post("/barber/attendance/checkout");
