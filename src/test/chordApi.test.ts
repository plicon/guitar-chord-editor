/**
 * Tests for chord preset API client
 *
 * Verifies that all endpoints construct the correct URLs,
 * especially that admin routes don't double the /admin/ path segment.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sessionStorage before importing modules that use it
const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
  },
  writable: true,
});

import {
  searchChordPresetsApi,
  getChordPresetApi,
  createChordPresetApi,
  updateChordPresetApi,
  deleteChordPresetApi,
} from '@/services/presets/chordApi';

/** Extract the pathname from a full URL string */
function urlPath(url: string): string {
  return new URL(url).pathname;
}

const okJson = (data: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

const notFoundResponse = () => ({
  ok: false,
  status: 404,
  json: () => Promise.resolve({ error: 'Not found' }),
  text: () => Promise.resolve('Not found'),
});

describe('chordApi URL construction', () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(okJson({ data: [] }));
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  // -- Public endpoints use /api/presets/... (no /admin/) --

  it('searchChordPresetsApi hits /api/presets/chords (no /admin/)', async () => {
    await searchChordPresetsApi('Am');
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/');
    expect(url).toContain('/api/presets/chords?search=Am');
  });

  it('getChordPresetApi hits /api/presets/chords/:id (no /admin/)', async () => {
    await getChordPresetApi('c-major-1');
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/');
    expect(url).toContain('/api/presets/chords/c-major-1');
  });

  it('getChordPresetApi returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(notFoundResponse());
    const result = await getChordPresetApi('nonexistent');
    expect(result).toBeNull();
  });

  // -- Admin endpoints: /api/admin/presets/... (never /admin/admin/) --

  it('createChordPresetApi does not double /admin/ in URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: '1', name: 'C' }));
    await createChordPresetApi({
      name: 'C',
      frets: 5,
      fingers: [{ string: 2, fret: 1, finger: 1 }],
    });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/admin/');
    expect(urlPath(url)).toMatch(/\/api\/admin\/presets\/chords$/);
  });

  it('createChordPresetApi sends POST with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: '1', name: 'C' }));
    const data = {
      name: 'C',
      frets: 5,
      fingers: [{ string: 2, fret: 1, finger: 1 }],
    };
    await createChordPresetApi(data);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });

  it('updateChordPresetApi does not double /admin/ in URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: 'abc', name: 'C' }));
    await updateChordPresetApi('abc', { name: 'Cm' });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/admin/');
    expect(urlPath(url)).toMatch(/\/api\/admin\/presets\/chords\/abc$/);
  });

  it('updateChordPresetApi sends PUT with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: 'abc', name: 'Cm' }));
    await updateChordPresetApi('abc', { name: 'Cm' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ name: 'Cm' });
  });

  it('deleteChordPresetApi does not double /admin/ in URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await deleteChordPresetApi('abc');

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/admin/');
    expect(urlPath(url)).toMatch(/\/api\/admin\/presets\/chords\/abc$/);
  });

  it('deleteChordPresetApi sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await deleteChordPresetApi('abc');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('DELETE');
  });

  it('deleteChordPresetApi does not throw on 404', async () => {
    mockFetch.mockResolvedValueOnce(notFoundResponse());
    await expect(deleteChordPresetApi('gone')).resolves.not.toThrow();
  });

  // -- Error handling --

  it('searchChordPresetsApi throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(searchChordPresetsApi('X')).rejects.toThrow('Failed to search chord presets');
  });

  it('createChordPresetApi throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(
      createChordPresetApi({ name: 'X', frets: 5, fingers: [] })
    ).rejects.toThrow('Failed to create chord preset');
  });

  it('updateChordPresetApi throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(
      updateChordPresetApi('abc', { name: 'X' })
    ).rejects.toThrow('Failed to update chord preset');
  });

  it('deleteChordPresetApi throws on non-404 error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(deleteChordPresetApi('abc')).rejects.toThrow('Failed to delete chord preset');
  });
});
