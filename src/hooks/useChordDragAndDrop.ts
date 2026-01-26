import { useState, useCallback } from "react";
import { ChordDiagram, createEmptyChord, isChordEdited } from "@/types/chord";
import {
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

interface UseChordDragAndDropProps {
  rows: ChordDiagram[][];
  setRows: (rows: ChordDiagram[][]) => void;
}

export function useChordDragAndDrop(rows: ChordDiagram[][], onRowsChange: (newRows: ChordDiagram[][]) => void) {
  const [activeChord, setActiveChord] = useState<ChordDiagram | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findChordPosition = useCallback((chordId: string): { rowIndex: number; chordIndex: number } | null => {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const chordIndex = rows[rowIndex].findIndex((c) => c.id === chordId);
      if (chordIndex !== -1) {
        return { rowIndex, chordIndex };
      }
    }
    return null;
  }, [rows]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const position = findChordPosition(active.id as string);
    if (position) {
      setActiveChord(rows[position.rowIndex][position.chordIndex]);
    }
  }, [findChordPosition, rows]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activePos = findChordPosition(activeId);
    let overPos = findChordPosition(overId);

    if (!overPos && overId.startsWith("row-")) {
      const targetRowIndex = parseInt(overId.replace("row-", ""));
      if (activePos && targetRowIndex !== activePos.rowIndex) {
        overPos = { rowIndex: targetRowIndex, chordIndex: rows[targetRowIndex].length };
      }
    }

    if (!activePos || !overPos) return;

    if (activePos.rowIndex === overPos.rowIndex) {
      const newRows = [...rows];
      const row = [...newRows[activePos.rowIndex]];
      const [movedChord] = row.splice(activePos.chordIndex, 1);
      row.splice(overPos.chordIndex, 0, movedChord);
      newRows[activePos.rowIndex] = row;
      onRowsChange(newRows);
    } else {
      const newRows = [...rows];
      const sourceRow = [...newRows[activePos.rowIndex]];
      const targetRow = [...newRows[overPos.rowIndex]];

      const [movedChord] = sourceRow.splice(activePos.chordIndex, 1);
      sourceRow.push(createEmptyChord(`chord-${Date.now()}-placeholder`));

      const emptyIndex = targetRow.findIndex((c) => !isChordEdited(c));
      if (emptyIndex !== -1) {
        targetRow[emptyIndex] = movedChord;
      } else {
        targetRow.splice(overPos.chordIndex, 0, movedChord);
        targetRow.pop();
      }

      newRows[activePos.rowIndex] = sourceRow;
      newRows[overPos.rowIndex] = targetRow;
      onRowsChange(newRows);
    }
  }, [findChordPosition, rows, onRowsChange]);

  const handleDragEnd = useCallback(() => {
    setActiveChord(null);
  }, []);

  return {
    sensors,
    activeChord,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
