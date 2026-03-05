/**
 * Tests for YouTube Import client-side utilities
 */
import { describe, it, expect } from 'vitest';
import { isValidYouTubeUrl } from '@/services/youtubeImport';

describe('isValidYouTubeUrl', () => {
  it('accepts standard watch URL', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts short URL', () => {
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts embed URL', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts shorts URL', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts /v/ URL format', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts URL with extra query params', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLx')).toBe(true);
  });

  it('accepts URL without https', () => {
    expect(isValidYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts URL without www', () => {
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isValidYouTubeUrl('  https://youtu.be/dQw4w9WgXcQ  ')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidYouTubeUrl('')).toBe(false);
  });

  it('rejects random URL', () => {
    expect(isValidYouTubeUrl('https://example.com/video')).toBe(false);
  });

  it('rejects partial YouTube URL', () => {
    expect(isValidYouTubeUrl('youtube.com')).toBe(false);
  });

  it('rejects URL with short video ID', () => {
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=abc')).toBe(false);
  });

  it('rejects plain text', () => {
    expect(isValidYouTubeUrl('not a url at all')).toBe(false);
  });
});
