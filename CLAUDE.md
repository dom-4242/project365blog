# Project 365 Blog

## Projektübersicht

Ein öffentliches tägliches Journal (365-Tage-Projekt) mit integriertem Habit-Tracking und Metriken-Visualisierung.
Der Blog dient als Accountability-Tool: tägliche Einträge dokumentieren Fortschritte, Gewohnheiten werden getrackt und Metriken über Zeit visualisiert.

**Kernidee:** Persönliche Veränderung öffentlich dokumentieren — ehrlich, aber ohne sehr private Details.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Sprache:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Content:** Datenbank-basiert mit Rich-Text Editor (Web-CMS)
- **Auth:** NextAuth.js mit Google OAuth (Single-Admin)
- **Rich-Text Editor:** Tiptap (headless, erweiterbar, Markdown-kompatibel)
- **i18n:** next-intl mit Locale-Routing (/de, /en)
- **Datenbank:** PostgreSQL (Docker Container)
- **ORM:** Prisma (Type-safe, Schema-first, Migrations)
- **Charts:** Recharts für Metriken-Visualisierung
- **Deployment:** Docker Compose → HomeLab (Self-Hosted)
- **CI/CD:** GitHub Actions
- **Package Manager:** pnpm

## Projektstruktur

```
project365blog/
├── CLAUDE.md                          ← Diese Datei
├── README.md
├── .npmrc                             ← node-linker=hoisted (für Docker/Prisma)
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   └── bug.md
│   └── workflows/
│       ├── ci.yml                     ← Lint, Test, Build bei PR
│       └── deploy.yml                 ← Docker Build & Push bei Merge in main
├── prisma/
│   ├── schema.prisma                  ← Datenbank-Schema
│   ├── migrations/                    ← Auto-generierte Migrations
│   └── seed.ts                        ← Seed-Daten für Entwicklung
├── messages/
│   ├── de.json                        ← Deutsche UI-Übersetzungen
│   └── en.json                        ← Englische UI-Übersetzungen
├── src/
│   ├── app/
│   │   ├── [locale]/                  ← Locale-Routing (next-intl)
│   │   │   ├── layout.tsx             ← Root Layout mit Navigation
│   │   │   ├── page.tsx               ← Startseite: Habits + Metriken + Feed
│   │   │   ├── journal/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       ← Einzelner Journal-Eintrag
│   │   │   └── admin/
│   │   │       ├── page.tsx           ← Admin-Dashboard
│   │   │       ├── entries/
│   │   │       │   ├── new/page.tsx   ← Neuer Eintrag (Tiptap Editor)
│   │   │       │   └── [id]/edit/     ← Eintrag bearbeiten
│   │   │       ├── metrics/           ← Manuelle Metriken-Erfassung
│   │   │       └── translations/      ← Übersetzungs-Verwaltung
│   │   └── api/
│   │       ├── reactions/route.ts     ← Emoji-Reactions API (GET/POST)
│   │       ├── fitbit/                ← Fitbit OAuth & Sync
│   │       ├── health-import/         ← Apple Health Webhook
│   │       └── translate/             ← AI-Übersetzung via Claude API
│   ├── components/
│   │   ├── ui/                        ← Basis-UI-Komponenten
│   │   ├── habits/                    ← Drei-Säulen-Dashboard
│   │   ├── metrics/                   ← Charts (Gewicht, Schritte)
│   │   ├── journal/                   ← Feed & Posts
│   │   ├── reactions/                 ← Emoji-Reactions
│   │   └── admin/                     ← Admin-spezifische Komponenten
│   ├── lib/
│   │   ├── prisma.ts                  ← Prisma Client Singleton
│   │   ├── journal.ts                 ← Journal-Einträge (DB Queries)
│   │   ├── habits.ts                  ← Habits-Logik & Streak-Berechnung
│   │   ├── metrics.ts                 ← Metriken-Aggregation
│   │   ├── fitbit.ts                  ← Fitbit API Client
│   │   └── translate.ts              ← Übersetzungs-Logik (Claude API)
│   └── middleware.ts                  ← Auth-Schutz für /admin/*
├── public/images/journal/             ← Banner-Bilder (Upload)
├── Dockerfile                         ← Multi-stage Build (Alpine)
└── docker-compose.yml                 ← Next.js + PostgreSQL
```

## Content-Format: Journal-Einträge

Einträge werden **im Browser über einen Rich-Text Editor** erstellt und in der Datenbank gespeichert.
Kein MDX, kein Git-Commit für Content — alles läuft über das Web-CMS.

**Wichtig:** Es gibt eine klare Trennung zwischen **Gewohnheiten** und **Metriken**.

- **Gewohnheiten (Habits):** Die drei Säulen des Projekts. Subjektive tägliche Selbsteinschätzung
  mit definierten Erfüllungsgraden. Werden im Journal-Editor als Pflichtfelder erfasst.
- **Metriken (Metrics):** Objektive, messbare Körper- und Aktivitätswerte.
  Werden primär automatisch via APIs (Fitbit, Apple Health) importiert.
  Können optional auch manuell im Admin-Bereich eingetragen werden.

### Die drei Säulen (Habits)

**Säule 1 — Bewegung & Training** (MovementLevel):

- `MINIMAL` → Minimale Schritte, kein Training
- `ACTIVE` → Über 10'000 Schritte
- `TRAINING` → Über 10'000 Schritte + Training

**Säule 2 — Ernährung** (NutritionLevel):

- `NONE` → Keine gesunde Mahlzeit
- `ONE` → Eine gesunde Mahlzeit
- `TWO` → Zwei gesunde Mahlzeiten
- `THREE` → Drei gesunde Mahlzeiten

**Säule 3 — Rauchstopp** (SmokingStatus):

- `SMOKED` → Es wurde geraucht
- `REPLACEMENT` → Nicht geraucht, aber Nikotinersatz
- `NONE` → Rauchfrei ohne Hilfsmittel

### Metriken (automatisch via API oder manuell)

- Gewicht (kg) — Fitbit Aria Waage
- Körperfettanteil (%) — Fitbit Aria Waage
- BMI — berechnet aus Gewicht + Körpergrösse
- Schritte — Fitbit / Apple Watch
- Aktive Minuten — Fitbit
- Verbrannte Kalorien — Fitbit
- Distanz (km) — Fitbit
- Ruheherzfrequenz (bpm) — Fitbit / Apple Watch
- Schlafdauer (min) — Fitbit / Apple Watch

## Datenbank-Schema (Prisma)

```prisma
// prisma/schema.prisma

model JournalEntry {
  id             String          @id @default(cuid())
  date           DateTime        @unique @db.Date
  slug           String          @unique     // Default: Datum (2026-03-26)
  title          String
  content        String          @db.Text    // HTML von Tiptap Editor
  excerpt        String?
  bannerImage    String?         // Pfad zum Banner-Bild
  tags           String[]        @default([])
  published      Boolean         @default(false)

  // Die drei Säulen — Pflichtfelder
  habitMovement  MovementLevel
  habitNutrition NutritionLevel
  habitSmoking   SmokingStatus

  // Übersetzung
  translatedTitle   String?
  translatedContent String?      @db.Text
  translatedAt      DateTime?
  translationHash   String?      // Hash des Originals, um Änderungen zu erkennen

  reactions      Reaction[]

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([date])
  @@index([published])
}

enum MovementLevel {
  MINIMAL
  ACTIVE
  TRAINING
}

enum NutritionLevel {
  NONE
  ONE
  TWO
  THREE
}

enum SmokingStatus {
  SMOKED
  REPLACEMENT
  NONE
}

model DailyMetrics {
  id             String        @id @default(cuid())
  date           DateTime      @unique @db.Date

  // Körperdaten (Quelle: Fitbit Aria / manuell)
  weight         Float?        // kg
  bodyFat        Float?        // % Körperfettanteil
  bmi            Float?        // BMI

  // Aktivität (Quelle: Fitbit/Apple Watch oder manuell)
  steps          Int?          // Tagesschritte
  activeMinutes  Int?          // Aktive Minuten
  caloriesBurned Int?          // Verbrannte Kalorien
  distance       Float?        // Distanz in km

  // Vitaldaten (Quelle: Apple Watch/Fitbit)
  restingHR      Int?          // Ruheherzfrequenz (bpm)
  sleepDuration  Int?          // Schlafdauer in Minuten

  source         MetricSource  @default(MANUAL)

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([date])
}

enum MetricSource {
  MANUAL           // Manuell im Admin-Bereich eingetragen
  FITBIT           // Automatisch von Fitbit API
  APPLE_HEALTH     // Automatisch von Apple Health (via Health Auto Export)
  MERGED           // Kombination aus mehreren Quellen
}

model Reaction {
  id           String       @id @default(cuid())
  emoji        ReactionType
  ipHash       String       // SHA-256 Hash der IP (Spam-Schutz)

  journalEntry JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  entryId      String

  createdAt    DateTime     @default(now())

  @@unique([entryId, emoji, ipHash])  // Ein Emoji pro IP pro Eintrag
  @@index([entryId])
}

enum ReactionType {
  HEART            // ❤️  Berührt mich
  CLAP             // 👏  Gut gemacht
  FIRE             // 🔥  Stark
  MUSCLE           // 💪  Motivierend
  STAR             // ⭐  Inspirierend
}
```

### Datenbank-Regeln

- **JournalEntry:** Einzige Content-Quelle. Enthält Text (HTML von Tiptap), Habits und Metadaten.
  Habits sind direkt im Entry eingebettet (kein separates DailyHabits-Model).
- **DailyMetrics:** Automatisch via API-Sync ODER manuell im Admin-Bereich. Alles optional.
- **Reactions:** Verknüpft via Foreign Key mit JournalEntry. IP nur als SHA-256 Hash.
- Bei Metriken-Konflikten: Geräte-Daten (FITBIT/APPLE_HEALTH) > MANUAL.

### Umgebungsvariablen

```env
# .env.example
DATABASE_URL="postgresql://project365:password@localhost:5432/project365blog"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_EMAIL="deine@email.com"

# Fitbit API
FITBIT_CLIENT_ID="..."
FITBIT_CLIENT_SECRET="..."

# Claude API (für Übersetzungen)
ANTHROPIC_API_KEY="..."
```

## Features & Phasen

### Phase 1 — MVP ✅ (abgeschlossen)

- [x] Projektstruktur aufsetzen (Next.js, TypeScript, Tailwind, Prisma)
- [x] PostgreSQL + Prisma Setup
- [x] MDX-Integration & Habits-Sync
- [x] Fitbit API Integration
- [x] Journal Feed & Einzelansicht
- [x] Emoji-Reactions (❤️ 👏 🔥 💪 ⭐)
- [x] Gewohnheiten-Dashboard (Drei Säulen)
- [x] Metriken-Dashboard (Charts)
- [x] Docker Production Setup
- [x] UI Styling & Redesign

### Phase 1.5 — Web-CMS & Auth ✅ (abgeschlossen)

- [x] NextAuth.js mit Google OAuth (Single-Admin)
- [x] Admin-Bereich (/admin/) mit Middleware-Schutz
- [x] JournalEntry DB-Model (Migration von MDX → DB)
- [x] Rich-Text Editor (Tiptap) für Journal-Einträge
- [x] Banner-Bild Upload
- [x] Habits-Auswahl im Editor (Buttons für die drei Säulen)
- [x] Manuelle Metriken-Erfassung im Admin-Bereich
- [x] Admin-Dashboard mit Übersicht und Schnellzugriff

### Phase 2 — Polish, Fitbit & Apple Health ✅ (abgeschlossen)

- [x] Fitbit API in Betrieb nehmen und testen (#35)
- [x] Dark Mode (#37)
- [x] SEO-Optimierung — Meta-Tags, Open Graph, Sitemap, Structured Data (#38)
- [x] RSS-Feed (#39)
- [x] Suchfunktion über Einträge (#40)
- [x] Smooth Animationen & Reaction-Effekte (#41)
- [x] Eintrag löschen im Admin (#42)
- [x] Admin-Link auf Startseite für eingeloggte User (#43)
- [ ] ⏸️ Apple Health Integration (#36) — Code fertig, Automatisierung erst nach HomeLab Deployment

**Noch offen:** HomeLab Deployment (Voraussetzung für Apple Health Automatisierung)

### Phase 3 — Mehrsprachigkeit ✅ (abgeschlossen)

- [x] next-intl Setup mit Locale-Routing /de, /en (#53)
- [x] UI-Übersetzungen für Navigation, Footer und Dashboard (#54)
- [x] Sprachumschalter in Navigation (#55)
- [x] AI-Übersetzung der Journal-Einträge (DE → EN) via Claude API (#56)
- [x] Übersetzungs-Cache und Admin-UI für Übersetzungen (#57)
- [x] SEO für mehrsprachige Inhalte — hreflang, locale Meta-Tags (#58)

### Phase 4 — Visualisierung, Analytics & Datenqualität (aktuell)

- [ ] Übersetzungs-Lücken schliessen: Metriken-Diagramme, Vorschau-Box, Datumsformate i18n
- [ ] Statische Werte: Körpergrösse, Ziele im Admin erfassbar (Grundlage für BMI etc.)
- [ ] Jahres-Übersicht: GitHub-style Contribution Grid für die drei Säulen
- [ ] Live-Vorschau: Eintrag im Editor vor Veröffentlichung ansehen
- [ ] PostgreSQL Backup: Automatisiertes Backup mit Rotation und Restore-Script
- [ ] Admin-Analytics: Seitenaufrufe & Besucher-Statistiken (privacy-first, kein externer Dienst)
- [ ] Monats-Zusammenfassungen: AI-generierte Rückblicke per Claude API

### Phase 5 — Community & Outreach (Backlog)

- [ ] Vierte Säule / Spenden-Indikator (Betterplace-Kampagne)
- [ ] Betterplace-Kampagne Integration
- [ ] Zusätzliche Sprachen (PT, FR, IT, ES)
- [ ] Social Media Strategie & Content Management
- [ ] Emoji-Reactions auch in der Journal-Übersichtsseite
- [ ] Catppuccin Design-Anpassung

## Design-Richtlinien

### Ästhetik

- **Ton:** Warm, ehrlich, motivierend — kein klinisches Dashboard
- **Stil:** Editorial/Magazine-inspiriert mit klarer Typografie
- **Farbpalette:** Warme, erdige Töne als Basis; Akzentfarben für Metriken
  - Gewicht: Blau-Töne
  - Schritte: Grün-Töne
  - Rauchen: Amber/Orange (Streak-Erfolge in Grün)
- **Typografie:** Distinctive Display-Font für Überschriften, leserlicher Body-Font
- **Layout:** Grosszügiger Whitespace, Bilder prominent, Metriken-Dashboard als visueller Hingucker
- **Dark Mode:** Vollständig unterstützt (Tailwind dark: Klassen)

### Responsive Breakpoints

- Mobile: < 640px (primäre Erfahrung — Tagebuch wird oft mobil gelesen)
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Code-Konventionen

### TypeScript

- Strict mode aktiviert
- Interfaces bevorzugen über Types (ausser für Unions)
- Alle Komponenten-Props mit eigenem Interface definieren
- Keine `any` — wenn nötig, `unknown` mit Type Guards

### Komponenten

- Functional Components mit Arrow Functions
- Named Exports (kein Default Export ausser für Pages)
- Co-located Tests: `ComponentName.test.tsx` neben `ComponentName.tsx`

### Datei-Benennung

- Komponenten: PascalCase (`JournalCard.tsx`)
- Utilities/Libs: camelCase (`journal.ts`)
- Bilder: Datum als Name (`2026-03-26.jpg`)

### Git-Konventionen

- **Branch-Naming:** `feature/ISSUE-NR-kurze-beschreibung` (z.B. `feature/12-metrics-dashboard`)
- **Commit-Messages:** Conventional Commits auf Englisch
  - `feat:` Neues Feature
  - `fix:` Bug-Fix
  - `chore:` Dependencies, Config
  - `docs:` Dokumentation
  - `style:` CSS, Formatting
  - `refactor:` Code-Umbau ohne neue Funktion
  - `test:` Tests hinzufügen/ändern
- **PRs:** Immer gegen `main`, verlinkt mit Issue (`Closes #12`)
- **Kein direkter Push auf main** — immer über PR (Ausnahme: reine Doku-Änderungen)
- **Merge-Strategie:** Squash Merge mit `-d` Flag (Branch nach Merge löschen)

### Testing

- Unit Tests mit Vitest
- Component Tests mit React Testing Library
- DB-Tests mit Prisma Test-Utilities (separate Test-DB)
- Metriken- und Habit-Berechnungen besonders gut abdecken
- Mindestens Tests für: `lib/journal.ts`, `lib/habits.ts`, `lib/metrics.ts`,
  Streak-Berechnung pro Säule, Reaction-API, Fitbit-Sync-Logik

## Wichtige Entscheidungen (ADRs)

### ADR-001: MDX → DB-first Content

Ursprünglich MDX-Dateien im Git. Ab Phase 1.5 Migration auf DB-basierte Einträge mit
Tiptap Rich-Text Editor. JournalEntry als primäres Content-Model, HTML in der DB gespeichert.
Vorteile: Web-Editor, kein Git nötig für Content, einfachere Queries, Übersetzungen direkt am Model.

### ADR-002: Drei-Säulen Habits als Pflichtfelder

Die drei Gewohnheits-Säulen sind direkt im JournalEntry eingebettet (nicht als separates Model).
Jeder Eintrag MUSS alle drei Säulen erfassen. Erfüllungsgrade als Prisma Enums mit klar
definierten Stufen.

### ADR-003: Emoji-Reactions statt Kommentare

Anonyme Emoji-Reactions (❤️ 👏 🔥 💪 ⭐) statt Kommentar-System.
IP wird nur als SHA-256 Hash gespeichert. Keine Kommentare — vermeidet Moderationsaufwand.

### ADR-004: Docker Compose für Self-Hosting

Deployment als Docker Compose Stack im HomeLab: Next.js (Standalone-Mode) + PostgreSQL.
Reverse-Proxy (Nginx Proxy Manager) für HTTPS wird separat verwaltet.
PostgreSQL-Daten auf einem Docker Volume mit regelmässigem Backup.

### ADR-005: Fitbit API als primäre Metriken-Quelle

Fitbit Web API (OAuth 2.0) für automatischen Import von Gewicht, Körperfett (Aria Waage),
Schritte und Aktivitätsdaten. Täglicher Cron-Sync. Apple Health als ergänzende Quelle
via "Health Auto Export" App → REST-Webhook.

### ADR-006: Übersetzungs-Strategie (Phase 3)

AI-Übersetzung via Claude API. Einträge werden auf Deutsch erfasst, Übersetzungen
in der DB gecacht (translatedTitle, translatedContent, translationHash auf JournalEntry).
Admin-UI für Übersetzungs-Verwaltung und Kosten-Tracking. next-intl für UI-Strings.

### ADR-007: Tiptap als Rich-Text Editor

Tiptap (headless, React-basiert) statt alternatives (Slate, ProseMirror direkt, Draft.js).
Vorteile: Gute DX, erweiterbar, Markdown-Shortcuts, sauberer HTML-Output.
Content wird als HTML in der DB gespeichert.

## CI/CD Pipeline

### Bei jedem PR / Push:

1. Lint & Type-Check (ESLint + TypeScript)
2. Tests (Vitest mit echter PostgreSQL-Testdatenbank)
3. Build (Next.js Production Build)

### Bei Merge in main:

1. Docker-Image bauen
2. Push zu GitHub Container Registry (`ghcr.io/dom-4242/project365blog`)
3. (Geplant) HomeLab Deployment triggern

### CI-Lessons Learned:

- pnpm/action-setup: KEIN `version:` Feld setzen (nimmt automatisch aus packageManager)
- CI verwendet `prisma migrate deploy` (nicht `migrate dev`)
- sitemap.xml braucht `force-dynamic` Export
- Dockerfile: `node-linker=hoisted` in .npmrc für flaches node_modules
- Prisma: `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` für Alpine

## Befehle

```bash
# Entwicklung
pnpm dev                    # Dev-Server starten
pnpm build                  # Production Build
pnpm test                   # Tests ausführen
pnpm test:watch             # Tests im Watch-Mode
pnpm lint                   # ESLint ausführen
pnpm type-check             # TypeScript Prüfung

# Datenbank
pnpm db:generate            # Prisma Client generieren
pnpm db:migrate             # Migration erstellen und ausführen
pnpm db:push                # Schema pushen ohne Migration (Dev)
pnpm db:seed                # Seed-Daten laden
pnpm db:studio              # Prisma Studio öffnen (DB GUI)

# Content (via Web-Editor im Browser)
# Einträge werden unter /admin/entries/new im Browser erstellt.
# Kein CLI-Befehl nötig für neue Einträge.

# Docker
docker compose up -d        # Container starten
docker compose down         # Container stoppen
docker compose build        # Image neu bauen
```

## Umgebung

- **Lokale Entwicklung:** macOS, VS Code / Terminal mit Claude Code
- **Node.js:** 20 LTS
- **Deployment:** Docker auf HomeLab-Server (pilab01.lab.dom42.ch)
- **Volumes:** /container/project365blog/
- **Reverse Proxy:** Nginx Proxy Manager
- **Repository:** github.com/dom-4242/project365blog
- **Projektpfad lokal:** /Users/dominiquestampfli/Documents/13_Dev/6_Project365Blog
