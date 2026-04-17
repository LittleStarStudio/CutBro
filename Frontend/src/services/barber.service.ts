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

export interface BarbershopPhoto {
  id: number;
  photo_url: string;
}

export interface OperationalHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface BarbershopData {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  city: string;
  description: string;
  photos: BarbershopPhoto[];
  operational_hours: OperationalHour[];
}

export interface WeeklySchedule {
  [day: string]: {
    shift_name:      string | null;
    start_time:      string | null;
    end_time:        string | null;
    actual_checkin:  string | null;
    actual_checkout: string | null;
  } | null;
}

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

export const getMyBarbershop = () =>
  api.get<{ success: boolean; data: BarbershopData }>("/barber/barbershop")
      .then(unwrap<BarbershopData>);

export const getTodayAttendance = () =>
  api.get<{ success: boolean; data: TodayAttendance }>("/barber/attendance/today")
     .then(unwrap<TodayAttendance>);

export const checkIn = () =>
  api.post("/barber/attendance/checkin");

export const checkOut = () =>
  api.post("/barber/attendance/checkout");

export const getWeeklySchedule = () =>
  api.get<{ success: boolean; data: WeeklySchedule }>("/barber/schedule/weekly")
     .then(unwrap<WeeklySchedule>);
