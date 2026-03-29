import { useRef, useEffect } from "react";

/**
 * Custom hook to get the previous value of a prop or state
 * @param value - The value to track
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(value || undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
