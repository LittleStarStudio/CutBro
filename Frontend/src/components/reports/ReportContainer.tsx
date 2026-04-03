interface ReportContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function ReportContainer({
  title,
  subtitle,
  children,
}: ReportContainerProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-6 sm:p-8 relative overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Report Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-[#B8B8B8]">{subtitle}</p>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}