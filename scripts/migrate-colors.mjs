#!/usr/bin/env node
/**
 * Kinetic Lab color migration script
 * Replaces Catppuccin ctp-* and sand-* tokens with new Kinetic Lab tokens.
 * Also strips dark: prefixes (keeping the dark-variant value).
 */

import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Files to process
const files = [
  ...globSync('src/**/*.{tsx,ts,css}', { cwd: ROOT }),
].filter(f =>
  !f.includes('node_modules') &&
  !f.includes('migrate-colors') &&
  f !== 'src/styles/globals.css' &&          // already done
  f !== 'src/app/layout.tsx' &&              // already done
  f !== 'src/components/providers/ThemeProvider.tsx' // already done
)

// ─────────────────────────────────────────────────────────────────
// Token replacement map (ordered — longest first to avoid partial matches)
// ─────────────────────────────────────────────────────────────────
const TOKEN_MAP = [
  // ctp-surface hierarchy (order matters: surface2 before surface1 before surface0)
  ['ctp-surface2',      'surface-container-highest'],
  ['ctp-surface1',      'surface-container-high'],
  ['ctp-surface0',      'surface-container'],
  // ctp backgrounds
  ['ctp-crust',         'surface-container-lowest'],
  ['ctp-mantle',        'surface-container-low'],
  ['ctp-base',          'surface-container'],
  // ctp text / subtext / overlay
  ['ctp-subtext1',      'on-surface-variant'],
  ['ctp-subtext0',      'on-surface-variant'],
  ['ctp-overlay2',      'on-surface-variant'],
  ['ctp-overlay1',      'on-surface-variant'],
  ['ctp-overlay0',      'on-surface-variant'],
  ['ctp-text',          'on-surface'],
  // ctp accent colors
  ['ctp-rosewater',     'primary'],
  ['ctp-flamingo',      'secondary'],
  ['ctp-pink',          'tertiary'],
  ['ctp-mauve',         'tertiary'],
  ['ctp-red',           'error'],
  ['ctp-maroon',        'secondary'],
  ['ctp-peach',         'primary'],
  ['ctp-yellow',        'primary'],
  ['ctp-green',         'on-surface'],
  ['ctp-teal',          'tertiary'],
  ['ctp-sky',           'tertiary'],
  ['ctp-sapphire',      'secondary'],
  ['ctp-blue',          'secondary'],
  ['ctp-lavender',      'tertiary'],
  // sand scale
  ['sand-50',           'background'],
  ['sand-100',          'surface-container'],
  ['sand-200',          'surface-container-high'],
  ['sand-300',          'outline'],
  ['sand-400',          'on-surface-variant'],
  ['sand-500',          'on-surface-variant'],
  ['sand-600',          'on-surface-variant'],
]

// Nutrition/Smoking/Movement dark: adjustments
// dark:bg-movement-600/10 → bg-movement-600/10
// dark:text-movement-400  → text-movement-400
// We handle these via the dark: stripping pass below.

function migrateContent(content) {
  let out = content

  // ── Step 1: Handle "X dark:Y" pairs → keep only Y (without dark:) ──
  // Pattern: a Tailwind class followed by space and dark: variant of same utility type
  // e.g. "bg-sand-50/95 dark:bg-ctp-mantle/95" → "bg-ctp-mantle/95" (then token-replaced later)
  // e.g. "text-nutrition-600 dark:text-nutrition-500" → "text-nutrition-500"
  // e.g. "hover:text-nutrition-700 dark:hover:text-nutrition-400" → "hover:text-nutrition-400"
  //
  // Strategy: strip the light variant when a dark: variant follows it
  out = out.replace(
    /(?:hover:|focus:|group-hover:|disabled:)?[\w-]+(?:\/[\d.]+)?\s+dark:(?:(hover:|focus:|group-hover:|disabled:)?[\w-]+(?:\/[\d.]+)?)/g,
    (match) => {
      // Extract dark: part and remove the "dark:" prefix
      const darkIdx = match.indexOf(' dark:')
      if (darkIdx === -1) return match
      return match.slice(darkIdx + 6) // " dark:X" → "X"
    }
  )

  // ── Step 2: Remove remaining standalone dark: prefixes ──
  out = out.replace(/\bdark:/g, '')

  // ── Step 3: Token name replacements ──
  for (const [from, to] of TOKEN_MAP) {
    // Replace as part of Tailwind class token (after bg-, text-, border-, etc.)
    // Using word boundary awareness via negative lookbehind/lookahead
    out = out.split(from).join(to)
  }

  return out
}

let changed = 0
for (const rel of files) {
  const abs = path.join(ROOT, rel)
  let original
  try {
    original = readFileSync(abs, 'utf8')
  } catch {
    continue
  }
  const migrated = migrateContent(original)
  if (migrated !== original) {
    writeFileSync(abs, migrated, 'utf8')
    console.log(`  ✓ ${rel}`)
    changed++
  }
}

console.log(`\nDone — ${changed} files updated.`)
