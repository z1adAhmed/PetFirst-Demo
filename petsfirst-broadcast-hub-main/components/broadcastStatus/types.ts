/** Single campaign analytics item from GET /api/broadcast-campaign/analytics */
export interface BroadcastAnalyticsRow {
  campaignId: number;
  broadcastName: string;
  templateName: string;
  timeStamp: string;
  recipients: number;
  sent: number;
  delivered: number;
  failed: number;
  read: number;
}

/** API response for GET /api/broadcast-campaign/analytics with pagination */
export interface BroadcastAnalyticsResponse {
  data: BroadcastAnalyticsRow[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export function formatBroadcastDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
