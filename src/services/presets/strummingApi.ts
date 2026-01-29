// API client for strumming pattern CRUD
// TODO: Add Cloudflare Access headers when authentication is enabled

const API_BASE = import.meta.env.VITE_API_URL;
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL;

export async function getStrummingPatterns({ admin = false } = {}) {
  const url = admin ? `${ADMIN_BASE}/presets/strumming` : `${API_BASE}/presets/strumming`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch patterns");
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse JSON. Response:", text);
    throw new Error("Invalid JSON response from server");
  }
}

export async function createStrummingPattern(data) {
  const res = await fetch(`${ADMIN_BASE}/presets/strumming`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create pattern");
  return await res.json();
}

export async function updateStrummingPattern(id, data) {
  const res = await fetch(`${ADMIN_BASE}/presets/strumming/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update pattern");
  return await res.json();
}

export async function deleteStrummingPattern(id) {
  const res = await fetch(`${ADMIN_BASE}/presets/strumming/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete pattern");
}
