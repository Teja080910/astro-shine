'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <span className="text-sm text-text-secondary">
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="input-field text-xs py-1.5 px-2 w-auto"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-card-border bg-surface-light/30 text-text-secondary disabled:opacity-40 hover:text-text-primary flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-card-border bg-surface-light/30 text-text-secondary disabled:opacity-40 hover:text-text-primary flex items-center gap-1"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function unwrapList<T>(res: any): { data: T[]; total: number; totalPages: number } {
  if (Array.isArray(res)) {
    return { data: res, total: res.length, totalPages: 1 };
  }
  return {
    data: res?.data ?? [],
    total: res?.total ?? 0,
    totalPages: res?.totalPages ?? 1,
  };
}
