import React from "react";
import { useSearchParams } from "react-router-dom";
import AnalyticsDashboard from "../../components/analytics/AnalyticsDashboard";
import BroadcastStats from "../../components/broadcastStatus/BroadcastStats";

export type HomeTab = "analytics" | "broadcast";

const TAB_PARAM = "tab";
const TABS: { id: HomeTab; label: string }[] = [
  { id: "analytics", label: "Message Analytics" },
  { id: "broadcast", label: "Broadcast" },
];

interface HomePageProps {
  accessToken: string;
  wabaId: string;
}

const HomePage: React.FC<HomePageProps> = ({ accessToken, wabaId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab =
    (searchParams.get(TAB_PARAM) as HomeTab) || "analytics";

  const setTab = (tab: HomeTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(TAB_PARAM, tab);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-2xl w-full max-w-md">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-sm font-black transition-all ${
              currentTab === id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentTab === "analytics" ? (
        <AnalyticsDashboard accessToken={accessToken} wabaId={wabaId} />
      ) : (
        <BroadcastStats />
      )}
    </div>
  );
};

export default HomePage;
