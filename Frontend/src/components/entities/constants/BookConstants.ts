import { Scissors, User, Calendar, CheckCircle } from "lucide-react";
import type { Shop, Service, Barber, StepConfig } from "@/type/BookingType";

// ─── Shop ─────────────────────────────────────────────────────────────────────

export const SHOP: Shop = {
  id: 1,
  name: "Royal Cuts",
  location: "South Jakarta",
  rating: 4.8,
  reviews: 127,
  image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800",
  phone: "+62 812-3456-7890",
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  { id: "s1", name: "Classic Haircut",    duration: "30 min", price: 35000, icon: "✂️", popular: true,  discount: 20 },
  { id: "s2", name: "Beard Trim",         duration: "20 min", price: 20000, icon: "🪒", popular: false },
  { id: "s3", name: "Hair Coloring",      duration: "90 min", price: 85000, icon: "🎨", popular: false },
  { id: "s4", name: "Premium Cut + Wash", duration: "50 min", price: 55000, icon: "💈", popular: true  },
  { id: "s5", name: "Hot Towel Shave",    duration: "40 min", price: 45000, icon: "🔥", popular: false },
  { id: "s6", name: "Hair Treatment",     duration: "60 min", price: 65000, icon: "💆", popular: false },
];

// ─── Barbers ──────────────────────────────────────────────────────────────────

export const BARBERS: Barber[] = [
  { id: "b1", name: "Alex Martin", specialty: "Classic & Fade",  rating: 4.9, reviews: 87, experience: "5 yrs", avatar: "https://i.pravatar.cc/150?img=11", available: true  },
  { id: "b2", name: "Ryan Davis",  specialty: "Modern Styles",   rating: 4.8, reviews: 64, experience: "3 yrs", avatar: "https://i.pravatar.cc/150?img=15", available: true  },
  { id: "b3", name: "Chris Lee",   specialty: "Beard Design",    rating: 4.7, reviews: 51, experience: "4 yrs", avatar: "https://i.pravatar.cc/150?img=20", available: false },
  { id: "b4", name: "Sam Wilson",  specialty: "Color & Texture", rating: 5.0, reviews: 32, experience: "6 yrs", avatar: "https://i.pravatar.cc/150?img=25", available: true  },
];

// ─── Time Slots ───────────────────────────────────────────────────────────────

export const TIME_SLOTS: string[] = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "17:00", "17:30", "18:00",
];

export const UNAVAILABLE_TIMES: string[] = ["10:00", "14:00", "17:00"];

// ─── Step Config ──────────────────────────────────────────────────────────────

export const STEPS: StepConfig[] = [
  { id: 1, label: "Service",      icon: Scissors     },
  { id: 2, label: "Barber",       icon: User         },
  { id: 3, label: "Schedule",     icon: Calendar     },
  { id: 4, label: "Verification", icon: CheckCircle  }, 
];

// ─── Calendar constants ───────────────────────────────────────────────────────

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const PAYMENT_METHODS = [
  { id: "card",  label: "Credit / Debit Card", icon: "💳" },
  { id: "gopay", label: "GoPay",               icon: "🟢" },
  { id: "ovo",   label: "OVO",                 icon: "🟣" },
  { id: "dana",  label: "DANA",                icon: "🔵" },
];
