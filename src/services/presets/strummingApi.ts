// API client for strumming pattern CRUD

const API_BASE = import.meta.env.VITE_API_URL;
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL;
const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

// Helper to get Cloudflare Access headers for admin endpoints
function getAdminHeaders(extraHeaders = {}) {
  // Debug: log if credentials are available
  if (!CF_ACCESS_CLIENT_ID || !CF_ACCESS_CLIENT_SECRET) {
    console.error("Missing Cloudflare Access credentials:", {
      hasClientId: !!CF_ACCESS_CLIENT_ID,
      hasClientSecret: !!CF_ACCESS_CLIENT_SECRET,
      clientIdLength: CF_ACCESS_CLIENT_ID?.length,
      secretLength: CF_ACCESS_CLIENT_SECRET?.length,
    });
  }
  
  return {
    "CF-Access-Client-Id": CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": CF_ACCESS_CLIENT_SECRET,
    ...extraHeaders,
  };
}

export async function getStrummingPatterns({ admin = false } = {}) {
  const url = admin ? `${ADMIN_BASE}/presets/strumming` : `${API_BASE}/presets/strumming`;
  const options = admin 
    ? { credentials: "include", headers: getAdminHeaders() }
    : { credentials: "include" };
  
  // Debug: log connection details
  console.log("Fetching strumming patterns:", {
    url,
    admin,
    hasClientId: !!CF_ACCESS_CLIENT_ID,
    hasClientSecret: !!CF_ACCESS_CLIENT_SECRET,
    clientIdPreview: CF_ACCESS_CLIENT_ID?.substring(0, 10) + "...",
    headers: admin ? Object.keys(options.headers) : [],
  });
  
  const res = await fetch(url, options);
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
    headers: getAdminHeaders({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create pattern");
  return await res.json();
}

export async function updateStrummingPattern(id, data) {
  const res = await fetch(`${ADMIN_BASE}/presets/strumming/${id}`, {
    method: "PUT",
    headers: getAdminHeaders({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update pattern");
  return await res.json();
}

export async function deleteStrummingPattern(id) {
  const res = await fetch(`${ADMIN_BASE}/presets/strumming/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete pattern");
}
