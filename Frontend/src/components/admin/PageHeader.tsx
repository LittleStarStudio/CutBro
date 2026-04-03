import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  highlightedText?: string;
  description?: string;
  actions?: ReactNode;
  actionButton?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
}

export default function PageHeader({
  title,
  highlightedText,
  description,
  actions,
  actionButton,
}: PageHeaderProps) {
  const ButtonIcon = actionButton?.icon;

  return (
    <div className="flex justify-between items-start gap-4">
      {/* Left Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {title}{" "}
          {highlightedText && (
            <span className="text-[#D4AF37]">{highlightedText}</span>
          )}
        </h1>

        {description && (
          <p className="text-sm text-[#B8B8B8] mt-1">{description}</p>
        )}
      </div>

      {/* Right Section */}
      <div className="flex-shrink-0">
        {/* Priority: actions slot */}
        {actions && actions}

        {/* Fallback: actionButton */}
        {!actions && actionButton && (
          <>
            {actionButton.href ? (
              <a
                href={actionButton.href}
                className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {actionButton.label}
                </span>
              </a>
            ) : (
              <button
                onClick={actionButton.onClick}
                className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {actionButton.label}
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}