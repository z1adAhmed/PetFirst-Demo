import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import StatusPill from "../../components/ui/StatusPill";

/** User/recipient from GET /api/broadcast-campaign/:id/analytics */
interface AnalyticsUser {
  recipientName: string;
  phone: string;
  messageStatus: string;
  messageId?: string;
  tries?: number;
}

/** Response from GET /api/broadcast-campaign/:id/analytics */
interface BroadcastAnalyticsDetail {
  broadcastName: string;
  templateName: string;
  timeStamp: string;
  recipients: number;
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  users: AnalyticsUser[];
}

const normalizeDetails = (payload: any): BroadcastAnalyticsDetail | null => {
  if (!payload || typeof payload !== "object") return null;
  const users = Array.isArray(payload.users) ? payload.users : [];
  return {
    broadcastName: payload.broadcastName ?? "Broadcast",
    templateName: payload.templateName ?? "",
    timeStamp: payload.timeStamp ?? "",
    recipients: Number(payload.recipients ?? 0),
    sent: Number(payload.sent ?? 0),
    delivered: Number(payload.delivered ?? 0),
    failed: Number(payload.failed ?? 0),
    read: Number(payload.read ?? 0),
    users,
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const BroadcastDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [details, setDetails] = useState<BroadcastAnalyticsDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTab = (searchParams.get("tab") || "all").toLowerCase();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          API_ENDPOINTS.STRAPI.GET_BROADCAST_ANALYTICS_BY_ID(id),
        );
        const data = await response.json();
        const payload = data?.data ?? data;
        setDetails(normalizeDetails(payload));
      } catch {
        setError("Unable to load broadcast details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const allUsers = useMemo(() => details?.users ?? [], [details]);
  const deliveredUsers = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.messageStatus?.toLowerCase() === "delivered" ||
          u.messageStatus?.toLowerCase() === "read" ||
          u.messageStatus?.toLowerCase() === "sent" ||
          u.messageStatus?.toLowerCase() === "processed",
      ),
    [allUsers],
  );
  const failedUsers = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.messageStatus?.toLowerCase() === "failed" ||
          u.messageStatus?.toLowerCase() === "error",
      ),
    [allUsers],
  );

  const currentList =
    activeTab === "failed"
      ? failedUsers
      : activeTab === "delivered"
        ? deliveredUsers
        : allUsers;

  const handleTabChange = (tab: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", tab);
      return params;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 p-4 sm:p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <p className="text-slate-400 text-sm">Loading broadcast details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 p-4 sm:p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-slate-500 text-sm">
          {error || "Broadcast not found."}
        </p>
        <button
          onClick={() => navigate("/?tab=broadcast")}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 p-4 sm:p-8">
        <div className="flex items-start gap-3 md:gap-4 mb-6">
          <button
            onClick={() => navigate("/?tab=broadcast")}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <span className="text-lg md:text-xl">←</span>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              {details.broadcastName}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Template:{" "}
              <span className="text-slate-700 font-bold">
                {details.templateName}
              </span>
            </p>
            <p className="text-slate-400 text-xs font-medium mt-1">
              {formatDateTime(details.timeStamp)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-slate-700">
              {details.recipients}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Recipients
            </div>
          </div>
          <div className="bg-violet-50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-violet-600">
              {details.sent}
            </div>
            <div className="text-[10px] font-black text-violet-500 uppercase tracking-wider">
              Sent
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-green-600">
              {details.delivered}
            </div>
            <div className="text-[10px] font-black text-green-500 uppercase tracking-wider">
              Delivered
            </div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-red-500">
              {details.failed}
            </div>
            <div className="text-[10px] font-black text-red-400 uppercase tracking-wider">
              Failed
            </div>
          </div>
          <div className="bg-cyan-50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-cyan-600">
              {details.read}
            </div>
            <div className="text-[10px] font-black text-cyan-500 uppercase tracking-wider">
              Read
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors ${
              activeTab === "all"
                ? "bg-slate-200 text-slate-800"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            All ({allUsers.length})
          </button>
          <button
            onClick={() => handleTabChange("delivered")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors ${
              activeTab === "delivered"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Delivered / Sent ({deliveredUsers.length})
          </button>
          <button
            onClick={() => handleTabChange("failed")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors ${
              activeTab === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Failed ({failedUsers.length})
          </button>
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No recipients in this tab.
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-2">
              {currentList.map((user, index) => (
                <div
                  key={`${user.phone}-${index}`}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <p className="text-sm font-black text-slate-700 truncate">
                    {user.recipientName || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500 font-mono truncate mt-1">
                    {user.phone || "—"}
                  </p>
                  <div className="mt-2">
                    <StatusPill status={user.messageStatus || ""} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-100">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Phone</div>
                <div className="col-span-4">Status</div>
              </div>
              <div className="divide-y divide-slate-100">
                {currentList.map((user, index) => (
                  <div
                    key={`${user.phone}-${index}`}
                    className="grid grid-cols-12 gap-3 px-4 py-3 text-sm items-center"
                  >
                    <div className="col-span-4 font-bold text-slate-700 truncate">
                      {user.recipientName || "Unknown"}
                    </div>
                    <div className="col-span-4 text-slate-500 font-mono truncate">
                      {user.phone || "—"}
                    </div>
                    <div className="col-span-4">
                      <StatusPill status={user.messageStatus || ""} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BroadcastDetailsPage;
