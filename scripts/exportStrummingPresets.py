#!/usr/bin/env python3
"""
Export strumming presets from Cloudflare D1 database and generate seed SQL migration.
This script queries the production database and creates INSERT statements.

Usage:
    python3 exportStrummingPresets.py [--env production|staging|development]
"""

import json
import subprocess
import sys
from typing import List, Dict, Any

def escape_sql(value: str) -> str:
    """Escape single quotes for SQL strings."""
    if value is None:
        return "NULL"
    return value.replace("'", "''")

def query_database(environment: str = "production", config: str = "wrangler.toml") -> List[Dict[str, Any]]:
    """
    Query the D1 database using wrangler CLI.
    
    Args:
        environment: The environment to query (production, staging, or development)
        config: Path to wrangler config file relative to worker/ directory
    
    Returns:
        List of strumming preset records
    """
    cmd = [
        "npx", "wrangler", "d1", "execute", "DB",
        "--env", environment,
        "--remote",
        "--json",
        "--config", config,
        "--command", "SELECT id, name, pattern, description, created_at FROM strumming_presets ORDER BY id"
    ]
    
    print(f"Querying {environment} database...")
    # Run from worker directory where wrangler.toml is located
    result = subprocess.run(cmd, capture_output=True, text=True, cwd="worker")
    
    # Wrangler may exit with code 1 due to warnings, but still return valid data
    # Check if we have valid JSON output regardless of exit code
    if not result.stdout.strip():
        print(f"Error: No data returned from database", file=sys.stderr)
        if result.stderr:
            print(f"Wrangler output: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    
    # Parse wrangler output - it returns an array with results
    try:
        output = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}", file=sys.stderr)
        print(f"Response: {result.stdout[:500]}", file=sys.stderr)
        sys.exit(1)
    
    # Wrangler returns: [{"results": [...], "success": true, ...}]
    if isinstance(output, list) and len(output) > 0:
        return output[0].get("results", [])
    
    # Handle error response format
    if isinstance(output, dict) and "error" in output:
        print(f"Database query error: {output['error'].get('text', 'Unknown error')}", file=sys.stderr)
        sys.exit(1)
    
    return []

def generate_insert(record: Dict[str, Any]) -> str:
    """
    Generate SQL INSERT statement for a strumming preset.
    
    Args:
        record: Database record with id, name, pattern, description, created_at, updated_at
    
    Returns:
        SQL INSERT statement
    """
    id_val = record["id"]
    name = escape_sql(record["name"])
    pattern = escape_sql(record["pattern"])
    description = escape_sql(record.get("description", ""))
    
    # Use strftime for timestamp to ensure consistent format
    sql = f"""INSERT INTO strumming_presets (id, name, pattern, description, created_at) VALUES
  ('{id_val}', '{name}', '{pattern}', '{description}', strftime('%s', 'now') * 1000);"""
    
    return sql

def generate_sql_file(presets: List[Dict[str, Any]], output_path: str):
    """
    Generate the complete SQL migration file.
    
    Args:
        presets: List of strumming preset records
        output_path: Path to write the SQL file
    """
    lines = [
        "-- Seed strumming presets",
        "-- This migration adds common strumming patterns",
        ""
    ]
    
    # Group by time signature for organization
    time_signatures = {}
    for preset in presets:
        pattern_data = json.loads(preset["pattern"])
        time_sig = pattern_data.get("timeSignature", "unknown")
        
        if time_sig not in time_signatures:
            time_signatures[time_sig] = []
        time_signatures[time_sig].append(preset)
    
    # Add presets grouped by time signature
    for time_sig in sorted(time_signatures.keys()):
        presets_in_group = time_signatures[time_sig]
        
        # Add comment header
        if time_sig == "4/4":
            lines.append("-- 4/4 Patterns (subdivision 2 - eighth notes)")
        elif time_sig == "3/4":
            lines.append("-- 3/4 Patterns (Waltz time, subdivision 2 - eighth notes)")
        elif time_sig == "6/8":
            lines.append("-- 6/8 Patterns (subdivision 3 - triplets)")
        else:
            lines.append(f"-- {time_sig} Patterns")
        
        for preset in presets_in_group:
            lines.append(generate_insert(preset))
            lines.append("")
    
    # Add summary comment
    lines.append(f"-- Inserted {len(presets)} strumming presets")
    lines.append("")
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"Generated SQL file: {output_path}")
    print(f"Total presets: {len(presets)}")
    
    # Print breakdown by time signature
    print("\nBreakdown by time signature:")
    for time_sig in sorted(time_signatures.keys()):
        count = len(time_signatures[time_sig])
        print(f"  {time_sig}: {count} presets")

def main():
    """Main execution function."""
    # Parse command line arguments
    environment = "production"
    config = "wrangler.toml"  # Default relative to worker/ directory
    
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        
        if arg in ["--env", "-e"]:
            if i + 1 < len(sys.argv):
                environment = sys.argv[i + 1]
                i += 2
            else:
                print(f"Error: {arg} requires a value", file=sys.stderr)
                sys.exit(1)
        elif arg in ["--config", "-c"]:
            if i + 1 < len(sys.argv):
                config = sys.argv[i + 1]
                i += 2
            else:
                print(f"Error: {arg} requires a value", file=sys.stderr)
                sys.exit(1)
        elif arg.startswith("-"):
            print(f"Error: Unknown option {arg}", file=sys.stderr)
            print("Usage: python3 exportStrummingPresets.py [--env|-e ENV] [--config|-c CONFIG]", file=sys.stderr)
            sys.exit(1)
        else:
            # Positional argument (backward compatibility)
            environment = arg
            i += 1
    
    if environment not in ["production", "staging", "development"]:
        print(f"Invalid environment: {environment}", file=sys.stderr)
        print("Usage: python3 exportStrummingPresets.py [--env|-e production|staging|development] [--config|-c CONFIG]", file=sys.stderr)
        sys.exit(1)
    
    # Query database
    presets = query_database(environment, config)
    
    if not presets:
        print("No strumming presets found in database", file=sys.stderr)
        sys.exit(1)
    
    # Generate SQL file
    output_path = "worker/migrations/0002_seed_strumming_presets.sql"
    generate_sql_file(presets, output_path)
    
    print("\n✓ Successfully exported strumming presets!")
    print(f"  Environment: {environment}")
    print(f"  Output: {output_path}")

if __name__ == "__main__":
    main()
