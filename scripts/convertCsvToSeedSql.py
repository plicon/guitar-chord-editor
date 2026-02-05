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

def calculate_start_fret(fingers: list) -> int:
    """Calculate the starting fret from finger positions"""
    if not fingers:
        return 1
    
    fret_numbers = [f['fret'] for f in fingers if f['fret'] > 0]
    
    if not fret_numbers:
        return 1  # All open strings
    
    min_fret = min(fret_numbers)
    return 1 if min_fret == 1 else min_fret

def escape_sql(s: str) -> str:
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def convert_row(row: dict) -> dict:
    """Convert CSV row to ChordPreset format"""
    # Clean name - remove newlines and extra spaces
    name = ' '.join(row['chord_label'].split())
    chord_id = generate_id(name)
    
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
    
    # Calculate start fret
    start_fret = calculate_start_fret(fingers)
    
    # Adjust finger positions to be relative to start fret
    adjusted_fingers = [
        {
            **f,
            'fret': 0 if f['fret'] == 0 else f['fret'] - start_fret + 1
        }
        for f in fingers
    ]
    
    return {
        'id': chord_id,
        'name': name,
        'frets': 5,
        'start_fret': start_fret,
        'fingers': adjusted_fingers,
        'barres': barres,
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
    finger_labels_json = 'NULL'
    
    symbols = f"'{escape_sql(chord['symbols'])}'" if chord.get('symbols') else 'NULL'
    steps = f"'{escape_sql(chord['steps'])}'" if chord.get('steps') else 'NULL'
    notes = f"'{escape_sql(chord['notes'])}'" if chord.get('notes') else 'NULL'
    instructions = f"'{escape_sql(chord['instructions'])}'" if chord.get('instructions') else 'NULL'
    
    return f"  ('{escape_sql(chord['id'])}', '{escape_sql(chord['name'])}', {chord['frets']}, {chord['start_fret']}, '{escape_sql(fingers_json)}', {barres_json}, {muted_json}, {open_json}, {finger_labels_json}, {symbols}, {steps}, {notes}, {instructions}, {timestamp}, {timestamp})"

def main():
    script_dir = Path(__file__).parent
    csv_path = script_dir / 'guitar_chords.csv'
    output_path = script_dir.parent / 'worker' / 'migrations' / '0006_seed_all_chord_presets.sql'
    
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
    
    # Generate SQL
    sql = f"""-- Seed all chord presets from all-guitar-chords.com
-- Generated from guitar_chords.csv on {datetime.now().strftime('%Y-%m-%d')}
-- Total chords: {len(chords)}

"""
    
    def insert_chords(chords_list: list, comment: str) -> str:
        if not chords_list:
            return ''
        
        result = f"-- {comment}\n"
        result += "INSERT INTO chord_presets (id, name, frets, start_fret, fingers, barres, muted_strings, open_strings, finger_labels, symbols, steps, notes, instructions, created_at, updated_at) VALUES\n"
        result += ',\n'.join(generate_insert(c) for c in chords_list)
        result += ';\n\n'
        return result
    
    sql += insert_chords(major, f"Major chords ({len(major)})")
    sql += insert_chords(minor, f"Minor chords ({len(minor)})")
    sql += insert_chords(seventh, f"Seventh chords ({len(seventh)})")
    sql += insert_chords(other, f"Other chords ({len(other)})")
    
    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"\n✅ Generated SQL seed file: {output_path}")
    print(f"   Total inserts: {len(chords)}")
    
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
