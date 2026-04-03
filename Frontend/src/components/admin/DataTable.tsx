import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  itemsPerPage?: number;
  hidePagination?: boolean;
}

export default function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onRowClick,
  itemsPerPage = 10,
  hidePagination = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = hidePagination ? data : data.slice(startIndex, endIndex);

  return (
    <div className="hidden md:block w-full overflow-x-auto mt-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2A2A2A] text-[#B8B8B8]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 ${column.headerClassName || "text-left"}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#2A2A2A]">
          {paginatedData.map((item, rowIndex) => (
            <tr
              key={item.id}
              className={`hover:bg-[#2A2A2A]/50 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-4 ${column.className || ""}`}
                >
                  {column.render(item, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer — disembunyikan jika hidePagination=true */}
      {!hidePagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A] mt-2">
          <p className="text-xs text-[#B8B8B8]">
            Menampilkan{" "}
            <span className="text-white font-medium">
              {totalItems === 0 ? 0 : startIndex + 1}–{endIndex}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md text-[#B8B8B8] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

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

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md text-[#B8B8B8] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}