import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { AnalyticsResponse } from "../../types";
import { fetchWhatsAppAnalytics } from "../../store/thunks/analyticsThunks";
import Loader from "../ui/Loader";

interface AnalyticsDashboardProps {
  accessToken: string;
  wabaId: string;
}

interface TooltipData {
  sent: number;
  delivered: number;
  date: string;
  x: number;
  y: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  accessToken,
  wabaId,
}) => {
  const dispatch = useAppDispatch();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d">("7d");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const fetchData = async () => {
    if (!accessToken || !wabaId) {
      setError(
        "Missing VITE_META_ACCESS_TOKEN or VITE_META_WABA_ID in .env.local",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const now = Math.floor(Date.now() / 1000);
    const daysMap = { "7d": 7, "14d": 14, "30d": 30 };
    const startTimestamp = now - daysMap[dateRange] * 24 * 60 * 60;

    const result = await dispatch(
      fetchWhatsAppAnalytics({
        wabaId,
        accessToken,
        startTimestamp,
        endTimestamp: now,
      }),
    );

    if (fetchWhatsAppAnalytics.rejected.match(result)) {
      setError(result.payload || "Failed to fetch analytics");
    } else if (fetchWhatsAppAnalytics.fulfilled.match(result)) {
      setAnalytics(result.payload);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (accessToken && wabaId) {
      fetchData();
    }
  }, [accessToken, wabaId, dateRange]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const dataPoints = analytics?.analytics?.data_points || [];
  const totalSent = dataPoints.reduce((sum, dp) => sum + dp.sent, 0);
  const totalDelivered = dataPoints.reduce((sum, dp) => sum + dp.delivered, 0);
  const deliveryRate =
    totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0";
  const maxValue = Math.max(
    ...dataPoints.map((dp) => Math.max(dp.sent, dp.delivered)),
    1,
  );

  if (!accessToken || !wabaId) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-black text-slate-700 mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-slate-400 text-sm">
            Set VITE_META_ACCESS_TOKEN and VITE_META_WABA_ID in .env.local to
            view analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 lg:pb-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg shadow-violet-100">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                Message Analytics
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                WhatsApp delivery performance
              </p>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl w-full sm:w-auto">
            {(["7d", "14d", "30d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  dateRange === range
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {range === "7d"
                  ? "7 Days"
                  : range === "14d"
                    ? "14 Days"
                    : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader
                size="lg"
                className="mx-auto mb-4"
                ariaLabel="Loading analytics"
              />
              <p className="text-slate-500 font-medium">Loading analytics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg font-black text-red-600 mb-2">
              Error Loading Analytics
            </h3>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📭</span>
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-2">
              No Data Available
            </h3>
            <p className="text-slate-400 text-sm">
              No message data found for the selected period
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-2xl border border-violet-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-violet-400 text-lg">📤</span>
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">
                    Sent
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-violet-600">
                  {totalSent.toLocaleString()}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 text-lg">✅</span>
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">
                    Delivered
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-green-600">
                  {totalDelivered.toLocaleString()}
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-5 rounded-2xl border border-cyan-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 text-lg">📈</span>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                    Rate
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-cyan-600">
                  {deliveryRate}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-slate-50 rounded-2xl p-3 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Daily Performance
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full mr-2"></div>
                    <span className="text-xs font-bold text-slate-500">
                      Sent
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-2"></div>
                    <span className="text-xs font-bold text-slate-500">
                      Delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="overflow-x-auto">
                <div
                  className="relative h-72 min-w-[520px]"
                  onMouseLeave={() => setTooltip(null)}
                >
                {/* Floating Tooltip */}
                {tooltip && (
                  <div
                    className="fixed bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap z-[9999] pointer-events-none shadow-2xl"
                    style={{
                      left: tooltip.x,
                      top: tooltip.y - 80,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="text-center mb-2 text-slate-300 text-xs font-medium border-b border-slate-700 pb-2">
                      {tooltip.date}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                        <span className="text-violet-300">Sent:</span>
                        <span className="ml-1 text-white">
                          {tooltip.sent.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        <span className="text-green-300">Delivered:</span>
                        <span className="ml-1 text-white">
                          {tooltip.delivered.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900"></div>
                  </div>
                )}

                  <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pt-8">
                  {dataPoints.map((dp, index) => {
                    const sentHeight = (dp.sent / maxValue) * 100;
                    const deliveredHeight = (dp.delivered / maxValue) * 100;

                    const handleMouseEnter = (e: React.MouseEvent) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        sent: dp.sent,
                        delivered: dp.delivered,
                        date: formatDate(dp.start),
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    };

                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center cursor-pointer"
                        onMouseEnter={handleMouseEnter}
                        onMouseMove={handleMouseEnter}
                      >
                        <div className="w-full flex gap-1 items-end h-52">
                          <div
                            className="flex-1 bg-gradient-to-t from-violet-500 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-violet-600 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-200"
                            style={{
                              height: `${sentHeight}%`,
                              minHeight: dp.sent > 0 ? "8px" : "0",
                            }}
                          />
                          <div
                            className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-emerald-500 hover:shadow-lg hover:shadow-green-200"
                            style={{
                              height: `${deliveredHeight}%`,
                              minHeight: dp.delivered > 0 ? "8px" : "0",
                            }}
                          />
                        </div>
                        <div className="mt-3 text-[10px] font-bold text-slate-400 text-center">
                          {formatDate(dp.start)}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            </div>

            {analytics?.analytics?.phone_numbers &&
              analytics.analytics.phone_numbers.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📱</span>
                    <span className="text-xs font-bold text-slate-500">
                      Tracked Number:
                    </span>
                    <span className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      +{analytics.analytics.phone_numbers[0]}
                    </span>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      {!isLoading && accessToken && wabaId && (
        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8">
          <button
            onClick={fetchData}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span> Refresh Analytics
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
