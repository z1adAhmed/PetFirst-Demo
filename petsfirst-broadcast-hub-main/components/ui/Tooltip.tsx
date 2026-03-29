import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export type TooltipPlacement = "top" | "bottom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  /** When true, tooltip is never shown (e.g. when trigger is enabled) */
  disabled?: boolean;
  /** Optional class for the trigger wrapper */
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  disabled = false,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (!disabled) setVisible(true);
  };
  const hide = () => setVisible(false);

  useEffect(() => {
    if (!visible || disabled || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const tooltipHeight = 40;
    const gap = 8;
    const isTop = placement === "top";
    setCoords({
      left: rect.left + rect.width / 2,
      top: isTop ? rect.top - tooltipHeight - gap : rect.bottom + gap,
    });
  }, [visible, disabled, placement]);

  const isTop = placement === "top";
  const arrowBorder = "6px solid transparent";
  const arrowTop = "6px solid rgb(30 41 59)";
  const arrowBottom = "6px solid rgb(30 41 59)";

  const tooltipContent =
    visible && !disabled ? (
      <div
        role="tooltip"
        className="fixed z-[9999] whitespace-nowrap px-3 py-2 text-xs font-semibold text-white bg-slate-800 rounded-xl shadow-lg border border-[#00A89E]/40 transition-opacity duration-150 -translate-x-1/2"
        style={{
          left: coords.left,
          top: coords.top,
        }}
      >
        <span className="relative z-10">{content}</span>
        <span
          className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
          style={
            isTop
              ? {
                  bottom: "-6px",
                  borderLeft: arrowBorder,
                  borderRight: arrowBorder,
                  borderTop: arrowTop,
                }
              : {
                  top: "-6px",
                  borderLeft: arrowBorder,
                  borderRight: arrowBorder,
                  borderBottom: arrowBottom,
                }
          }
        />
      </div>
    ) : null;

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </div>
  );
};

export default Tooltip;
