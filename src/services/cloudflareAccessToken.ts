// Cloudflare Access Service Token fetcher for frontend (development only)
// DO NOT expose secrets in production builds!

const ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;
const ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;
const ACCESS_AUD = import.meta.env.VITE_CF_ACCESS_AUD || ""; // Optional: set your AUD claim if needed
const ACCESS_TOKEN_URL = "https://" + ACCESS_CLIENT_ID.split(".")[0] + ".cloudflareaccess.com/cdn-cgi/access/service/token";

let cachedToken = null;
let cachedExpiry = 0;

export async function getCloudflareAccessToken() {
  const now = Date.now() / 1000;
  if (cachedToken && cachedExpiry - now > 60) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("client_id", ACCESS_CLIENT_ID);
  params.append("client_secret", ACCESS_CLIENT_SECRET);
  if (ACCESS_AUD) params.append("aud", ACCESS_AUD);

  const res = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Failed to fetch Cloudflare Access token");
  const data = await res.json();
  cachedToken = data.token;
  cachedExpiry = data.expires_at;
  return cachedToken;
}
