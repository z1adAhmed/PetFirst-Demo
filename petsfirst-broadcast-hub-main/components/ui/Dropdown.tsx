import React, { useState, useRef, useEffect } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  badge?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional: use a smaller trigger (e.g. for inline forms) */
  size?: "sm" | "md";
  disabled?: boolean;
}

const BASE_TRIGGER =
  "w-full px-3 rounded-lg border border-slate-300 bg-white text-left text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A89E] focus:border-transparent";

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
  size = "md",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  const paddingClass = size === "sm" ? "py-1.5" : "py-2";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string, disabled?: boolean) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={`${BASE_TRIGGER} ${paddingClass} flex items-center justify-between gap-2 ${
          !selectedOption ? "text-slate-500" : ""
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg focus:outline-none"
          style={{ maxHeight: "240px", overflowY: "auto" }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isDisabled = opt.disabled === true;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                onClick={() => handleSelect(opt.value, isDisabled)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(opt.value, isDisabled);
                  }
                }}
                className={`px-3 py-2 text-sm transition-colors ${
                  isDisabled
                    ? "cursor-not-allowed opacity-50 text-slate-400"
                    : isSelected
                      ? "cursor-pointer bg-[#00A89E]/10 text-[#00A89E] font-medium hover:bg-[#00A89E]/15"
                      : "cursor-pointer text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="mt-0.5 block text-xs text-slate-500 truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {opt.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold uppercase tracking-wide">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <svg
                        className="w-4 h-4 flex-shrink-0 text-[#00A89E]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
