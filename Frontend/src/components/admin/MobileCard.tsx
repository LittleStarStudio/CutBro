import { Fragment, type ReactNode } from "react";

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
        <div className="text-xs text-[#B8B8B8] pt-2 grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-1.5 items-center">
          {fields.map((field, index) => (
            <Fragment key={index}>
              <span className="text-white font-medium whitespace-nowrap">{field.label}</span>
              <span className="text-white font-medium">:</span>
              <span className="min-w-0">{field.value}</span>
            </Fragment>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="pt-2">{actions}</div>}
    </div>
  );
}