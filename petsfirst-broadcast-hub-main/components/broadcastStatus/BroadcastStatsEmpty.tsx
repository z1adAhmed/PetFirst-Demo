import React from "react";

interface BroadcastStatsEmptyProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

const BroadcastStatsEmpty: React.FC<BroadcastStatsEmptyProps> = ({
  title = "No Broadcasts Yet",
  message = "Send a broadcast to see stats here.",
  icon = <span className="text-3xl">📭</span>,
}) => (
  <div className="text-center py-10">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-black text-slate-700 mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

export default BroadcastStatsEmpty;
