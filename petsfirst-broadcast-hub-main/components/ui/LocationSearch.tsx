import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "./Input";
import { usePlacesAutocomplete } from "../../hooks/usePlacesAutocomplete";
import type { PlaceDetails } from "../../hooks/usePlacesAutocomplete";

export interface LocationSearchProps {
  /** Controlled search input value */
  value: string;
  /** Called when user types in the search input */
  onSearchChange: (value: string) => void;
  /** Called when user selects a place from suggestions; use to populate Name and Address fields */
  onPlaceSelect: (details: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  /** Shown when Google Maps script is not loaded or API key is missing */
  disabled?: boolean;
  /** Optional label for a11y */
  "aria-label"?: string;
}

/**
 * Reusable location search with Google Places Autocomplete.
 * Renders an input and a dropdown of suggestions with theme-colored highlight.
 * On select, fetches place details and calls onPlaceSelect({ name, address }).
 */
export const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onSearchChange,
  onPlaceSelect,
  placeholder = "Search location...",
  className = "",
  disabled = false,
  "aria-label": ariaLabel = "Search location",
}) => {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { predictions, isLoading, selectPlace, isReady } = usePlacesAutocomplete(value, mapContainerRef);

  const showDropdown = isReady && (predictions.length > 0 || isLoading) && value.trim().length > 0;

  const handleSelect = useCallback(
    async (placeId: string) => {
      try {
        const details = await selectPlace(placeId);
        onPlaceSelect(details);
        onSearchChange("");
        setHighlightIndex(-1);
      } catch {
        // Optionally show error to user
      }
    },
    [selectPlace, onPlaceSelect, onSearchChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || predictions.length === 0) {
        if (e.key === "Escape") onSearchChange("");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i < predictions.length - 1 ? i + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1));
        return;
      }
      if (e.key === "Enter" && highlightIndex >= 0 && predictions[highlightIndex]) {
        e.preventDefault();
        handleSelect(predictions[highlightIndex].placeId);
        return;
      }
      if (e.key === "Escape") {
        setHighlightIndex(-1);
      }
    },
    [showDropdown, predictions, highlightIndex, handleSelect, onSearchChange],
  );

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden div for PlacesService (must be in DOM; can be off-screen) */}
      <div
        ref={mapContainerRef}
        aria-hidden
        className="absolute left-[-9999px] top-0 w-px h-px overflow-hidden"
        style={{ position: "absolute" }}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || !isReady}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="location-suggestions"
        id="location-search-input"
        className="w-full"
      />
      {showDropdown && (
        <ul
          id="location-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 py-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-slate-500" role="option">
              Searching...
            </li>
          ) : (
            predictions.map((p, i) => (
              <li
                key={p.placeId}
                role="option"
                aria-selected={i === highlightIndex}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === highlightIndex
                    ? "bg-[#00A89E] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseLeave={() => setHighlightIndex(-1)}
                onClick={() => handleSelect(p.placeId)}
              >
                <span className="font-medium">{p.mainText ?? p.description}</span>
                {p.secondaryText && (
                  <span className={i === highlightIndex ? "text-white/90" : "text-slate-500"}>
                    {" "}
                    {p.secondaryText}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
