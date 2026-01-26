// Chromatic scale notes with multiple notation formats
const baseNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

// Sharp and flat variations (both ASCII and proper symbols)
const sharpNotes = [
  { note: 'C#', alt: 'C♯' },
  { note: 'D#', alt: 'D♯' },
  { note: 'F#', alt: 'F♯' },
  { note: 'G#', alt: 'G♯' },
  { note: 'A#', alt: 'A♯' },
];

const flatNotes = [
  { note: 'Db', alt: 'D♭' },
  { note: 'Eb', alt: 'E♭' },
  { note: 'Gb', alt: 'G♭' },
  { note: 'Ab', alt: 'A♭' },
  { note: 'Bb', alt: 'B♭' },
];

// All root notes including enharmonic equivalents
const allRootNotes = [
  ...baseNotes,
  ...sharpNotes.flatMap(s => [s.note, s.alt]),
  ...flatNotes.flatMap(f => [f.note, f.alt]),
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

// Remove duplicates
const uniqueChords = [...new Set(allChordSuggestions)];

// Normalize input for matching (handles various flat/sharp representations)
const normalizeForSearch = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/\s+/g, ' ')
    .trim();
};

// Filter suggestions based on input
export const filterChordSuggestions = (input: string): string[] => {
  if (!input.trim()) return [];
  
  const normalizedInput = normalizeForSearch(input);
  
  // Find matches - prioritize exact prefix matches
  const matches = uniqueChords.filter(chord => {
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
