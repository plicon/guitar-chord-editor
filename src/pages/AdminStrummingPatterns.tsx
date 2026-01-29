import { StrummingPatternDisplay } from "../components/StrummingPatternDisplay";
import { StrummingPatternEditor } from "../components/StrummingPatternEditor";
import { useState, useEffect } from "react";
import { useStrummingPatterns } from "../hooks/useStrummingPatterns";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Plus, Pencil, Trash2, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { getBeatLabel } from "../types/strumming";

// Convert backend StrummingPreset format to frontend StrummingPattern format
function transformPresetToPattern(preset: any) {
  // Backend returns: { id, name, description, pattern: {bars, timeSignature, subdivision, pattern: []} }
  // Frontend expects: { bars, beatsPerBar, timeSignature, subdivision, beats: [{stroke, noteValue, beatType}] }
  
  if (!preset || !preset.pattern) {
    console.error("Invalid preset structure:", preset);
    return null;
  }
  
  const { pattern } = preset;
  if (!pattern.timeSignature) {
    console.error("Missing timeSignature in pattern:", pattern);
    return null;
  }
  
  const beatsPerBar = pattern.timeSignature === "6/8" ? 6 : parseInt(pattern.timeSignature.split("/")[0]);
  
  return {
    bars: pattern.bars || 1,
    beatsPerBar,
    timeSignature: pattern.timeSignature,
    subdivision: pattern.subdivision || 4,
    beats: pattern.pattern.map((stroke: string | null, index: number) => ({
      stroke,
      noteValue: "full" as const,
      beatType: getBeatLabel(index, pattern.subdivision),
    })),
  };
}

// Convert frontend StrummingPattern format to backend StrummingPreset format
function transformPatternToPreset(pattern: any) {
  // Frontend has: { bars, beatsPerBar, timeSignature, subdivision, beats: [{stroke, noteValue, beatType}] }
  // Backend expects: { pattern: {bars, timeSignature, subdivision, pattern: [stroke values]} }
  return {
    pattern: {
      bars: pattern.bars,
      timeSignature: pattern.timeSignature,
      subdivision: pattern.subdivision,
      pattern: pattern.beats.map((beat: any) => beat.stroke),
    },
  };
}
// This page is for admin CRUD on strumming patterns
// It reuses display/editor components and toggles CRUD controls

export default function AdminStrummingPatternsPage() {
  const { patterns, createPattern, updatePattern, deletePattern } = useStrummingPatterns({ admin: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  useEffect(() => {
    // Debug: log patterns value and type
    // eslint-disable-next-line no-console
    console.log("patterns value:", patterns, Array.isArray(patterns));
  }, [patterns]);

  const handleStartEdit = (pattern: any) => {
    setEditingId(pattern.id);
    // Remove time signature from name (e.g., "Basic Down (4/4)" -> "Basic Down")
    const nameWithoutTiming = pattern.name.replace(/\s*\([^)]+\)\s*$/, '');
    setPresetName(nameWithoutTiming);
    setPresetDescription(pattern.description || "");
  };

  const handleStartCreate = () => {
    setCreating(true);
    setPresetName("");
    setPresetDescription("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCreating(false);
    setPresetName("");
    setPresetDescription("");
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
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to App
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage strumming pattern presets
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Strumming Patterns</h2>
          <Button onClick={handleStartCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add New Pattern
          </Button>
        </div>
      {creating && (
        <StrummingPatternEditor
          pattern={null}
          open={true}
          onClose={handleCancelEdit}
          onSave={async (patternData) => {
            if (!presetName.trim()) {
              alert("Please enter a pattern name");
              return;
            }
            // Auto-append time signature to name if not already present
            const nameWithTiming = presetName.includes('(') 
              ? presetName 
              : `${presetName} (${patternData.timeSignature})`;
            
            await createPattern({
              name: nameWithTiming,
              description: presetDescription,
              ...transformPatternToPreset(patternData),
            });
            handleCancelEdit();
          }}
          onDelete={() => {}}
          showMetadata={true}
          name={presetName}
          description={presetDescription}
          onNameChange={setPresetName}
          onDescriptionChange={setPresetDescription}
        />
      )}
      {Array.isArray(patterns) && patterns.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No strumming patterns found. Click "Add New Pattern" to create one.</p>
      ) : (
        <ul className="space-y-4">
          {patterns.map((pattern) => (
            <li key={pattern.id} className="border p-2 rounded">
              {editingId === pattern.id ? (
                <StrummingPatternEditor
                  pattern={transformPresetToPattern(pattern)}
                  open={true}
                  onClose={handleCancelEdit}
                  onSave={async (patternData) => {
                    if (!presetName.trim()) {
                      alert("Please enter a pattern name");
                      return;
                    }
                    // Auto-append time signature to name if not already present
                    const nameWithTiming = presetName.includes('(') 
                      ? presetName 
                      : `${presetName} (${patternData.timeSignature})`;
                    
                    await updatePattern(pattern.id, {
                      name: nameWithTiming,
                      description: presetDescription,
                      ...transformPatternToPreset(patternData),
                    });
                    handleCancelEdit();
                  }}
                  onDelete={() => {}}
                  showMetadata={true}
                  name={presetName}
                  description={presetDescription}
                  onNameChange={setPresetName}
                  onDescriptionChange={setPresetDescription}
                />
              ) : (
                <>
                  <div className="mb-2">
                    <h3 className="font-semibold">{pattern.name}</h3>
                    {pattern.description && (
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    )}
                  </div>
                  {transformPresetToPattern(pattern) && (
                    <StrummingPatternDisplay pattern={transformPresetToPattern(pattern)!} />
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStartEdit(pattern)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deletePattern(pattern.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>
    </>
  );
}
