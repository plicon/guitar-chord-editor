import { useState, useCallback } from "react";
import { ChordDiagram, createEmptyChord, isChordEdited } from "@/types/chord";
import { StrummingPattern } from "@/types/strumming";
import { ChordChart, createChordChart } from "@/types/chordChart";
import { 
  saveChart, 
  loadChart, 
  downloadChartAsJson, 
  importChartFromJson 
} from "@/services/storage";
import { toast } from "sonner";

const createRow = (startId: number, chordsPerRow: number): ChordDiagram[] => 
  Array.from({ length: chordsPerRow }, (_, i) => 
    createEmptyChord(`chord-${Date.now()}-${startId + i}`)
  );

export interface ChartState {
  currentChartId: string | null;
  title: string;
  description: string;
  chordsPerRow: number;
  rows: ChordDiagram[][];
  rowSubtitles: string[];
  strummingPattern: StrummingPattern | null;
  isSaving: boolean;
}

export interface ChartActions {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setStrummingPattern: (pattern: StrummingPattern | null) => void;
  handleNewChart: () => void;
  handleSave: () => Promise<void>;
  handleLoadChart: (id: string) => Promise<void>;
  handleExportJson: () => void;
  handleImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleChordsPerRowChange: (newCount: number) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  handleRowSubtitleChange: (index: number, value: string) => void;
  handleSaveChord: (chord: ChordDiagram, rowIndex: number, chordIndex: number) => void;
  getCurrentChart: () => ChordChart;
  hasEditedChords: boolean;
}

export function useChartState(): [ChartState, ChartActions] {
  const [currentChartId, setCurrentChartId] = useState<string | null>(null);
  const [title, setTitle] = useState("My Chord Chart");
  const [description, setDescription] = useState("");
  const [chordsPerRow, setChordsPerRow] = useState(4);
  const [rows, setRows] = useState<ChordDiagram[][]>([createRow(0, 4)]);
  const [rowSubtitles, setRowSubtitles] = useState<string[]>([""]);
  const [strummingPattern, setStrummingPattern] = useState<StrummingPattern | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getCurrentChart = useCallback((): ChordChart => {
    const chart = createChordChart(
      title,
      description,
      chordsPerRow,
      rows,
      rowSubtitles,
      strummingPattern
    );
    if (currentChartId) {
      chart.id = currentChartId;
    }
    return chart;
  }, [title, description, chordsPerRow, rows, rowSubtitles, strummingPattern, currentChartId]);

  const loadChartIntoEditor = useCallback((chart: ChordChart) => {
    setCurrentChartId(chart.id);
    setTitle(chart.title);
    setDescription(chart.description);
    setChordsPerRow(chart.chordsPerRow);
    setRows(chart.rows);
    setRowSubtitles(chart.rowSubtitles);
    setStrummingPattern(chart.strummingPattern);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const chart = getCurrentChart();
      await saveChart(chart);
      setCurrentChartId(chart.id);
      toast.success("Chart saved successfully!");
    } catch (error) {
      console.error("Failed to save chart:", error);
      toast.error("Failed to save chart");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadChart = async (id: string) => {
    try {
      const chart = await loadChart(id);
      if (chart) {
        loadChartIntoEditor(chart);
        toast.success("Chart loaded successfully!");
      }
    } catch (error) {
      console.error("Failed to load chart:", error);
      toast.error("Failed to load chart");
    }
  };

  const handleExportJson = () => {
    const chart = getCurrentChart();
    downloadChartAsJson(chart);
    toast.success("Chart exported as JSON");
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const chart = importChartFromJson(json);
        loadChartIntoEditor(chart);
        await saveChart(chart);
        toast.success("Chart imported successfully!");
      } catch (error) {
        console.error("Failed to import chart:", error);
        toast.error("Failed to import chart. Invalid format.");
      }
    };
    reader.readAsText(file);
    
    event.target.value = "";
  };

  const handleNewChart = () => {
    setCurrentChartId(null);
    setTitle("My Chord Chart");
    setDescription("");
    setChordsPerRow(4);
    setRows([createRow(0, 4)]);
    setRowSubtitles([""]);
    setStrummingPattern(null);
    toast.success("New chart created");
  };

  const handleChordsPerRowChange = (newCount: number) => {
    if (newCount < 1 || newCount > 5) return;
    setChordsPerRow(newCount);
    setRows(rows.map((row, rowIndex) => {
      const baseId = rowIndex * 5;
      if (row.length < newCount) {
        return [...row, ...Array.from({ length: newCount - row.length }, (_, i) => 
          createEmptyChord(`chord-${Date.now()}-${baseId + row.length + i}`)
        )];
      } else if (row.length > newCount) {
        return row.slice(0, newCount);
      }
      return row;
    }));
  };

  const addRow = () => {
    const nextId = rows.length * 5;
    setRows([...rows, createRow(nextId, chordsPerRow)]);
    setRowSubtitles([...rowSubtitles, ""]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
      setRowSubtitles(rowSubtitles.filter((_, i) => i !== index));
    }
  };

  const handleRowSubtitleChange = (index: number, value: string) => {
    const newSubtitles = [...rowSubtitles];
    newSubtitles[index] = value;
    setRowSubtitles(newSubtitles);
  };

  const handleSaveChord = (chord: ChordDiagram, rowIndex: number, chordIndex: number) => {
    const newRows = [...rows];
    newRows[rowIndex][chordIndex] = chord;
    setRows(newRows);
  };

  const hasEditedChords = rows.some((row) => row.some(isChordEdited));

  const state: ChartState = {
    currentChartId,
    title,
    description,
    chordsPerRow,
    rows,
    rowSubtitles,
    strummingPattern,
    isSaving,
  };

  const actions: ChartActions = {
    setTitle,
    setDescription,
    setStrummingPattern,
    handleNewChart,
    handleSave,
    handleLoadChart,
    handleExportJson,
    handleImportJson,
    handleChordsPerRowChange,
    addRow,
    removeRow,
    handleRowSubtitleChange,
    handleSaveChord,
    getCurrentChart,
    hasEditedChords,
  };

  return [state, actions];
}
