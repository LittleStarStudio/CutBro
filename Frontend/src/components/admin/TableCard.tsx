import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import SearchAndFilters from "@/components/admin/SearchAndFilters";
import EmptyState from "@/components/admin/EmptyState";

interface Filter {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

interface TableCardProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchPlaceholder: string;
  filters?: Filter[];
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}

export default function TableCard({
  searchQuery,
  setSearchQuery,
  searchPlaceholder,
  filters = [],
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: TableCardProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      <SearchAndFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
      />

      {isEmpty ? (
        <div className="py-16">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
}