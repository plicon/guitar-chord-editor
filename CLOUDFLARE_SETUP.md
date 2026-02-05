# ☁️ Cloudflare Setup Guide -

Complete step-by-step guide to deploy FretKit backend on Cloudflare Workers + D1.

## Prerequisites

- ✅ Cloudflare account (free tier is fine)
- ✅ Domain connected to Cloudflare (optional, for custom domain)
- ✅ Wrangler CLI installed (`npx wrangler`)
- ✅ Git repository

---

## Part 1: Database Setup

### Step 1: Login to Cloudflare

```bash
npx wrangler login
```

Opens browser to authenticate. Verify:

```bash
npx wrangler whoami
```

### Step 2: Create Production Database

```bash
cd worker

# Create the database
npx wrangler d1 create fretkit-db-production
```

**Output:**

```

✅ Successfully created DB 'fretkit-db-production'

[[env.production.d1_databases]]
binding = "DB"
database_name = "fretkit-db-production"
database_id = "xxxx-xxxx-xxxx-xxxx"
```

**⚠️ IMPORTANT:** Copy the `database_id`

### Step 3: Update Configuration

Edit `worker/wrangler.toml`:

```toml
# Uncomment and add your database ID:
[[env.production.d1_databases]]
binding = "DB"
database_name = "fretkit-db-production"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### Step 4: Apply Migrations

```bash
cd worker

# Apply migrations to production
npx wrangler d1 migrations apply DB --env production --remote
```

**Output:**
```
✅ Successfully applied 3 migration(s)
```

This will create:
- Schema (tables, indexes)
- Seed strumming patterns (14 presets)
- Seed chord presets (600 chords)

### Step 5: Verify Database

```bash
# Check tables
npx wrangler d1 execute DB --env production --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# Should show: charts, strumming_presets, chord_presets
```

---

## Part 2: Worker Deployment

### Option A: Manual Deployment

#### Step 6: Deploy Worker

```bash
cd worker

# Deploy to production
npm run deploy --env production
```

**Output:**
```
✅ Successfully deployed to:
   https://fretkit-worker-production.YOUR_SUBDOMAIN.workers.dev
```

**⚠️ IMPORTANT:** Copy this URL

#### Step 7: Test Worker

```bash
# Test health endpoint
curl https://fretkit-worker-production.YOUR_SUBDOMAIN.workers.dev/health

# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Test presets
curl https://fretkit-worker-production.YOUR_SUBDOMAIN.workers.dev/api/presets/strumming

# Should return array of presets
```

### Option B: GitHub Actions CI/CD (Recommended)

Automate deployments with GitHub Actions for a complete CI/CD pipeline.

#### Step 6: Generate Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template or create custom token with:
   - **Permissions:**
     - Account → Workers Scripts → Edit
     - Account → D1 → Edit
   - **Account Resources:** Include → Your Account
4. Click **Continue to summary** → **Create Token**
5. **Copy the token** (you won't see it again!)

#### Step 7: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Secret:** Paste your API token
5. Click **Add secret**

#### Step 8: Configure GitHub Environments

1. **Settings** → **Environments** → **New environment**

Create three environments:

**1. development**
- No protection rules needed
- Click **Configure environment**

**2. staging**
- No protection rules needed
- Click **Configure environment**

**3. production**
- ✅ **Required reviewers:** Add yourself or team members
- ✅ **Wait timer:** 0 minutes (or add delay if desired)
- Click **Save protection rules**

#### Step 9: Update Worker URLs in Workflow

Edit `.github/workflows/deploy-worker.yml`:

Replace `YOUR_SUBDOMAIN` with your actual Cloudflare subdomain in these lines:
- Line ~64: `https://fretkit-worker-production.YOUR_SUBDOMAIN.workers.dev`
- Line ~66: `https://fretkit-worker-staging.YOUR_SUBDOMAIN.workers.dev`
- Line ~68: `https://fretkit-worker.YOUR_SUBDOMAIN.workers.dev`
- Line ~112: `https://fretkit-worker-production.YOUR_SUBDOMAIN.workers.dev` (2 instances)

#### Step 10: How It Works

**Feature Branches** (`feature/*`, `dev/*`):
- Push triggers automatic deployment to **development** environment
- Shared dev environment for quick testing
- No approval needed

**Main Branch**:
- Merge to `main` triggers automatic deployment to **staging**
- Runs tests and smoke tests
- After staging succeeds, **production** deployment requires manual approval
- Go to **Actions** tab → Click the workflow run → Review and approve

**Manual Deployment**:
- Go to **Actions** → **Deploy Worker** → **Run workflow**
- Choose environment: development, staging, or production
- Click **Run workflow**

#### Step 11: Test the Pipeline

```bash
# Create a feature branch
git checkout -b feature/test-cicd

# Make a small change
echo "# Test" >> worker/README.md

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push -u origin feature/test-cicd
```

Go to GitHub **Actions** tab to see the deployment to development!

#### Step 12: Deploy to Production

```bash
# Merge feature to main (via PR or direct merge)
git checkout main
git merge feature/test-cicd
git push origin main
```

**What happens:**
1. ✅ Auto-deploys to staging
2. ✅ Runs tests and smoke tests
3. ⏸️ Waits for your approval to deploy to production
4. Go to **Actions** → Review and approve
5. ✅ Deploys to production

---

## Part 3: Verify Initial Data

The migrations have already seeded your database with:
- ✅ 107 common chord presets
- ✅ 11 strumming patterns

### Step 8: Verify Seeded Data

```bash
cd worker

# Check chord count
npx wrangler d1 execute fretkit-db --remote \
  --command "SELECT COUNT(*) as count FROM chord_presets"

# Expected: 107

# Check strumming patterns count
npx wrangler d1 execute fretkit-db --remote \
  --command "SELECT COUNT(*) as count FROM strumming_presets"

# Expected: 11

# List some chord presets
npx wrangler d1 execute fretkit-db --remote \
  --command "SELECT id, name FROM chord_presets LIMIT 10"
```

---

## Part 4: Frontend Configuration

### Step 9: Update Frontend Environment

Create `.env.local` in root directory:

```env
VITE_STORAGE_PROVIDER=cloudflare-api
VITE_CLOUDFLARE_API_URL=https://fretkit-api.YOUR_SUBDOMAIN.workers.dev/api
```

### Step 10: Test Locally

```bash
# From root directory
npm run dev
```

Open http://localhost:5173

- Create a chord chart
- Click "Save"
- Refresh page
- Chart should persist (loaded from Cloudflare!)

### Step 13: Build for Production

```bash
npm run build
```

---

## Part 5: Frontend Deployment

### Cloudflare Pages with Git Integration (Recommended)

Cloudflare Pages automatically creates:
- **Production** deployment from `main` branch
- **Preview** deployments from feature branches

The key is configuring different worker URLs for each environment.

#### Step 13: Connect Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your repository
4. **Build settings:**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (leave default)

#### Step 14: Configure Production Environment Variables

In the setup wizard, add **Production** environment variables (for main branch):

- `VITE_STORAGE_PROVIDER` = `cloudflare-api`
- `VITE_CLOUDFLARE_API_URL` = `https://fretkit-worker-production.YOUR_SUBDOMAIN.workers.dev/api`

Click **Save and Deploy**

#### Step 15: Configure Preview Environment Variables

After initial deployment:

1. Go to your Pages project → **Settings** → **Environment variables**
2. Scroll to **Preview** section
3. Add preview environment variables (for feature branches):
   - `VITE_STORAGE_PROVIDER` = `cloudflare-api`
   - `VITE_CLOUDFLARE_API_URL` = `https://fretkit-worker-staging.YOUR_SUBDOMAIN.workers.dev/api`
4. Click **Save**

#### Step 16: How It Works

**Local Development:**
```bash
# Start local dev server
npm run dev
```

Uses `.env.local`:
```env
VITE_STORAGE_PROVIDER=cloudflare-api
VITE_CLOUDFLARE_API_URL=https://fretkit-worker.YOUR_SUBDOMAIN.workers.dev/api
```

- Frontend: `http://localhost:5173`
- Worker: Development environment

**Feature Branch Workflow (Preview):**
```bash
git checkout -b feature/new-chord-editor
# make changes
git push origin feature/new-chord-editor
```

Cloudflare automatically:
1. ✅ Builds with **staging** worker URL (from preview env vars)
2. ✅ Deploys to preview URL: `https://abc123.fretkit.pages.dev`
3. ✅ Posts comment on PR with preview link

**Production Workflow:**
```bash
git checkout main
git merge feature/new-chord-editor
git push origin main
```

Cloudflare automatically:
1. ✅ Builds with **production** worker URL (from production env vars)
2. ✅ Deploys to: `https://fretkit.pages.dev`

**No pipelines needed!** Cloudflare Pages handles everything.

#### Step 17: Local Development Setup

Create `.env.local` in root directory:

```env
VITE_STORAGE_PROVIDER=cloudflare-api
VITE_CLOUDFLARE_API_URL=https://fretkit-worker.YOUR_SUBDOMAIN.workers.dev/api
```

This connects your local development to the **development** worker environment.

---

### Alternative: Manual Deploy

Use existing deployment method (Azure, Netlify, Vercel, etc.)

Just ensure `.env` or build environment has:
```env
VITE_STORAGE_PROVIDER=cloudflare-api
VITE_CLOUDFLARE_API_URL=https://fretkit-api.YOUR_SUBDOMAIN.workers.dev/api
```

---

## Part 6: Architecture Summary

You now have a complete three-tier environment setup:

### Development Environment
- **Worker**: `fretkit-worker` (development database)
- **Frontend**: Local dev server `http://localhost:5173`
- **Database**: `fretkit-db` (development data)
- **Use case**: Local development and testing

### Staging Environment
- **Worker**: `fretkit-worker-staging` (auto-deploys from main via GitHub Actions)
- **Frontend**: Preview deployments from feature branches (Cloudflare Pages)
- **Database**: `fretkit-db-staging` (staging data)
- **Use case**: Preview and test features before merging to main

### Production Environment
- **Worker**: `fretkit-worker-production` (manual approval via GitHub Actions)
- **Frontend**: Production deployment from main branch (Cloudflare Pages)
- **Database**: `fretkit-db-production` (live data)
- **Use case**: Live application

### Complete Deployment Flow

**1. Local Development:**
```bash
npm run dev  # Uses development worker via .env.local
```

**2. Feature Development:**
```bash
git checkout -b feature/new-feature
# code changes
git push origin feature/new-feature
```
- Worker → Auto-deploys to staging (GitHub Actions)
- Frontend → Preview deployment with **staging** worker URL (Cloudflare Pages)
- Test at: `https://abc123.fretkit.pages.dev`

**3. Ready for Production:**
```bash
git checkout main
git merge feature/new-feature
git push origin main
```
- Worker → Waits for manual approval (GitHub Actions)
- Frontend → Auto-deploys to production with **production** worker URL (Cloudflare Pages)

**4. Approve Production Worker:**
- Go to GitHub **Actions** → Review and approve worker deployment
- Frontend is already live and switches to production worker automatically

---

## Part 7: Custom Domain (Optional)

### Step 17: Add Custom Domain to Worker

1. Cloudflare Dashboard → **Workers & Pages**
2. Select your worker (`fretkit-api`)
3. **Triggers** → **Custom Domains** → **Add Custom Domain**
4. Enter: `api.fretkit.io` (or your preferred subdomain)
5. Click **Add Custom Domain**

Cloudflare automatically creates DNS records.

### Step 18: Update Frontend

```env
# .env.local or build environment
VITE_CLOUDFLARE_API_URL=https://api.fretkit.io
```

Rebuild and redeploy frontend.

---

## Part 8: Monitoring & Maintenance

### View Worker Analytics

1. Cloudflare Dashboard → **Workers & Pages**
2. Select `fretkit-api`
3. **Analytics** tab

Shows:
- Request count
- Error rate
- CPU time
- Bandwidth

### View Database Usage

1. Cloudflare Dashboard → **D1**
2. Select `fretkit-db`
3. **Metrics** tab

Shows:
- Storage used
- Queries per day
- Read/write operations

### View Live Logs

```bash
cd worker

# Tail production logs
npx wrangler tail

# Tail staging logs
npx wrangler tail --env staging

# Filter errors only
npx wrangler tail --status error
```

### Backup Database

```bash
cd worker

# Export all data
npx wrangler d1 export fretkit-db --remote --output=backup.sql

# Backup specific table
npx wrangler d1 execute fretkit-db --remote \
  --command "SELECT * FROM chord_charts" > charts-backup.json
```

---

## Troubleshooting

### Worker Not Deploying

**Error:** `Unauthorized`

**Solution:**
```bash
npx wrangler logout
npx wrangler login
npx wrangler whoami  # Verify
```

### Database Not Found

**Error:** `Database 'fretkit-db' not found`

**Solution:**
```bash
# List all databases
npx wrangler d1 list

# Verify database_id in wrangler.toml matches
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin`

**Solution:**

Check `worker/wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGIN = "https://fretkit.io"  # ← Must match your domain
```

Redeploy worker after changing:
```bash
cd worker
npm run deploy
```

### Migrations Failed

**Error:** `Migration already applied`

**Solution:**
```bash
# Check migration status
npx wrangler d1 migrations list fretkit-db --remote

# If stuck, manually reset (⚠️ deletes data)
npx wrangler d1 execute fretkit-db --remote \
  --command "DROP TABLE IF EXISTS chord_charts"

# Reapply
npx wrangler d1 migrations apply fretkit-db --remote
```

### Import Failed

**Error:** Bulk import script fails

**Solution:**
```bash
# Import smaller batches
# Edit scripts/bulkImportChords.js:
const BATCH_SIZE = 50;  // Reduce from 100

# Retry
node scripts/bulkImportChords.js
```

---

## Cost Estimate

### Free Tier Limits:

**Workers:**
- 100,000 requests/day
- 10ms CPU time per request
- ✅ More than enough for small/medium apps

**D1:**
- 5 GB storage
- 5 million reads/day
- 100,000 writes/day
- ✅ Sufficient for ~100k users

**Pages:**
- Unlimited static requests
- 500 builds/month
- ✅ Plenty for continuous deployment

### Estimated Usage:

For 1,000 daily active users:
- ~10,000 API requests/day (well under limit)
- ~1 MB database storage (1600 chords + charts)
- **Total cost: $0/month** 🎉

Cloudflare free tier is generous!

---

## Production Checklist

- [ ] Production database created and migrated
- [ ] Staging database created (optional)
- [ ] Worker deployed to production
- [ ] Chords bulk imported (1600+)
- [ ] Worker health endpoint returns OK
- [ ] Frontend `.env` configured
- [ ] Frontend built and deployed
- [ ] Can create chart in production
- [ ] Can load chart after refresh
- [ ] No CORS errors
- [ ] Analytics enabled
- [ ] Monitoring setup (optional)
- [ ] Custom domain configured (optional)

---

## Rollback Plan

### Rollback Worker

```bash
cd worker
npx wrangler rollback
```

Lists recent deployments, select one to restore.

### Rollback Database

```bash
# Restore from backup
npx wrangler d1 import fretkit-db --remote --file=backup.sql
```

### Disable Cloud Backend

Emergency fallback to localStorage:

```env
# .env.local
VITE_STORAGE_PROVIDER=local
```

Rebuild and redeploy frontend.

---

## Next Steps

After successful deployment:

1. ✅ Monitor for 24-48 hours
2. ✅ Check error logs daily
3. ✅ Set up alerts (optional)
4. ✅ Plan Phase 2 features

---

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Support](https://support.cloudflare.com)

**Need help?** Check the [Cloudflare Community](https://community.cloudflare.com/)
