#!/usr/bin/env python3
import csv
import json
import re
import time
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = "https://www.all-guitar-chords.com"
INDEX_URL = f"{BASE}/chords/index"

# --- helpers -------------------------------------------------

# Finger name to number mapping
FINGER_MAP = {
    "index": 1,
    "middle": 2,
    "ring": 3,
    "pinky": 4,
    "thumb": 0,  # thumb is often used for bass notes, mapped to 0 (no finger)
}

# String position to number mapping
# Note: E string is ambiguous - low E (6th) vs high E (1st)
# This will be resolved by finger position in get_string_number()
STRING_POSITION_MAP = {
    "1st": 1,
    "2nd": 2,
    "3rd": 3,
    "4th": 4,
    "5th": 5,
    "6th": 6,
}

# String note to possible positions
STRING_NOTE_MAP = {
    "E": [1, 6],  # high E or low E
    "B": [2],
    "G": [3],
    "D": [4],
    "A": [5],
}

def ordinal_to_number(ordinal: str) -> int:
    """Convert ordinal like '1st', '2nd', '3rd' to number."""
    return int(re.match(r"(\d+)", ordinal).group(1))

def get_string_number(note: str, finger_num: int, position_ordinal: Optional[str] = None) -> int:
    """
    Determine string number from note name and finger.
    For E strings: index finger (1) usually plays low E (6), 
                   ring/pinky (3/4) usually plays high E (1)
    """
    # If we have explicit position, use it
    if position_ordinal and position_ordinal in STRING_POSITION_MAP:
        return STRING_POSITION_MAP[position_ordinal]
    
    possible = STRING_NOTE_MAP.get(note, [])
    if len(possible) == 1:
        return possible[0]
    
    # Handle E string ambiguity with finger heuristic
    if note == "E" and len(possible) == 2:
        # Index finger -> low E (6th string)
        if finger_num == 1:
            return 6
        # Ring or pinky -> high E (1st string)
        elif finger_num in [3, 4]:
            return 1
        # Middle finger -> could be either, default to low E
        else:
            return 6
    
    return possible[0] if possible else 0

def fetch(url: str) -> str:
    r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.text

def parse_root_quality(h1_text: str):
    """
    Example h1 on site: 'C guitar chord (C Major)'
    We'll extract root='C' and quality='Major' (best-effort).
    """
    root = None
    quality = None

    # root is first token
    m = re.match(r"\s*([A-G](?:#|b)?(?:/[^ ]+)?)\s+guitar chord", h1_text, re.I)
    if m:
        root = m.group(1).strip()

    # quality is inside parentheses like "(C Major)" => "Major"
    m2 = re.search(r"\(([^)]+)\)", h1_text)
    if m2:
        inside = m2.group(1).strip()
        # try to remove leading root
        if root and inside.startswith(root):
            inside = inside[len(root):].strip()
        quality = inside.strip() if inside else None

    return root, quality

def parse_meta_line(soup: BeautifulSoup, label: str) -> Optional[str]:
    # looks like: "Symbols: M, maj"
    text = soup.get_text("\n")
    m = re.search(rf"^{re.escape(label)}:\s*(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else None

def extract_variations(soup: BeautifulSoup):
    """
    Returns list of dicts:
      {variation: 1..n, bullets: [...], strum_from: '5th string' or None}
    
    The page structure has chord-play elements for each variation heading,
    and text-box divs with the instructions. The first text-box is usually
    a description, so we skip it and match variations to text-boxes starting
    from the second one.
    """
    variations = []
    
    # Find all chord-play elements (each contains a variation heading)
    chord_plays = soup.find_all('chord-play')
    
    # Find all text-box divs that contain ul elements
    all_text_boxes = soup.find_all('div', class_='text-box')
    text_boxes_with_ul = [tb for tb in all_text_boxes if tb.find('ul')]
    
    # Match each variation to a text-box with instructions
    for i, cp in enumerate(chord_plays):
        h2 = cp.find('h2')
        if not h2:
            continue
            
        # Extract variation number from heading
        var_num_m = re.search(r"variation\s+(\d+)", h2.get_text(strip=True), re.I)
        if not var_num_m:
            continue
        var_num = int(var_num_m.group(1))
        
        bullets = []
        strum_from = None
        
        # Try to get the corresponding text-box (assuming same index)
        if i < len(text_boxes_with_ul):
            ul = text_boxes_with_ul[i].find('ul')
            if ul:
                for li in ul.find_all("li"):
                    t = li.get_text(" ", strip=True)
                    bullets.append(t)
        
        # try to detect "strum from the 5th string" in bullets
        for b in bullets:
            m = re.search(r"starting from the (\d+(?:st|nd|rd|th)) string", b, re.I)
            if m:
                strum_from = m.group(1)
                break

        variations.append({
            "variation": var_num,
            "bullets": bullets,
            "strum_from": strum_from
        })

    return variations

def parse_positions_from_bullets(bullets: list[str]):
    """
    Best-effort: parse bullet lines like:
      'Press the B (2nd) string on the 1st fret with your index finger'
    into structured objects. Also extracts strum/mute information.
    
    Returns: (positions, strum_info) where strum_info is a dict with:
      - strum_from: int or None (starting string number)
      - strum_to: int or None (ending string number)
      - explicitly_muted: list of explicitly muted string numbers
    """
    positions = []
    strum_info = {
        "strum_from": None,
        "strum_to": None,
        "explicitly_muted": []
    }

    # Strum patterns
    # "strum all the strings starting from the 5th string"
    strum_from_pattern = re.compile(
        r'strum.*?(?:from|starting from).*?(\d+)(?:st|nd|rd|th)\s+string',
        re.IGNORECASE
    )
    
    # "strum all the strings up to the 2nd string"
    strum_to_pattern = re.compile(
        r'strum.*?up to.*?(\d+)(?:st|nd|rd|th)\s+string',
        re.IGNORECASE
    )
    
    # "mute the 5th string"
    mute_pattern = re.compile(
        r'mute.*?(\d+)(?:st|nd|rd|th)\s+string',
        re.IGNORECASE
    )

    # common finger position patterns - ordered from most specific to most general
    patterns = [
        # Pattern 1: "Press [down on] the B (2nd) string on/at the 1st fret with/using your index finger"
        re.compile(
            r"press\s+(?:down\s+)?(?:on\s+)?(?:the\s+)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string.*?(?:on|at)\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret.*?(?:with|using)\s+(?:your\s+)?(index|middle|ring|pinky|thumb)",
            re.I
        ),
        # Pattern 2: "Place/Position/Stretch [out] your pinky [finger] on the G (3rd) string at the 3rd fret"
        re.compile(
            r"(?:place|position|stretch(?:\s+out)?)\s+(?:your\s+)?(index|middle|ring|pinky|thumb)\s*(?:finger)?\s+(?:on|to)\s+(?:the\s+)?(?:(\d+(?:st|nd|rd|th))\s+fret\s+of\s+(?:the\s+)?)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string.*?(?:at|on)\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret",
            re.I
        ),
        # Pattern 3: "Stretch out your pinky to the 4th fret of the G (3rd) string"
        re.compile(
            r"(?:stretch(?:\s+out)?|place)\s+(?:your\s+)?(index|middle|ring|pinky|thumb)\s*(?:finger)?\s+to\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret\s+of\s+(?:the\s+)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string",
            re.I
        ),
        # Pattern 4: "With your middle finger, press [down] [on] the D (4th) string at the 2nd fret"
        re.compile(
            r"with\s+your\s+(index|middle|ring|pinky|thumb)\s*(?:finger)?,?\s+press(?:\s+down)?(?:\s+on)?\s+(?:the\s+)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string.*?(?:at|on)\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret",
            re.I
        ),
        # Pattern 5: "Use your pinky [finger] to press [down] the G (3rd) string [down] on/at the 5th fret"
        re.compile(
            r"use\s+your\s+(index|middle|ring|pinky|thumb)\s*(?:finger)?\s+to\s+press(?:\s+down)?\s+(?:the\s+)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string(?:\s+down)?\s+(?:on|at)\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret",
            re.I
        ),
        # Pattern 6: "Press down on the low E (6th) string at the 2nd fret using your middle finger"
        re.compile(
            r"press\s+down\s+on\s+(?:the\s+)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string\s+at\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret\s+using\s+(?:your\s+)?(index|middle|ring|pinky|thumb)",
            re.I
        ),
        # Pattern 7: "Press the low E (6th) string on the 3rd fret with your middle finger"
        re.compile(
            r"press\s+(?:the\s+)?(?:low\s+)?([A-G])\s*\((\d+(?:st|nd|rd|th))\)\s*string\s+on\s+(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret\s+with\s+(?:your\s+)?(index|middle|ring|pinky|thumb)",
            re.I
        ),
    ]

    for b in bullets:
        text = b.lower()
        
        # Check for strum instructions
        strum_from_match = strum_from_pattern.search(b)
        if strum_from_match:
            strum_info["strum_from"] = ordinal_to_number(strum_from_match.group(1))
        
        strum_to_match = strum_to_pattern.search(b)
        if strum_to_match:
            strum_info["strum_to"] = ordinal_to_number(strum_to_match.group(1))
        
        # Check for explicit mute instructions
        mute_match = mute_pattern.search(b)
        if mute_match:
            muted_string = ordinal_to_number(mute_match.group(1))
            if muted_string and muted_string not in strum_info["explicitly_muted"]:
                strum_info["explicitly_muted"].append(muted_string)
        
        # If this is purely a strum/mute instruction, don't try to parse finger positions
        if (strum_from_match or strum_to_match) and 'press' not in text and 'place' not in text:
            continue
        
        if "barre" in text:
            # Parse barre information
            # Look for patterns like:
            # - "barre... 1st fret"
            # - "barre... across the 1st fret"
            # - "barre... on the 1st fret"
            m = re.search(r"barre.*?(?:across|on|using)?\s*(?:the\s+)?(\d+(?:st|nd|rd|th))\s*fret", b, re.I)
            fret_ord = m.group(1) if m else None
            fret_num = ordinal_to_number(fret_ord) if fret_ord else None
            
            # Try to find which strings are barred
            # Look for patterns like:
            # - "from the 1st to the 2nd strings"
            # - "covering the 2nd to the 4th strings"
            # - "extending over the 1st to the 5th strings"
            # - "extending over all the strings"
            # - "1st to the 2nd strings"
            from_str = None
            to_str = None
            
            # Check for "all the strings" pattern
            if re.search(r"(?:over|across|extending\s+over|covering)\s+all\s+(?:the\s+)?strings", b, re.I):
                from_str = 1
                to_str = 6
            else:
                # Try patterns with "from X to Y"
                m2 = re.search(r"from(?:\s+the)?\s+(\d+(?:st|nd|rd|th)).*?to(?:\s+the)?\s+(\d+(?:st|nd|rd|th))\s+string", b, re.I)
                if not m2:
                    # Try patterns with "covering/extending X to Y"
                    m2 = re.search(r"(?:covering|extending\s+over)(?:\s+the)?\s+(\d+(?:st|nd|rd|th)).*?to(?:\s+the)?\s+(\d+(?:st|nd|rd|th))\s+string", b, re.I)
                if not m2:
                    # Try simple "X to Y" pattern
                    m2 = re.search(r"(?:the\s+)?(\d+(?:st|nd|rd|th)).*?to(?:\s+the)?\s+(\d+(?:st|nd|rd|th))\s+string", b, re.I)
                
                if m2:
                    from_str = ordinal_to_number(m2.group(1))
                    to_str = ordinal_to_number(m2.group(2))
                else:
                    # If no string range specified, default to all strings (1-6)
                    # This handles cases like "Place a barre using your index finger on the 1st fret"
                    from_str = 1
                    to_str = 6
            
            positions.append({
                "type": "barre",
                "fret": fret_num,
                "fromString": from_str,
                "toString": to_str,
            })
            continue

        matched = False
        for pat_idx, pat in enumerate(patterns):
            m = pat.search(b)
            if not m:
                continue

            # Extract groups based on pattern type
            if pat_idx == 0:
                # Pattern 0: press [down on] the [low] X string on/at Y fret with/using Z finger
                note, string_ord, fret_ord, finger = m.groups()
            elif pat_idx == 1:
                # Pattern 1: place/position/stretch your Z finger on X string at Y fret
                # Groups: (finger, optional_fret, note, string_ord, fret_ord)
                finger, _, note, string_ord, fret_ord = m.groups()
            elif pat_idx == 2:
                # Pattern 2: stretch your Z finger to Y fret of X string
                # Groups: (finger, fret_ord, note, string_ord)
                finger, fret_ord, note, string_ord = m.groups()
            elif pat_idx == 3:
                # Pattern 3: with your Z finger, press [the] [low] X string at Y fret
                finger, note, string_ord, fret_ord = m.groups()
            elif pat_idx == 4:
                # Pattern 4: use your Z finger to press [the] [low] X string on Y fret
                finger, note, string_ord, fret_ord = m.groups()
            elif pat_idx == 5:
                # Pattern 5: press down on [the] [low] X string at Y fret using Z finger
                note, string_ord, fret_ord, finger = m.groups()
            elif pat_idx == 6:
                # Pattern 6: press [the] [low] X string on Y fret with Z finger
                note, string_ord, fret_ord, finger = m.groups()
            else:
                continue

            # Convert to numbers
            finger_num = FINGER_MAP.get(finger.lower(), 0)
            fret_num = ordinal_to_number(fret_ord)
            string_num = get_string_number(note, finger_num, string_ord)

            positions.append({
                "type": "finger",
                "string": string_num,
                "fret": fret_num,
                "finger": finger_num,
            })
            matched = True
            break

        if not matched:
            # keep raw line if it didn't parse, so you don't lose info
            positions.append({"type": "raw", "text": b})

    return (positions, strum_info)

# --- main ----------------------------------------------------

def main():
    print(f"Fetching index from {INDEX_URL}...")
    index_html = fetch(INDEX_URL)
    index_soup = BeautifulSoup(index_html, "html.parser")

    # collect chord links that look like /chords/index/...
    chord_urls = []
    
    # Debug: print first few chord links found
    all_links = index_soup.select('a[href]')
    print(f"Total links on page: {len(all_links)}")
    
    # Match both relative and absolute chord URLs
    for a in all_links:
        href = a.get("href")
        if not href:
            continue
        # Match both /chords/index/... and full URLs ending with /chords/index/...
        if '/chords/index/' in href:
            url = urljoin(BASE, href)
            chord_urls.append(url)

    # dedupe while preserving order
    seen = set()
    chord_urls = [u for u in chord_urls if not (u in seen or seen.add(u))]

    print(f"Found {len(chord_urls)} chord URLs to process")
    
    if not chord_urls:
        print("ERROR: No chord URLs found. The website structure may have changed.")
        return

    out_rows = []

    for i, url in enumerate(chord_urls, 1):
        html = fetch(url)
        soup = BeautifulSoup(html, "html.parser")

        h1 = soup.find("h1")
        h1_text = h1.get_text(" ", strip=True) if h1 else ""
        root, quality = parse_root_quality(h1_text)

        symbols = parse_meta_line(soup, "Symbols")
        steps = parse_meta_line(soup, "Steps")
        notes = parse_meta_line(soup, "Notes")

        variations = extract_variations(soup)

        # Only process Variation 1
        variation_1 = next((v for v in variations if v["variation"] == 1), None)
        if not variation_1:
            continue
            
        v = variation_1
        bullets = v["bullets"]
        positions, strum_info = parse_positions_from_bullets(bullets)
        
        # Calculate muted and open strings
        # Get all strings that have finger positions or are covered by barres
        fretted_strings = set()
        for pos in positions:
            if pos.get("type") == "finger" and pos.get("string"):
                fretted_strings.add(pos["string"])
            elif pos.get("type") == "barre" and pos.get("fromString") and pos.get("toString"):
                # Add all strings covered by the barre
                for string_num in range(pos["fromString"], pos["toString"] + 1):
                    fretted_strings.add(string_num)
        
        # Calculate muted strings
        muted_strings = []
        
        # Add explicitly muted strings
        muted_strings.extend(strum_info["explicitly_muted"])
        
        # If strum_from is specified, strings below it are muted
        # e.g., "strum from 5th string" means string 6 is muted
        if strum_info["strum_from"] and strum_info["strum_from"] < 6:
            for string_num in range(strum_info["strum_from"] + 1, 7):
                if string_num not in muted_strings:
                    muted_strings.append(string_num)
        
        # If strum_to is specified, strings above it are muted
        # e.g., "strum up to 2nd string" means string 1 is muted
        if strum_info["strum_to"] and strum_info["strum_to"] > 1:
            for string_num in range(1, strum_info["strum_to"]):
                if string_num not in muted_strings:
                    muted_strings.append(string_num)
        
        # Calculate open strings (played but not fretted)
        open_strings = []
        all_strings = set(range(1, 7))
        played_strings = all_strings - set(muted_strings)
        
        for string_num in played_strings:
            if string_num not in fretted_strings:
                open_strings.append(string_num)
        
        # Sort for consistency
        muted_strings.sort()
        open_strings.sort()

        out_rows.append({
            "root": root,
            "quality": quality,
            "chord_label": h1_text,
            "url": url,
            "symbols": symbols,
            "steps": steps,
            "notes": notes,
            "variation": v["variation"],
            "instructions": " | ".join(bullets),
            "parsed_positions": json.dumps(positions, ensure_ascii=False),
            "strum_from": strum_info["strum_from"],
            "strum_to": strum_info["strum_to"],
            "muted_strings": json.dumps(muted_strings),
            "open_strings": json.dumps(open_strings),
        })

        # be polite
        time.sleep(0.5)

        if i % 10 == 0:
            print(f"Processed {i}/{len(chord_urls)}...")

    if not out_rows:
        print("ERROR: No chord data was extracted. The website structure may have changed.")
        return

    with open("guitar_chords.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"Done. Wrote {len(out_rows)} rows to guitar_chords.csv")

if __name__ == "__main__":
    main()
