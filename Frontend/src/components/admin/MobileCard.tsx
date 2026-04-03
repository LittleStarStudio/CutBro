import type { ReactNode } from "react";

interface MobileCardField {
  label: string;
  value: ReactNode;
}

interface MobileCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  fields: MobileCardField[];
  actions?: ReactNode;
  headerRight?: ReactNode;
}

export default function MobileCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
  headerRight,
}: MobileCardProps) {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          {typeof title === "string" ? (
            <p className="font-semibold text-white">{title}</p>
          ) : (
            title
          )}
          {subtitle}
        </div>
        {headerRight || badge}
      </div>

      {/* Badge Row (if separate from header) */}
      {badge && headerRight && (
        <div className="flex justify-between items-center">{badge}</div>
      )}

      {/* Fields */}
      {fields.length > 0 && (
        <div className="text-xs text-[#B8B8B8] space-y-1 pt-2">
          {fields.map((field, index) => (
            <p key={index}>
              <span className="text-white font-medium">{field.label}:</span>{" "}
              {field.value}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="pt-2">{actions}</div>}
    </div>
  );
}