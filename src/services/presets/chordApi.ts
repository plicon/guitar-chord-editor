// API client for chord preset CRUD

import type { FingerPosition, Barre, FingerLabel } from "@/types/chord";

const API_BASE = import.meta.env.VITE_API_URL;
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL;
const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

// Helper to get Cloudflare Access headers for admin endpoints
function getAdminHeaders(extraHeaders = {}) {
  return {
    "CF-Access-Client-Id": CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": CF_ACCESS_CLIENT_SECRET,
    ...extraHeaders,
  };
}

export async function searchChordPresetsApi(query: string) {
  const url = `${API_BASE}/presets/chords?search=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search chord presets");
  return await res.json();
}

export async function getChordPresetApi(id: string) {
  const url = `${ADMIN_BASE}/presets/chords/${id}`;
  const res = await fetch(url, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch chord preset");
  }
  return await res.json();
}

export async function createChordPresetApi(data: {
  name: string;
  frets: number;
  fingers: FingerPosition[];
  barres?: Barre[];
  mutedStrings?: number[];
  openStrings?: number[];
  fingerLabels?: FingerLabel[];
}) {
  const res = await fetch(`${ADMIN_BASE}/presets/chords`, {
    method: "POST",
    headers: getAdminHeaders({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create chord preset");
  return await res.json();
}

export async function updateChordPresetApi(
  id: string,
  data: {
    name?: string;
    frets?: number;
    fingers?: FingerPosition[];
    barres?: Barre[];
    mutedStrings?: number[];
    openStrings?: number[];
    fingerLabels?: FingerLabel[];
  }
) {
  const res = await fetch(`${ADMIN_BASE}/presets/chords/${id}`, {
    method: "PUT",
    headers: getAdminHeaders({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update chord preset");
  return await res.json();
}

export async function deleteChordPresetApi(id: string) {
  const res = await fetch(`${ADMIN_BASE}/presets/chords/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
    credentials: "include",
  });
  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to delete chord preset");
  }
}
