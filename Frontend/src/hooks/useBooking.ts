import { useState, useCallback } from "react";
import type { BookingState, StepId } from "@/type/BookingType";
import { STEPS } from "@/components/entities/constants/BookConstants";

const INITIAL_BOOKING: BookingState = {
  service: "",
  barber: null,
  date: null,
  time: null,
  phone: undefined
};

export function useBooking() {
  const [step, setStep]             = useState<StepId>(1);
  const [isComplete, setIsComplete] = useState(false);
  const [booking, setBooking]       = useState<BookingState>(INITIAL_BOOKING);

  // ── Validation ──────────────────────────────────────────────────────────────

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1: return booking.service !== "";
      case 2: return booking.barber !== null;
      case 3: return booking.date !== null && booking.time !== null;
      default: return true;
    }
  }, [step, booking]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (canProceed() && step < STEPS.length) setStep((s) => (s + 1) as StepId);
  }, [canProceed, step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as StepId);
  }, [step]);

  // ── Field updaters ───────────────────────────────────────────────────────────

  const selectService = useCallback((id: string) => {
    setBooking((prev) => ({ ...prev, service: id }));
  }, []);

  const selectBarber = useCallback((id: string) => {
    setBooking((prev) => ({ ...prev, barber: id }));
  }, []);

  const selectDate = useCallback((date: string) => {
    setBooking((prev) => ({ ...prev, date, time: null }));
  }, []);

  const selectTime = useCallback((time: string) => {
    setBooking((prev) => ({ ...prev, time }));
  }, []);

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  const confirm = useCallback(() => setIsComplete(true), []);

  const reset = useCallback(() => {
    setBooking(INITIAL_BOOKING);
    setStep(1);
    setIsComplete(false);
  }, []);

  return {
    step,
    booking,
    isComplete,
    canProceed,
    goNext,
    goBack,
    confirm,
    reset,
    selectService,
    selectBarber,
    selectDate,
    selectTime,
  };
}