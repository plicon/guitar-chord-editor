#!/usr/bin/env python3
"""
Converts guitar_chords.csv to SQL seed migration file
Usage: python3 convertCsvToSeedSql.py
"""

import csv
import json
import re
from datetime import datetime
from pathlib import Path

def generate_id(name: str) -> str:
    """Generate a URL-safe ID from chord name"""
    # Remove newlines and extra whitespace
    clean_name = ' '.join(name.split())
    
    return (clean_name.lower()
            .replace(' ', '_')
            .replace('#', '_sharp')
            .replace('♯', '_sharp')
            .replace('b', '_flat')
            .replace('♭', '_flat')
            .replace('(', '')
            .replace(')', '')
            .replace('/', '_')
            .replace('-', '_')
            .replace('+', '_plus')
            .replace(',', ''))

def calculate_start_fret(fingers: list, barres: list = None) -> int:
    """Calculate the centered starting fret for display purposes.
    
    The start_fret determines which fret range (start_fret to start_fret+4) 
    is shown in the 5-fret diagram. The chord is centered within this range.
    
    Examples:
        - Chord uses frets 1,2,3: span=3, start_fret=1 (shows 1-5, centered with 1 empty after)
        - Chord uses frets 4,5,6: span=3, start_fret=3 (shows 3-7, centered with 1 empty before/after)
        - Chord uses frets 3,4,5,6: span=4, start_fret=3 (shows 3-7, with 1 empty after)
    """
    fret_numbers = []
    
    # Add finger frets
    fret_numbers.extend([f['fret'] for f in fingers if f['fret'] > 0])
    
    # Add barre frets
    if barres:
        fret_numbers.extend([b['fret'] for b in barres if b.get('fret') and b['fret'] > 0])
    
    if not fret_numbers:
        return 1  # All open strings
    
    min_fret = min(fret_numbers)
    max_fret = max(fret_numbers)
    span = max_fret - min_fret + 1
    
    # If chord includes fret 1 or spans 5+ frets, start at the minimum fret
    if min_fret == 1 or span >= 5:
        return 1 if min_fret == 1 else min_fret
    
    # Center the chord in the 5-fret diagram
    # For span of 3: 1 empty before, for span of 4: 0 empty before
    empty_frets = 5 - span
    padding_before = empty_frets // 2
    
    # Calculate start_fret, but never go below 1
    centered_start = max(1, min_fret - padding_before)
    
    return centered_start

def escape_sql(s: str) -> str:
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def simplify_chord_name(full_name: str) -> str:
    """Simplify chord name by extracting just the chord symbol.
    
    Examples:
        'C guitar chord (C Major)' -> 'C'
        'Cadd9 guitar chord (C Major added 9th)' -> 'Cadd9'
        'C#/Db guitar chord (C#/Db Major)' -> 'C#/Db'
    """
    # Pattern: "<ChordSymbol> guitar chord (<Description>)"
    match = re.match(r'^(.+?)\s+guitar chord\s+\(', full_name)
    if match:
        return match.group(1)
    return full_name  # Return original if pattern doesn't match

def convert_row(row: dict) -> dict:
    """Convert CSV row to ChordPreset format"""
    # Clean name - remove newlines and extra spaces
    full_name = ' '.join(row['chord_label'].split())
    name = simplify_chord_name(full_name)
    chord_id = generate_id(full_name)
    
    # Parse positions
    positions = json.loads(row['parsed_positions'])
    
    # Extract finger positions
    fingers = [
        {
            'string': p['string'],
            'fret': p['fret'],
            **({'finger': p['finger']} if 'finger' in p and p['finger'] is not None else {})
        }
        for p in positions
        if p.get('type') == 'finger'
    ]
    
    # Extract barres
    barres = [
        {
            'fret': p['fret'],
            'fromString': p['fromString'],
            'toString': p['toString']
        }
        for p in positions
        if p.get('type') == 'barre' and p.get('fret') and p.get('fromString') and p.get('toString')
    ]
    
    # Parse muted and open strings
    muted_strings = json.loads(row['muted_strings']) if row['muted_strings'] else []
    open_strings = json.loads(row['open_strings']) if row['open_strings'] else []
    
    # Calculate centered start fret for display (based on absolute fret positions)
    start_fret = calculate_start_fret(fingers, barres)
    
    # Store absolute fret positions (no adjustment needed)
    # The frontend will use start_fret to determine which frets to display (start_fret to start_fret+4)
    
    return {
        'id': chord_id,
        'name': name,
        'frets': 5,
        'start_fret': start_fret,
        'fingers': fingers,  # Store absolute positions
        'barres': barres,    # Store absolute positions
        'muted_strings': muted_strings,
        'open_strings': open_strings,
        'symbols': row.get('symbols', ''),
        'steps': row.get('steps', ''),
        'notes': row.get('notes', ''),
        'instructions': row.get('instructions', '')
    }

def generate_insert(chord: dict) -> str:
    """Generate SQL INSERT statement"""
    timestamp = "strftime('%s', 'now') * 1000"
    
    fingers_json = json.dumps(chord['fingers'], separators=(',', ':'))
    barres_json = 'NULL' if not chord['barres'] else f"'{escape_sql(json.dumps(chord['barres'], separators=(',', ':')))}'"
    muted_json = 'NULL' if not chord['muted_strings'] else f"'{escape_sql(json.dumps(chord['muted_strings'], separators=(',', ':')))}'"
    open_json = 'NULL' if not chord['open_strings'] else f"'{escape_sql(json.dumps(chord['open_strings'], separators=(',', ':')))}'"
    # Generate finger_labels from fingers data
    finger_labels = [
        {'string': f['string'], 'finger': f['finger']}
        for f in chord['fingers']
        if 'finger' in f and f['finger'] is not None
    ]
    finger_labels_json = f"'{escape_sql(json.dumps(finger_labels, separators=(',', ':')))}'" if finger_labels else 'NULL'
    
    symbols = f"'{escape_sql(chord['symbols'])}'" if chord.get('symbols') else 'NULL'
    steps = f"'{escape_sql(chord['steps'])}'" if chord.get('steps') else 'NULL'
    notes = f"'{escape_sql(chord['notes'])}'" if chord.get('notes') else 'NULL'
    instructions = f"'{escape_sql(chord['instructions'])}'" if chord.get('instructions') else 'NULL'
    
    return f"  ('{escape_sql(chord['id'])}', '{escape_sql(chord['name'])}', {chord['frets']}, {chord['start_fret']}, '{escape_sql(fingers_json)}', {barres_json}, {muted_json}, {open_json}, {finger_labels_json}, {symbols}, {steps}, {notes}, {instructions}, {timestamp}, {timestamp})"

def main():
    script_dir = Path(__file__).parent
    csv_path = script_dir / 'guitar_chords.csv'
    migrations_dir = script_dir.parent / 'worker' / 'migrations'
    
    # Configuration
    CHORDS_PER_FILE = 100  # Split into files of 100 chords each
    
    print(f"Reading CSV from: {csv_path}")
    
    # Read CSV
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Parsed {len(rows)} chords from CSV")
    
    # Convert all rows
    chords = [convert_row(row) for row in rows]
    
    # Group by category
    major = [c for c in chords if 'Major' in c['name']]
    minor = [c for c in chords if 'Minor' in c['name']]
    seventh = [c for c in chords if re.search(r'7(?!th)', c['name'])]
    other = [c for c in chords if c not in major and c not in minor and c not in seventh]
    
    print(f"Categories: {len(major)} major, {len(minor)} minor, {len(seventh)} seventh, {len(other)} other")
    
    # Calculate number of files needed
    total_files = (len(chords) + CHORDS_PER_FILE - 1) // CHORDS_PER_FILE
    
    # Generate multiple migration files
    for file_idx in range(total_files):
        start_idx = file_idx * CHORDS_PER_FILE
        end_idx = min((file_idx + 1) * CHORDS_PER_FILE, len(chords))
        chunk = chords[start_idx:end_idx]
        
        # File numbering starts at 0003
        file_num = 3 + file_idx
        output_path = migrations_dir / f'{file_num:04d}_seed_chord_presets_part{file_idx + 1}.sql'
        
        # Generate SQL for this chunk
        sql = f"""-- Seed chord presets (part {file_idx + 1} of {total_files})
-- Generated from guitar_chords.csv on {datetime.now().strftime('%Y-%m-%d')}
-- Chords {start_idx + 1} to {end_idx}

INSERT INTO chord_presets (id, name, frets, start_fret, fingers, barres, muted_strings, open_strings, finger_labels, symbols, steps, notes, instructions, created_at, updated_at) VALUES
"""
        sql += ',\n'.join(generate_insert(c) for c in chunk)
        sql += ';\n\n'
        sql += f"-- Inserted {len(chunk)} chord presets\n"
        
        # Write output
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(sql)
        
        print(f"✅ Generated {output_path.name} with {len(chunk)} chords")
    
    print(f"\n📊 Summary:")
    print(f"   Total chords: {len(chords)}")
    print(f"   Split into {total_files} migration files")
    print(f"   Migrations: {3:04d} to {3 + total_files - 1:04d}")
    
    # Statistics
    with_barres = sum(1 for c in chords if c['barres'])
    with_muted = sum(1 for c in chords if c['muted_strings'])
    with_open = sum(1 for c in chords if c['open_strings'])
    avg_fingers = sum(len(c['fingers']) for c in chords) / len(chords)
    
    print(f"\n📊 Statistics:")
    print(f"   Chords with barres: {with_barres} ({100 * with_barres / len(chords):.1f}%)")
    print(f"   Chords with muted strings: {with_muted} ({100 * with_muted / len(chords):.1f}%)")
    print(f"   Chords with open strings: {with_open} ({100 * with_open / len(chords):.1f}%)")
    print(f"   Average fingers per chord: {avg_fingers:.1f}")

if __name__ == '__main__':
    main()
