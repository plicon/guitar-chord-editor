// API client for chord preset CRUD

import type { FingerPosition, Barre, FingerLabel } from "@/types/chord";
import { getAdminAuthHeaders } from "@/services/adminAuth";

const API_BASE = import.meta.env.VITE_API_URL || 'https://production.api.fretkit.io/api';
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL || `${API_BASE}/admin`;

export async function searchChordPresetsApi(query: string) {
  const url = `${API_BASE}/presets/chords?search=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search chord presets");
  return await res.json();
}

export async function getChordPresetApi(id: string) {
  const url = `${API_BASE}/presets/chords/${id}`;
  const res = await fetch(url);
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
    headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
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
    headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update chord preset");
  return await res.json();
}

export async function deleteChordPresetApi(id: string) {
  const res = await fetch(`${ADMIN_BASE}/presets/chords/${id}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to delete chord preset");
  }
}
