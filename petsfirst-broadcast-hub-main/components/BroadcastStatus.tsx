
import React from 'react';
import { BroadcastResult, BroadcastStatus } from '../types';

interface BroadcastStatusProps {
  results: BroadcastResult[];
  total: number;
  isBroadcasting: boolean;
}

const StatusIndicator: React.FC<BroadcastStatusProps> = ({ results, total, isBroadcasting }) => {
  const successCount = results.filter(r => r.status === BroadcastStatus.SUCCESS).length;
  const failedCount = results.filter(r => r.status === BroadcastStatus.FAILED).length;
  const processedCount = results.length;
  const progressPercent =
    total > 0 ? Math.min(100, Math.round((processedCount / total) * 100)) : 0;
  const remainingCount = Math.max(0, total - processedCount);

  const stateLabel = (() => {
    if (isBroadcasting) return 'Sending';
    if (processedCount === 0) return 'Ready';
    if (total > 0 && processedCount >= total) return 'Completed';
    return 'In progress';
  })();

  const StateIcon = () => {
    if (isBroadcasting) {
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
        </svg>
      );
    }
    if (total > 0 && processedCount >= total) {
      return (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    }
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-base md:text-xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center">
        <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4Z" />
          </svg>
        </span>
        Delivery Status
      </h2>

      <div className="space-y-3 md:space-y-4">
        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-[10px] md:text-xs font-semibold inline-flex items-center gap-1.5 py-1 px-2 uppercase rounded-full text-teal-700 bg-teal-100">
                <StateIcon />
                {stateLabel}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] md:text-xs font-semibold inline-block text-teal-600">
                {progressPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-500 font-semibold mb-2">
            <span>
              Sent <span className="text-slate-700">{processedCount}</span> of{' '}
              <span className="text-slate-700">{total}</span>
            </span>
            <span>
              Remaining <span className="text-slate-700">{remainingCount}</span>
            </span>
          </div>
          <div className="overflow-hidden h-2 mb-3 md:mb-4 text-xs flex rounded bg-slate-100">
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#00A89E] transition-all duration-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4">
          <div className="text-center p-2 md:p-3 rounded-lg bg-teal-50">
            <p className="text-xl md:text-2xl font-bold text-[#00A89E]">{successCount}</p>
            <p className="text-[9px] md:text-[10px] uppercase text-teal-700 font-bold">Delivered</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-lg bg-red-50">
            <p className="text-xl md:text-2xl font-bold text-red-500">{failedCount}</p>
            <p className="text-[9px] md:text-[10px] uppercase text-red-500 font-bold">Failed</p>
          </div>
          <div className="text-center p-2 md:p-3 rounded-lg bg-slate-50">
            <p className="text-xl md:text-2xl font-bold text-slate-700">{remainingCount}</p>
            <p className="text-[9px] md:text-[10px] uppercase text-slate-500 font-bold">Remaining</p>
          </div>
        </div>

        {/* Recent Errors */}
        {failedCount > 0 && (
          <div className="mt-3 md:mt-4">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-2">
              Recent errors
            </h3>
            <div className="max-h-24 md:max-h-32 overflow-y-auto space-y-1">
              {results.filter(r => r.status === BroadcastStatus.FAILED).slice(-5).map((r, i) => (
                <div key={i} className="text-[10px] md:text-xs bg-red-50 border-l-2 border-red-400 p-1.5 md:p-2 text-red-700 rounded-r">
                  <strong>{r.contact.name}:</strong> {r.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
