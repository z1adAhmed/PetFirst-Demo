import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DropdownOption } from "./Dropdown";

const BASE_TRIGGER =
  "w-full px-3 rounded-lg border border-slate-300 bg-white text-left text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A89E] focus:border-transparent";

export interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Placeholder for the search input inside the dropdown */
  searchPlaceholder?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

/**
 * Dropdown with a search input for large option lists. Same option shape and theme as Dropdown.
 * Use for 10+ options (e.g. language list); use Dropdown for small lists.
 */
export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  className = "",
  size = "md",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const paddingClass = size === "sm" ? "py-1.5" : "py-2";

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery("");
    setHighlightIndex(0);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdown]);

  useEffect(() => {
    if (!isOpen) return;
    setHighlightIndex(0);
  }, [searchQuery, isOpen]);

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  const handleSelect = useCallback(
    (optionValue: string, optDisabled?: boolean) => {
      if (optDisabled) return;
      onChange(optionValue);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        closeDropdown();
        (e.target as HTMLInputElement).blur();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i <= 0 ? filteredOptions.length - 1 : i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = filteredOptions[highlightIndex];
        if (opt) handleSelect(opt.value, opt.disabled);
        return;
      }
    },
    [isOpen, filteredOptions, highlightIndex, handleSelect, closeDropdown],
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={openDropdown}
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
          role="listbox"
          aria-label={placeholder}
        >
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A89E] focus:border-[#00A89E]"
              aria-label="Search options"
            />
          </div>
          <ul
            ref={listRef}
            className="py-1 focus:outline-none"
            style={{ maxHeight: "280px", overflowY: "auto" }}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500 text-center">No matches</li>
            ) : (
              filteredOptions.map((opt, i) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled === true;
                const isHighlighted = i === highlightIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => handleSelect(opt.value, isDisabled)}
                    onMouseEnter={() => setHighlightIndex(i)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50 text-slate-400"
                        : isSelected
                          ? "bg-[#00A89E]/10 text-[#00A89E] font-medium"
                          : isHighlighted
                            ? "bg-[#00A89E]/10 text-slate-800"
                            : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
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
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
