import type { ReactNode } from "react";
import { type LucideIcon, AlertCircle } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";

interface TableSectionProps {
  title: string;
  description?: string;
  children: ReactNode;

  isEmpty?: boolean;

  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;

  searchProps?: ReactNode;
}

export default function TableSection({
  title,
  description,
  children,
  isEmpty = false,

  emptyIcon = AlertCircle, // ✅ default icon
  emptyTitle = "No data found",
  emptyDescription = "Try adjusting your filters",

  searchProps,
}: TableSectionProps) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {searchProps && <div>{searchProps}</div>}
      </div>

      {/* Content */}
      <div className="rounded-lg border bg-card p-4">
        {isEmpty ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
