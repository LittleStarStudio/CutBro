import type { LucideIcon } from "lucide-react";

type Trend = {
  value: string;
  isPositive?: boolean;
};

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: string | number;
  iconBgColor?: string;
  iconColor?: string;
  trend?: Trend;
};

export default function StatCard({
  icon: Icon,
  title,
  value,
  iconBgColor = "bg-[#2A2A2A]",
  iconColor = "text-[#D4AF37]",
  trend,
}: StatCardProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 sm:p-5
                    hover:border-[#D4AF37]/40 transition-all duration-200">

      <div className="flex items-center justify-between">

        {/* Left Content */}
        <div className="space-y-1">
          {/* title lebih kecil */}
          <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium">
            {title}
          </p>

          {/* value lebih compact */}
          <h3 className="text-lg sm:text-xl font-semibold text-white">
            {value}
          </h3>

          {trend && (
            <p
              className={`text-[11px] font-medium ${
                trend.isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend.value}
            </p>
          )}
        </div>

        {/* icon lebih kecil */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}
        >
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
