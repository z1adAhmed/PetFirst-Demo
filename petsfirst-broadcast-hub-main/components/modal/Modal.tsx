import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success" | "confirm";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  /** When set, renders this instead of parsing message (for custom content e.g. tables). */
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  children,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    info: {
      icon: "ℹ️",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      titleColor: "text-blue-600",
      buttonBg: "bg-blue-500 hover:bg-blue-600",
      borderColor: "border-blue-200",
    },
    warning: {
      icon: "⚠️",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      titleColor: "text-orange-600",
      buttonBg: "bg-orange-500 hover:bg-orange-600",
      borderColor: "border-orange-200",
    },
    error: {
      icon: "❌",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-600",
      buttonBg: "bg-red-500 hover:bg-red-600",
      borderColor: "border-red-200",
    },
    success: {
      icon: "✅",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      titleColor: "text-green-600",
      buttonBg: "bg-green-500 hover:bg-green-600",
      borderColor: "border-green-200",
    },
    confirm: {
      icon: "🚀",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      titleColor: "text-teal-600",
      buttonBg: "bg-[#00A89E] hover:bg-[#00c4b8]",
      borderColor: "border-teal-200",
    },
  };

  const styles = typeStyles[type];
  const isConfirm = type === "confirm" && onConfirm;
  const disableBackdropClose = type === "success";

  if (!isOpen) return null;

  const rawLines = message.split("\n");
  const isFailureSectionHeader = (line: string) => {
    const t = line.trim().toLowerCase();
    return t === "failure reasons:" || t === "users with failures:";
  };

  const renderMessage = () => {
    const nodes: React.ReactNode[] = [];
    let inFailureSection = false;
    let listItems: Array<{ text: string; isFailure: boolean }> = [];

    const flushList = (keySeed: number) => {
      if (!listItems.length) return;
      const items = listItems;
      listItems = [];
      nodes.push(
        <ul key={`list-${keySeed}`} className="space-y-1">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2 rounded-xl px-3 py-2 border ${
                item.isFailure
                  ? "bg-red-50 border-red-100 text-red-700"
                  : "bg-slate-50 border-slate-100 text-slate-700"
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  item.isFailure ? "bg-red-400" : "bg-slate-300"
                }`}
              />
              <span className="text-sm font-semibold leading-relaxed">
                {item.text}
              </span>
            </li>
          ))}
        </ul>,
      );
    };

    let keySeed = 0;
    for (const line of rawLines) {
      const trimmed = line.trim();

      if (trimmed === "") {
        flushList(keySeed++);
        nodes.push(<div key={`sp-${keySeed++}`} className="h-2" />);
        continue;
      }

      if (isFailureSectionHeader(trimmed)) {
        flushList(keySeed++);
        inFailureSection = true;
        nodes.push(
          <div key={`fh-${keySeed++}`} className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-red-100 text-red-700 border border-red-200">
              ⚠️
            </span>
            <h4 className="text-sm font-black text-red-700 uppercase tracking-wide">
              {trimmed.replace(/:$/, "")}
            </h4>
          </div>,
        );
        continue;
      }

      if (trimmed.startsWith("- ")) {
        listItems.push({
          text: trimmed.slice(2),
          isFailure: inFailureSection,
        });
        continue;
      }

      flushList(keySeed++);
      nodes.push(
        <p
          key={`p-${keySeed++}`}
          className={`font-medium leading-relaxed ${
            inFailureSection ? "text-red-700" : "text-slate-700"
          }`}
        >
          {trimmed}
        </p>,
      );
    }

    flushList(keySeed++);
    return nodes;
  };

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .modal-backdrop {
          animation: modalFadeIn 0.3s ease-out;
        }
        .modal-content {
          animation: modalSlideUp 0.3s ease-out;
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop"
        onClick={(e) => {
          if (!disableBackdropClose && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={disableBackdropClose ? undefined : onClose}
        />

        <div className="relative bg-white rounded-[34px] shadow-2xl max-w-2xl w-full modal-content overflow-hidden">
          <div
            className={`p-6 border-b ${styles.borderColor} bg-white rounded-t-[34px]`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 ${styles.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}
              >
                <span className="text-2xl">{styles.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-xl font-black ${styles.titleColor}`}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
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

          <div className="p-6 bg-white">
            {children != null ? (
              <div className="space-y-3">{children}</div>
            ) : (
              <div className="space-y-2">{renderMessage()}</div>
            )}
          </div>

          <div
            className={`p-6 border-t ${styles.borderColor} bg-white rounded-b-[34px]`}
          >
            <div className="flex gap-3 justify-end">
              {isConfirm && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
                  }
                }}
                className={`px-6 py-3 rounded-xl font-black text-white ${styles.buttonBg} shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                {isConfirm ? confirmText : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
