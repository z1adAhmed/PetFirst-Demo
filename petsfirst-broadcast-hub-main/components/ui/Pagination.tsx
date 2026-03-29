import React from "react";

export interface PaginationProps {
  /** Current 1-based page */
  page: number;
  /** Total number of pages */
  pageCount: number;
  /** Total number of items (optional, for display) */
  total?: number;
  /** Page size (optional, for display) */
  pageSize?: number;
  /** Called when user requests previous page */
  onPrev: () => void;
  /** Called when user requests next page */
  onNext: () => void;
  /** Optional: refresh callback (e.g. reload current page) */
  onRefresh?: () => void;
  /** Optional class for the container */
  className?: string;
  /** Optional: hide "Page X of Y" text */
  hideLabel?: boolean;
}

/**
 * Reusable pagination controls: Prev / Next and optional label and Refresh.
 * Disables Prev when page <= 1 and Next when page >= pageCount.
 */
const Pagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  total,
  pageSize,
  onPrev,
  onNext,
  onRefresh,
  className = "",
  hideLabel = false,
}) => {
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 sm:gap-3 ${className}`}
    >
      {!hideLabel && (
        <span className="text-xs text-slate-400 font-medium">
          {total != null && pageSize != null
            ? `Page ${page} of ${pageCount} (${total} total)`
            : `Page ${page} of ${pageCount}`}
        </span>
      )}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Prev
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Next
      </button>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg text-xs font-black border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          Refresh
        </button>
      )}
    </div>
  );
};

export default Pagination;
