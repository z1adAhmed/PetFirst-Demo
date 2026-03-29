import React from "react";

export interface LocationMapProps {
  /** Latitude (takes precedence over address when both set) */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Location name (shown below map) */
  name?: string;
  /** Full address (used for embed query when lat/lng missing; shown below map) */
  address?: string;
  /** Optional class for the wrapper */
  className?: string;
  /** Aspect ratio of the map area (width / height). Default 2 (e.g. 280x140). */
  aspectRatio?: number;
  /** Height of the map in pixels. Default 140. */
  height?: number;
}

/**
 * Reusable static map showing a single location.
 * Uses Google Maps embed (no extra API key). Prefers lat/lng when available for accuracy.
 */
export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  name,
  address,
  className = "",
  aspectRatio = 2,
  height = 140,
}) => {
  const hasCoords =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);
  const hasAddress = typeof address === "string" && address.trim().length > 0;

  const query = hasCoords
    ? `${latitude},${longitude}`
    : hasAddress
      ? encodeURIComponent(address.trim())
      : null;

  if (!query) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm ${className}`}
        style={{ aspectRatio: `${aspectRatio} / 1`, minHeight: height }}
        aria-label="No location selected"
      >
        <span>Select a location</span>
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div className={`overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      <iframe
        src={embedUrl}
        title={name || address || "Location map"}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full border-0"
        style={{
          aspectRatio: `${aspectRatio} / 1`,
          minHeight: height,
          maxHeight: 200,
        }}
      />
      {(name || address) && (
        <div className="min-w-0 p-2 bg-white border-t border-slate-100">
          {name && (
            <p className="text-xs font-bold text-slate-700 truncate">
              {name}
            </p>
          )}
          {address && (
            <p
              className={`text-[10px] text-slate-500 truncate ${name ? "mt-0.5" : ""}`}
            >
              {address}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationMap;
