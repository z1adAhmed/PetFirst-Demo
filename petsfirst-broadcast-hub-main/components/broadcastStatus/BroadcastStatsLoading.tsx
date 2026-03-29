import React from "react";

interface BroadcastStatsLoadingProps {
  message?: string;
}

const BroadcastStatsLoading: React.FC<BroadcastStatsLoadingProps> = ({
  message = "Loading broadcast stats...",
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <span className="text-3xl">⏳</span>
    </div>
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

export default BroadcastStatsLoading;
