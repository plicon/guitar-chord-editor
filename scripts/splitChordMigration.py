#!/usr/bin/env python3
"""
Split large chord preset migration into smaller chunks to avoid SQLite TOOBIG error.
Splits 0003_seed_chord_presets.sql into multiple migration files with ~100 chords each.
"""

import re
import os

def split_migration(input_file, output_dir, chords_per_file=100):
    """Split large migration into smaller files."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all value rows (individual chord data)
    # Pattern: ('id', 'name', ...)
    value_pattern = r"\('[^']+',\s*'[^']+',\s*\d+,\s*\d+,.*?\),?"
    values = re.findall(value_pattern, content, re.DOTALL)
    
    print(f"Found {len(values)} chord value rows")
    
    if len(values) == 0:
        print("ERROR: No chord values found in migration file")
        return
    
    # Split into chunks
    total_files = (len(values) + chords_per_file - 1) // chords_per_file
    
    for i in range(total_files):
        start_idx = i * chords_per_file
        end_idx = min((i + 1) * chords_per_file, len(values))
        chunk = values[start_idx:end_idx]
        
        # Create migration file
        file_num = 3 + i
        filename = f"000{file_num}_seed_chord_presets_part{i+1}.sql"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"-- Seed chord presets (part {i+1} of {total_files})\n")
            f.write(f"-- Chords {start_idx + 1} to {end_idx}\n\n")
            
            f.write("INSERT INTO chord_presets (id, name, frets, start_fret, fingers, barres, muted_strings, open_strings, finger_labels, symbols, steps, notes, instructions, created_at, updated_at) VALUES\n")
            
            for j, value in enumerate(chunk):
                # Remove trailing comma if present
                value = value.rstrip(',')
                # Add comma except for last item
                if j < len(chunk) - 1:
                    f.write(f"  {value},\n")
                else:
                    f.write(f"  {value};\n")
            
            f.write(f"\n-- Inserted {len(chunk)} chord presets\n")
        
        print(f"Created {filename} with {len(chunk)} chords")
    
    print(f"\n✓ Split into {total_files} migration files")
    print(f"  Original file: {input_file}")
    print(f"  You can now delete: 0003_seed_chord_presets.sql")

if __name__ == "__main__":
    input_file = "worker/migrations/0003_seed_chord_presets.sql"
    output_dir = "worker/migrations"
    
    split_migration(input_file, output_dir, chords_per_file=100)
