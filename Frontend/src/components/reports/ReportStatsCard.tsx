import type { LucideIcon } from "lucide-react";

interface ReportStatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  bgColor?: string;
  iconColor?: string;
  valueColor?: string;
}

export default function ReportStatsCard({
  icon: Icon,
  title,
  value,
  bgColor = "bg-blue-500/20",
  iconColor = "text-blue-400",
  valueColor = "text-white",
}: ReportStatsCardProps) {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-[#B8B8B8]">{title}</p>
          <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}