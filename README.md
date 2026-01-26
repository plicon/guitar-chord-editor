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

---

## Table of Contents

- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
  - [Docker](#docker-deployment)
  - [Cloudflare Pages](#cloudflare-pages)
  - [AWS S3 + CloudFront](#aws-s3--cloudfront)
  - [Azure Static Web Apps](#azure-static-web-apps)
  - [Self-hosted (Nginx)](#self-hosted-nginx)

---

## Configuration

Application settings are centralized in `src/config/appConfig.ts`:

```typescript
export const APP_CONFIG = {
  // App name displayed in watermark
  appName: "Guitar Chord Creator",
  
  // URL displayed at the bottom right of each row in printable output
  rowUrl: "chordcreator.app",
  
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
│   │   ├── ChordDiagram.tsx    # Individual chord diagram renderer
│   │   ├── ChordEditor.tsx     # Main chord editing interface
│   │   ├── ChordRow.tsx        # Row of chord diagrams
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
│   │   └── use-toast.ts        # Toast notification hook
│   ├── lib/
│   │   └── utils.ts            # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx           # Main application page
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

---

## Testing

This project uses [Vitest](https://vitest.dev/) with React Testing Library.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

Place test files alongside components with `.test.tsx` or `.spec.tsx` extension:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });
});
```

---

## Deployment

This is a static web application (no backend required) that can be deployed to any static hosting service.

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

---

### Docker Deployment

#### Option 1: Using the provided Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Build and run:

```bash
# Build the Docker image
docker build -t guitar-chord-creator .

# Run the container
docker run -p 8080:80 guitar-chord-creator
```

#### Option 2: Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

---

### Cloudflare Pages

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `20`
5. Click **Deploy**

Cloudflare will automatically deploy on every push to your main branch.

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

### Azure Static Web Apps

1. Push your code to GitHub
2. Go to Azure Portal → Create Static Web App
3. Connect your GitHub repository
4. Configure:
   - **Build preset:** Vite
   - **App location:** `/`
   - **Output location:** `dist`
5. Azure will create a GitHub Action automatically

---

### Self-hosted (Nginx)

#### Step 1: Build the application

```bash
npm run build
```

#### Step 2: Copy to server

```bash
scp -r dist/* user@your-server:/var/www/chord-app/
```

#### Step 3: Configure Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/chord-app;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Step 4: Enable HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com
```

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
