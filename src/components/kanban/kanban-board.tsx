"use client";

import { useState, useCallback, type ReactNode } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useDroppable } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { CollisionPriority } from "@dnd-kit/abstract";
import { COLORS } from "@/lib/tokens";

// ─── Types ─────────────────────────────────────────────────────────

export interface KanbanColumnConfig {
  id: string;
  label: string;
  color: string;
  bg: string;
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumnConfig[];
  items: Record<string, T[]>;
  renderCard: (item: T, columnId: string) => ReactNode;
  onMove: (itemId: string, fromColumn: string, toColumn: string) => void;
  disabled?: boolean;
  columnWidth?: string;
  emptyLabel?: string;
  /** Extra content rendered inside the column header, after the count badge */
  columnHeaderExtra?: (columnId: string) => ReactNode;
}

// ─── Sortable Card ─────────────────────────────────────────────────

function SortableCard<T extends { id: string }>({
  item,
  index,
  columnId,
  renderCard,
  disabled,
}: {
  item: T;
  index: number;
  columnId: string;
  renderCard: (item: T, columnId: string) => ReactNode;
  disabled?: boolean;
}) {
  const { ref, isDragging } = useSortable({
    id: item.id,
    index,
    type: "item",
    accept: "item",
    group: columnId,
    disabled,
  });

  return (
    <div
      ref={ref}
      data-dragging={isDragging}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        transition: "opacity 200ms ease",
      }}
    >
      {renderCard(item, columnId)}
    </div>
  );
}

// ─── Droppable Column ──────────────────────────────────────────────

function DroppableColumn({
  config,
  count,
  children,
  columnWidth,
  emptyLabel,
  headerExtra,
}: {
  config: KanbanColumnConfig;
  count: number;
  children: ReactNode;
  columnWidth?: string;
  emptyLabel?: string;
  headerExtra?: ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: config.id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      className="flex shrink-0 flex-col rounded-lg border transition-all"
      style={{
        width: columnWidth ?? "18rem",
        backgroundColor: isDropTarget ? `${config.color}08` : COLORS.surface,
        borderColor: isDropTarget ? config.color : COLORS.cardBorder,
        boxShadow: isDropTarget ? `0 0 12px ${config.color}30` : undefined,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: COLORS.cardBorder }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        className="relative flex-1 space-y-2 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 280px)", minHeight: 80 }}
      >
        {children}

        {count === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {emptyLabel ?? "No items"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Board ────────────────────────────────────────────────────

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  renderCard,
  onMove,
  disabled,
  columnWidth,
  emptyLabel,
  columnHeaderExtra,
}: KanbanBoardProps<T>) {
  // Local copy of items keyed by column id for optimistic drag-over updates
  const [localItems, setLocalItems] = useState(items);

  // Sync external items changes
  const itemsKey = JSON.stringify(
    Object.fromEntries(
      Object.entries(items).map(([k, v]) => [k, v.map((i) => i.id)])
    )
  );
  const [prevKey, setPrevKey] = useState(itemsKey);
  if (itemsKey !== prevKey) {
    setLocalItems(items);
    setPrevKey(itemsKey);
  }

  // Track the original column for the currently-dragged item so we can fire onMove at dragEnd
  const [dragMeta, setDragMeta] = useState<{
    itemId: string;
    fromColumn: string;
  } | null>(null);

  const handleDragStart = useCallback(
    (event: { operation: { source: { id: string | number } | null } }) => {
      const sourceId = event.operation.source?.id;
      if (sourceId == null) return;
      const itemId = String(sourceId);
      // Find which column this item is currently in
      for (const [colId, colItems] of Object.entries(localItems)) {
        if (colItems.some((i) => i.id === itemId)) {
          setDragMeta({ itemId, fromColumn: colId });
          break;
        }
      }
    },
    [localItems]
  );

  const handleDragOver = useCallback(
    (event: any) => {
      setLocalItems((current) => move(current, event));
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      if (!dragMeta) return;

      // Determine which column the item is now in
      const finalItems = move(localItems, event);
      setLocalItems(finalItems);

      let toColumn: string | null = null;
      for (const [colId, colItems] of Object.entries(finalItems)) {
        if ((colItems as T[]).some((i) => i.id === dragMeta.itemId)) {
          toColumn = colId;
          break;
        }
      }

      if (toColumn && toColumn !== dragMeta.fromColumn) {
        onMove(dragMeta.itemId, dragMeta.fromColumn, toColumn);
      }

      setDragMeta(null);
    },
    [dragMeta, localItems, onMove]
  );

  if (disabled) {
    // Read-only mode: no DnD context, just render plain columns
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = items[col.id] ?? [];
          return (
            <div
              key={col.id}
              className="flex shrink-0 flex-col rounded-lg border"
              style={{
                width: columnWidth ?? "18rem",
                backgroundColor: COLORS.surface,
                borderColor: COLORS.cardBorder,
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-2.5 border-b"
                style={{ borderColor: COLORS.cardBorder }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-xs font-medium" style={{ color: col.color }}>
                    {col.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {columnHeaderExtra?.(col.id)}
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
                    style={{ backgroundColor: col.bg, color: col.color }}
                  >
                    {colItems.length}
                  </span>
                </div>
              </div>
              <div
                className="relative flex-1 space-y-2 overflow-y-auto p-2"
                style={{ maxHeight: "calc(100vh - 280px)", minHeight: 80 }}
              >
                {colItems.map((item) => (
                  <div key={item.id}>{renderCard(item, col.id)}</div>
                ))}
                {colItems.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      {emptyLabel ?? "No items"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = localItems[col.id] ?? [];
          return (
            <DroppableColumn
              key={col.id}
              config={col}
              count={colItems.length}
              columnWidth={columnWidth}
              emptyLabel={emptyLabel}
              headerExtra={columnHeaderExtra?.(col.id)}
            >
              {colItems.map((item, index) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  index={index}
                  columnId={col.id}
                  renderCard={renderCard}
                  disabled={disabled}
                />
              ))}
            </DroppableColumn>
          );
        })}
      </div>
    </DragDropProvider>
  );
}
