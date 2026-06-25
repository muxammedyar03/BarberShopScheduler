'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-slate-400">
        {page} / {totalPages} ({total})
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
