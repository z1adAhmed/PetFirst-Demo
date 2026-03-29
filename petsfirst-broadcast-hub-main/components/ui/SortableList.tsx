import React, { useCallback } from "react";
import { GripVertical } from "lucide-react";

const DRAG_DATA_KEY = "application/x-sortable-index";

export interface SortableListProps<T> {
  /** Items in current order. */
  items: T[];
  /** Called when the user reorders. Pass the new array order. */
  onReorder: (reordered: T[]) => void;
  /** Render each item. Receives item and index (after reorder, index is the visual index). */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional key extractor for list items. Default: index. */
  getItemKey?: (item: T, index: number) => React.Key;
  /** Optional class for the list container. */
  className?: string;
  /** Optional class for each row wrapper (row = handle + content). */
  itemClassName?: string;
}

/**
 * Reusable sortable list: drag handle on the left, reorder via drag-and-drop.
 * Uses HTML5 drag and drop. When order changes, onReorder is called with the new array.
 */
export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  getItemKey = (_, i) => i,
  className = "",
  itemClassName = "",
}: SortableListProps<T>) {
  const handleDragStart = useCallback(
    (e: React.DragEvent, fromIndex: number) => {
      e.dataTransfer.setData(DRAG_DATA_KEY, String(fromIndex));
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndexStr = e.dataTransfer.getData(DRAG_DATA_KEY);
      if (fromIndexStr === "") return;
      const fromIndex = parseInt(fromIndexStr, 10);
      if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
      const next = [...items];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      onReorder(next);
    },
    [items, onReorder],
  );

  if (items.length === 0) return null;

  return (
    <div className={className} role="list">
      {items.map((item, index) => (
        <div
          key={getItemKey(item, index)}
          role="listitem"
          className={`flex items-start gap-2 ${itemClassName}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            className="flex-shrink-0 mt-1 p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  );
}

export default SortableList;
