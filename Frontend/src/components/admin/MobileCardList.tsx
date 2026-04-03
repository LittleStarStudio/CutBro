import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MobileCardListProps<T> {
  data: T[];
  renderCard: (item: T) => ReactNode;
  itemsPerPage?: number;
}

export default function MobileCardList<T extends { id: number | string }>({
  data,
  renderCard,
  itemsPerPage = 10,
}: MobileCardListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset ke halaman 1 jika data berubah (filter/search)
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    // md:hidden — muncul di mobile (<768px), tersembunyi di md ke atas
    <div className="md:hidden mt-6 space-y-3">
      {/* Cards */}
      {paginatedData.map((item) => (
        <div key={item.id}>{renderCard(item)}</div>
      ))}

      {/* Pagination Footer — sama persis dengan DataTable */}
      <div className="flex items-center justify-between px-1 py-3 border-t border-[#2A2A2A] mt-2">
        {/* Info */}
        <p className="text-xs text-[#B8B8B8]">
          Menampilkan{" "}
          <span className="text-white font-medium">
            {totalItems === 0 ? 0 : startIndex + 1}–{endIndex}
          </span>
        </p>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md text-[#B8B8B8] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
            )
            .reduce<(number | "...")[]>((acc, page, idx, arr) => {
              if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                acc.push("...");
              }
              acc.push(page);
              return acc;
            }, [])
            .map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-[#B8B8B8] text-xs"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-colors ${
                    currentPage === page
                      ? "bg-white text-black"
                      : "text-[#B8B8B8] hover:bg-[#2A2A2A] hover:text-white"
                  }`}
                >
                  {page}
                </button>
              )
            )}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md text-[#B8B8B8] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}