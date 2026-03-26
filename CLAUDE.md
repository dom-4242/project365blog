# Project 365 Blog

## Projektübersicht

Ein öffentliches tägliches Journal (365-Tage-Projekt) mit integriertem Habit-Tracking und Metriken-Visualisierung. Der Blog dient als Accountability-Tool: tägliche Einträge dokumentieren Fortschritte, Gewohnheiten werden getrackt und Metriken über Zeit visualisiert.

**Kernidee:** Persönliche Veränderung öffentlich dokumentieren — ehrlich, aber ohne sehr private Details.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Sprache:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Content:** MDX-Dateien im Git-Repository (kein CMS)
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
├── src/
│   ├── app/
│   │   ├── layout.tsx                 ← Root Layout mit Navigation
│   │   ├── page.tsx                   ← Startseite: Metriken-Dashboard + Journal-Feed
│   │   ├── journal/
│   │   │   └── [slug]/
│   │   │       └── page.tsx           ← Einzelner Journal-Eintrag
│   │   └── api/
│   │       ├── reactions/
│   │       │   └── route.ts           ← API für Emoji-Reactions (GET/POST)
│   │       ├── health-import/
│   │       │   └── route.ts           ← Webhook für Apple Health Auto Export (POST)
│   │       └── cron/
│   │           └── fitbit-sync/
│   │               └── route.ts       ← Täglicher Fitbit API Sync (GET, auth-geschützt)
│   ├── components/
│   │   ├── ui/                        ← Basis-UI-Komponenten (Button, Card, etc.)
│   │   ├── journal/                   ← Journal-spezifische Komponenten
│   │   │   ├── JournalCard.tsx        ← Vorschaukarte im Feed
│   │   │   ├── JournalPost.tsx        ← Vollansicht eines Eintrags
│   │   │   └── JournalFeed.tsx        ← Liste aller Einträge
│   │   ├── reactions/                 ← Emoji-Reaction-System
│   │   │   ├── ReactionBar.tsx        ← Reaction-Leiste unter jedem Eintrag
│   │   │   └── ReactionButton.tsx     ← Einzelner Emoji-Button mit Counter
│   │   ├── habits/                    ← Gewohnheiten (Die drei Säulen)
│   │   │   ├── HabitsDashboard.tsx    ← Drei-Säulen-Übersicht auf Startseite
│   │   │   ├── HabitPillar.tsx        ← Einzelne Säule (Bewegung/Ernährung/Rauchstopp)
│   │   │   ├── HabitStreak.tsx        ← Streak-Anzeige pro Säule
│   │   │   └── HabitHeatmap.tsx       ← Erfüllungsgrade über Zeit
│   │   ├── metrics/                   ← Metriken (objektive Messwerte)
│   │   │   ├── MetricsDashboard.tsx   ← Haupt-Dashboard auf Startseite
│   │   │   ├── WeightChart.tsx        ← Gewichtsverlauf
│   │   │   ├── StepsChart.tsx         ← Schritte-Verlauf
│   │   │   └── BodyFatChart.tsx       ← Körperfett-Trend
│   │   └── layout/                    ← Layout-Komponenten
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Navigation.tsx
│   ├── lib/
│   │   ├── db.ts                      ← Prisma Client Singleton
│   │   ├── journal.ts                 ← MDX laden, parsen, sortieren
│   │   ├── habits.ts                  ← Habits aus Frontmatter lesen, Streaks berechnen
│   │   ├── metrics.ts                 ← Metriken-Aggregation aus DB
│   │   ├── fitbit.ts                  ← Fitbit API Client (OAuth, Datenabruf)
│   │   └── utils.ts                   ← Hilfsfunktionen
│   └── styles/
│       └── globals.css                ← Tailwind Base + Custom Styles
├── content/
│   └── journal/                       ← Alle Journal-Einträge als MDX
│       ├── 2026-03-26.mdx
│       ├── 2026-03-27.mdx
│       └── ...
├── public/
│   ├── images/
│   │   └── journal/                   ← Banner-Bilder pro Eintrag
│   │       ├── 2026-03-26.jpg
│   │       └── ...
│   └── favicon.ico
├── Dockerfile
├── docker-compose.yml                 ← Next.js + PostgreSQL + (optional) Adminer
├── .env.local                         ← Lokale Umgebungsvariablen (nicht im Git)
├── .env.example                       ← Vorlage für Umgebungsvariablen
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Content-Format: Journal-Einträge

Jeder Eintrag ist eine MDX-Datei mit strukturiertem Frontmatter.
**Wichtig:** Es gibt eine klare Trennung zwischen **Gewohnheiten** und **Metriken**.

- **Gewohnheiten (Habits):** Die drei Säulen des Projekts. Subjektive tägliche Selbsteinschätzung
  mit definierten Erfüllungsgraden. Werden manuell im Frontmatter erfasst.
- **Metriken (Metrics):** Objektive, messbare Körper- und Aktivitätswerte.
  Werden primär automatisch via APIs (Fitbit, Apple Health) importiert.
  Können optional auch im Frontmatter stehen (als Fallback/Override).

```mdx
---
title: "Tag 1 — Der Anfang"
date: "2026-03-26"
banner: "/images/journal/2026-03-26.jpg"
tags: ["motivation", "start"]

# === GEWOHNHEITEN (Die drei Säulen) ===
# Werden IMMER manuell erfasst — tägliche Selbsteinschätzung
habits:
  movement: "steps_only"    # Säule 1: Bewegung & Training
                            # "minimal"      → Unter 10k Schritte, kein Training
                            # "steps_only"   → Über 10k Schritte, kein Training
                            # "steps_trained"→ Über 10k Schritte + Training
  nutrition: "two"          # Säule 2: Ernährung
                            # "none"  → Keine gesunde Mahlzeit
                            # "one"   → Eine gesunde Mahlzeit
                            # "two"   → Zwei gesunde Mahlzeiten
                            # "three" → Drei gesunde Mahlzeiten
  smoking: "none"           # Säule 3: Rauchstopp
                            # "smoked"      → Es wurde geraucht
                            # "replacement" → Nicht geraucht, aber Nikotinersatz
                            # "none"        → Rauchfrei ohne Hilfsmittel
---

Heute beginnt das Projekt. Der erste Tag von 365...

## Was ich heute gelernt habe

...

## Wie ich mich fühle

...
```

### Regeln für Frontmatter

- `date` ist immer im Format YYYY-MM-DD
- `banner` ist optional — zeigt auf /images/journal/
- Alle drei Habits sind **required** — werden jeden Tag im Frontmatter erfasst
- Metriken werden NICHT im Frontmatter erfasst (kommen aus APIs) — ausser als optionaler Override
- Neue Habits/Metriken können später ergänzt werden — das Schema soll erweiterbar sein

## Datenbank-Schema (Prisma)

PostgreSQL wird für alle dynamischen Daten verwendet. MDX-Content bleibt im Filesystem.
**Kernprinzip:** Gewohnheiten = manuell (Frontmatter → DB), Metriken = automatisch (APIs → DB).

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// =============================================
// GEWOHNHEITEN — Die drei Säulen
// Quelle: Manuell via Frontmatter (sync bei Build/Commit)
// =============================================

model DailyHabits {
  id        String          @id @default(cuid())
  date      DateTime        @unique @db.Date

  // Säule 1: Bewegung & Training
  movement  MovementLevel
  // Säule 2: Ernährung
  nutrition NutritionLevel
  // Säule 3: Rauchstopp
  smoking   SmokingStatus

  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@index([date])
}

enum MovementLevel {
  MINIMAL          // Unter 10k Schritte, kein Training
  STEPS_ONLY       // Über 10k Schritte, kein Training
  STEPS_TRAINED    // Über 10k Schritte + Training
}

enum NutritionLevel {
  NONE             // Keine gesunde Mahlzeit
  ONE              // Eine gesunde Mahlzeit
  TWO              // Zwei gesunde Mahlzeiten
  THREE            // Drei gesunde Mahlzeiten
}

enum SmokingStatus {
  SMOKED           // Es wurde geraucht
  REPLACEMENT      // Nicht geraucht, aber Nikotinersatz
  NONE             // Rauchfrei ohne Hilfsmittel
}

// =============================================
// METRIKEN — Objektive Messwerte
// Quelle: Primär automatisch via Fitbit/Apple Health APIs
// Können auch manuell erfasst werden (source = MANUAL)
// =============================================

model DailyMetrics {
  id             String        @id @default(cuid())
  date           DateTime      @unique @db.Date

  // Körperwerte (Quelle: Fitbit Aria Waage)
  weight         Float?        // kg
  bodyFat        Float?        // % Körperfettanteil
  bmi            Float?        // BMI

  // Aktivität (Quelle: Fitbit/Apple Watch)
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
  MANUAL           // Von Hand oder via Frontmatter eingetragen
  FITBIT           // Automatisch von Fitbit API
  APPLE_HEALTH     // Automatisch von Apple Health (via Health Auto Export)
  MERGED           // Kombination aus mehreren Quellen
}

// =============================================
// EMOJI-REACTIONS — Leser-Interaktion
// Quelle: Rein DB-basiert (API-Route)
// =============================================

model Reaction {
  id        String       @id @default(cuid())
  slug      String       // Journal-Eintrag Slug (= Datum)
  emoji     ReactionType
  ipHash    String       // SHA-256 Hash der IP (Spam-Schutz)

  createdAt DateTime     @default(now())

  @@unique([slug, emoji, ipHash])  // Ein Emoji pro IP pro Eintrag
  @@index([slug])
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

- **Gewohnheiten (`DailyHabits`):** Sync aus Frontmatter bei Build/Commit. Alle drei Säulen required.
- **Metriken (`DailyMetrics`):** Primär via API-Sync (Fitbit, Apple Health). Alles optional weil
  nicht jede Quelle jeden Tag alle Werte liefert.
- **Reactions (`Reaction`):** Rein DB-basiert. IP nur als SHA-256 Hash gespeichert.
- Ein Besucher kann pro Eintrag jedes Emoji einmal vergeben (unique constraint).
- `MetricSource` trackt woher die Daten kommen — wichtig für Debugging und Datenqualität.
- Bei Konflikten zwischen Quellen: Geräte-Daten (FITBIT/APPLE_HEALTH) > MANUAL.

## Datenquellen & API-Integrationen

### Fitbit Web API (Phase 1)
Die Fitbit Aria Waage und der Fitbit Tracker liefern automatisch Daten.
Die Fitbit Web API bietet REST-Endpoints mit OAuth 2.0 Authentifizierung.

**Verfügbare Daten:**
- Gewicht, BMI, Körperfett → `GET /1/user/-/body/log/weight/date/{date}.json`
- Schritte (Tagesübersicht) → `GET /1/user/-/activities/date/{date}.json`
- Schritte (Zeitreihe) → `GET /1/user/-/activities/steps/date/{start}/{end}.json`
- Ruheherzfrequenz, Schlaf, Distanz, Kalorien

**Sync-Strategie:**
- Täglicher Cron-Job (z.B. 03:00 Uhr) holt die Daten des Vortags
- OAuth 2.0 Tokens werden sicher in Environment-Variablen gespeichert
- Rate Limit: 150 Requests/Stunde — ein täglicher Sync braucht nur ~3-5 Requests

### Apple Health (Phase 2+)
Apple Health hat **keine Server-seitige API**. Daten leben auf dem Gerät (iPhone).
Aber es gibt einen bewährten Workaround:

**Option: "Health Auto Export" App (~3 CHF)**
- iOS App die Apple Health Daten automatisch an einen REST-Endpoint sendet
- Konfigurierbar: welche Metriken, wie oft, welches Format (JSON)
- Unser Blog bekommt eine `POST /api/health-import` Route die die Daten empfängt
- Unterstützt 150+ Metriken inkl. Workouts, Schlafphasen, Herzfrequenz

**Datenfluss:** Apple Watch → iPhone Health App → Health Auto Export → Blog API → PostgreSQL

### Merge-Logik
Wenn Daten aus mehreren Quellen kommen (z.B. Schritte von Fitbit UND Apple Health):
- Fitbit ist primär für Gewicht/Körperfett (Aria Waage)
- Apple Watch/Health ist primär für Herzfrequenz, Workouts
- Bei Duplikaten: Höherer Schrittwert gewinnt (konservativ)
- `source` wird auf `MERGED` gesetzt wenn kombiniert

### Umgebungsvariablen

```env
# .env.example
DATABASE_URL="postgresql://project365:password@localhost:5432/project365blog"

# Fitbit API (OAuth 2.0)
FITBIT_CLIENT_ID=""
FITBIT_CLIENT_SECRET=""
FITBIT_ACCESS_TOKEN=""
FITBIT_REFRESH_TOKEN=""

# Health Auto Export (einfacher API-Key für Webhook-Authentifizierung)
HEALTH_IMPORT_API_KEY=""

# .env.local (NICHT im Git — in .gitignore)
DATABASE_URL="postgresql://project365:dein_sicheres_passwort@localhost:5432/project365blog"
```

## Features & Phasen

### Phase 1 — MVP (aktuell)
- [x] Projektstruktur aufsetzen
- [ ] PostgreSQL + Prisma Setup (Schema, Migrations, Seed)
- [ ] MDX-Integration mit Frontmatter-Parsing
- [ ] Sync-Script: Frontmatter-Habits → Datenbank
- [ ] Fitbit API Integration (OAuth Setup, täglicher Sync für Gewicht + Schritte)
- [ ] Startseite mit Journal-Feed (neueste zuerst)
- [ ] Einzelne Journal-Post Ansicht mit Banner-Bild
- [ ] Emoji-Reactions unter jedem Eintrag (❤️ 👏 🔥 💪 ⭐)
- [ ] Gewohnheiten-Dashboard auf Startseite (oberhalb Feed)
  - [ ] Drei-Säulen-Übersicht: Bewegung, Ernährung, Rauchstopp
  - [ ] Streak-Anzeigen pro Säule (z.B. "X Tage rauchfrei")
  - [ ] Erfüllungsgrad-Visualisierung (Fortschrittsbalken oder Heatmap)
- [ ] Metriken-Dashboard auf Startseite (unterhalb Habits, oberhalb Feed)
  - [ ] Gewichtsverlauf (Linien-Chart, letzte 30 Tage + Gesamttrend)
  - [ ] Schritte-Verlauf (Balken-Chart)
  - [ ] Körperfett-Trend (wenn von Waage verfügbar)
- [ ] Responsive Design (Mobile-first)
- [ ] Docker Compose Setup (Next.js + PostgreSQL)

### Phase 2 — Polish & Apple Health
- [ ] Apple Health Integration via "Health Auto Export" App
  - [ ] POST /api/health-import Endpoint
  - [ ] Merge-Logik für Fitbit + Apple Health Daten
- [ ] Erweiterte Metriken: Ruheherzfrequenz, Schlaf, Kalorien
- [ ] Smooth Animationen und Übergänge
- [ ] Reaction-Animationen (Confetti/Pop-Effekt beim Klicken)
- [ ] Dark Mode
- [ ] SEO-Optimierung (Meta-Tags, Open Graph)
- [ ] RSS-Feed
- [ ] Suchfunktion über Einträge

### Phase 3 — Mehrsprachigkeit
- [ ] i18n-Setup für UI-Elemente (Navigation, Labels)
- [ ] AI-basierte Übersetzung der Journal-Einträge (DE → EN, etc.)
- [ ] Sprachumschalter in Navigation
- [ ] Übersetzungs-Workflow definieren (Build-Time vs. On-Demand)

### Phase 4 — Erweitert
- [ ] Weitere Metriken/Habits ergänzen
- [ ] Jahres-Übersicht (GitHub-style Contribution Grid) für alle drei Säulen
- [ ] Monats-Zusammenfassungen (automatisch generiert)
- [ ] Metriken-Eingabe über Web-UI (neben MDX-Workflow)
- [ ] Backup-Strategie für PostgreSQL-Daten

## Design-Richtlinien

### Ästhetik
- **Ton:** Warm, ehrlich, motivierend — kein klinisches Dashboard
- **Stil:** Editorial/Magazine-inspiriert mit klarer Typografie
- **Farbpalette:** Warme, erdige Töne als Basis; Akzentfarben für Habits und Metriken
  - Säule Bewegung: Grün-Töne (Energie, Natur)
  - Säule Ernährung: Orange/Amber-Töne (Wärme, Nahrung)
  - Säule Rauchstopp: Blau-Töne (Freiheit, klare Luft)
  - Metriken allgemein: Neutrale Töne mit dezenten Akzenten
  - Erfüllungsgrade: Abstufungen innerhalb der Säulenfarbe (heller = weniger, satter = mehr)
- **Typografie:** Distinctive Display-Font für Überschriften, leserlicher Body-Font
- **Layout:** Grosszügiger Whitespace, Bilder prominent, Drei-Säulen-Dashboard als visueller Hingucker

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
- Storybook-Stories wo sinnvoll (Phase 2)

### Datei-Benennung
- Komponenten: PascalCase (`JournalCard.tsx`)
- Utilities/Libs: camelCase (`journal.ts`)
- Content: Datum als Name (`2026-03-26.mdx`)
- Bilder: Datum als Name (`2026-03-26.jpg`)

### Git-Konventionen
- **Branch-Naming:** `feature/ISSUE-NR-kurze-beschreibung` (z.B. `feature/12-metrics-dashboard`)
- **Commit-Messages:** Conventional Commits auf Englisch
  - `feat: add weight chart to metrics dashboard`
  - `fix: correct date parsing in journal entries`
  - `chore: update dependencies`
  - `docs: add API documentation`
  - `style: improve mobile spacing on journal feed`
  - `refactor: extract metric aggregation logic`
  - `test: add tests for smoking streak calculation`
- **PRs:** Immer gegen `main`, verlinkt mit Issue (`Closes #12`)
- **Kein direkter Push auf main** — immer über PR

### Testing
- Unit Tests mit Vitest
- Component Tests mit React Testing Library
- DB-Tests mit Prisma Test-Utilities (separate Test-DB)
- Metriken- und Habit-Berechnungen besonders gut abdecken
- Mindestens Tests für: `lib/journal.ts`, `lib/habits.ts`, `lib/metrics.ts`,
  Streak-Berechnung pro Säule, Reaction-API, Fitbit-Sync-Logik

## Wichtige Entscheidungen (ADRs)

### ADR-001: MDX für Content + Habits, PostgreSQL für Metriken + Reactions
Hybrid-Ansatz: Journal-Texte und Gewohnheiten als MDX-Dateien im Git (manuell erfasst,
versioniert, offline-fähig). Objektive Metriken primär aus APIs (Fitbit, Apple Health)
direkt in PostgreSQL. Reactions rein DB-basiert.
Klare Trennung: Habits = subjektive Selbsteinschätzung (Mensch), Metriken = objektive Messwerte (Geräte).

### ADR-002: Prisma als ORM
Prisma bietet type-safe DB-Zugriffe, auto-generierte TypeScript-Types aus dem Schema, deklarative Migrations und eine grosse Community. Passt ideal zum TypeScript-strict-Ansatz des Projekts.

### ADR-003: Anonyme Emoji-Reactions statt Kommentare
Leser können mit Emojis reagieren (❤️ 👏 🔥 💪 ⭐) ohne Login oder Account. IP-basiertes Rate-Limiting verhindert Spam (ein Emoji-Typ pro IP pro Eintrag). IP wird nur als SHA-256 Hash gespeichert. Keine Kommentare — vermeidet Moderationsaufwand bei einem Solo-Projekt.

### ADR-004: Docker Compose für Self-Hosting
Deployment als Docker Compose Stack im HomeLab: Next.js (Standalone-Mode) + PostgreSQL. Reverse-Proxy (Traefik) für HTTPS wird separat verwaltet. PostgreSQL-Daten auf einem Docker Volume mit regelmässigem Backup.

### ADR-005: Fitbit API als primäre Metriken-Quelle
Fitbit Web API (OAuth 2.0) für automatischen Import von Gewicht, Körperfett (Aria Waage),
Schritte und Aktivitätsdaten. Täglicher Cron-Sync. Apple Health als ergänzende Quelle
(Phase 2) via "Health Auto Export" App → REST-Webhook.

### ADR-006: Übersetzungs-Strategie (Phase 3)
AI-Übersetzung zur Build-Time mit Caching. Übersetzungen werden als generierte Dateien gespeichert und nur bei Änderung des Originals neu erstellt. Konkretes Tooling wird in Phase 3 evaluiert.

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
pnpm db:generate            # Prisma Client generieren nach Schema-Änderung
pnpm db:migrate             # Migration erstellen und ausführen
pnpm db:push                # Schema pushen ohne Migration (Dev)
pnpm db:seed                # Seed-Daten laden
pnpm db:studio              # Prisma Studio öffnen (DB GUI)
pnpm db:sync                # Frontmatter-Metriken → Datenbank synchronisieren

# Content
# Neuen Eintrag erstellen (Datum wird automatisch gesetzt):
pnpm new-entry              # Erstellt content/journal/YYYY-MM-DD.mdx mit Template

# Docker
docker compose up -d        # Alle Container starten (Next.js + PostgreSQL)
docker compose down         # Container stoppen
docker compose build        # Images neu bauen
docker compose logs -f web  # Next.js Logs verfolgen
docker compose logs -f db   # PostgreSQL Logs verfolgen
```

## Umgebung

- **Lokale Entwicklung:** macOS, VS Code / Terminal mit Claude Code
- **Node.js:** 20 LTS
- **Deployment:** Docker auf HomeLab-Server
- **Repository:** GitHub (privat oder öffentlich — TBD)
- **Projektpfad lokal:** /Users/dominiquestampfli/Documents/13_Dev/6_Project365Blog
