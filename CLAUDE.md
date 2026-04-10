# Project 365 Blog — CLAUDE.md

> **Achtung:** Diese Datei ist die zentrale Kontextquelle für Claude Code. Niemals teilweise überschreiben — immer vollständig validieren vor dem Commit.

## Projektübersicht

Öffentliches tägliches Journal (365-Tage-Projekt) mit integriertem Habit-Tracking und Metriken-Visualisierung. Self-hosted im HomeLab.

- **Domain:** project365.dom42.ch
- **Repo:** github.com/dom-4242/project365blog (public)
- **Server:** pilab01 / pilab01.lab.dom42.ch
- **Lokal:** /Users/dominiquestampfli/Documents/13_Dev/6_Project365Blog

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth.js (Google OAuth, Single-Admin)
- Tiptap Rich-Text Editor
- next-intl (i18n: DE, EN, PT, FR, IT, ES)
- Docker Compose (Production)
- Recharts (Visualisierungen)
- Claude API (AI-Übersetzungen, Monats-Zusammenfassungen)

## Architektur-Entscheidungen

### ADR-001: Database-first Content

Journal-Einträge werden in PostgreSQL gespeichert (JournalEntry Model), nicht als MDX-Dateien. Der Tiptap Editor speichert Rich-Text als JSON/HTML in der DB.

### Routing

- Public: `/[locale]/` (de, en) — next-intl
- Admin: `/admin/` (Root-Level, **nicht** unter `[locale]`)
- Admin bleibt nur auf Deutsch

### Drei Säulen (Habits)

**Bewegung & Training** (MovementLevel Enum):

- `MINIMAL` — Unter 10k Schritte, kein Training ❌
- `STEPS_ONLY` — 10k+ Schritte, kein Training ✅
- `TRAINED_ONLY` — Training absolviert, unter 10k Schritte ✅
- `STEPS_TRAINED` — 10k+ Schritte + Training ✅

**Ernährung** (NutritionLevel Enum):

- `NONE` — 0 Mahlzeiten ❌
- `ONE_MEAL` — 1 Mahlzeit ❌
- `TWO_MEALS` — 2 Mahlzeiten ✅ (Minimum für Zielerfüllung)
- `THREE_MEALS` — 3 Mahlzeiten ✅

**Rauchstopp** (SmokingLevel Enum):

- `SMOKED` — Geraucht ❌
- `NICOTINE_REPLACEMENT` — Nikotinersatz ✅ (Minimum für Zielerfüllung)
- `SMOKE_FREE` — Rauchfrei ohne Hilfsmittel ✅

### Design-System: "Kinetic Lab" (ab Phase 6)

**Nur Dark Mode** — kein Light/Dark Toggle.

#### Farbpalette

- Background: `#0e0e0e`
- Surface-Container-Lowest: `#000000`
- Surface-Container-Low: `#131313`
- Surface-Container: `#1a1919`
- Surface-Container-High: `#201f1f`
- Surface-Container-Highest: `#262626`
- Surface-Variant: `#262626`
- Surface-Bright: `#2c2c2c`
- Primary: `#ff8f70` (warmes Orange)
- Primary-Container: `#ff7852`
- Primary-Dim: `#ff734c`
- Secondary: `#fc7c7c`
- Tertiary: `#eaa5ff`
- Error: `#ff716c`
- On-Surface: `#ffffff`
- On-Surface-Variant: `#adaaaa`
- Outline: `#767575`
- Outline-Variant: `#484847`

#### Typografie

- Headline Font: **Space Grotesk** (300–700) — `font-headline`
- Body/Label Font: **Manrope** (300–800) — `font-body`, `font-label`
- Headlines: `font-headline font-bold tracking-tighter`
- Body: `font-body leading-relaxed`
- Labels/Badges: `font-label font-bold tracking-widest uppercase`

#### Icons

- **Google Material Symbols** (Outlined, variable)
- Variable Font Settings: `font-variation-settings: 'FILL' 0|1`

#### Border-Radius

- Default: `0.125rem` (2px)
- lg: `0.25rem` (4px)
- xl: `0.5rem` (8px)
- full: `0.75rem` (12px)

#### Glassmorphism

- Backdrop-Blur: `backdrop-blur-xl`
- Semi-transparente Hintergründe: `bg-surface-variant/40`
- Subtile Borders: `border border-outline-variant/15`
- Card-Hover: `hover:bg-surface-variant/60 transition-colors`

## Schema-Details (wichtig!)

- Feld `bannerUrl` (nicht `bannerImage` oder `imageUrl`)
- Felder `movement`, `nutrition`, `smoking` (nicht `habitMovement` etc.)
- `published` Default: `true`
- Übersetzungen: separates `Translation` Model
- Prisma Client Singleton: `lib/db.ts`
- Feld `excerpt`: Pflichtfeld im Sinne der UX — optional im Editor, aber aktiv genutzt für SEO Meta-Description, Open Graph, RSS-Feed, Suche (indexiert + angezeigt), Feed-Karten-Vorschau und AI-Monats-Zusammenfassungen. Wird automatisch aus Content generiert wenn leer (`extractExcerpt()` in `actions.ts`).

## Environment Variables

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAIL=...
FITBIT_CLIENT_ID=23VD2F
FITBIT_CLIENT_SECRET=... (Rotation ausstehend!)
FITBIT_USER_ID=6RWGGH
HEALTH_IMPORT_TOKEN=...
ANTHROPIC_API_KEY=...
```

## Projektstruktur

```
project365blog/
├── CLAUDE.md              → Diese Datei
├── prisma/schema.prisma   → Datenbank-Schema
├── src/app/               → Next.js Pages & API Routes
│   ├── [locale]/          → Öffentliche Seiten (i18n)
│   └── admin/             → Admin-Bereich (nur DE, kein [locale])
├── src/components/        → React-Komponenten
│   ├── habits/            → Drei-Säulen-Dashboard
│   ├── metrics/           → Charts (Gewicht, Schritte)
│   ├── journal/           → Feed & Posts
│   └── reactions/         → Emoji-Reactions
├── src/lib/               → Business-Logik
├── messages/              → i18n Message Files (de.json, en.json, ...)
├── content/journal/       → Legacy MDX (nicht mehr aktiv genutzt)
├── public/images/journal/ → Banner-Bilder
├── scripts/               → Utility Scripts
└── .github/workflows/     → CI/CD Pipelines
```

## Workflow & Konventionen

- **Git:** Feature Branch Workflow → Issue → Branch → Claude Code → PR → CI → Squash Merge mit `-d`
- **Commits:** Conventional Commits in Englisch (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **Direkt auf main:** Nur für Dokumentation/Content-Änderungen
- **Issue-Nummern:** Nicht fortlaufend (GitHub zählt Issues + PRs zusammen)
- **CI:** GitHub Actions — Lint, Type-Check, Tests (Vitest + PostgreSQL), Build
- **Deploy:** Docker Image → ghcr.io/dom-4242/project365blog

## CI/CD Hinweise

- `pnpm/action-setup`: Keine `version:` angeben (packageManager in package.json)
- CI: `migrate deploy` verwenden, nicht `migrate dev`
- `force-dynamic` für `sitemap.xml`
- Dockerfile: pnpm hoisted node_modules + Prisma Alpine Binary Targets

## Integrations-Status

### Fitbit API

- OAuth 2.0, Client ID `23VD2F`, User `6RWGGH`
- Access/Refresh Tokens vorhanden
- ⚠️ Client Secret Rotation ausstehend
- Cron-Container für automatischen Sync

### Apple Health Auto Export

- iOS App (Lifetime), POSTing an `/api/health-import`
- Bearer Token Auth funktioniert (200 OK)
- ⚠️ `daysProcessed: 0` — Parser `parseHealthPayload()` matcht nicht mit v2 Export-Format
- Fix ausstehend

### Infrastruktur

- Nginx Proxy Manager: Container `nginxproxy`, DNS fix applied (`dns: 192.168.1.11`)
- App Container: `app-web-1`, Compose Dir: `/container/project365blog/app`
- HomeLab Deployment: ✅ abgeschlossen

## Abgeschlossene Phasen

### Phase 1 — MVP ✅

Next.js Setup, MDX, Habits-Sync, Fitbit API, Journal Feed, Reactions, Dashboard, Metriken, Docker, UI Redesign

### Phase 1.5 — Web-CMS & Auth ✅

NextAuth Google OAuth, JournalEntry DB-Model (Migration von MDX), Tiptap Editor, Habits-Auswahl, Banner Upload, Metriken-Erfassung, Admin-Dashboard

### Phase 2 — Polish, Fitbit & Apple Health ✅

Fitbit API live, Apple Health Integration, Dark Mode, SEO, RSS-Feed, Suche, Animationen, Eintrag löschen, Admin-Link

### Phase 3 — Mehrsprachigkeit ✅

next-intl Setup (/de, /en), UI-Übersetzungen, Sprachumschalter, AI-Übersetzung via Claude API, Übersetzungs-Cache, SEO hreflang

### Phase 4 — Visualisierung, Analytics & Datenqualität ✅

i18n-Lücken geschlossen, statische Werte (Grösse/Ziele), GitHub-style Contribution Grid, Live-Vorschau im Editor, PostgreSQL Backup-Strategie, Admin-Analytics (Privacy-first), AI-Monats-Zusammenfassungen

### Phase 5 — Bugfixing, Aufräumen & HomeLab Deployment ✅

Phase 5a: Bugfixing (Banner-Bild, HTML-Tag, Drop-Cap, Säulen-Logik mit TRAINED_ONLY, Security Review, Deploy-Webhook, Admin-Link, Excerpt-Feld, Favicon)
Phase 5b: UI/UX Redesign (Catppuccin → wird in Phase 6 durch Kinetic Lab ersetzt)
Phase 5c: Neue Funktionen (Starttag-Einstellung, Emoji-Reactions im Feed, zusätzliche Sprachen PT/FR/IT/ES)
HomeLab Deployment abgeschlossen

## Aktuelle Phase: Phase 6 — "Kinetic Lab" Redesign

Komplettes visuelles Redesign: Dark-Only, warmes Orange, Space Grotesk + Manrope, Material Symbols, Bento-Grid Dashboard, Glassmorphism-Effekte.

### Phase 6a — Design Foundation

| #   | Issue                                             | Status  |
| --- | ------------------------------------------------- | ------- |
| 125 | Dark-Only Farbsystem und Tailwind-Theme umstellen | ⬜ Open |
| 126 | Typografie-System (Space Grotesk + Manrope)       | ⬜ Open |
| 127 | Material Symbols als Icon-Set integrieren         | ⬜ Open |
| 128 | Border-Radius und Glassmorphism Design-Tokens     | ⬜ Open |

### Phase 6b — Seitenstruktur & Komponenten

| #   | Issue                                                 | Status  |
| --- | ----------------------------------------------------- | ------- |
| 129 | Navigation im Kinetic-Stil redesignen                 | ⬜ Open |
| 130 | Hero-Section mit Hintergrundbild und CTA              | ⬜ Open |
| 131 | Live Status Section — Habits & Metriken im Bento-Grid | ⬜ Open |
| 132 | Daily Journals Section auf Startseite redesignen      | ⬜ Open |
| 133 | Footer im neuen Design-Stil                           | ⬜ Open |

### Phase 6c — Neue Seiten & Inhalte

| #   | Issue                                                       | Status  |
| --- | ----------------------------------------------------------- | ------- |
| 134 | "Über das Projekt" Seite (21-Tage-Wanderung, Spendenaktion) | ⬜ Open |
| 135 | Journal-Einzelansicht im neuen Stil                         | ⬜ Open |
| 136 | Journal-Übersichtsseite im neuen Stil                       | ⬜ Open |

### Empfohlene Reihenfolge

1. #125 Farbsystem → 2. #126 Typografie → 3. #127 Icons + #128 Glassmorphism → 4. #129 Navigation → 5. #130 Hero → 6. #131 Live Status → 7. #132 Journals → 8. #133 Footer → 9. #135 Einzelansicht → 10. #136 Übersicht → 11. #134 Über-Seite

## Backlog (Phase 7+)

- AI-generierte Banner-Bilder für Journal-Einträge (konsistenter Stil, angepasst an Inhalt)
- Live Location Map (OwnTracks)
- Betterplace Spendensäule / Widget
- Komoot Routen-Anzeige
- Apple Health Parser Fix (`parseHealthPayload()` v2 Format)

## Bekannte Bugs (nicht in Issues)

- Komisches Icon neben Abmelden im Admin
- Banner Bild auswählen öffnet Fotos App auf Apple Geräten
- Eintrag Vorschau Box nicht übersetzt bei maschineller Übersetzung
- Health Auto Export automatische Ausführung geht nicht
