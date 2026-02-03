# Version Synchronization

This project keeps the frontend and API versions in sync automatically.

## How It Works

Both the frontend and API read their version from their respective `package.json` files:

- **Frontend**: `src/config/version.ts` imports from `package.json`
- **API/Worker**: `worker/src/config/version.ts` imports from `worker/package.json`

## Updating the Version

To update the version for both frontend and API:

1. **Update both package.json files** with the same version:
   ```bash
   # Root package.json (frontend)
   {
     "version": "x.y.z"
   }
   
   # worker/package.json (API)
   {
     "version": "x.y.z"
   }
   ```

2. **Build the project** - the version will be automatically embedded:
   ```bash
   npm run build          # Frontend
   cd worker && npm run deploy  # API
   ```

## Version Format

Follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 1.1.0 → 1.2.0)
- **PATCH**: Bug fixes and small changes (e.g., 1.1.5 → 1.1.6)

## Checking the Version

- **Frontend**: Imported via `src/config/version.ts` → `APP_VERSION`
- **API Health Check**: `GET /health` returns `{"version": "x.y.z"}`
- **OpenAPI Spec**: `GET /api/docs/openapi.json` shows `info.version`

## Important Notes

⚠️ **Always keep both package.json versions in sync!**

The frontend and API should always have matching versions to ensure compatibility.
If they differ, you may experience unexpected behavior or API incompatibilities.
