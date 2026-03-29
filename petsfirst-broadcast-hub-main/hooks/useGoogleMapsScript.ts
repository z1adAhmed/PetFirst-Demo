import { useEffect, useState } from "react";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const THEME_COLOR = "#00A89E";

declare global {
  interface Window {
    __googleMapsReady?: Promise<typeof google>;
    __googleMapsResolve?: (value: typeof google) => void;
  }
}

/**
 * Loads the Google Maps JavaScript API with Places library once per app.
 * Uses a global promise so multiple callers share the same load.
 */
function loadGoogleMapsScript(apiKey: string): Promise<typeof google> {
  if (!apiKey) return Promise.reject(new Error("Google Maps API key is required"));
  if (typeof window === "undefined") return Promise.reject(new Error("Window is undefined"));

  if (window.__googleMapsReady) return window.__googleMapsReady;

  window.__googleMapsReady = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existing) {
      if (typeof google !== "undefined" && google.maps?.places) {
        resolve(google);
        return;
      }
      window.__googleMapsResolve = resolve;
      return;
    }
    const callbackName = "__googleMapsPlacesCallback";
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      if (typeof google !== "undefined" && google.maps?.places) resolve(google);
      else reject(new Error("Google Maps Places failed to load"));
    };
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return window.__googleMapsReady;
}

export interface UseGoogleMapsScriptOptions {
  apiKey?: string;
}

/**
 * Hook to load Google Maps JS API and expose ready state.
 * Use VITE_GOOGLE_MAPS_API_KEY in .env for the key.
 */
export function useGoogleMapsScript(options: UseGoogleMapsScriptOptions = {}) {
  const apiKey = options.apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError(new Error("VITE_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => {
        setError(null);
        setIsLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoaded(false);
      });
  }, [apiKey]);

  return { isLoaded, error, apiKey: apiKey || undefined };
}

export { THEME_COLOR };
