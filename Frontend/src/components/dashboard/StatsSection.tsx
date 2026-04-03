import { TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string | number;
  growth?: string;
  color?: "primary" | "success" | "warning" | "info";
};

export default function StatCard({
  icon,
  title,
  value,
  growth,
  color = "primary",
}: StatCardProps) {
  const bgMap: Record<NonNullable<StatCardProps["color"]>, string> = {
    primary: "bg-amber-500/10 text-amber-400",
    success: "bg-emerald-500/10 text-emerald-400",
    warning: "bg-yellow-500/10 text-yellow-400",
    info: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl hover:border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgMap[color]}`}
        >
          {icon}
        </div>

        {growth && (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {growth}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-white mb-1">
        {value}
      </p>

      {/* Title */}
      <p className="text-sm text-zinc-400">
        {title}
      </p>
    </div>
  );
}
