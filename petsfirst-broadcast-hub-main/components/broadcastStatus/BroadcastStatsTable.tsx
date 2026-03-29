import React from "react";
import { Link } from "react-router-dom";
import type { BroadcastAnalyticsRow } from "./types";
import { formatBroadcastDate } from "./types";

interface BroadcastStatsTableProps {
  rows: BroadcastAnalyticsRow[];
}

/** Desktop table of campaign analytics. */
const BroadcastStatsTable: React.FC<BroadcastStatsTableProps> = ({ rows }) => (
  <div className="overflow-hidden rounded-3xl border border-slate-100">
    <div className="grid grid-cols-12 gap-3 px-4 lg:px-6 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
      <div className="col-span-1 text-center">ID</div>
      <div className="col-span-2">Broadcast</div>
      <div className="col-span-2">Template</div>
      <div className="col-span-2">Date</div>
      <div className="col-span-1 text-center">Recipients</div>
      <div className="col-span-1 text-center">Sent</div>
      <div className="col-span-1 text-center">Delivered</div>
      <div className="col-span-1 text-center">Failed</div>
      <div className="col-span-1 text-center">Read</div>
    </div>
    <div className="divide-y divide-slate-100">
      {rows.map((row) => (
        <Link
          key={row.campaignId}
          to={`/broadcasts/${row.campaignId}`}
          className="grid grid-cols-12 gap-3 px-4 lg:px-6 py-4 items-start hover:bg-slate-50 transition-colors"
        >
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-600">
              {row.campaignId}
            </span>
          </div>
          <div className="col-span-2 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-500 text-sm font-black flex-shrink-0">
                {row.broadcastName?.charAt(0)?.toUpperCase() || "B"}
              </div>
              <div className="min-w-0 break-words">
                <div className="text-sm font-black text-slate-700 break-words">
                  {row.broadcastName || "—"}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-2 text-sm text-slate-600 break-words">
            {row.templateName || "—"}
          </div>
          <div className="col-span-2 text-xs text-slate-500">
            {formatBroadcastDate(row.timeStamp)}
          </div>
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black bg-slate-50 text-slate-600">
              {row.recipients.toLocaleString()}
            </span>
          </div>
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black bg-violet-50 text-violet-600">
              {row.sent.toLocaleString()}
            </span>
          </div>
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black bg-green-50 text-green-600">
              {row.delivered.toLocaleString()}
            </span>
          </div>
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black bg-red-50 text-red-600">
              {row.failed.toLocaleString()}
            </span>
          </div>
          <div className="col-span-1 text-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-black bg-cyan-50 text-cyan-600">
              {row.read.toLocaleString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default BroadcastStatsTable;
