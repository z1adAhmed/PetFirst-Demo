import React from "react";
import { Dropdown } from "../ui/Dropdown";
import type { BroadcastRetryOptions } from "../../types";

const FIRST_RETRY_HOURS = Array.from({ length: 13 }, (_, i) => 12 + i); // 12 to 24
const FIRST_RETRY_OPTIONS = FIRST_RETRY_HOURS.map((h) => ({
  value: String(h),
  label: `${h} hour${h === 1 ? "" : "s"}`,
}));

const RETRY_COUNT_OPTIONS = [1, 2, 3].map((n) => ({
  value: String(n),
  label: n === 1 ? "1 time" : `${n} times`,
}));

export interface RetrySectionProps {
  value: BroadcastRetryOptions;
  onChange: (value: BroadcastRetryOptions) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable broadcast retry section: optional enable, first retry in 12–24 hours.
 * When enabled, frontend sends firstRetryInHours as top-level field in create request; backend sets retryRunAt.
 */
const RetrySection: React.FC<RetrySectionProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const toggleEnabled = () => {
    if (disabled) return;
    const next = !value.enableRetry;
    onChange({
      ...value,
      enableRetry: next,
      firstRetryInHours: next ? value.firstRetryInHours : 12,
      retryCount: next ? value.retryCount : 1,
    });
  };

  const setFirstRetryInHours = (hours: number) => {
    onChange({ ...value, firstRetryInHours: hours });
  };

  const setRetryCount = (count: number) => {
    onChange({ ...value, retryCount: count });
  };

  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-slate-50/50 p-4 md:p-5 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-800">Retry</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Optional. Backend will schedule first retry after the selected hours.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.enableRetry}
          disabled={disabled}
          onClick={toggleEnabled}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A89E] focus:ring-offset-2 disabled:opacity-50 ${
            value.enableRetry ? "bg-[#00A89E]" : "bg-slate-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
              value.enableRetry ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {value.enableRetry && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                First retry in
              </label>
              <Dropdown
                options={FIRST_RETRY_OPTIONS}
                value={String(value.firstRetryInHours)}
                onChange={(v) => setFirstRetryInHours(parseInt(v, 10))}
                placeholder="Select hours"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                Number of retries
              </label>
              <Dropdown
                options={RETRY_COUNT_OPTIONS}
                value={String(value.retryCount)}
                onChange={(v) => setRetryCount(parseInt(v, 10))}
                placeholder="Select"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetrySection;
