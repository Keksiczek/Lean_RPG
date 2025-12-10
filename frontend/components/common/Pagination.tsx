'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const startIndex = Math.max(0, currentPage - 3);
  const endIndex = Math.min(pages.length, currentPage + 2);
  const visiblePages = pages.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
