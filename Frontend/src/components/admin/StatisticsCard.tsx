import type { ReactNode } from "react";

type Color = "default" | "success" | "warning" | "danger";

interface StatisticsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  growth?: string;
  color?: Color;
  className?: string;
  variant?: "compact" | "default" | "detailed"; // tambahan variant
}

const colorClasses: Record<Color, string> = {
  default: `
    bg-blue-50 dark:bg-blue-950/30 
    border-blue-200 dark:border-blue-800 
    text-blue-600 dark:text-blue-400
  `,
  success: `
    bg-emerald-50 dark:bg-emerald-950/30 
    border-emerald-200 dark:border-emerald-800 
    text-emerald-600 dark:text-emerald-400
  `,
  warning: `
    bg-amber-50 dark:bg-amber-950/30 
    border-amber-200 dark:border-amber-800 
    text-amber-600 dark:text-amber-400
  `,
  danger: `
    bg-red-50 dark:bg-red-950/30 
    border-red-200 dark:border-red-800 
    text-red-600 dark:text-red-400
  `,
};

const iconBackgroundClasses: Record<Color, string> = {
  default: "bg-blue-100 dark:bg-blue-900/50",
  success: "bg-emerald-100 dark:bg-emerald-900/50",
  warning: "bg-amber-100 dark:bg-amber-900/50",
  danger: "bg-red-100 dark:bg-red-900/50",
};

const textClasses: Record<Color, string> = {
  default: "text-blue-700 dark:text-blue-300",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-red-700 dark:text-red-300",
};

export default function StatisticsCard({
  icon,
  title,
  value,
  growth,
  color = "default",
  className = "",
  variant = "default",
}: StatisticsCardProps) {
  // Variant classes untuk ukuran berbeda
  const variantClasses = {
    compact: "p-4",
    default: "p-6",
    detailed: "p-8",
  };

  const iconSizeClasses = {
    compact: "p-2",
    default: "p-3",
    detailed: "p-4",
  };

  const valueSizeClasses = {
    compact: "text-xl sm:text-2xl",
    default: "text-2xl sm:text-3xl",
    detailed: "text-3xl sm:text-4xl",
  };

  const titleSizeClasses = {
    compact: "text-xs sm:text-sm",
    default: "text-sm sm:text-base",
    detailed: "text-base sm:text-lg",
  };

  return (
    <div
      className={`
        border-2 rounded-xl 
        hover:shadow-lg 
        transition-all duration-300
        w-full
        ${variantClasses[variant]}
        ${colorClasses[color]} 
        ${className}
      `}
    >
      {/* Icon & Growth - Responsive */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`rounded-lg ${iconBackgroundClasses[color]} ${iconSizeClasses[variant]}`}>
          {icon}
        </div>

        {growth && (
          <span className="text-xs sm:text-sm font-semibold truncate ml-2">
            {growth}
          </span>
        )}
      </div>

      {/* Title - Responsive */}
      <p className={`font-semibold mb-1 ${textClasses[color]} ${titleSizeClasses[variant]} line-clamp-2`}>
        {title}
      </p>

      {/* Value - Responsive */}
      <p className={`font-bold ${valueSizeClasses[variant]} truncate`}>
        {value}
      </p>
    </div>
  );
}