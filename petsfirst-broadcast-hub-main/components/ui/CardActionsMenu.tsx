import React, { useEffect, useRef, useState } from "react";
import { Copy, Eye, MoreVertical, Trash2 } from "lucide-react";

interface CardActionsMenuProps {
  copyValue?: string;
  copyLabel?: string;
  viewLabel?: string;
  onView?: () => void;
  deleteLabel?: string;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

const CardActionsMenu: React.FC<CardActionsMenuProps> = ({
  copyValue,
  copyLabel = "Copy template ID",
  viewLabel = "View template",
  onView,
  deleteLabel = "Delete",
  onDelete,
  deleteDisabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
      setOpen(false);
    } catch {
      // ignore clipboard errors
    }
  };

  if (!copyValue && !onView && !onDelete) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="w-7 h-7 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center"
        title="More actions"
        aria-label="More actions"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 w-44 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden z-30"
          onClick={(e) => e.stopPropagation()}
        >
          {copyValue && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Copied template ID" : copyLabel}</span>
            </button>
          )}
          {onView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onView();
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{viewLabel}</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                if (!deleteDisabled) onDelete();
              }}
              disabled={deleteDisabled}
              className="w-full px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:text-rose-300 disabled:cursor-not-allowed flex items-center gap-2 border-t border-slate-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleteLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CardActionsMenu;

