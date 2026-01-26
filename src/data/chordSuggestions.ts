// Chromatic scale notes
const baseNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

// Sharp notes with proper Unicode symbol only
const sharpNotes = ['C♯', 'D♯', 'F♯', 'G♯', 'A♯'];

// Flat notes with proper Unicode symbol only
const flatNotes = ['D♭', 'E♭', 'G♭', 'A♭', 'B♭'];

// All root notes (no duplicates - using proper symbols only)
const allRootNotes = [
  ...baseNotes,
  ...sharpNotes,
  ...flatNotes,
];

// Chord types with both shorthand and full names for minor
const chordTypes = [
  { short: '', full: '' }, // Major
  { short: 'm', full: ' minor' }, // Minor - both formats
  { short: '5', full: '5' }, // Power chord
  { short: '7', full: '7' },
  { short: 'm7', full: ' minor 7' },
  { short: 'maj7', full: 'maj7' },
  { short: 'sus2', full: 'sus2' },
  { short: 'sus4', full: 'sus4' },
  { short: 'dim', full: 'dim' },
  { short: 'aug', full: 'aug' },
  { short: 'add9', full: 'add9' },
  { short: '6', full: '6' },
  { short: 'm6', full: ' minor 6' },
  { short: '9', full: '9' },
  { short: 'm9', full: ' minor 9' },
] as const;

// Generate all chord combinations with both formats
export const allChordSuggestions: string[] = [];

allRootNotes.forEach(note => {
  chordTypes.forEach(type => {
    // Add short format (e.g., "Bm")
    allChordSuggestions.push(`${note}${type.short}`);
    
    // Add full format for minor chords (e.g., "B minor")
    if (type.full !== type.short && type.full !== '') {
      allChordSuggestions.push(`${note}${type.full}`);
    }
  });
});

// Normalize input for matching (handles various flat/sharp representations)
const normalizeForSearch = (str: string): string => {
  return str
    .toLowerCase()
    // Normalize sharps: # → ♯
    .replace(/#/g, '♯')
    // Normalize flats: b after a letter → ♭ (but not words like "minor")
    .replace(/([a-g])b(?![a-z])/gi, '$1♭')
    // Also handle explicit flat text
    .replace(/flat/gi, '♭')
    .replace(/sharp/gi, '♯')
    .replace(/\s+/g, ' ')
    .trim();
};

// Filter suggestions based on input
export const filterChordSuggestions = (input: string): string[] => {
  if (!input.trim()) return [];
  
  const normalizedInput = normalizeForSearch(input);
  
  // Find matches - prioritize exact prefix matches
  const matches = allChordSuggestions.filter(chord => {
    const normalizedChord = normalizeForSearch(chord);
    return normalizedChord.startsWith(normalizedInput);
  });
  
  // Sort to show shorter/simpler chords first, then alphabetically
  matches.sort((a, b) => {
    const aLen = a.length;
    const bLen = b.length;
    if (aLen !== bLen) return aLen - bLen;
    return a.localeCompare(b);
  });
  
  return matches.slice(0, 12); // Limit to 12 suggestions
};
