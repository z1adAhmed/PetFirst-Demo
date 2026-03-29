import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleMapsScript } from "./useGoogleMapsScript";
import { useDebounce } from "./useDebounce";

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

export interface PlaceDetails {
  name: string;
  address: string;
}

const DEBOUNCE_MS = 300;

/**
 * Hook for Google Places Autocomplete: predictions list + fetch place details on select.
 * Requires a ref to a container div used to host a minimal map (required by PlacesService.getDetails).
 * The container can be hidden (e.g. position: absolute; left: -9999px; width: 1px; height: 1px).
 */
export function usePlacesAutocomplete(
  searchQuery: string,
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  const { isLoaded } = useGoogleMapsScript();
  const debouncedQuery = useDebounce(searchQuery, DEBOUNCE_MS);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const mapRef = useRef<google.maps.Map | null>(null);

  // Initialize AutocompleteService when script is loaded
  useEffect(() => {
    if (!isLoaded || typeof google === "undefined") return;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current =
        new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Create PlacesService lazily when we have a container (required for getDetails)
  const ensurePlacesService = useCallback(() => {
    if (
      placesServiceRef.current ||
      !mapContainerRef.current ||
      typeof google === "undefined"
    )
      return;
    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: 0, lng: 0 },
      zoom: 1,
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    mapRef.current = map;
    placesServiceRef.current = new google.maps.places.PlacesService(map);
  }, []);

  // Fetch predictions when debounced query changes
  useEffect(() => {
    if (!autocompleteServiceRef.current || !debouncedQuery.trim()) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    autocompleteServiceRef.current.getPlacePredictions(
      { input: debouncedQuery },
      (results, status) => {
        if (cancelled) return;
        setIsLoading(false);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          setPredictions([]);
          return;
        }
        setPredictions(
          results.map((r) => ({
            placeId: r.place_id ?? "",
            description: r.description ?? "",
            mainText: r.structured_formatting?.main_text,
            secondaryText: r.structured_formatting?.secondary_text,
          })),
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const selectPlace = useCallback(
    (placeId: string): Promise<PlaceDetails> => {
      ensurePlacesService();
      return new Promise((resolve, reject) => {
        if (!placesServiceRef.current) {
          reject(new Error("Places service not ready"));
          return;
        }
        placesServiceRef.current.getDetails(
          { placeId, fields: ["name", "formatted_address"] },
          (place, status) => {
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !place
            ) {
              reject(new Error("Could not load place details"));
              return;
            }
            resolve({
              name: place.name ?? "",
              address: place.formatted_address ?? "",
            });
          },
        );
      });
    },
    [ensurePlacesService],
  );

  return { predictions, isLoading, selectPlace, isReady: isLoaded };
}
