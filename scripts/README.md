# Guitar Chord Data Scripts

This directory contains scripts for scraping guitar chord data from [all-guitar-chords.com](https://www.all-guitar-chords.com) and converting it to SQL seed migrations.

## Overview

The workflow consists of two main steps:

1. **Scraping** - Extract chord fingering data from the website into CSV format
2. **Conversion** - Transform CSV data into SQL migration file

## Scripts

### 1. `all-guitar-chords_create-export.py`

Scrapes chord data from all-guitar-chords.com and exports to `guitar_chords.csv`.

**Features:**
- Parses finger positions with 77.8% success rate
- Detects muted strings (97% coverage)
- Detects open strings (100% coverage)
- Handles thumb positions (mapped to finger 0)
- Supports multiple finger placement patterns
- Detects barre chords
- Limits to 1 variation per chord type

**Usage:**
```bash
cd scripts
python3 all-guitar-chords_create-export.py
```

**Output:** `guitar_chords.csv` with 600 rows and 14 columns:
- `root`, `quality`, `chord_label`, `url`
- `symbols`, `steps`, `notes`, `variation`
- `instructions` (raw HTML)
- `parsed_positions` (JSON array of finger/barre positions)
- `strum_from`, `strum_to` (strum instruction data)
- `muted_strings`, `open_strings` (JSON arrays)

### 2. `convertCsvToSeedSql.py`

Converts `guitar_chords.csv` to SQL migration file format.

**Features:**
- Generates URL-safe IDs from chord names
- Calculates `startFret` from finger positions
- Adjusts fret numbers to be relative to `startFret`
- Creates properly escaped SQL INSERT statements
- Organizes chords by category (Major, Minor, 7th, Other)

**Usage:**
```bash
cd scripts
python3 convertCsvToSeedSql.py
```

**Output:** `../worker/migrations/0003_seed_chord_presets.sql`

### 3. `exportStrummingPresets.py`

Exports strumming presets from Cloudflare D1 database and regenerates the seed migration file.

**Features:**
- Queries remote D1 database using wrangler CLI
- Supports multiple environments (production, staging, development)
- Groups presets by time signature (3/4, 4/4, 6/8)
- Generates properly formatted SQL INSERT statements
- Handles SQL escaping for special characters

**Usage:**
```bash
cd scripts

# Export from production (default)
python3 exportStrummingPresets.py production

# Export from staging
python3 exportStrummingPresets.py staging

# Export from development
python3 exportStrummingPresets.py development
```

**Output:** `../worker/migrations/0002_seed_strumming_presets.sql`

**Requirements:**
- Wrangler CLI must be installed (`npm install wrangler`)
- Must be authenticated with Cloudflare (`wrangler login`)
- Database must have strumming_presets table populated

## Workflow

### Initial Setup

```bash
# Install Python dependencies (if needed)
pip3 install beautifulsoup4 requests
```

### Regular Use

```bash
# 1. Scrape latest chord data (only when needed)
cd scripts
python3 all-guitar-chords_create-export.py

# 2. Convert to SQL seed file
python3 convertCsvToSeedSql.py

# 3. Export strumming presets from production database
python3 exportStrummingPresets.py production

# 4. Review the generated migrations
cat ../worker/migrations/0002_seed_strumming_presets.sql | head -20
cat ../worker/migrations/0003_seed_chord_presets.sql | head -50

# 5. Apply migrations (when ready to deploy)
cd ../worker
npx wrangler d1 migrations apply DB --env production --remote
```

## Data Statistics

**Current Dataset (as of 2026-02-05):**
- **600 chords** total (1 variation per chord type)
- **180** Major chords
- **144** Minor chords
- **216** Seventh chords
- **168** Other chords (augmented, diminished, suspended, etc.)

**Parsing Quality:**
- Finger positions: 77.8% (1,650/2,120 instructions)
- Barre positions: 16.4% (347/2,120)
- Unparsed: 5.8% (123/2,120 - all "strum all strings" playback instructions)

**Coverage:**
- Chords with barres: 51.0%
- Chords with muted strings: 84.8%
- Chords with open strings: 84.5%
- Average fingers per chord: 2.8

## CSV Format

The intermediate CSV format provides:

1. **Human-readable data** for manual inspection
2. **Version control** - can diff changes between scrapes
3. **Portability** - any language can read CSV
4. **Debugging** - easier to spot issues before SQL conversion

### Sample CSV Row

```csv
root,quality,chord_label,url,...
C,Major,"C guitar chord (C Major)",https://www.all-guitar-chords.com/chord/c,...
```

### Parsed Positions Format

JSON array with three types of positions:

```json
[
  {
    "type": "finger",
    "string": 2,
    "fret": 1,
    "finger": 1
  },
  {
    "type": "barre",
    "fret": 1,
    "fromString": 1,
    "toString": 6
  },
  {
    "type": "raw",
    "text": "now, strum all the strings"
  }
]
```

## SQL Migration Format

The generated migration file matches the database schema:

```sql
INSERT INTO chord_presets 
  (id, name, frets, start_fret, fingers, barres, 
   muted_strings, open_strings, finger_labels, created_at, updated_at) 
VALUES
  ('c_guitar_chord_c_major', 
   'C guitar chord (C Major)', 
   5, 
   1, 
   '[{"string":2,"fret":1,"finger":1},{"string":4,"fret":2,"finger":2},{"string":5,"fret":3,"finger":3}]',
   NULL,
   '[6]',
   '[1,3]',
   NULL,
   strftime('%s', 'now') * 1000,
   strftime('%s', 'now') * 1000);
```

## Implementation Details

### Finger Mapping

```python
FINGER_MAP = {
    "index": 1,
    "middle": 2,
    "ring": 3,
    "pinky": 4,
    "thumb": 0,  # Used for bass notes
}
```

### String Mapping

```python
STRING_NOTE_MAP = {
    "E": [1, 6],  # Both high E and low E
    "B": [2],
    "G": [3],
    "D": [4],
    "A": [5],
}
```

### E-String Disambiguation

When encountering "E" strings, the script uses heuristics:
- Index finger → likely low E (string 6)
- Ring/Pinky → likely high E (string 1)

### Start Fret Calculation

The `startFret` is calculated as:
- Minimum fret number from all finger positions
- Returns `1` for open position chords
- Used to make fret numbers relative in the diagram

## Troubleshooting

### Script Hangs or Times Out
- The website may be slow or down
- Check internet connection
- Increase delay between requests in the script

### Parsing Errors
- Website structure may have changed
- Check Chrome DevTools on the website
- Update regex patterns in `parse_positions_from_bullets()`

### Missing Dependencies
```bash
pip3 install beautifulsoup4 requests
```

### SSL Warnings
The script uses Python 3.9 with LibreSSL 2.8.3, which shows urllib3 warnings. These are safe to ignore.

## Future Improvements

Potential enhancements:
- [ ] Parse all variations (currently limited to 1 per chord)
- [ ] Extract finger labels from diagrams
- [ ] Add alternate fingerings
- [ ] Support for left-handed chord diagrams
- [ ] Scrape additional metadata (difficulty, common uses)
- [ ] Incremental updates (only fetch new/changed chords)

## Files

- `all-guitar-chords_create-export.py` - Web scraper (474 lines)
- `convertCsvToSeedSql.py` - CSV to SQL converter (195 lines)
- `exportStrummingPresets.py` - D1 database exporter (187 lines)
- `guitar_chords.csv` - Scraped chord data (600 rows, ~500KB)

## Related Files

- `../worker/migrations/0001_initial_schema.sql` - Database schema definition
- `../worker/migrations/0002_seed_strumming_presets.sql` - Generated strumming patterns (10 presets)
- `../worker/migrations/0003_seed_chord_presets.sql` - Generated chord presets (600 chords, 724 lines)
- `../../src/types/chord.ts` - TypeScript chord type definitions

## Notes

- **Why Python for scraping?** BeautifulSoup and requests are mature, battle-tested libraries with excellent HTML parsing
- **Why CSV intermediate?** Easier debugging, version control, and manual inspection
- **Why Python for conversion?** CSV parsing is simpler in Python, and we already have the environment set up
