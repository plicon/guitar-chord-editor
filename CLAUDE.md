# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
```

To run a single test file:
```bash
npx vitest run src/components/ChordEditor.test.tsx
```

## Architecture Overview

FretKit is a React 18 + TypeScript + Vite PWA for creating and editing guitar chord charts and songs.

### Routing & Entry
- `src/main.tsx` → `src/App.tsx` — sets up `ThemeProvider`, `QueryClientProvider`, and `BrowserRouter`
- Routes: `/` (main editor), `/admin`, `/admin/chords`, `/admin/strumming-patterns`

### State Management (Hooks)
Business logic lives in custom hooks, not components:
- `useChartState` — legacy flat chord chart state (single grid)
- `useSongState` — new section-based song state (active development)
- `useChordDragAndDrop` — drag-and-drop reordering via `@dnd-kit`
- `usePdfExport` — PDF generation using `jspdf` + `html2canvas` with SVG rasterization

### Data Architecture
Two parallel data models exist during migration:

**Legacy** (`src/types/chordChart.ts`): flat `ChordChart` with a 2D chord array.

**New** (`src/types/song.ts`): section-based `Song`:
```
Song → SongSection[] → SectionRow[]
SectionRow = chord-row | tab-row   (discriminated union by `kind`)
```

`src/types/chord.ts` — `ChordDiagram` with `fingers`, `barres`, `mutedStrings`, `openStrings`, `fingerLabels`
`src/types/strumming.ts` — `StrummingPattern` with `TimeSignature`, `Subdivision`, `StrumBeat`
`src/types/tab.ts` — `TabMeasure` / `TabColumn` / `TabNote` for guitar tablature

### Storage
Factory pattern in `src/services/storage/index.ts` selects provider via `VITE_STORAGE_PROVIDER`:
- `local` — browser `localStorage` (default)
- `s3` — S3-compatible (AWS, MinIO); configured via `VITE_S3_*` env vars
- `d1` — Cloudflare D1 via `VITE_API_URL`

### Key Configuration
`src/config/appConfig.ts` — central config object (`APP_CONFIG`) for app name, watermark, storage, and Cloudflare D1 API settings.

### PDF Export
`usePdfExport` renders `PrintableSheet` / `PrintableSongSheet` off-screen, rasterizes SVG chord diagrams before passing to `html2canvas`, then builds PDF pages with `jspdf`. Integer pixel coordinates are required in print mode to avoid rendering artifacts (see recent commit history).

### UI Components
shadcn/ui components live in `src/components/ui/` — prefer editing these only when necessary. App-specific components are directly in `src/components/`.

### Testing
Vitest + React Testing Library. Test files colocate with source files (e.g., `ChordEditor.test.tsx` next to `ChordEditor.tsx`). Global test setup in `src/test/setup.ts`.

### Deployment
Targets Cloudflare Pages (primary). The `wrangler.toml` and `_redirects` handle SPA routing. See `CLOUDFLARE_SETUP.md` for full deployment instructions.
