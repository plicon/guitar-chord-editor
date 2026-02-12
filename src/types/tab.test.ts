import { describe, it, expect } from 'vitest';
import { 
  createEmptyTabNote, 
  createEmptyTabColumn, 
  createEmptyTabMeasure,
  isValidFret,
  TAB_STRING_NAMES
} from '@/types/tab';

describe('Tab Types', () => {
  describe('createEmptyTabNote', () => {
    it('should create a tab note with null fret', () => {
      const note = createEmptyTabNote();
      expect(note.fret).toBeNull();
      expect(note.technique).toBeUndefined();
    });
  });

  describe('createEmptyTabColumn', () => {
    it('should create a column with 6 empty strings', () => {
      const column = createEmptyTabColumn();
      expect(column.strings).toHaveLength(6);
      column.strings.forEach(note => {
        expect(note.fret).toBeNull();
      });
    });
  });

  describe('createEmptyTabMeasure', () => {
    it('should create a measure with default 8 columns', () => {
      const measure = createEmptyTabMeasure();
      expect(measure.id).toBeDefined();
      expect(measure.columns).toHaveLength(8);
      expect(measure.timeSignature).toBe('4/4');
    });

    it('should create a measure with custom column count', () => {
      const measure = createEmptyTabMeasure(12);
      expect(measure.columns).toHaveLength(12);
    });
  });

  describe('isValidFret', () => {
    it('should accept null fret', () => {
      expect(isValidFret(null)).toBe(true);
    });

    it('should accept frets from 0 to 24', () => {
      expect(isValidFret(0)).toBe(true);
      expect(isValidFret(12)).toBe(true);
      expect(isValidFret(24)).toBe(true);
    });

    it('should reject frets outside valid range', () => {
      expect(isValidFret(-1)).toBe(false);
      expect(isValidFret(25)).toBe(false);
      expect(isValidFret(100)).toBe(false);
    });
  });

  describe('TAB_STRING_NAMES', () => {
    it('should have 6 string names from high to low', () => {
      expect(TAB_STRING_NAMES).toEqual(['e', 'B', 'G', 'D', 'A', 'E']);
    });
  });
});
