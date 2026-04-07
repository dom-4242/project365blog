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
- next-intl (i18n: DE, EN — Phase 5c erweitert um PT, FR, IT, ES)
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
- `TRAINED_ONLY` — Training absolviert, unter 10k Schritte ✅ _(NEU in Phase 5a)_
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

### Design-System: Catppuccin (ab Phase 5b)

- Light Mode: Catppuccin **Latte**
- Dark Mode: Catppuccin **Mocha**
- Referenz: https://catppuccin.com/palette
- npm: @catppuccin/palette

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
├── messages/              → i18n Message Files (de.json, en.json)
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
- Fix blockiert durch ausstehendes HomeLab Deployment

### Infrastruktur

- Nginx Proxy Manager: Container `nginxproxy`, DNS fix applied (`dns: 192.168.1.11`)
- App Container: `app-web-1`, Compose Dir: `/container/project365blog/app`
- ⚠️ HomeLab Deployment noch ausstehend

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

## Aktuelle Phase: Phase 5

### Phase 5a — Bugfixing & Aufräumen

1. Banner-Bild wird im Feed nicht angezeigt (Bug)
2. HTML-Tag `<br/>` im Startseiten-Titel (Bug)
3. Drop-Cap (übergrosse Anfangsbuchstaben) entfernen (Bug)
4. Säulen-Logik für Zielerfüllung anpassen (neue Stufe `TRAINED_ONLY`, Schwellen ändern)
5. Security Review + Massnahmen
6. Deploy-Webhook in GitHub Actions
7. Admin → Startseite Link
8. Excerpt-Feld klären/dokumentieren
9. Favicon mit AI generieren

### Phase 5b — UI/UX Redesign (Catppuccin)

1. Catppuccin Design-System als Tailwind-Theme (Latte/Mocha)
2. Public-Bereich Startseite neu strukturieren (Hero + Tabs/Sections)
3. Admin-Bereich Navigation überarbeiten (Sidebar statt überladene Top-Nav)
4. Projektbeschreibung auf Startseite für Besucher

### Phase 5c — Neue Funktionen

1. Starttag in Admin-Einstellungen definierbar
2. Emoji-Reactions in Journal-Übersichtsseite (Feed)
3. Zusätzliche Sprachen (PT, FR, IT, ES) — UI + AI-Übersetzung, Admin bleibt DE

## Backlog (Phase 6+)

- Vierte Säule / Spenden-Indikator (Betterplace)
- Social Media Strategie
- Live Location Map (OwnTracks)
- Komoot Routen-Anzeige
- Apple Health Parser Fix (nach HomeLab Deployment)

## Bekannte Bugs (nicht in Issues)

- Komisches Icon neben Abmelden im Admin
- Banner Bild auswählen öffnet Fotos App auf Apple Geräten
- Eintrag Vorschau Box nicht übersetzt bei maschineller Übersetzung
- Health Auto Export automatische Ausführung geht nicht
