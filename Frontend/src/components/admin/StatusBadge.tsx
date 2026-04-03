import { Check, Ban, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "active" | "suspended" | "pending";
  size?: "sm" | "md" | "lg"; // tambahan size
  showIcon?: boolean; // optional icon
}

export default function StatusBadge({ 
  status, 
  size = "md",
  showIcon = true 
}: StatusBadgeProps) {
  const statusConfig = {
    active: {
      icon: Check,
      label: "Active",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    },
    suspended: {
      icon: Ban,
      label: "Suspended",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    },
    pending: {
      icon: AlertCircle,
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
  };

  const sizeClasses = {
    sm: {
      badge: "px-2 py-0.5 text-xs",
      icon: "w-2.5 h-2.5",
      gap: "gap-1",
    },
    md: {
      badge: "px-3 py-1 text-xs sm:text-sm",
      icon: "w-3 h-3 sm:w-3.5 sm:h-3.5",
      gap: "gap-1 sm:gap-1.5",
    },
    lg: {
      badge: "px-4 py-1.5 text-sm sm:text-base",
      icon: "w-4 h-4 sm:w-5 sm:h-5",
      gap: "gap-1.5 sm:gap-2",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const sizes = sizeClasses[size];

  return (
    <span 
      className={`
        inline-flex items-center 
        rounded-full font-semibold
        ${sizes.badge}
        ${sizes.gap}
        ${config.className}
      `}
    >
      {showIcon && <Icon className={sizes.icon} />}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
}