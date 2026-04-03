import type { LucideIcon } from "lucide-react";

interface BadgeProps {
  text: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "gold" | "info";
  showDot?: boolean;
  dotColor?: string;
  icon?: LucideIcon;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  primary: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  gold: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  info: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
};

export default function Badge({
  text,
  variant = "default",
  showDot = false,
  dotColor = "bg-gray-500",
  icon: Icon,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {showDot && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      {Icon && <Icon className="w-3 h-3" />}
      {text}
    </span>
  );
}