# Guitar Chord Creator

A web application for creating, editing, and printing guitar chord charts with customizable diagrams, strumming patterns, and professional layouts.

## Features

- 🎸 Create chord diagrams with finger positions, barre chords, and custom labels
- 🎵 Add strumming patterns with up/down strokes, accents, and muted beats
- 📄 Print-ready output with customizable watermarks and branding
- 💾 Save and load chord charts (localStorage or S3-compatible storage)
- 🎨 Light/dark theme support
- 📱 Responsive design for desktop and mobile
- 📲 **PWA Support** - Install as native app on iOS/Android
- 👆 **Touch Optimized** - 44px tap targets, gesture support, haptic-ready
- 🧪 **Comprehensive Test Suite** - 66+ automated tests with coverage reporting

---

## Table of Contents

- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Test Coverage](#test-coverage)
  - [Manual Testing](#manual-testing)
  - [Test Architecture](#test-architecture)
- [CI/CD Integration](#cicd-integration)
  - [GitHub Actions](#github-actions)
  - [GitLab CI/CD](#gitlab-cicd)
- [Deployment](#deployment)
  - [Cloudflare Pages](#cloudflare-pages)
  - [Azure Static Web Apps](#azure-static-web-apps)
  - [Self-hosted (Nginx)](#self-hosted-nginx)

---

## Configuration

Application settings are centralized in `src/config/appConfig.ts`:

```typescript
export const APP_CONFIG = {
  // App name displayed in watermark
  appName: "Fretkit",
  
  // URL displayed at the bottom right of each row in printable output
  rowUrl: "https://fretkit.io",
  
  // Toggle visibility of watermark and URL
  showWatermark: true,
  showRowUrl: true,

  // Storage configuration
  storage: {
    provider: "local", // "local" or "s3"
    
    // S3-compatible storage (AWS S3, Azure Blob, MinIO, etc.)
    // s3: {
    //   endpoint: "https://s3.amazonaws.com",
    //   bucket: "my-chord-charts",
    //   region: "us-east-1",
    //   accessKeyId: "YOUR_ACCESS_KEY",
    //   secretAccessKey: "YOUR_SECRET_KEY",
    //   prefix: "chord-charts",
    // },
  },
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appName` | string | "Guitar Chord Creator" | Application name shown in the watermark |
| `rowUrl` | string | "chordcreator.app" | URL displayed on each row of printed output |
| `showWatermark` | boolean | true | Show/hide diagonal watermark on printed sheets |
| `showRowUrl` | boolean | true | Show/hide URL label on each chord row |
| `storage.provider` | "local" \| "s3" | "local" | Storage backend for saving charts |
| `storage.s3` | object | undefined | S3-compatible storage configuration |

### S3 Storage Configuration

To use cloud storage instead of browser localStorage:

1. Uncomment the `s3` configuration in `appConfig.ts`
2. Configure your S3-compatible endpoint (AWS S3, MinIO, Backblaze B2, etc.)
3. Set your credentials and bucket name

---

## Project Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── public/
│   ├── favicon.ico             # App favicon
│   ├── apple-touch-icon.png    # iOS home screen icon
│   ├── pwa-192x192.png         # PWA icon (Android)
│   ├── pwa-512x512.png         # PWA icon (splash screens)
│   ├── placeholder.svg         # Placeholder images
│   └── robots.txt              # SEO robots file
├── src/
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── AppHeader.tsx       # Application header with actions
│   │   ├── ChartMetadataSection.tsx  # Title, description, strumming
│   │   ├── ChordDiagram.tsx    # Individual chord diagram renderer
│   │   ├── ChordEditor.tsx     # Main chord editing interface
│   │   ├── ChordGridSection.tsx # Chord grid with drag-and-drop
│   │   ├── ChordRow.tsx        # Row of chord diagrams
│   │   ├── PreviewDialog.tsx   # Print preview modal
│   │   ├── PrintableSheet.tsx  # Print-optimized layout
│   │   ├── SavedChartsDialog.tsx # Load/manage saved charts
│   │   ├── SortableChord.tsx   # Drag-and-drop chord wrapper
│   │   ├── StrummingPatternDisplay.tsx  # Strumming pattern renderer
│   │   ├── StrummingPatternEditor.tsx   # Strumming pattern editor
│   │   ├── ThemeProvider.tsx   # Dark/light theme context
│   │   └── ThemeToggle.tsx     # Theme switcher button
│   ├── config/
│   │   └── appConfig.ts        # Application configuration
│   ├── data/
│   │   ├── chordPresets.ts     # Predefined chord shapes
│   │   ├── chordSuggestions.ts # Chord autocomplete data
│   │   └── strummingPresets.ts # Predefined strumming patterns
│   ├── hooks/
│   │   ├── use-mobile.tsx      # Mobile detection hook
│   │   ├── use-toast.ts        # Toast notification hook
│   │   ├── useChartState.ts    # Chart state management hook
│   │   ├── useChartState.test.ts # Chart state tests (21 tests)
│   │   ├── useChordDragAndDrop.ts    # Drag-and-drop logic hook
│   │   ├── useChordDragAndDrop.test.ts # Drag-and-drop tests (13 tests)
│   │   ├── usePdfExport.ts     # PDF export hook
│   │   └── usePdfExport.test.ts # PDF export tests (8 tests)
│   ├── lib/
│   │   └── utils.ts            # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx           # Main application page
│   │   ├── Index.test.tsx      # Integration tests (23 tests)
│   │   └── NotFound.tsx        # 404 page
│   ├── services/
│   │   └── storage/            # Storage abstraction layer
│   │       ├── index.ts        # Storage exports and utilities
│   │       ├── types.ts        # Storage type definitions
│   │       ├── localStorageProvider.ts  # Browser localStorage
│   │       └── s3StorageProvider.ts     # S3-compatible storage
│   ├── test/
│   │   ├── setup.ts            # Test configuration
│   │   └── example.test.ts     # Example test file
│   ├── types/
│   │   ├── chord.ts            # Chord type definitions
│   │   ├── chordChart.ts       # Chart type definitions
│   │   └── strumming.ts        # Strumming type definitions
│   ├── App.tsx                 # Root application component
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind CSS imports
│   └── main.tsx                # Application entry point
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
└── vitest.config.ts            # Vitest test configuration
```

---

## Development

### Prerequisites

- Node.js 18+ (recommended: 20.x)
- npm, yarn, or bun

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd guitar-chord-creator

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm test -- --coverage` | Run tests with coverage report |

---

## Testing

This project uses [Vitest](https://vitest.dev/) with React Testing Library for comprehensive testing.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run a specific test file
npm test -- src/hooks/useChartState.test.ts

# Run tests matching a pattern
npm test -- --grep "drag and drop"
```

### Test Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Current coverage summary (66 tests):
# - Statements: 44.49%
# - Branches: 57.89%
# - Functions: 28%
# - Lines: 44.49%
```

**Well-covered modules:**
| Module | Coverage | Tests |
|--------|----------|-------|
| `useChartState.ts` | 64.59% | 21 tests |
| `useChordDragAndDrop.ts` | 96.05% | 13 tests |
| `usePdfExport.ts` | 100% | 8 tests |
| `Index.tsx` | 86.33% | 23 tests |
| Type definitions | 96%+ | - |

### Manual Testing

#### Basic Functionality Checklist

1. **Chord Creation**
   - [ ] Click an empty chord slot to open the editor
   - [ ] Enter a chord name (e.g., "Am", "G7")
   - [ ] Add finger positions by clicking on the fretboard
   - [ ] Toggle muted (X) and open (O) strings
   - [ ] Use chord presets from the dropdown
   - [ ] Save the chord and verify it appears in the grid

2. **Chord Management**
   - [ ] Drag and drop chords to reorder within a row
   - [ ] Drag chords between different rows
   - [ ] Add a new row using "Add Row" button
   - [ ] Remove a row (hover to reveal delete button)
   - [ ] Change chords per row (2-5 range)

3. **Strumming Patterns**
   - [ ] Click "Add Strumming Pattern" to open editor
   - [ ] Add up/down strokes on beats and off-beats
   - [ ] Use preset patterns
   - [ ] Verify pattern displays in header and print preview

4. **Chart Metadata**
   - [ ] Enter a chart title
   - [ ] Add description/notes
   - [ ] Add row subtitles for sections (Verse, Chorus, etc.)

5. **Save & Load**
   - [ ] Save a chart (verify toast notification)
   - [ ] Open saved charts dialog
   - [ ] Load a previously saved chart
   - [ ] Delete a saved chart

6. **Export & Import**
   - [ ] Export chart as JSON file
   - [ ] Import a JSON file
   - [ ] Download as PDF
   - [ ] Preview print layout

7. **Theme & Responsive**
   - [ ] Toggle dark/light theme
   - [ ] Test on mobile viewport (responsive layout)
   - [ ] Verify touch interactions work on mobile

8. **PDF Output Verification**
   - [ ] Watermark appears diagonally
   - [ ] Row URLs display at bottom-right
   - [ ] Chord diagrams render correctly
   - [ ] Strumming pattern displays in header
   - [ ] Subtitles have gray background

### Test Architecture

The test suite is organized into three layers:

```
┌─────────────────────────────────────────────┐
│          Integration Tests                   │
│     (src/pages/Index.test.tsx)              │
│  - Full page rendering with all components   │
│  - User interaction workflows               │
│  - Component communication                   │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│           Hook Unit Tests                    │
│  - useChartState.test.ts (state management)  │
│  - useChordDragAndDrop.test.ts (DnD logic)  │
│  - usePdfExport.test.ts (PDF generation)    │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│           Utility Tests                      │
│     (src/test/example.test.ts)              │
│  - Basic test setup verification            │
└─────────────────────────────────────────────┘
```

**Writing New Tests:**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByText("Success")).toBeInTheDocument();
  });
});
```

---

## CI/CD Integration

### GitHub Actions

The project includes a comprehensive CI pipeline in `.github/workflows/ci.yml` that runs on every push and pull request:

**Pipeline Jobs:**

| Job | Description |
|-----|-------------|
| `lint` | ESLint + TypeScript type checking |
| `test` | Vitest unit and integration tests |
| `build` | Production build (depends on lint + test) |
| `security` | npm audit + Snyk vulnerability scan |
| `codeql` | GitHub CodeQL static analysis |
| `dependency-review` | Dependency review for PRs |

**Triggering the Pipeline:**
- Automatically runs on push to `main`/`master`
- Automatically runs on all pull requests
- Build artifacts are uploaded and retained for 7 days


---

## Deployment

This is a static web application (no backend required) that can be deployed to any static hosting service.

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

---

### Cloudflare Pages

#### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. Push your code to GitHub or GitLab
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (or leave empty)
5. Add environment variables (if using S3 storage):
   - Click **Add variable** for each:
     - `VITE_STORAGE_PROVIDER` = `s3`
     - `VITE_S3_ENDPOINT` = `your-endpoint`
     - `VITE_S3_BUCKET` = `your-bucket`
     - `VITE_S3_REGION` = `us-east-1`
     - `VITE_S3_ACCESS_KEY_ID` = `your-key`
     - `VITE_S3_SECRET_ACCESS_KEY` = `your-secret`
6. Click **Save and Deploy**

**Important:** For SPA routing to work, add a `_redirects` file to your `public/` folder:

```bash
# Create public/_redirects file
echo "/*    /index.html   200" > public/_redirects
```

This ensures all routes are handled by the React Router instead of returning 404s.

#### Option 2: Deploy via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy
wrangler pages deploy dist --project-name=guitar-chord-creator

# Set environment variables (if using S3)
wrangler pages secret put VITE_S3_ACCESS_KEY_ID --project-name=guitar-chord-creator
wrangler pages secret put VITE_S3_SECRET_ACCESS_KEY --project-name=guitar-chord-creator
```

#### Custom Domain Setup

1. Go to your Pages project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `chordcreator.app`)
4. Cloudflare will automatically configure DNS and SSL

**Deployment triggers:**
- Automatic deployment on every push to production branch
- Preview deployments for all pull requests
- Instant rollbacks to previous deployments

#### Troubleshooting: Bun Lockfile Error

If you see `"Outdated lockfile version"` or `"lockfile is frozen"` errors:

**Solution:** Force Cloudflare to use npm instead of Bun by adding an environment variable:
- Go to your Pages project → **Settings** → **Environment variables**
- Add variable: `NPM_FLAGS` = `--version`
- Redeploy

Alternatively, remove `bun.lockb` from your repository and commit only `package-lock.json`:
```bash
git rm bun.lockb
git commit -m "Remove bun.lockb to use npm in CI/CD"
git push
```

---

### AWS S3 + CloudFront

#### Step 1: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://your-chord-app-bucket --region us-east-1

# Enable static website hosting
aws s3 website s3://your-chord-app-bucket \
  --index-document index.html \
  --error-document index.html
```

#### Step 2: Build and Upload

```bash
# Build the project
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-chord-app-bucket --delete
```

#### Step 3: Create CloudFront Distribution

1. Go to AWS CloudFront Console
2. Create distribution with S3 bucket as origin
3. Set default root object to `index.html`
4. Create custom error response for 404 → `/index.html` (for SPA routing)
5. Enable HTTPS

#### Step 4: Set up CI/CD (Optional)

Add to `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'dist'
```

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] New features have corresponding tests
- [ ] Documentation updated if needed
