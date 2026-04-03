import { Check } from "lucide-react";

// ─── SelectionIndicator ───────────────────────────────────────────────────────

interface SelectionIndicatorProps {
  size?: "sm" | "md";
}

export function SelectionIndicator({ size = "md" }: SelectionIndicatorProps) {
  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const icon = size === "sm" ? 12 : 13;
  return (
    <div className={`${dim} bg-amber-500 rounded-full flex items-center justify-center shrink-0`}>
      <Check size={icon} className="text-black" strokeWidth={3} />
    </div>
  );
}

// ─── StepHeading ─────────────────────────────────────────────────────────────

interface StepHeadingProps {
  title: string;
  subtitle: string;
}

export function StepHeading({ title, subtitle }: StepHeadingProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
      <p className="text-zinc-400 text-sm">{subtitle}</p>
    </div>
  );
}

// ─── SelectableCard ───────────────────────────────────────────────────────────

interface SelectableCardProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

export function SelectableCard({
  active,
  disabled = false,
  onClick,
  className = "",
  children,
}: SelectableCardProps) {
  const base = "w-full text-left rounded-2xl border transition-all duration-300";

  const state = disabled
    ? "opacity-40 cursor-not-allowed bg-zinc-900/50 border-zinc-800"
    : active
    ? "bg-amber-500/15 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.2)] cursor-pointer"
    : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-pointer";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${state} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────

interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}

export function SummaryRow({ label, value, bold = false }: SummaryRowProps) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-base" : "text-sm"}`}>
      <span className={bold ? "text-zinc-400" : "text-zinc-500"}>{label}</span>
      <span className={bold ? "text-amber-400" : "text-white font-semibold"}>{value}</span>
    </div>
  );
}

// ─── GoldButton ──────────────────────────────────────────────────────────────

interface GoldButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function GoldButton({ disabled, onClick, className = "", children }: GoldButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300
        ${disabled
          ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          : "bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-[0_4px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_4px_28px_rgba(251,191,36,0.5)]"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ─── FormField ───────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white " +
  "placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition";