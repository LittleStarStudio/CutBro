import { ChevronLeft, AlertTriangle } from "lucide-react";

import { SHOP } from "@/components/entities/constants/BookConstants";
import { useBooking } from "@/hooks/useBooking";
import { ProgressBar } from "@/components/ui/ProggresBar";
import { SuccessScreen } from "@/components/ui/SuccsessScreen";
import { GoldButton } from "@/components/ui/BookingUi";

import { StepService }      from "@/components/steps/StepService";
import { StepBarber }       from "@/components/steps/StepBarber";
import { StepDateTime }     from "@/components/steps/StepDateTime";
import { StepVerification } from "@/components/steps/StepVerification";
import { useNavigate, useLocation } from "react-router-dom";

const TOTAL_STEPS = 4;

export default function BookingFlow() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const shopData  = location.state?.shop ?? SHOP;

  const {
    step, booking, isComplete, canProceed,
    goNext, goBack, confirm, reset,
    selectService, selectDate, selectTime, selectBarber
  } = useBooking();

  if (isComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <SuccessScreen
            booking={booking}
            shop={shopData}
            onDone={() => { reset(); navigate("/customer/booking"); }}
          />
        </div>
      </div>
    );
  }

  const nextLabel = step === TOTAL_STEPS ? "Confirm Booking →" : "Continue →";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center px-4 py-8">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              if (step > 1) { goBack(); } else { navigate("/customer/booking"); }
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <img src={shopData.image} alt={shopData.name} className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <p className="text-white font-bold text-sm leading-none">{shopData.name}</p>
              <p className="text-zinc-500 text-xs">{shopData.location}</p>
            </div>
          </div>
        </div>

        {/* ── Progress ── */}
        <ProgressBar currentStep={step} />

        {/* ── Cancellation Warning Badge ── */}
        <div className="mt-4 mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-300/90 text-xs leading-relaxed">
            <span className="font-semibold text-amber-400">Attention:</span>{" "}
            Reservations can only be cancelled up to{" "}
            <span className="font-semibold text-amber-400">1 day before</span> the scheduled time.
            If you have trouble cancelling, contact us at{" "}
            <span className="font-semibold text-amber-400">{shopData.phone}</span>.
          </p>
        </div>

        {/* ── Step Content ── */}
        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-zinc-800 p-6 min-h-[480px] flex flex-col">
          <div className="flex-1">
            {step === 1 && <StepService  selected={booking.service} onSelect={selectService} />}
            {step === 2 && <StepBarber   selected={booking.barber}  onSelect={selectBarber}  />}
            {step === 3 && (
              <StepDateTime
                selectedDate={booking.date}
                selectedTime={booking.time}
                onSelectDate={selectDate}
                onSelectTime={selectTime}
              />
            )}
            {step === 4 && <StepVerification booking={booking} />}
          </div>

          {/* ── Footer nav ── */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Step {step} of {TOTAL_STEPS}
            </p>
            <GoldButton
              disabled={!canProceed()}
              onClick={step === TOTAL_STEPS ? confirm : goNext}
            >
              {nextLabel}
            </GoldButton>
          </div>
        </div>

      </div>
    </div>
  );
}