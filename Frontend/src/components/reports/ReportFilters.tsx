import { Calendar } from "lucide-react";

interface FilterField {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
  type?: "text" | "select";
  placeholder?: string;
}

interface ReportFiltersProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  additionalFilters?: FilterField[];
  onExport: () => void;
  exportLabel?: string;
  isExporting?: boolean;
}

export default function ReportFilters({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  additionalFilters = [],
  onExport,
  exportLabel = "Export Excel",
  isExporting = false,
}: ReportFiltersProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* From Date */}
        <div>
          <label className="block text-sm font-medium text-[#B8B8B8] mb-2">
            From Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 pr-10 text-white placeholder-[#B8B8B8] focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8B8B8] pointer-events-none" />
          </div>
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium text-[#B8B8B8] mb-2">
            To Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 pr-10 text-white placeholder-[#B8B8B8] focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8B8B8] pointer-events-none" />
          </div>
        </div>

        {/* Additional Filters */}
        {additionalFilters.map((filter, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-[#B8B8B8] mb-2">
              {filter.label}
            </label>
            {filter.type === "select" || filter.options ? (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none cursor-pointer"
              >
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                placeholder={filter.placeholder}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#B8B8B8] focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            )}
          </div>
        ))}

        {/* Export Button */}
        <div className="flex items-end">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-green-600/50"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exportLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}