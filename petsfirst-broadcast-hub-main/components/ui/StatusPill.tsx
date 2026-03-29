import React from "react";

/** Message/broadcast status values that map to the same colors as the summary cards (Sent, Delivered, Failed, Read). */
export type MessageStatusType =
  | "sent"
  | "delivered"
  | "failed"
  | "read"
  | "processed"
  | "error"
  | "pending"
  | string;

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label?: string }
> = {
  read: { bg: "bg-cyan-50", text: "text-cyan-600", label: "Read" },
  delivered: { bg: "bg-green-50", text: "text-green-600", label: "Delivered" },
  sent: { bg: "bg-violet-50", text: "text-violet-600", label: "Sent" },
  processed: { bg: "bg-violet-50", text: "text-violet-600", label: "Processed" },
  failed: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
  error: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
  pending: { bg: "bg-slate-100", text: "text-slate-600", label: "Pending" },
};

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const key = (status || "").toLowerCase().trim();
  const built = STATUS_STYLES[key];
  if (built) {
    return {
      ...built,
      label: built.label ?? status,
    };
  }
  return {
    bg: "bg-slate-100",
    text: "text-slate-600",
    label: status || "—",
  };
}

export interface StatusPillProps {
  /** Raw status from backend (e.g. "read", "delivered", "sent", "failed"). */
  status: string;
  /** Optional override for display text. Default: derived from status (e.g. "Read", "Delivered"). */
  label?: string;
  className?: string;
}

/**
 * Reusable pill for message/broadcast status. Uses the same colors as broadcast summary cards:
 * Read = cyan, Delivered = green, Sent = violet, Failed = red, other = slate.
 */
const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  className = "",
}) => {
  const { bg, text, label: defaultLabel } = getStatusStyle(status);
  const displayLabel = label ?? defaultLabel;

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${bg} ${text} ${className}`}
    >
      {displayLabel}
    </span>
  );
};

export default StatusPill;
