import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sessionStorage
const store: Record<string, string> = {};
const mockSessionStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true });

import { getAdminToken, setAdminToken, clearAdminToken, getAdminAuthHeaders } from '@/services/adminAuth';

describe('adminAuth', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    vi.clearAllMocks();
  });

  it('returns null when no token is stored', () => {
    expect(getAdminToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setAdminToken('test-token-123');
    expect(getAdminToken()).toBe('test-token-123');
  });

  it('clears token', () => {
    setAdminToken('test-token-123');
    clearAdminToken();
    expect(getAdminToken()).toBeNull();
  });

  it('returns empty headers when no token', () => {
    const headers = getAdminAuthHeaders();
    expect(headers.Authorization).toBeUndefined();
  });

  it('returns Bearer header when token is set', () => {
    setAdminToken('my-token');
    const headers = getAdminAuthHeaders();
    expect(headers.Authorization).toBe('Bearer my-token');
  });

  it('merges extra headers with auth header', () => {
    setAdminToken('my-token');
    const headers = getAdminAuthHeaders({ 'Content-Type': 'application/json' });
    expect(headers.Authorization).toBe('Bearer my-token');
    expect(headers['Content-Type']).toBe('application/json');
  });
});
