/**
 * Tests for strumming pattern API client
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
  getStrummingPatterns,
  createStrummingPattern,
  updateStrummingPattern,
  deleteStrummingPattern,
} from '@/services/presets/strummingApi';

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

describe('strummingApi URL construction', () => {
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

  // -- Public endpoint --

  it('getStrummingPatterns hits /api/presets/strumming (no /admin/)', async () => {
    await getStrummingPatterns();
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/');
    expect(url).toContain('/api/presets/strumming');
  });

  // -- Admin endpoints --

  it('createStrummingPattern does not double /admin/ in URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: '1' }));
    await createStrummingPattern({ name: 'D DU UDU' });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/admin/');
    expect(urlPath(url)).toMatch(/\/api\/admin\/presets\/strumming$/);
  });

  it('createStrummingPattern sends POST with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: '1' }));
    const data = { name: 'D DU UDU', timeSignature: '4/4' };
    await createStrummingPattern(data);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });

  it('updateStrummingPattern does not double /admin/ in URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: 'abc' }));
    await updateStrummingPattern('abc', { name: 'DU DU' });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/admin/');
    expect(urlPath(url)).toMatch(/\/api\/admin\/presets\/strumming\/abc$/);
  });

  it('updateStrummingPattern sends PUT with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: 'abc' }));
    await updateStrummingPattern('abc', { name: 'DU DU' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ name: 'DU DU' });
  });

  it('deleteStrummingPattern does not double /admin/ in URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await deleteStrummingPattern('abc');

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('/admin/admin/');
    expect(urlPath(url)).toMatch(/\/api\/admin\/presets\/strumming\/abc$/);
  });

  it('deleteStrummingPattern sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await deleteStrummingPattern('abc');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('DELETE');
  });

  // -- Error handling --

  it('getStrummingPatterns throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getStrummingPatterns()).rejects.toThrow('Failed to fetch patterns');
  });

  it('createStrummingPattern throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(createStrummingPattern({})).rejects.toThrow('Failed to create pattern');
  });

  it('updateStrummingPattern throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(updateStrummingPattern('abc', {})).rejects.toThrow('Failed to update pattern');
  });

  it('deleteStrummingPattern throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(deleteStrummingPattern('abc')).rejects.toThrow('Failed to delete pattern');
  });
});
