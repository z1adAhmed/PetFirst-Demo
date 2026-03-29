import { TrashIcon } from "lucide-react";
import React, { useEffect } from "react";
import Loader from "./Loader";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  /** Custom text when loading (e.g. "Deleting (2/5)..."). Default: "Deleting..." */
  loadingText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  loadingText = "Deleting...",
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const accent = isDanger ? "text-rose-700" : "text-slate-700";
  const iconBg = isDanger
    ? "bg-rose-100 border-rose-200"
    : "bg-slate-100 border-slate-200";
  const confirmBtn = isDanger
    ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-300"
    : "bg-[#00A89E] hover:bg-[#00c4b8] focus:ring-teal-200";

  const lines = message.split("\n").filter((l) => l.trim() !== "");

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl border ${iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-2xl">
                <TrashIcon />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-black ${accent}`}>{title}</h3>
              <div className="mt-2 space-y-1">
                {lines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-sm text-slate-600 font-medium leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => !isLoading && onCancel()}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => !isLoading && onCancel()}
            className="px-5 py-2.5 rounded-xl font-black text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 flex items-center justify-center gap-2 ${confirmBtn} disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader size="sm" className="text-white" ariaLabel="Loading" />
                <span>{loadingText}</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
