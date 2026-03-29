import React from "react";

const THEME_FOCUS =
  "focus:outline-none focus:ring-2 focus:ring-[#00A89E] focus:border-[#00A89E]";

const BASE_TEXTAREA =
  "w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-800 resize-y " +
  THEME_FOCUS +
  " disabled:opacity-60 disabled:cursor-not-allowed";

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  className = "",
  ...props
}) => {
  return (
    <textarea
      className={`${BASE_TEXTAREA} px-3 py-2 min-h-[100px] ${className}`.trim()}
      {...props}
    />
  );
};

export default Textarea;
