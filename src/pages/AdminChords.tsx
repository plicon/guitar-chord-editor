import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Home, Save, Trash2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import type { ChordDiagram, FingerPosition, Barre, FingerLabel } from "../types/chord";
import { createEmptyChord } from "../types/chord";
import { ChordEditor } from "../components/ChordEditor";
import { filterChordSuggestions } from "@/data/chordSuggestions";
import { searchChordPresetsApi, createChordPresetApi, updateChordPresetApi, deleteChordPresetApi } from "@/services/presets/chordApi";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AppFooter } from "../components/AppFooter";

// Backend API response format (now matches frontend!)
interface ApiChordPreset {
  id: string;
  name: string;
  frets: number;
  fingers: FingerPosition[];
  barres: Barre[];
  mutedStrings: number[];
  openStrings: number[];
  fingerLabels: FingerLabel[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminChordsPage() {
  const { toast } = useToast();
  const [currentChord, setCurrentChord] = useState<ChordDiagram | null>(null);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [availablePresets, setAvailablePresets] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  // Update suggestions when search query changes
  useEffect(() => {
    let isMounted = true;

    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const filtered = filterChordSuggestions(searchQuery);
    setSuggestions(filtered);
    setSelectedIndex(0);
    setShowSuggestions(filtered.length > 0 && searchQuery.length > 0);

    // Check which suggestions have presets available
    const checkPresets = async () => {
      try {
        const response = await searchChordPresetsApi(searchQuery);
        const presetNames = new Set<string>(
          response.data.map((p: ApiChordPreset) => p.name.toLowerCase())
        );
        if (isMounted) {
          setAvailablePresets(presetNames);
        }
      } catch (error) {
        console.error("Failed to check presets:", error);
      }
    };

    if (filtered.length > 0 && searchQuery.length > 0) {
      checkPresets();
    }

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = async (suggestion: string) => {
    justSelectedRef.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery(suggestion);

    try {
      // Try to load preset from API
      const response = await searchChordPresetsApi(suggestion);
      const preset = response.data.find(
        (p: ApiChordPreset) => p.name.toLowerCase() === suggestion.toLowerCase()
      );

      if (preset) {
        const chord: ChordDiagram = {
          id: "current",
          name: preset.name,
          frets: preset.frets || 5,
          startFret: preset.startFret || 1,
          fingers: preset.fingers,
          barres: preset.barres,
          mutedStrings: preset.mutedStrings,
          openStrings: preset.openStrings,
          fingerLabels: preset.fingerLabels,
        };

        setCurrentChord(chord);
        setCurrentPresetId(preset.id);
        setEditorOpen(true);
      } else {
        // No preset found, create empty chord with this name
        const emptyChord = createEmptyChord("current");
        setCurrentChord({
          ...emptyChord,
          name: suggestion,
        });
        setCurrentPresetId(null);
        setEditorOpen(true);
      }
    } catch (error) {
      console.error("Failed to load preset:", error);
      toast({
        title: "Error",
        description: "Failed to load chord preset",
        variant: "destructive",
      });
    }
  };

  const handleNewChord = () => {
    setCurrentChord(createEmptyChord("current"));
    setCurrentPresetId(null);
    setSearchQuery("");
    setEditorOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedIndex]);
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const handleSaveChord = async (chord: ChordDiagram) => {
    if (!chord.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chord name",
        variant: "destructive",
      });
      return;
    }

    const chordData = {
      name: chord.name,
      frets: chord.frets,
      startFret: chord.startFret,
      fingers: chord.fingers,
      barres: chord.barres || [],
      mutedStrings: chord.mutedStrings || [],
      openStrings: chord.openStrings || [],
      fingerLabels: chord.fingerLabels || [],
    };

    try {
      if (currentPresetId) {
        // Update existing preset
        await updateChordPresetApi(currentPresetId, chordData);
        toast({
          title: "Success",
          description: `Updated ${chord.name} preset`,
        });
      } else {
        // Create new preset
        const newPreset = await createChordPresetApi(chordData);
        setCurrentPresetId(newPreset.id);
        toast({
          title: "Success",
          description: `Created ${chord.name} preset`,
        });
      }
      setEditorOpen(false);
      setSearchQuery(chord.name);
    } catch (error) {
      console.error("Failed to save preset:", error);
      toast({
        title: "Error",
        description: "Failed to save chord preset",
        variant: "destructive",
      });
    }
  };

  const handleDeletePreset = async () => {
    if (!currentPresetId || !currentChord) {
      toast({
        title: "Error",
        description: "No preset loaded to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the ${currentChord.name} preset?`)) {
      return;
    }

    try {
      await deleteChordPresetApi(currentPresetId);
      toast({
        title: "Success",
        description: `Deleted ${currentChord.name} preset`,
      });
      // Reset state
      setCurrentChord(null);
      setCurrentPresetId(null);
      setSearchQuery("");
      setEditorOpen(false);
    } catch (error) {
      console.error("Failed to delete preset:", error);
      toast({
        title: "Error",
        description: "Failed to delete chord preset",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-2">
            {/* Logo and title */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img
                src="/ms-icon-310x310.png"
                alt="Fretkit Logo"
                className="w-12 h-12 md:w-24 md:h-24 flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-lg md:text-4xl font-bold text-foreground truncate">
                  Fretkit
                </h1>
                <span className="hidden md:inline text-lg font-bold text-foreground">
                  {" "}- Admin Panel
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to App
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage chord presets
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Chord Preset Editor</h2>
          <Button onClick={handleNewChord}>
            <Plus className="w-4 h-4 mr-2" />
            New Chord
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Label htmlFor="chord-search" className="mb-2 block">
            Search Chord
          </Label>
          <div className="relative">
            <Input
              ref={inputRef}
              id="chord-search"
              type="text"
              placeholder="Type chord name (e.g., C, Am, G7...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              className="w-full"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                role="listbox"
              >
                {suggestions.map((suggestion, index) => {
                  const hasPreset = availablePresets.has(suggestion.toLowerCase());
                  return (
                    <div
                      key={suggestion}
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-accent flex justify-between items-center",
                        index === selectedIndex && "bg-accent"
                      )}
                      onClick={() => handleSuggestionClick(suggestion)}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <span>{suggestion}</span>
                      {!hasPreset && (
                        <span className="text-xs text-muted-foreground">(no preset)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Current Preset Info */}
        {currentChord && (
          <div className="space-y-4 mb-6">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">Current Chord</Label>
                  <div className="text-2xl font-bold">{currentChord.name || "(unnamed)"}</div>
                  {currentPresetId && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Preset ID: {currentPresetId}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setEditorOpen(true)} variant="outline">
                    Edit
                  </Button>
                  {currentPresetId && (
                    <Button onClick={handleDeletePreset} variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Preset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentChord && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Search for a chord above or click "New Chord" to start editing.</p>
          </div>
        )}
      </div>

      {/* Chord Editor Dialog */}
      {currentChord && (
        <ChordEditor
          chord={currentChord}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveChord}
        />
      )}

      <AppFooter className="mt-8" />
    </>
  );
}
