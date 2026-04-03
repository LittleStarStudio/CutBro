import type { ReactNode } from "react";

interface InfoCardProps {
  title?: string;
  children: ReactNode;
  variant?: "info" | "warning" | "success" | "error";
}

export default function InfoCard({
  title = "Important Information",
  children,
  variant = "info",
}: InfoCardProps) {
  const variants = {
    info: {
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/20",
      iconBg: "bg-[#D4AF37]",
      iconText: "text-black",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      iconBg: "bg-yellow-500",
      iconText: "text-black",
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      iconBg: "bg-green-500",
      iconText: "text-black",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      iconBg: "bg-red-500",
      iconText: "text-white",
    },
  };

  const style = variants[variant];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center`}
          >
            <span className={`${style.iconText} font-bold text-sm`}>i</span>
          </div>
        </div>
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
          )}
          <div className="text-xs text-[#B8B8B8]">{children}</div>
        </div>
      </div>
    </div>
  );
}