import { useState, useCallback } from "react";
import { ChordDiagram, createEmptyChord, isChordEdited } from "@/types/chord";
import { StrummingPattern, getSlotsPerBar } from "@/types/strumming";
import { sanitizeFilename } from "@/lib/utils";
import { 
  Song, 
  SongSection, 
  SectionRow,
  SectionType,
  createSong, 
  createSection,
  createChordRow,
  createTabRow 
} from "@/types/song";
import { createEmptyTabMeasure } from "@/types/tab";
import { toast } from "sonner";
import { getStorageProvider } from "@/services/storage";

const saveSong = async (song: Song) => {
  const provider = getStorageProvider();
  if (provider.saveSong) {
    await provider.saveSong(song);
  } else {
    // Fallback to localStorage if provider doesn't support songs
    localStorage.setItem(`song-${song.id}`, JSON.stringify(song));
  }
};

const loadSong = async (id: string): Promise<Song | null> => {
  const provider = getStorageProvider();
  if (provider.loadSong) {
    return await provider.loadSong(id);
  } else {
    // Fallback to localStorage
    const data = localStorage.getItem(`song-${id}`);
    return data ? JSON.parse(data) : null;
  }
};

const downloadSongAsJson = (song: Song) => {
  const dataStr = JSON.stringify(song, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  const exportFileDefaultName = `${sanitizeFilename(song.title || 'untitled-song')}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

const importSongFromJson = async (file: File): Promise<Song> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const song = JSON.parse(e.target?.result as string);
        resolve(song);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export interface SongState {
  currentSongId: string | null;
  title: string;
  artist: string;
  description: string;
  key: string;
  tempo: number | undefined;
  timeSignature: string;
  sections: SongSection[];
  strummingPattern: StrummingPattern | null;
  isSaving: boolean;
}

export interface SongActions {
  setTitle: (title: string) => void;
  setArtist: (artist: string) => void;
  setDescription: (description: string) => void;
  setKey: (key: string) => void;
  setTempo: (tempo: number | undefined) => void;
  setTimeSignature: (timeSignature: string) => void;
  setStrummingPattern: (pattern: StrummingPattern | null) => void;
  
  // Section management
  addSection: (type: SectionType, name?: string, index?: number) => void;
  removeSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<SongSection>) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  toggleSectionCollapsed: (sectionId: string) => void;
  
  // Row management within sections
  addRowToSection: (sectionId: string, rowType: 'chord-row' | 'tab-row', chordsPerRow?: number) => void;
  removeRowFromSection: (sectionId: string, rowId: string) => void;
  updateRowInSection: (sectionId: string, rowId: string, updates: Partial<SectionRow>) => void;
  moveRowInSection: (sectionId: string, fromIndex: number, toIndex: number) => void;
  
  // Chord management
  updateChord: (sectionId: string, rowId: string, chordIndex: number, chord: ChordDiagram) => void;
  addChordToRow: (sectionId: string, rowId: string) => void;
  removeChordFromRow: (sectionId: string, rowId: string) => void;
  reorderChordsInRow: (sectionId: string, rowId: string, fromIndex: number, toIndex: number) => void;
  duplicateChordInRow: (sectionId: string, rowId: string, chordIndex: number) => void;
  
  // File operations
  handleNewSong: () => void;
  handleSave: () => Promise<void>;
  handleLoadSong: (id: string) => Promise<void>;
  handleExportJson: () => void;
  handleImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  getCurrentSong: () => Song;
  hasEditedContent: boolean;
}

export function useSongState(): [SongState, SongActions] {
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [title, setTitle] = useState("My Song");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [tempo, setTempo] = useState<number | undefined>(undefined);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [sections, setSections] = useState<SongSection[]>([]);
  const [strummingPattern, setStrummingPattern] = useState<StrummingPattern | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getCurrentSong = useCallback((): Song => {
    const song: Song = {
      id: currentSongId || `song-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      title,
      artist: artist || undefined,
      description: description || undefined,
      key: key || undefined,
      tempo,
      timeSignature: timeSignature || undefined,
      sections,
      strummingPattern,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return song;
  }, [currentSongId, title, artist, description, key, tempo, timeSignature, sections, strummingPattern]);

  const loadSongIntoEditor = useCallback((song: Song) => {
    setCurrentSongId(song.id);
    setTitle(song.title);
    setArtist(song.artist || "");
    setDescription(song.description || "");
    setKey(song.key || "");
    setTempo(song.tempo);
    setTimeSignature(song.timeSignature || "4/4");
    setSections(song.sections);
    setStrummingPattern(song.strummingPattern || null);
  }, []);

  const handleNewSong = useCallback(() => {
    const newSong = createSong();
    // Add an initial verse section with one row
    const initialSection = createSection('verse', 'Verse 1');
    const emptyChords = Array.from({ length: 4 }, (_, i) => 
      createEmptyChord(`chord-${Date.now()}-${i}`)
    );
    initialSection.rows = [createChordRow(emptyChords)];
    newSong.sections = [initialSection];
    
    loadSongIntoEditor(newSong);
  }, [loadSongIntoEditor]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const song = getCurrentSong();
      await saveSong(song);
      setCurrentSongId(song.id);
      toast.success("Song saved successfully!");
    } catch (error) {
      console.error("Failed to save song:", error);
      toast.error("Failed to save song");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSong = async (id: string) => {
    try {
      const song = await loadSong(id);
      if (song) {
        loadSongIntoEditor(song);
        toast.success("Song loaded successfully!");
      }
    } catch (error) {
      console.error("Failed to load song:", error);
      toast.error("Failed to load song");
    }
  };

  const handleExportJson = useCallback(() => {
    const song = getCurrentSong();
    downloadSongAsJson(song);
  }, [getCurrentSong]);

  const handleImportJson = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const song = await importSongFromJson(file);
      loadSongIntoEditor(song);
      toast.success("Song imported successfully!");
    } catch (error) {
      console.error("Failed to import song:", error);
      toast.error("Failed to import song");
    }
  }, [loadSongIntoEditor]);

  // Section management
  const addSection = useCallback((type: SectionType, name?: string, index?: number) => {
    const newSection = createSection(type, name);
    setSections(prev => {
      const newSections = [...prev];
      if (index !== undefined && index >= 0 && index <= prev.length) {
        newSections.splice(index, 0, newSection);
      } else {
        newSections.push(newSection);
      }
      return newSections;
    });
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<SongSection>) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  }, []);

  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    setSections(prev => {
      const newSections = [...prev];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      return newSections;
    });
  }, []);

  const toggleSectionCollapsed = useCallback((sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    ));
  }, []);

  // Row management
  const addRowToSection = useCallback((sectionId: string, rowType: 'chord-row' | 'tab-row' = 'chord-row', chordsPerRow: number = 4) => {
    let newRow;

    if (rowType === 'tab-row') {
      const columns = strummingPattern
        ? getSlotsPerBar(strummingPattern.timeSignature, strummingPattern.subdivision)
        : 8;
      newRow = createTabRow([createEmptyTabMeasure(columns)]);
    } else {
      const emptyChords = Array.from({ length: chordsPerRow }, (_, i) => 
        createEmptyChord(`chord-${Date.now()}-${i}`)
      );
      newRow = createChordRow(emptyChords);
    }
    
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, rows: [...section.rows, newRow] }
        : section
    ));
  }, [strummingPattern]);

  const removeRowFromSection = useCallback((sectionId: string, rowId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, rows: section.rows.filter(r => r.id !== rowId) }
        : section
    ));
  }, []);

  const updateRowInSection = useCallback((sectionId: string, rowId: string, updates: Partial<SectionRow>) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map(row => {
              if (row.id !== rowId) return row;
              
              // Type-safe update based on row kind
              if (row.kind === 'chord-row' && updates.kind === 'chord-row') {
                return { ...row, ...updates };
              } else if (row.kind === 'tab-row' && updates.kind === 'tab-row') {
                return { ...row, ...updates };
              } else if (!updates.kind) {
                // Allow updating common properties like subtitle
                return { ...row, ...updates } as SectionRow;
              }
              return row;
            }),
          }
        : section
    ));
  }, []);

  const moveRowInSection = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      const newRows = [...section.rows];
      const [moved] = newRows.splice(fromIndex, 1);
      newRows.splice(toIndex, 0, moved);
      return { ...section, rows: newRows };
    }));
  }, []);

  const updateChord = useCallback((sectionId: string, rowId: string, chordIndex: number, chord: ChordDiagram) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        rows: section.rows.map(row => {
          if (row.id !== rowId || row.kind !== 'chord-row') return row;
          
          const newChords = [...row.chords];
          newChords[chordIndex] = chord;
          return { ...row, chords: newChords };
        }),
      };
    }));
  }, []);

  const addChordToRow = useCallback((sectionId: string, rowId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        rows: section.rows.map(row => {
          if (row.id !== rowId || row.kind !== 'chord-row') return row;
          if (row.chords.length >= 5) return row; // Max 5 chords
          
          const newChord = createEmptyChord(`chord-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
          return { ...row, chords: [...row.chords, newChord] };
        }),
      };
    }));
  }, []);

  const removeChordFromRow = useCallback((sectionId: string, rowId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        rows: section.rows.map(row => {
          if (row.id !== rowId || row.kind !== 'chord-row') return row;
          if (row.chords.length <= 1) return row; // Min 1 chord
          
          // Remove the last chord
          return { ...row, chords: row.chords.slice(0, -1) };
        }),
      };
    }));
  }, []);

  const reorderChordsInRow = useCallback((sectionId: string, rowId: string, fromIndex: number, toIndex: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        rows: section.rows.map(row => {
          if (row.id !== rowId || row.kind !== 'chord-row') return row;
          const newChords = [...row.chords];
          const [removed] = newChords.splice(fromIndex, 1);
          newChords.splice(toIndex, 0, removed);
          return { ...row, chords: newChords };
        }),
      };
    }));
  }, []);

  const duplicateChordInRow = useCallback((sectionId: string, rowId: string, chordIndex: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        rows: section.rows.map(row => {
          if (row.id !== rowId || row.kind !== 'chord-row') return row;
          const source = row.chords[chordIndex];
          const duplicate = { ...source, id: `chord-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` };
          const newChords = [...row.chords];

          // Prefer replacing an empty slot after the source chord, then before it
          const emptyAfter = newChords.findIndex((c, i) => i > chordIndex && !isChordEdited(c));
          const emptyBefore = emptyAfter === -1 ? newChords.findIndex((c, i) => i < chordIndex && !isChordEdited(c)) : -1;
          const emptyIndex = emptyAfter !== -1 ? emptyAfter : emptyBefore;

          if (emptyIndex !== -1) {
            newChords[emptyIndex] = duplicate;
          } else if (newChords.length < 5) {
            newChords.splice(chordIndex + 1, 0, duplicate);
          }
          // else: row is full with all edited chords — button should not be visible

          return { ...row, chords: newChords };
        }),
      };
    }));
  }, []);

  const hasEditedContent = sections.some(section =>
    section.rows.some(row => {
      if (row.kind === 'chord-row') {
        return row.chords.some(isChordEdited);
      }
      if (row.kind === 'tab-row') {
        return true; // Tab rows are always considered edited content
      }
      return false;
    })
  );

  const state: SongState = {
    currentSongId,
    title,
    artist,
    description,
    key,
    tempo,
    timeSignature,
    sections,
    strummingPattern,
    isSaving,
  };

  const actions: SongActions = {
    setTitle,
    setArtist,
    setDescription,
    setKey,
    setTempo,
    setTimeSignature,
    setStrummingPattern,
    addSection,
    removeSection,
    updateSection,
    moveSection,
    toggleSectionCollapsed,
    addRowToSection,
    removeRowFromSection,
    updateRowInSection,
    moveRowInSection,
    updateChord,
    addChordToRow,
    removeChordFromRow,
    reorderChordsInRow,
    duplicateChordInRow,
    handleNewSong,
    handleSave,
    handleLoadSong,
    handleExportJson,
    handleImportJson,
    getCurrentSong,
    hasEditedContent,
  };

  return [state, actions];
}
