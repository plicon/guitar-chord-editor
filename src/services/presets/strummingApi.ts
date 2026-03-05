// API client for strumming pattern CRUD

import { getAdminAuthHeaders } from "@/services/adminAuth";

const API_BASE = import.meta.env.VITE_API_URL || 'https://production.api.fretkit.io/api';
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL || API_BASE;

/**
 * Fetch all strumming patterns.
 * Always uses the public endpoint — the admin and public list endpoints
 * return identical data, so there is no reason to require auth for reads.
 */
export async function getStrummingPatterns() {
  const res = await fetch(`${API_BASE}/presets/strumming`);
  if (!res.ok) throw new Error("Failed to fetch patterns");
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse JSON. Response:", text);
    throw new Error("Invalid JSON response from server");
  }
}

export async function createStrummingPattern(data: Record<string, unknown>) {
  const res = await fetch(`${ADMIN_BASE}/admin/presets/strumming`, {
    method: "POST",
    headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create pattern");
  return await res.json();
}

export async function updateStrummingPattern(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${ADMIN_BASE}/admin/presets/strumming/${id}`, {
    method: "PUT",
    headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update pattern");
  return await res.json();
}

export async function deleteStrummingPattern(id: string) {
  const res = await fetch(`${ADMIN_BASE}/admin/presets/strumming/${id}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete pattern");
}
