import React from "react";

const THEME_FOCUS =
  "focus:outline-none focus:ring-2 focus:ring-[#00A89E] focus:border-[#00A89E]";

const BASE_INPUT =
  "w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-800 " +
  THEME_FOCUS +
  " disabled:opacity-60 disabled:cursor-not-allowed";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  className?: string;
  size?: "sm" | "md";
}

export const Input: React.FC<InputProps> = ({
  className = "",
  size = "md",
  ...props
}) => {
  const paddingClass = size === "sm" ? "px-2 py-1.5" : "px-3 py-2";
  return (
    <input
      className={`${BASE_INPUT} ${paddingClass} ${className}`.trim()}
      {...props}
    />
  );
};

export default Input;
