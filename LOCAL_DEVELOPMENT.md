# 🔧 Local Development Guide

Complete guide for developing FretKit locally with the Cloudflare Workers backend.

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install worker dependencies
cd worker
npm install
cd ..
```

### 2. Start Local Backend

```bash
cd worker

# Start local development server (with auto-reload)
npm run dev
```

The Worker API runs at **`http://localhost:8787`**

Wrangler automatically:
- ✅ Creates local SQLite database in `.wrangler/state/`
- ✅ Applies migrations from `migrations/` folder
- ✅ Enables hot reload on code changes
- ✅ Logs all requests and SQL queries

### 3. Configure Frontend

Create `.env.local` in the root directory:

```env
# Use local API
VITE_STORAGE_PROVIDER=cloudflare-api
VITE_CLOUDFLARE_API_URL=http://localhost:8787/api
```

### 4. Start Frontend

```bash
# From root directory
npm run dev
```

Opens at **`http://localhost:5173`**

---

## Development Workflow

### Making Changes

#### 1. Worker Code Changes (Backend)

```bash
cd worker

# Edit files in worker/src/
# Changes auto-reload (no restart needed!)

# View logs in terminal where 'npm run dev' is running
```

#### 2. Frontend Code Changes

```bash
# Edit files in src/
# Vite auto-reloads browser

# Check browser console for API calls
```

#### 3. Database Schema Changes

```bash
cd worker

# Create new migration
npm run db:migrate:create add_new_column

# Edit the generated file in migrations/
# Then restart dev server (migrations auto-apply)
npm run dev
```

---

## Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:8787/api/health

# Get strumming presets
curl http://localhost:8787/api/presets/strumming | jq

# Get chord presets
curl http://localhost:8787/api/presets/chords | jq '.[0:5]'  # First 5

# Create a test chart
curl -X POST http://localhost:8787/api/charts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Song",
    "timeSignature": "4/4",
    "gridData": []
  }' | jq

# List all charts
curl http://localhost:8787/api/charts | jq
```

### Test Full Flow

1. Open http://localhost:5173
2. Create a chord chart
3. Click "Save" - should save to local Worker
4. Refresh page - chart should load from Worker
5. Check Worker terminal - should see API requests

---

## Database Management

### View Local Database

```bash
cd worker

# Execute SQL query
npx wrangler d1 execute fretkit-db --local \
  --command "SELECT * FROM chord_charts LIMIT 10"

# Count presets
npx wrangler d1 execute fretkit-db --local \
  --command "SELECT 
    (SELECT COUNT(*) FROM chord_presets) as chords,
    (SELECT COUNT(*) FROM strumming_presets) as strumming,
    (SELECT COUNT(*) FROM chord_charts) as charts"
```

### Reset Local Database

```bash
cd worker

# Remove local state
rm -rf .wrangler/state/

# Restart dev server (auto-creates DB and runs migrations)
npm run dev
```

### Seed Initial Data

The local dev server automatically applies migrations, including seed data from `migrations/0002_seed_presets.sql`.

To add all 1600+ chords:

```bash
# Generate chord JSON
node scripts/exportAllChords.js > worker/data/all-chords.json

# Import to local database
# (Modify bulkImportChords.js to use --local flag)
node scripts/bulkImportChords.js
```

---

## Debugging

### Worker Logs

All console.log() in Worker code shows in the terminal:

```typescript
// In worker/src/routes/charts.ts
console.log('Creating chart:', body.title);
```

Shows in terminal:
```
[wrangler] Creating chart: My Song
```

### Network Debugging

1. Open browser DevTools (F12)
2. Network tab
3. Filter by "localhost:8787"
4. Click requests to see payloads

### Database Debugging

```bash
# Check what's in the database
cd worker
npx wrangler d1 execute fretkit-db --local \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# View table schema
npx wrangler d1 execute fretkit-db --local \
  --command "PRAGMA table_info(chord_presets)"
```

---

## Common Issues

### Port Already in Use

```bash
# Kill process on port 8787
lsof -i :8787
kill -9 <PID>

# Or use different port
cd worker
npx wrangler dev --port 8788

# Update .env.local:
VITE_CLOUDFLARE_API_URL=http://localhost:8788/api
```

### CORS Errors

Worker allows all localhost origins in dev mode. If you see CORS errors:

1. Check `worker/src/utils/cors.ts`
2. Ensure origin check includes localhost:
   ```typescript
   if (origin?.startsWith('http://localhost'))
   ```

### Migrations Not Applying

```bash
# Check migration files exist
ls -la worker/migrations/

# Manually apply
cd worker
npx wrangler d1 migrations apply fretkit-db --local
```

### "DB is not defined"

This means D1 binding is not configured. Check `worker/wrangler.toml`:

```toml
# For local dev, this section can be commented out
# Wrangler creates a temporary local DB automatically

# [[d1_databases]]
# binding = "DB"
# database_name = "fretkit-db"
```

For local development, you don't need this configured!

---

## Hot Reload

### What Auto-Reloads?

✅ **Worker TypeScript files** - instant reload  
✅ **Frontend React files** - instant browser refresh  
❌ **Database schema** - requires manual migration  
❌ **wrangler.toml** - requires restart  

### Restart Worker

```bash
# Stop: Ctrl+C
# Start: npm run dev
```

---

## Testing with Real Data

### Import Sample Charts

```sql
-- Create test-data.sql
INSERT INTO chord_charts (id, title, artist, time_signature, grid_data, created_at, updated_at)
VALUES 
('test1', 'Wonderwall', 'Oasis', '4/4', '[{"chordName":"Em7","bars":1}]', 1738024800000, 1738024800000),
('test2', 'Hotel California', 'Eagles', '4/4', '[{"chordName":"Bm","bars":1}]', 1738024800000, 1738024800000);
```

```bash
cd worker
npx wrangler d1 execute fretkit-db --local --file=test-data.sql
```

---

## Performance Testing

### Measure Response Time

```bash
# Using curl
curl -w "\nTime: %{time_total}s\n" http://localhost:8787/api/presets/chords

# Should be < 50ms for local
```

### Load Testing

```bash
# Install autocannon
npm install -g autocannon

# Test endpoint
autocannon -c 10 -d 5 http://localhost:8787/api/presets/strumming
```

---

## Environment Comparison

| Feature | Local Dev | Staging | Production |
|---------|-----------|---------|------------|
| Database | SQLite (.wrangler/state/) | D1 Remote | D1 Remote |
| API URL | localhost:8787 | worker-staging.workers.dev | worker.workers.dev |
| CORS | Permissive | localhost:5173 | fretkit.io |
| Logging | Console | Wrangler tail | Wrangler tail |
| Data | Test data | Staging data | Live data |

---

## Best Practices

### 1. Use Git Branches

```bash
git checkout -b feature/new-api-endpoint
# Make changes
# Test locally
git commit -m "feat: add new endpoint"
```

### 2. Test Before Committing

```bash
# Start both servers
cd worker && npm run dev &
npm run dev

# Test the feature manually
# Check both terminals for errors
```

### 3. Keep .wrangler/ Clean

```bash
# Add to .gitignore (already done)
worker/.wrangler/
worker/dist/
```

### 4. Use TypeScript

Worker has full TypeScript support:
```typescript
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Auto-completion works!
    const result = await env.DB.prepare('SELECT * FROM chord_presets').all();
  }
}
```

---

## Next Steps

After local testing works:

1. ✅ Create staging environment
2. ✅ Deploy to staging
3. ✅ Test with staging frontend
4. ✅ Deploy to production

See [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) for deployment instructions.

---

## Troubleshooting Checklist

- [ ] Node.js >= 18 installed
- [ ] Worker running (`npm run dev` in worker/)
- [ ] Frontend running (`npm run dev` in root)
- [ ] `.env.local` configured correctly
- [ ] No CORS errors in browser console
- [ ] Worker logs showing requests
- [ ] Database has presets (check SQL query)
- [ ] Ports 5173 and 8787 available

---

## Support

- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
