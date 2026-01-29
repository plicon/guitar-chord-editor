# Cloudflare Access Setup for FretKit API

This guide shows how to protect your Worker API using Cloudflare Access with Service Tokens. This is better than manual API keys because Cloudflare manages authentication, rotation, and auditing for you.

## Overview

- **Read operations** (GET) → Public (no authentication)
- **Write operations** (POST, PUT, DELETE) → Protected by Cloudflare Access
- Service Tokens allow your frontend to authenticate without user interaction

## Step 1: Enable Cloudflare Zero Trust (One-Time Setup)

1. Go to [https://one.dash.cloudflare.com/](https://one.dash.cloudflare.com/)
2. Sign in with your Cloudflare account
3. Select your account
4. This enables Zero Trust (free tier available - 50 users included)

## Step 2: Create a Service Token

Service Tokens are for service-to-service authentication (your frontend → your Worker).

1. In Zero Trust dashboard, go to **Access** → **Service Auth** → **Service Tokens**
2. Click **Create Service Token**
3. Name it: `FretKit Frontend` (or similar)
4. Click **Generate token**
5. **IMPORTANT**: Copy both values immediately (you can't retrieve the secret later):
   - `Client ID`: e.g., `a1b2c3d4e5f6g7h8.access`
   - `Client Secret`: e.g., `abc123def456...`
6. Click **Save**

## Step 3: Create an Access Application for Your Worker

This creates a policy that protects your Worker endpoints.

### 3.1 Create Application

1. In Zero Trust dashboard, go to **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**
4. Configure the application:

**Application Configuration:**
- **Application name**: `FretKit Worker - Production` (or staging/dev)
- **Session Duration**: `24 hours` (how long tokens stay valid)
- **Application domain**: Select your worker domain
  - Domain: `fretkit-worker-production.patrick-407.workers.dev`
  - Path: `/api/admin/charts` (this protects only write operations)

Click **Next**

### 3.2 Add Policy

Create a policy that allows your Service Token:

**Policy Configuration:**
- **Policy name**: `Allow FretKit Frontend`
- **Action**: `Allow`
- **Session duration**: `24 hours`

**Include Rules:**
- **Selector**: `Service Auth`
- **Value**: Select `FretKit Frontend` (the service token you created)

Click **Next**, then **Add application**

### 3.3 Optional: Add Multiple Paths (Protect All Write Operations)

If you want granular control:

1. Edit the application
2. Under **Configure**, add more paths:
   - `/api/admin/charts` (already added)
   - Or use `/api/admin/*` to protect all admin endpoints

**Better approach**: Create separate applications:
- **Application 1**: Protect `/api/admin/*` for write operations
- **Application 2**: Leave `/api/*` public for reads

Unfortunately, Cloudflare Access doesn't support method-based rules directly. See "Hybrid Approach" below.

## Step 4: Configure Your Frontend

Add the Service Token credentials to your frontend environment **only if you plan to call admin write endpoints directly from the frontend**:

```bash
# .env.local (development)
VITE_API_URL=https://fretkit-worker-production.patrick-407.workers.dev/api
VITE_CF_ACCESS_CLIENT_ID=a1b2c3d4e5f6g7h8.access
VITE_CF_ACCESS_CLIENT_SECRET=abc123def456...
```

**Security Note**: These secrets will be exposed in the browser. That's okay for Service Tokens (they're meant for service-to-service auth). The token only allows access to your specific Worker, and you can revoke it anytime.

For production builds deployed to Cloudflare Pages:
1. Go to **Pages** → **Your site** → **Settings** → **Environment variables**
2. Add for Production environment:
   - `VITE_CF_ACCESS_CLIENT_ID` = (your client ID)
   - `VITE_CF_ACCESS_CLIENT_SECRET` = (your client secret)

## Step 5: Update Frontend Code to Include Access Headers

Modify your API client to include Cloudflare Access headers:

```typescript
// src/services/api/client.ts (or similar)
const cfAccessClientId = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;
const cfAccessClientSecret = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Cloudflare Access headers for write operations
  if (cfAccessClientId && cfAccessClientSecret) {
    headers['CF-Access-Client-Id'] = cfAccessClientId;
    headers['CF-Access-Client-Secret'] = cfAccessClientSecret;
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Usage (write operations)
await apiRequest('/admin/charts', {
  method: 'POST',
  body: JSON.stringify(chartData),
});
```

## Step 6: Test the Setup

### Test without credentials (should fail):
```bash
curl -X POST https://fretkit-worker-production.patrick-407.workers.dev/api/admin/charts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","chords":[]}'
```

Expected: **403 Forbidden** or redirect to Cloudflare Access login page

### Test with credentials (should succeed):
```bash
curl -X POST https://fretkit-worker-production.patrick-407.workers.dev/api/admin/charts \
  -H "Content-Type: application/json" \
  -H "CF-Access-Client-Id: YOUR_CLIENT_ID" \
  -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
  -d '{"title":"Test","chords":[]}'
```

Expected: **201 Created** with chart data

### Test public reads (should always work):
```bash
curl https://fretkit-worker-production.patrick-407.workers.dev/api/presets/chords
```

Expected: **200 OK** with chord presets (public endpoint)

## Hybrid Approach: Method-Based Protection

Since Cloudflare Access protects entire paths (not specific HTTP methods), here's a hybrid approach:

### Option A: Separate Paths for Write Operations

Refactor your API to have separate paths:
- **Public**: `GET /api/charts` → List all charts
- **Protected**: `POST /api/admin/charts` → Create chart
- **Protected**: `PUT /api/admin/charts/:id` → Update chart
- **Protected**: `DELETE /api/admin/charts/:id` → Delete chart

Then protect only `/api/admin/*` with Cloudflare Access.

### Option B: Use Worker Code + Cloudflare Access Together

1. **Don't protect the Worker** with Cloudflare Access at the application level
2. **In your Worker code**, check for Cloudflare Access headers on write operations
3. Validate the token using Cloudflare's Access API

This gives you method-level control but requires coding:

```typescript
// In your worker (not yet implemented)
async function isAuthorizedViaCloudflareAccess(request: Request): Promise<boolean> {
  const clientId = request.headers.get('CF-Access-Client-Id');
  const clientSecret = request.headers.get('CF-Access-Client-Secret');
  
  if (!clientId || !clientSecret) {
    return false;
  }
  
  // Validate with Cloudflare Access API
  // (requires additional implementation)
  return true;
}
```

### Option C: Recommended Simple Approach

For your use case (protecting chart writes), I recommend:

1. **Protect** `/api/admin/*` with Cloudflare Access
2. **Keep** `/api/charts` public for reads
3. **Keep** `/api/presets/*` and `/api/docs` public

## Managing Service Tokens

### View Active Tokens
Go to Zero Trust → **Access** → **Service Auth** → **Service Tokens**

### Revoke a Token
Click the **...** menu next to a token → **Revoke**

### Rotate Tokens
1. Create a new Service Token
2. Update frontend environment variables
3. Deploy new frontend
4. Revoke old token after confirming new one works

### Monitor Usage
Go to Zero Trust → **Logs** → **Access** to see all authentication attempts

## Per-Environment Setup

Set up separate Access Applications for each environment:

1. **Development**: `fretkit-worker.patrick-407.workers.dev`
   - Service Token: `FretKit Frontend - Dev`
   - Less restrictive policies for testing

2. **Staging**: `fretkit-worker-staging.patrick-407.workers.dev`
   - Service Token: `FretKit Frontend - Staging`
   - Same policies as production

3. **Production**: `fretkit-worker-production.patrick-407.workers.dev`
   - Service Token: `FretKit Frontend - Production`
   - Strict policies, monitored closely

Store different tokens in different Cloudflare Pages environment variables.

## Advantages Over Manual API Keys

✅ **Managed by Cloudflare**: No need to store/rotate keys manually  
✅ **Built-in Audit Logs**: See who accessed what and when  
✅ **Easy Revocation**: Instantly revoke compromised tokens  
✅ **Multiple Tokens**: Different tokens for different clients  
✅ **Zero Trust Integration**: Can add users, IP rules, geo-fencing later  
✅ **No Code Changes**: Protection happens at the edge, before your Worker

## Limitations

❌ **Path-based only**: Can't protect specific HTTP methods (POST vs GET)  
❌ **All-or-nothing**: If a path is protected, ALL methods are protected  
❌ **Visible in Browser**: Service Token credentials exposed in frontend JS (acceptable for this use case)

## Next Steps

After setup is working:
1. Add multiple Service Tokens for different clients (mobile app, CLI tool, etc.)
2. Set up email alerts for failed authentication attempts
3. Review access logs monthly
4. Consider user-based authentication if you add user accounts later

## Troubleshooting

**Problem**: Getting 403 even with correct headers  
**Solution**: Check that the Service Token is added to the Access Policy

**Problem**: Headers not being sent from frontend  
**Solution**: Check browser DevTools → Network → Headers to verify `CF-Access-*` headers are present

**Problem**: Still getting redirected to login page  
**Solution**: Service Tokens bypass the login page. If you see a login page, the headers aren't being sent correctly.

**Problem**: CORS errors  
**Solution**: Cloudflare Access respects your Worker's CORS settings. Make sure CORS is configured correctly.
