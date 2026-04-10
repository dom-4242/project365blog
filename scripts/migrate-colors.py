#!/usr/bin/env python3
"""
Kinetic Lab color migration script v2.
Safe approach:
  1. Remove dark: prefix from all Tailwind utility classes (promotes dark variants)
  2. Replace ctp-* and sand-* token names with new Kinetic Lab tokens

Does NOT try to remove "light-mode duplicates" — that would require parsing JSX.
Both old and new-promoted class may co-exist on elements; CSS cascade resolves order.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_FILES = {
    'src/styles/globals.css',
    'src/app/layout.tsx',
    'src/components/providers/ThemeProvider.tsx',
    'src/components/layout/Navigation.tsx',
    'src/components/layout/ThemeToggle.tsx',
    'scripts/migrate-colors.py',
    'scripts/migrate-colors.mjs',
    'tailwind.config.ts',
}

def find_files():
    result = []
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, 'src')):
        dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next', '__pycache__')]
        for f in filenames:
            if f.endswith(('.tsx', '.ts', '.css')):
                rel = os.path.relpath(os.path.join(dirpath, f), ROOT)
                if rel not in SKIP_FILES:
                    result.append(rel)
    return result

# Token replacement map (most specific first to avoid partial substring matches)
TOKEN_MAP = [
    # ctp-surface hierarchy (longest first)
    ('ctp-surface2',    'surface-container-highest'),
    ('ctp-surface1',    'surface-container-high'),
    ('ctp-surface0',    'surface-container'),
    # ctp backgrounds
    ('ctp-crust',       'surface-container-lowest'),
    ('ctp-mantle',      'surface-container-low'),
    ('ctp-base',        'surface-container'),
    # ctp text / subtext / overlay (all → on-surface-variant except text)
    ('ctp-subtext1',    'on-surface-variant'),
    ('ctp-subtext0',    'on-surface-variant'),
    ('ctp-overlay2',    'on-surface-variant'),
    ('ctp-overlay1',    'on-surface-variant'),
    ('ctp-overlay0',    'on-surface-variant'),
    ('ctp-text',        'on-surface'),
    # ctp accent colors
    ('ctp-rosewater',   'primary'),
    ('ctp-flamingo',    'secondary'),
    ('ctp-pink',        'tertiary'),
    ('ctp-mauve',       'tertiary'),
    ('ctp-red',         'error'),
    ('ctp-maroon',      'secondary'),
    ('ctp-peach',       'primary'),
    ('ctp-yellow',      'primary'),
    ('ctp-green',       'on-surface'),
    ('ctp-teal',        'tertiary'),
    ('ctp-sky',         'tertiary'),
    ('ctp-sapphire',    'secondary'),
    ('ctp-blue',        'secondary'),
    ('ctp-lavender',    'tertiary'),
    # sand scale (longest first to avoid sand-50 matching sand-500)
    ('sand-600',        'on-surface-variant'),
    ('sand-500',        'on-surface-variant'),
    ('sand-400',        'on-surface-variant'),
    ('sand-300',        'outline'),
    ('sand-200',        'surface-container-high'),
    ('sand-100',        'surface-container'),
    ('sand-50',         'background'),
]

# Remove "dark:" prefix (keeps the class value, promotes it to unconditional)
# Safe: only matches the literal string "dark:" not inside strings
DARK_RE = re.compile(r'\bdark:')

def migrate(content):
    # Step 1: Strip dark: prefix everywhere (safe simple replacement)
    content = DARK_RE.sub('', content)

    # Step 2: Replace token names (simple string replacement, most-specific first)
    for old, new in TOKEN_MAP:
        content = content.replace(old, new)

    return content

def main():
    files = find_files()
    changed = 0
    for rel in sorted(files):
        abs_path = os.path.join(ROOT, rel)
        try:
            with open(abs_path, 'r', encoding='utf-8') as f:
                original = f.read()
        except Exception as e:
            print(f'  ! Could not read {rel}: {e}', file=sys.stderr)
            continue

        migrated = migrate(original)
        if migrated != original:
            with open(abs_path, 'w', encoding='utf-8') as f:
                f.write(migrated)
            print(f'  ✓ {rel}')
            changed += 1

    print(f'\nDone — {changed} files updated.')

if __name__ == '__main__':
    main()
