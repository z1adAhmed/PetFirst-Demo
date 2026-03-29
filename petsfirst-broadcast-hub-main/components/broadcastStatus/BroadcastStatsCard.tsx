import React from "react";
import { Link } from "react-router-dom";
import type { BroadcastAnalyticsRow } from "./types";
import { formatBroadcastDate } from "./types";

interface BroadcastStatsCardProps {
  row: BroadcastAnalyticsRow;
}

/** Single campaign row as a card (mobile view). */
const BroadcastStatsCard: React.FC<BroadcastStatsCardProps> = ({ row }) => (
  <Link
    to={`/broadcasts/${row.campaignId}`}
    className="block rounded-2xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600">
            #{row.campaignId}
          </span>
          <p className="text-sm font-black text-slate-700 break-words">
            {row.broadcastName || "—"}
          </p>
        </div>
        <p className="text-xs text-slate-400 font-medium break-words">
          {row.templateName || "Template —"}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          {formatBroadcastDate(row.timeStamp)}
        </p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div className="rounded-xl bg-slate-50 p-2 text-center">
        <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">
          Recipients
        </p>
        <p className="text-sm font-black text-slate-700">
          {row.recipients.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl bg-green-50 p-2 text-center">
        <p className="text-[10px] uppercase tracking-wider font-black text-green-500">
          Delivered
        </p>
        <p className="text-sm font-black text-green-700">
          {row.delivered.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl bg-violet-50 p-2 text-center">
        <p className="text-[10px] uppercase tracking-wider font-black text-violet-500">
          Sent
        </p>
        <p className="text-sm font-black text-violet-700">
          {row.sent.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl bg-red-50 p-2 text-center">
        <p className="text-[10px] uppercase tracking-wider font-black text-red-500">
          Failed
        </p>
        <p className="text-sm font-black text-red-700">
          {row.failed.toLocaleString()}
        </p>
      </div>
    </div>
  </Link>
);

export default BroadcastStatsCard;
