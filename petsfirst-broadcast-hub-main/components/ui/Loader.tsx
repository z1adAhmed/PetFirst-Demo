import React from "react";

export type LoaderSize = "sm" | "md" | "lg";

const DEFAULT_LOADER_COLOR = "#22c55e";

const sizeMap: Record<LoaderSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-10 w-10",
};

export interface LoaderProps {
  /** Size of the spinner. Default: "md" */
  size?: LoaderSize;
  /** Optional class (e.g. "text-white" when on a colored button). Default uses theme color. */
  className?: string;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
}

/**
 * Reusable loading spinner. Uses #22c55e (emerald) by default.
 * Pass className="text-white" when the loader is on a colored background.
 */
export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  className = "",
  ariaLabel = "Loading",
}) => {
  const sizeClass = sizeMap[size];
  const hasExplicitColor = /text-/.test(className);
  const svgStyle = hasExplicitColor
    ? undefined
    : { color: DEFAULT_LOADER_COLOR };

  return (
    <svg
      className={`animate-spin ${sizeClass} ${className}`}
      style={svgStyle}
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default Loader;
