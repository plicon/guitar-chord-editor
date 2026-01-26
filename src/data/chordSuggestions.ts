// Chromatic scale notes with common chord variations
const chromaticNotes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'] as const;

const chordTypes = [
  '', // Major
  'm', // Minor
  '7',
  'm7',
  'maj7',
  'sus2',
  'sus4',
  'dim',
  'aug',
  'add9',
  '6',
  'm6',
  '9',
  'm9',
] as const;

// Generate all chord combinations
export const allChordSuggestions: string[] = chromaticNotes.flatMap(note =>
  chordTypes.map(type => `${note}${type}`)
);

// Filter suggestions based on input
export const filterChordSuggestions = (input: string): string[] => {
  if (!input.trim()) return [];
  
  const normalizedInput = input.toLowerCase();
  
  return allChordSuggestions.filter(chord => 
    chord.toLowerCase().startsWith(normalizedInput)
  ).slice(0, 12); // Limit to 12 suggestions
};
