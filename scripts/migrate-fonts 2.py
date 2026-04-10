#!/usr/bin/env python3
"""
Issue #126: Migrate font class names
- font-display → font-headline (in TSX/TS/CSS files)
- --font-display → --font-headline (CSS custom property references)
"""

import os
import sys

SRC_DIR = os.path.join(os.path.dirname(__file__), '..', 'src')
EXTENSIONS = ('.tsx', '.ts', '.css')

REPLACEMENTS = [
    ('font-display font-semibold', 'font-headline font-semibold'),
    ('font-display font-bold',     'font-headline font-bold'),
    ('font-display font-semibold', 'font-headline font-semibold'),
    ('font-display text-',        'font-headline text-'),
    ('"font-display"',            '"font-headline"'),
    ("'font-display'",            "'font-headline'"),
    # Generic catch-all (e.g. "font-display" followed by space or end of class string)
    ('font-display',              'font-headline'),
    # CSS variable
    ('var(--font-display)',       'var(--font-headline)'),
    ('--font-display',            '--font-headline'),
]

changed = []
skipped = []

for root, dirs, files in os.walk(SRC_DIR):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next')]
    for fname in files:
        if not any(fname.endswith(ext) for ext in EXTENSIONS):
            continue
        path = os.path.join(root, fname)
        with open(path, 'r', encoding='utf-8') as f:
            original = f.read()
        content = original
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)
        if content != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            changed.append(os.path.relpath(path, os.path.join(SRC_DIR, '..')))
        else:
            skipped.append(os.path.relpath(path, os.path.join(SRC_DIR, '..')))

print(f"\n✅ Changed {len(changed)} files:")
for p in changed:
    print(f"   {p}")
print(f"\n⏭  Skipped {len(skipped)} files (no changes needed)")
