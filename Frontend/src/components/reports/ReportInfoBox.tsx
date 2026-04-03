import { Info } from "lucide-react";

interface ReportInfoBoxProps {
  title?: string;
  description: string;
  additionalInfo?: string;
  totalItems?: number;
}

export default function ReportInfoBox({
  title = "This report contains:",
  description,
  additionalInfo = "Data will be exported in Excel format.",
  totalItems,
}: ReportInfoBoxProps) {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-blue-400 font-semibold mb-3">{title}</h3>
          <p className="text-sm text-[#B8B8B8] leading-relaxed mb-3">
            {description}
          </p>
          <p className="text-sm text-blue-400">
            {additionalInfo}
            {totalItems !== undefined && (
              <>
                {" "}Total items in this report: <strong>{totalItems}</strong>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}