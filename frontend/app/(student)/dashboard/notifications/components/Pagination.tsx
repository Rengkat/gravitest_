"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onChange }: Props) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-[13px] text-gray-500">
        Showing{" "}
        <span className="font-semibold text-green-900">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-green-900">{totalItems}</span>
      </span>

      <div className="flex items-center gap-2">
        <button
          title="current page"
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + Math.max(1, Math.min(currentPage - 2, totalPages - 4));
            return (
              <button
                key={page}
                onClick={() => onChange(page)}
                className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all ${
                  page === currentPage
                    ? "bg-green-800 text-white"
                    : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                {page}
              </button>
            );
          })}
        </div>

        <button
          title="next page"
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
