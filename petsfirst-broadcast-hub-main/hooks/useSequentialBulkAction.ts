import { useCallback, useState } from "react";

export interface BulkActionProgress<T> {
  /** 0-based index of the current item (or total when done). */
  currentIndex: number;
  total: number;
  /** Current item being processed (undefined when idle or between items). */
  currentItem: T | undefined;
  /** Errors per item: key = some identifier (e.g. template name), value = error message. */
  errors: Record<string, string>;
  /** Items that were processed successfully (e.g. deleted). */
  succeeded: string[];
}

export interface UseSequentialBulkActionOptions<T> {
  /**
   * Get a unique key for the item (for progress/errors). Default: (item) => String(item).
   */
  getItemKey?: (item: T) => string;
  /**
   * If true, continue to the next item when one fails. Default: true.
   */
  continueOnError?: boolean;
}

export interface UseSequentialBulkActionReturn<T> {
  run: (items: T[]) => Promise<void>;
  isRunning: boolean;
  progress: BulkActionProgress<T>;
  reset: () => void;
}

/**
 * Runs an async action for each item one-by-one (sequential loop).
 * Tracks progress, collects errors, and supports optional continue-on-error.
 * Reusable for bulk delete, bulk update, etc.
 */
export function useSequentialBulkAction<T>(
  action: (item: T) => Promise<void>,
  options: UseSequentialBulkActionOptions<T> = {},
): UseSequentialBulkActionReturn<T> {
  const { getItemKey = (item) => String(item), continueOnError = true } =
    options;

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BulkActionProgress<T>>({
    currentIndex: 0,
    total: 0,
    currentItem: undefined,
    errors: {},
    succeeded: [],
  });

  const reset = useCallback(() => {
    setProgress({
      currentIndex: 0,
      total: 0,
      currentItem: undefined,
      errors: {},
      succeeded: [],
    });
  }, []);

  const run = useCallback(
    async (items: T[]) => {
      if (items.length === 0) return;
      setIsRunning(true);
      setProgress({
        currentIndex: 0,
        total: items.length,
        currentItem: items[0],
        errors: {},
        succeeded: [],
      });

      const errors: Record<string, string> = {};
      const succeeded: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const key = getItemKey(item);
        setProgress((prev) => ({
          ...prev,
          currentIndex: i,
          currentItem: item,
          errors: { ...errors },
          succeeded: [...succeeded],
        }));

        try {
          await action(item);
          succeeded.push(key);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          errors[key] = message;
          if (!continueOnError) {
            setProgress((prev) => ({
              ...prev,
              currentIndex: i,
              currentItem: undefined,
              errors: { ...errors },
              succeeded: [...succeeded],
            }));
            setIsRunning(false);
            return;
          }
        }
      }

      setProgress((prev) => ({
        ...prev,
        currentIndex: items.length,
        currentItem: undefined,
        errors: { ...errors },
        succeeded: [...succeeded],
      }));
      setIsRunning(false);
    },
    [action, getItemKey, continueOnError],
  );

  return { run, isRunning, progress, reset };
}
