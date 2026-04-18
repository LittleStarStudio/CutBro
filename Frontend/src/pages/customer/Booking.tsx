import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Phone, ChevronLeft, Scissors,
  Calendar, Clock, User, CheckCircle2, Loader2, AlertCircle,
  Star, CalendarDays, UserCheck, BadgeCheck, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import NavbarLayout from "@/components/layout/Navbar";
import { getUser, logout } from "@/lib/auth";
import { useAuth } from "@/components/context/AuthContext";
import { useToast } from "@/components/ui/Toast";   
import {
  getBarbershops,
  getBarbershopDetail,
  getPublicAvailableSlots,
  createBooking,
  type PublicBarbershop,
  type BarbershopDetail,
  type ServiceItem,
  type BarberItem,
  type CreateBookingResponse, 
} from "@/services/customer.service";

/* ── Midtrans Snap type declared in src/types/midtrans.d.ts ── */

type Step = "browse" | "service" | "barber" | "slot" | "confirm";

/* ── Helper ────────────────────────────────────────────────────────── */
const formatPrice = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function BookingPage() {
  const navigate   = useNavigate();
  const { user: authUser } = useAuth();
  const toast = useToast();
  const guestUser  = getUser();
  const displayUser = authUser ?? guestUser ?? null;

  /* ── Midtrans script ── */
  useEffect(() => {
    const existing = document.getElementById("midtrans-snap-script");
    if (existing) return;
    const script = document.createElement("script");
    script.id  = "midtrans-snap-script";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? ""
    );
    document.body.appendChild(script);
  }, []);

  /* ── Wizard state ── */
  const [step,    setStep]    = useState<Step>("browse");
  const [search,  setSearch]  = useState("");
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  const [shops,    setShops]    = useState<PublicBarbershop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError,   setShopsError]   = useState("");

  const [detail,   setDetail]  = useState<BarbershopDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedBarber,  setSelectedBarber]  = useState<BarberItem | null>(null);
  const [selectedDate,    setSelectedDate]    = useState("");
  const [selectedTime,    setSelectedTime]    = useState("");

  const [slots,        setSlots]        = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [paying,    setPaying]    = useState(false);
  const [payError,  setPayError]  = useState("");
  const [successBooking, setSuccessBooking] = useState<CreateBookingResponse | null>(null);
  
  const filteredShops = ratingFilter === 0
    ? shops
    : shops.filter((s) => (s.average_rating ?? 0) >= ratingFilter);

  /* ── Load barbershops ── */
  useEffect(() => {
    setShopsLoading(true);
    getBarbershops({ search: search || undefined })
      .then(setShops)
      .catch(() => setShopsError("Failed to load barbershops."))
      .finally(() => setShopsLoading(false));
  }, [search]);

  /* ── Load slots when date changes ── */
  useEffect(() => {
    if (!detail || !selectedService || !selectedBarber || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime("");
    getPublicAvailableSlots(detail.id, {
      service_id:   selectedService.id,
      barber_id:    selectedBarber.id,
      booking_date: selectedDate,
    })
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [detail, selectedService, selectedBarber, selectedDate]);

  /* ── Select barbershop → load detail ── */
  const handleSelectShop = useCallback(async (shop: PublicBarbershop) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await getBarbershopDetail(shop.id);
      setDetail(d);
      setStep("service");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg    = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 403) {
        toast.error("Access Denied", msg ?? "You are blocked from this barbershop.");
      } else {
        setShopsError("Failed to load barbershop details.");
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  /* ── Back navigation ── */
  const goBack = () => {
    if (step === "service") { setStep("browse"); setDetail(null); }
    else if (step === "barber")  { setStep("service"); }
    else if (step === "slot")    { setStep("barber"); setSelectedDate(""); setSelectedTime(""); }
    else if (step === "confirm") { setStep("slot"); }
  };

  /* ── Create Booking → tampilkan modal sukses ── */
  const handlePay = async () => {
    if (!displayUser) {
      sessionStorage.setItem("booking_intent", JSON.stringify({
        shopId: detail?.id, serviceId: selectedService?.id,
        barberId: selectedBarber?.id, date: selectedDate, time: selectedTime,
      }));
      navigate("/login?redirect=/booking");
      return;
    }

    if (!detail || !selectedService || !selectedBarber || !selectedDate || !selectedTime) return;

    setPaying(true);
    setPayError("");

    try {
      const res = await createBooking({
        service_id:   selectedService.id,
        barber_id:    selectedBarber.id,
        booking_date: selectedDate,
        start_time:   selectedTime,
      });
      setSuccessBooking(res);   // ← tampilkan modal, bukan langsung Midtrans
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create booking.";
      setPayError(msg);
    } finally {
      setPaying(false);
    }
  };

  /* ── Min date (today) ── */
  const today = new Date().toISOString().split("T")[0];

  // Calendar state & helpers
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (y: number, m: number) => new Date(y, m, 1).getDay();
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const handleCalSelect = (day: number) => {
    const d = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (d < today) return;
    setSelectedDate(d);
  };

  const ORDERED_STEPS: Step[] = ["service", "barber", "slot", "confirm"];
  const STEP_ICONS: Record<string, React.ReactNode> = {
    service: <Scissors size={14} />,
    barber:  <User size={14} />,
    slot:    <CalendarDays size={14} />,
    confirm: <BadgeCheck size={14} />,
  };
  const STEP_LABELS: Record<string, string> = {
    service: "Service", barber: "Barber", slot: "Schedule", confirm: "Verification",
  };
  const STEP_INDEX: Record<Step, number> = {
    browse: -1, service: 0, barber: 1, slot: 2, confirm: 3,
  };

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <>
      <NavbarLayout
        user={displayUser ? { name: displayUser.name, email: displayUser.email, role: displayUser.role, avatar: displayUser.avatar } : undefined}
        onLogout={() => { logout(); navigate("/"); }}
      />

      <div className="min-h-screen bg-neutral-950 pt-20">
        <div className="max-w-5xl mx-auto px-4 pb-8">

         {/* Progress + barbershop header */}
          {step !== "browse" && (
            <div className="mb-6">
              {/* Barbershop mini header */}
              {detail && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-800">
                  <button
                    onClick={goBack}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors shrink-0"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {detail.logo_url
                      ? <img src={detail.logo_url} alt={detail.name} className="w-full h-full object-cover" />
                      : <Scissors size={16} className="text-neutral-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{detail.name}</p>
                    <p className="text-xs text-neutral-400">{detail.city}</p>
                  </div>
                </div>
              )}

              {/* Progress steps */}
              <div className="flex items-center justify-center">
                {ORDERED_STEPS.map((s, i) => {
                  const current  = STEP_INDEX[step];
                  const isActive = i === current;
                  const isDone   = i < current;
                  return (
                    <Fragment key={s}>
                      {i > 0 && (
                        <div className={`h-px flex-1 max-w-[60px] ${i <= current ? "bg-amber-500" : "bg-neutral-700"}`} />
                      )}
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                          ${isDone   ? "bg-amber-500 text-black"
                          : isActive ? "bg-amber-500 text-black ring-4 ring-amber-500/20"
                          :            "bg-neutral-800 text-neutral-500"}`}>
                          {isDone ? <CheckCircle2 size={16} /> : STEP_ICONS[s]}
                        </div>
                        <span className={`text-[10px] font-medium ${isActive ? "text-amber-400" : isDone ? "text-amber-500" : "text-neutral-600"}`}>
                          {STEP_LABELS[s]}
                        </span>
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              {/* Cancellation policy banner */}
              <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Reservations can only be cancelled up to 1 day before the scheduled time.</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ════════════ STEP 0: BROWSE ════════════ */}
            {step === "browse" && (
              <motion.div key="browse" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                {/* Search + filter */}
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text" placeholder="Search by name or location..."
                      value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <select
                    value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))}
                    className="w-44 px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value={0}>All Ratings</option>
                    <option value={4}>⭐ 4+ Stars</option>
                    <option value={3}>⭐ 3+ Stars</option>
                    <option value={2}>⭐ 2+ Stars</option>
                    <option value={1}>⭐ 1+ Stars</option>
                  </select>
                </div>

                {shopsError && <div className="flex items-center gap-2 text-red-400 text-sm mb-4"><AlertCircle size={15}/> {shopsError}</div>}

                {shopsLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amber-400" size={32}/></div>
                ) : filteredShops.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500">
                    <Scissors size={40} className="mx-auto mb-3 opacity-40"/>
                    <p>No barbershops found.</p>
                    {ratingFilter > 0 && <button onClick={() => setRatingFilter(0)} className="mt-3 text-sm text-amber-400 underline">Clear filter</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredShops.map((shop) => {
                      const closed = !shop.is_open_now;
                      return (
                        <div key={shop.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden transition-all duration-200 ${closed ? "opacity-60 grayscale" : "hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5"}`}>
                          {/* Image */}
                          <div className="h-44 bg-neutral-800 relative overflow-hidden">
                            {(shop.cover_photo_url ?? shop.logo_url)
                              ? <img src={(shop.cover_photo_url ?? shop.logo_url)!} alt={shop.name} className="w-full h-full object-cover"/>
                              : <div className="w-full h-full flex items-center justify-center"><Scissors size={36} className="text-neutral-600"/></div>}

                            {/* Open/Closed badge */}
                            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                              ${closed ? "bg-neutral-700 text-neutral-400" : "bg-green-500/90 text-white"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${closed ? "bg-neutral-500" : "bg-white"}`}/>
                              {closed ? "CLOSED" : "OPEN NOW"}
                            </div>

                            {/* Rating badge */}
                            {shop.average_rating && (
                              <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-900/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-amber-400">
                                <Star size={10} className="fill-amber-400"/> {shop.average_rating.toFixed(1)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-bold text-white mb-2">{shop.name}</h3>
                            <div className="space-y-1 text-xs text-neutral-400 mb-3">
                              <div className="flex items-center gap-1.5"><MapPin size={11}/> {shop.address}, {shop.city}</div>
                              <div className="flex items-center gap-1.5"><Phone size={11}/> {shop.phone}</div>
                              {shop.average_rating !== null ? (
                                <div className="flex items-center gap-1.5 text-amber-400">
                                  <Star size={11} className="fill-amber-400"/>
                                  <span>{shop.average_rating.toFixed(1)} rating</span>
                                </div>
                              ) : (
                                <span className="text-neutral-600">No ratings yet</span>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 mt-3">
                              <div>
                                {shop.min_price && (
                                  <>
                                    <p className="text-[10px] text-neutral-500">Starting from</p>
                                    <p className="text-sm font-bold text-amber-400">{formatPrice(shop.min_price)}</p>
                                  </>
                                )}
                              </div>
                              <button
                                disabled={closed || detailLoading}
                                onClick={() => {
                                  if (!authUser) { navigate("/login?redirect=/booking"); return; }
                                  handleSelectShop(shop);
                                }}
                                className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors
                                  ${closed
                                    ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                                    : "bg-amber-500 hover:bg-amber-400 text-black"}`}
                              >
                                {detailLoading ? <Loader2 size={14} className="animate-spin"/> : "Book Now"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════ STEP 1: SERVICE ════════════ */}
            {step === "service" && detail && (
              <motion.div key="service" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-1">Choose Your Service</h2>
                  <p className="text-neutral-400 text-sm mb-5">Select a service you'd like</p>

                  {detail.services.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No services available.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detail.services.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => { setSelectedService(svc); setStep("barber"); }}
                          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all
                            ${selectedService?.id === svc.id
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-neutral-700 bg-neutral-800 hover:border-amber-500/50"}`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
                            <Scissors size={16} className="text-amber-400"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm">{svc.name}</p>
                            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                              <Clock size={10}/> {svc.duration_minutes} min
                            </p>
                          </div>
                          {svc.promo ? (
                            <div className="text-right shrink-0">
                              <span className="block text-xs text-neutral-500 line-through">{formatPrice(svc.price)}</span>
                              <span className="block text-amber-400 font-bold text-sm">{formatPrice(svc.promo.final_price)}</span>
                              <span className="mt-0.5 inline-block bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -{svc.promo.discount_percent}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-400 font-bold text-sm shrink-0">{formatPrice(svc.price)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedService && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-neutral-500">Step 1 of 4</span>
                    <button onClick={() => setStep("barber")} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
                      Continue →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════ STEP 2: BARBER ════════════ */}
            {step === "barber" && detail && (
              <motion.div key="barber" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-1">Choose Your Barber</h2>
                  <p className="text-neutral-400 text-sm mb-5">Pick a barber or let us assign one for you</p>

                  {detail.barbers.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No barbers available.</p>
                  ) : (
                    <div className="space-y-3">
                      {detail.barbers.map((barber) => (
                        <button
                          key={barber.id}
                          onClick={() => { setSelectedBarber(barber); setStep("slot"); }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all
                            ${selectedBarber?.id === barber.id
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-neutral-700 bg-neutral-800 hover:border-amber-500/50"}`}
                        >
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-neutral-700 overflow-hidden flex items-center justify-center">
                              {barber.photo_url
                                ? <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover"/>
                                : <User size={20} className="text-neutral-500"/>}
                            </div>
                            {/* Available dot */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-800 bg-green-400"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white">{barber.name}</p>
                            {barber.bio && <p className="text-xs text-neutral-400 truncate mt-0.5">{barber.bio}</p>}
                          </div>
                          {selectedBarber?.id === barber.id && <UserCheck size={18} className="text-amber-400 shrink-0"/>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedBarber && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-neutral-500">Step 2 of 4</span>
                    <button onClick={() => setStep("slot")} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
                      Continue →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════ STEP 3: SLOT ════════════ */}
            {step === "slot" && (
              <motion.div key="slot" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-1">Pick a Date & Time</h2>
                  <p className="text-neutral-400 text-sm mb-5">Choose your preferred appointment slot</p>

                  {/* Calendar + Slots — 2 kolom di desktop */}
                  <div className="md:flex md:gap-6 md:items-start">

                    {/* Kolom kiri: Kalender */}
                    <div className="border border-neutral-700 rounded-xl p-4 mb-5 md:mb-0 md:w-64 md:shrink-0">
                      {/* Month nav */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white"
                        >‹</button>
                        <span className="font-semibold text-white">{MONTH_NAMES[calMonth]} {calYear}</span>
                        <button
                          onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white"
                        >›</button>
                      </div>

                      {/* Day names */}
                      <div className="grid grid-cols-7 mb-2">
                        {DAY_NAMES.map(d => (
                          <div key={d} className="text-center text-xs text-neutral-500 py-1">{d}</div>
                        ))}
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getFirstDay(calYear, calMonth) }).map((_, i) => (
                          <div key={`e${i}`} />
                        ))}
                        {Array.from({ length: getDaysInMonth(calYear, calMonth) }, (_, i) => i + 1).map((day) => {
                          const dateStr    = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                          const isPast     = dateStr < today;
                          const isSelected = dateStr === selectedDate;
                          const isToday    = dateStr === today;
                          return (
                            <button
                              key={day}
                              disabled={isPast}
                              onClick={() => handleCalSelect(day)}
                              className={`aspect-square flex items-center justify-center text-sm rounded-md transition-all
                                ${isSelected ? "bg-amber-500 text-black font-bold"
                                : isToday    ? "border border-amber-500 text-amber-400"
                                : isPast     ? "text-neutral-700 cursor-not-allowed"
                                :              "text-white hover:bg-neutral-700"}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Kolom kanan: Time slots */}
                    <div className="flex-1">
                      {selectedDate ? (
                        <div>
                          <p className="text-sm font-medium text-white mb-3 flex items-center gap-1.5">
                            <Clock size={14} className="text-amber-400"/> Available Times
                          </p>
                          {slotsLoading ? (
                            <div className="flex items-center gap-2 text-neutral-400 text-sm">
                              <Loader2 size={16} className="animate-spin"/> Loading slots...
                            </div>
                          ) : slots.length === 0 ? (
                            <p className="text-neutral-500 text-sm">No slots available on this date.</p>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {slots.map((slot) => (
                                <button
                                  key={slot.time}
                                  disabled={!slot.available}
                                  onClick={() => setSelectedTime(slot.time)}
                                  className={`py-2 rounded-lg text-sm font-medium transition-all
                                    ${!slot.available
                                      ? "bg-neutral-800 text-neutral-600 cursor-not-allowed line-through"
                                      : selectedTime === slot.time
                                      ? "bg-amber-500 text-black"
                                      : "bg-neutral-800 text-white hover:bg-neutral-700"}`}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full min-h-[120px]">
                          <p className="text-neutral-600 text-sm text-center">Select a date to see available times</p>
                        </div>
                      )}
                    </div>

                  </div>  {/* ← tutup md:flex */}

                </div>

                {selectedDate && selectedTime && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-neutral-500">Step 3 of 4</span>
                    <button
                      onClick={() => setStep("confirm")}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
                    >
                      Continue →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            

            {/* ════════════ STEP 4: CONFIRM ════════════ */}
            {step === "confirm" && detail && selectedService && selectedBarber && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-1">Review Your Order</h2>
                  <p className="text-neutral-400 text-sm mb-5">Confirm your booking details before proceeding.</p>

                  {/* Service */}
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Service</p>
                  <div className="flex items-center justify-between bg-neutral-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Scissors size={16} className="text-amber-400"/>
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{selectedService.name}</p>
                        <p className="text-xs text-neutral-400">{selectedService.duration_minutes} min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {selectedService.promo ? (
                        <>
                          <span className="block text-xs text-neutral-500 line-through">{formatPrice(selectedService.price)}</span>
                          <span className="block font-bold text-amber-400">{formatPrice(selectedService.promo.final_price)}</span>
                          <span className="inline-block mt-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            -{selectedService.promo.discount_percent}%
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-amber-400">{formatPrice(selectedService.price)}</span>
                      )}
                    </div>
                  </div>

                  {/* Barber */}
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Barber</p>
                  <div className="flex items-center gap-3 bg-neutral-800 rounded-xl p-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                      {selectedBarber.photo_url
                        ? <img src={selectedBarber.photo_url} alt={selectedBarber.name} className="w-full h-full object-cover"/>
                        : <User size={18} className="text-neutral-500"/>}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{selectedBarber.name}</p>
                      {selectedBarber.bio && <p className="text-xs text-neutral-400">{selectedBarber.bio}</p>}
                    </div>
                  </div>

                  {/* Schedule */}
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Schedule</p>
                  <div className="bg-neutral-800 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-neutral-300">
                        <CalendarDays size={14} className="text-amber-400"/> Date
                      </div>
                      <span className="text-sm font-medium text-white">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-neutral-300">
                        <Clock size={14} className="text-amber-400"/> Time
                      </div>
                      <span className="text-sm font-medium text-white">{selectedTime}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                    <span className="text-neutral-400">Total</span>
                    <div className="text-right">
                      {selectedService.promo && (
                        <span className="block text-sm text-neutral-500 line-through">{formatPrice(selectedService.price)}</span>
                      )}
                      <span className="text-xl font-bold text-amber-400">
                        {formatPrice(selectedService.promo?.final_price ?? selectedService.price)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 text-center mt-3">By confirming, you agree to our cancellation policy.</p>
                </div>

                {payError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-3">
                    <AlertCircle size={15}/> {payError}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-neutral-500">Step 4 of 4</span>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    {paying
                      ? <><Loader2 size={16} className="animate-spin"/> Processing...</>
                      : "Confirm Booking →"}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
        {/* Full-width bottom gradient */}
        {step === "browse" && (
          <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-500/30 via-yellow-500/10 to-transparent pointer-events-none z-10" />
        )}
      </div>

      {/* ════ SUCCESS MODAL ════ */}
      {successBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {/* Icon sukses */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-1">Booking Created!</h2>
            <p className="text-neutral-400 text-sm text-center mb-5">
              Your slot has been reserved. Please complete your payment before it expires.
            </p>

            {/* Detail booking */}
            <div className="bg-neutral-800 rounded-xl p-4 space-y-2 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Barbershop</span>
                <span className="text-white font-medium">{successBooking.booking.barbershop?.name ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Service</span>
                <span className="text-white font-medium">{successBooking.booking.service?.name ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Date</span>
                <span className="text-white font-medium">{successBooking.booking.booking_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Time</span>
                <span className="text-white font-medium">{successBooking.booking.start_time?.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-700">
                <span className="text-neutral-400">Total</span>
                <span className="text-amber-400 font-bold">
                  {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(successBooking.booking.total_price)}
                </span>
              </div>
            </div>

            {/* Warning expiry */}
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 mb-5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Please complete payment within <strong>30 minutes</strong> or your booking will be automatically cancelled.</span>
            </div>

            <button
              onClick={() => navigate("/customer/my-bookings")}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
            >
              Go to My Bookings →
            </button>
          </motion.div>
        </div>
      )}

    </>
  );
}

