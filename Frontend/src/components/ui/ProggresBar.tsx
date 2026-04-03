import { Check } from "lucide-react";
import { STEPS } from "@/components/entities/constants/BookConstants";
import type { StepId } from "@/type/BookingType";

interface Props {
  currentStep: StepId;
}

export function ProgressBar({ currentStep }: Props) {
  const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="relative flex items-center justify-between mb-8">
      {/* Track */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-800" />

      {/* Fill */}
      <div
        className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
        style={{ width: `${progressPct}%` }}
      />

      {/* Nodes */}
      {STEPS.map((step) => {
        const Icon       = step.icon;
        const isComplete = currentStep > step.id;
        const isActive   = currentStep === step.id;

        return (
          <div key={step.id} className="relative flex flex-col items-center gap-1.5 z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isComplete
                  ? "bg-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  : isActive
                  ? "bg-zinc-900 border-2 border-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                  : "bg-zinc-900 border-2 border-zinc-700"
              }`}
            >
              {isComplete ? (
                <Check size={14} className="text-black" strokeWidth={3} />
              ) : (
                <Icon size={14} className={isActive ? "text-amber-400" : "text-zinc-600"} />
              )}
            </div>

            <span
              className={`text-xs font-semibold ${
                isActive ? "text-amber-400" : isComplete ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}