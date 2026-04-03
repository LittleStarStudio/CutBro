// File: src/components/ui/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd   = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between mt-6 border-t border-zinc-800 pt-5">
      {/* Left: range info */}
      <p className="text-zinc-400 text-sm">
        Showing{" "}
        <span className="text-white font-bold">{rangeStart}–{rangeEnd}</span>
        {" "}of{" "}
        <span className="text-white font-bold">{totalItems}</span>
      </p>

      {/* Right: prev + page numbers + next */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
            currentPage === 1
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-zinc-600 text-sm select-none"
            >
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
              className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-200 ${
                currentPage === page
                  ? "bg-amber-500 text-black"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
            currentPage === totalPages
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}