import { StrummingPatternDisplay } from "../components/StrummingPatternDisplay";
import { StrummingPatternEditor } from "../components/StrummingPatternEditor";
import { useState, useEffect } from "react";
import { useStrummingPatterns } from "../hooks/useStrummingPatterns";
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
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin: Strumming Patterns</h1>
      <button className="mb-4 btn btn-primary" onClick={handleStartCreate}>
        Add New Pattern
      </button>
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
                    <button className="btn btn-secondary" onClick={() => handleStartEdit(pattern)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => deletePattern(pattern.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
