import React from "react";

interface BroadcastStatsHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

const BroadcastStatsHeader: React.FC<BroadcastStatsHeaderProps> = ({
  title = "Broadcast Stats",
  subtitle = "Campaign analytics — click a row for details",
  icon = <span className="text-white text-xl">📣</span>,
  className = "",
}) => (
  <div
    className={`p-4 sm:p-6 lg:p-8 lg:pb-6 border-b border-slate-100 ${className}`}
  >
    <div className="flex items-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-teal-100">
        {icon}
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-800">
          {title}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm font-medium">
          {subtitle}
        </p>
      </div>
    </div>
  </div>
);

export default BroadcastStatsHeader;
