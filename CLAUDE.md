# Project 365 Blog

## Projektübersicht

Ein öffentliches tägliches Journal (365-Tage-Projekt) mit integriertem Habit-Tracking und Metriken-Visualisierung. Der Blog dient als Accountability-Tool: tägliche Einträge dokumentieren Fortschritte, Gewohnheiten werden getrackt und Metriken über Zeit visualisiert.

**Kernidee:** Persönliche Veränderung öffentlich dokumentieren — ehrlich, aber ohne sehr private Details.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Sprache:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Content:** Datenbank-basiert mit Rich-Text Editor (Web-CMS)
- **Auth:** NextAuth.js mit Google OAuth (Single-Admin)
- **Rich-Text Editor:** Tiptap (headless, erweiterbar, Markdown-kompatibel)
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

Einträge werden **im Browser über einen Rich-Text Editor** erstellt und in der Datenbank gespeichert.
Kein MDX, kein Git-Commit für Content — alles läuft über das Web-CMS.

**Wichtig:** Es gibt eine klare Trennung zwischen **Gewohnheiten** und **Metriken**.

- **Gewohnheiten (Habits):** Die drei Säulen des Projekts. Subjektive tägliche Selbsteinschätzung
  mit definierten Erfüllungsgraden. Werden manuell im Editor-Formular erfasst.
- **Metriken (Metrics):** Objektive, messbare Körper- und Aktivitätswerte.
  Werden primär automatisch via APIs (Fitbit, Apple Health) importiert.
  Können auch manuell im Editor-Formular erfasst/überschrieben werden.

### Editor-Flow (Admin, eingeloggt)

1. Login via Google OAuth (nur ein erlaubter Admin-Account)
2. "Neuer Eintrag" → Editor-Seite öffnet sich
3. Ausfüllen:
   - **Titel** (Pflicht)
   - **Datum** (default: heute)
   - **Text** via Rich-Text Editor (Tiptap: Formatting, Überschriften, Listen, Links)
   - **Banner-Bild** (Upload)
   - **Tags** (optional)
   - **Die drei Säulen** (Dropdown/Buttons pro Habit — Pflicht)
   - **Manuelle Metriken** (optionale Felder für Gewicht, Schritte etc.)
4. Vorschau → Speichern → Eintrag ist sofort live

### Erfüllungsgrade der drei Säulen

**Säule 1 — Bewegung & Training:**
- `MINIMAL` → Unter 10k Schritte, kein Training
- `STEPS_ONLY` → Über 10k Schritte, kein Training
- `STEPS_TRAINED` → Über 10k Schritte + Training

**Säule 2 — Ernährung:**
- `NONE` → Keine gesunde Mahlzeit
- `ONE` → Eine gesunde Mahlzeit
- `TWO` → Zwei gesunde Mahlzeiten
- `THREE` → Drei gesunde Mahlzeiten

**Säule 3 — Rauchstopp:**
- `SMOKED` → Es wurde geraucht
- `REPLACEMENT` → Nicht geraucht, aber Nikotinersatz
- `NONE` → Rauchfrei ohne Hilfsmittel

### Regeln

- Alle drei Habits sind **required** beim Erstellen eines Eintrags
- Metriken sind optional — werden primär via API importiert, können aber manuell überschrieben werden
- Banner-Bild ist optional (Upload im Editor)
- Neue Habits/Metriken können später ergänzt werden — das Schema soll erweiterbar sein

## Authentifizierung

Single-Admin Setup mit NextAuth.js + Google OAuth.

- Nur **ein** Google-Account hat Admin-Zugang (konfiguriert via Umgebungsvariable)
- Leser brauchen KEIN Login — der Blog ist öffentlich lesbar
- Admin-Bereich: `/admin/` — geschützt via Middleware
- Admin-Funktionen: Einträge erstellen/bearbeiten, Metriken manuell erfassen

```
// Geschützte Routen (nur Admin):
/admin/                    → Dashboard
/admin/entries/new         → Neuer Eintrag (Editor)
/admin/entries/[id]/edit   → Eintrag bearbeiten
/admin/metrics             → Metriken manuell erfassen

// Öffentliche Routen (jeder):
/                          → Startseite (Dashboard + Feed)
/journal/[slug]            → Einzelner Eintrag
/api/reactions             → Emoji-Reactions
```

## Datenbank-Schema (Prisma)

PostgreSQL ist die **einzige Content-Quelle**. Kein Filesystem-Content mehr.
**Kernprinzip:** Alles in der DB — Journal-Einträge, Habits, Metriken, Reactions.

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
// JOURNAL-EINTRÄGE — Content
// Quelle: Web-Editor (Admin, eingeloggt)
// =============================================

model JournalEntry {
  id          String          @id @default(cuid())
  slug        String          @unique          // URL-Slug, default = Datum
  title       String
  content     String          @db.Text         // Rich-Text als HTML (von Tiptap)
  excerpt     String?                          // Kurzbeschreibung für Feed
  bannerUrl   String?                          // Pfad zum Banner-Bild
  tags        String[]                         // Tags als Array
  date        DateTime        @db.Date         // Datum des Eintrags
  published   Boolean         @default(true)   // Draft-Modus möglich

  // Eingebettete Gewohnheiten (Die drei Säulen)
  movement    MovementLevel
  nutrition   NutritionLevel
  smoking     SmokingStatus

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  reactions   Reaction[]

  @@index([date])
  @@index([published])
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
// Quelle: Automatisch (Fitbit/Apple Health) + Manuell (Admin-UI)
// =============================================

model DailyMetrics {
  id             String        @id @default(cuid())
  date           DateTime      @unique @db.Date

  // Körperwerte (Quelle: Fitbit Aria Waage oder manuell)
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

// =============================================
// EMOJI-REACTIONS — Leser-Interaktion
// =============================================

model Reaction {
  id           String       @id @default(cuid())
  emoji        ReactionType
  ipHash       String       // SHA-256 Hash der IP (Spam-Schutz)

  journalEntry JournalEntry @relation(fields: [entryId], references: [id])
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
  Habits sind direkt im Entry eingebettet (kein separates DailyHabits-Model mehr).
- **DailyMetrics:** Automatisch via API-Sync ODER manuell im Admin-Bereich. Alles optional.
- **Reactions:** Verknüpft via Foreign Key mit JournalEntry. IP nur als SHA-256 Hash.
- Bei Metriken-Konflikten: Geräte-Daten (FITBIT/APPLE_HEALTH) > MANUAL.

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

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""                      # openssl rand -base64 32

# Google OAuth (Admin-Login)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ADMIN_EMAIL=""                          # Deine Google-Email — nur dieser Account hat Zugang

# Fitbit API (OAuth 2.0)
FITBIT_CLIENT_ID=""
FITBIT_CLIENT_SECRET=""
FITBIT_ACCESS_TOKEN=""
FITBIT_REFRESH_TOKEN=""

# Health Auto Export (einfacher API-Key für Webhook-Authentifizierung)
HEALTH_IMPORT_API_KEY=""
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

### Phase 2 — Polish, Fitbit & Apple Health (aktuell)
- [ ] Fitbit API in Betrieb nehmen (Code ist implementiert, muss konfiguriert werden)
  - [ ] Fitbit Developer App registrieren auf dev.fitbit.com (Type: Personal)
  - [ ] OAuth 2.0 Tokens generieren (Authorization Code Flow)
  - [ ] Env-Variablen setzen: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_ACCESS_TOKEN, FITBIT_REFRESH_TOKEN, CRON_SECRET
  - [ ] Cron-Endpoint testen: GET /api/cron/fitbit-sync mit Bearer Token
  - [ ] Prüfen: Gewicht, Körperfett, BMI von Aria Waage kommen korrekt an
  - [ ] Prüfen: Schritte, Distanz, Kalorien, aktive Minuten kommen korrekt an
  - [ ] Metriken-Dashboard zeigt echte Fitbit-Daten
  - [ ] Cron-Job einrichten (extern: GitHub Actions Schedule oder Server-Cron)
  - [ ] Token-Refresh testen (was passiert wenn Access Token abläuft)
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
- [ ] Eintrag löschen im Admin-Bereich
- [ ] Admin-Link auf der Startseite (nur für eingeloggte User)

### Phase 3 — Mehrsprachigkeit
- [ ] i18n-Setup für UI-Elemente (Navigation, Labels)
- [ ] AI-basierte Übersetzung der Journal-Einträge (DE → EN, etc.)
- [ ] Sprachumschalter in Navigation
- [ ] Übersetzungs-Workflow definieren (Build-Time vs. On-Demand)

### Phase 4 — Erweitert
- [ ] Weitere Metriken/Habits ergänzen
- [ ] Jahres-Übersicht (GitHub-style Contribution Grid) für alle drei Säulen
- [ ] Monats-Zusammenfassungen (automatisch generiert)
- [ ] Statistiken und Seitenaufrufe im Admin-Bereich
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

### ADR-001: Datenbank als einzige Content-Quelle (Web-CMS)
**Geändert:** Ursprünglich MDX-Dateien im Git, jetzt komplett DB-basiert.
Journal-Einträge werden im Browser via Rich-Text Editor erstellt und in PostgreSQL
gespeichert. Vorteile: Einträge können von überall erstellt werden (Handy, Tablet),
kein Git-Workflow für Content nötig, Habits und Metriken direkt am Eintrag.
Klare Trennung: Habits = subjektive Selbsteinschätzung, Metriken = objektive Messwerte.

### ADR-002: Prisma als ORM
Prisma bietet type-safe DB-Zugriffe, auto-generierte TypeScript-Types aus dem Schema, deklarative Migrations und eine grosse Community. Passt ideal zum TypeScript-strict-Ansatz des Projekts.

### ADR-003: Anonyme Emoji-Reactions statt Kommentare
Leser können mit Emojis reagieren (❤️ 👏 🔥 💪 ⭐) ohne Login oder Account. IP-basiertes Rate-Limiting verhindert Spam (ein Emoji-Typ pro IP pro Eintrag). IP wird nur als SHA-256 Hash gespeichert. Keine Kommentare — vermeidet Moderationsaufwand bei einem Solo-Projekt.

### ADR-004: Docker Compose für Self-Hosting
Deployment als Docker Compose Stack im HomeLab: Next.js (Standalone-Mode) + PostgreSQL. Reverse-Proxy (Traefik) für HTTPS wird separat verwaltet. PostgreSQL-Daten auf einem Docker Volume mit regelmässigem Backup.

### ADR-005: Fitbit API als primäre Metriken-Quelle
Fitbit Web API (OAuth 2.0) für automatischen Import von Gewicht, Körperfett (Aria Waage),
Schritte und Aktivitätsdaten. Täglicher Cron-Sync. Apple Health als ergänzende Quelle
via "Health Auto Export" App → REST-Webhook.

### ADR-006: Google OAuth für Single-Admin Auth
NextAuth.js mit Google Provider. Nur ein Google-Account (konfiguriert via ADMIN_EMAIL
Env-Variable) hat Admin-Zugang. Kein Registrierungssystem. Blog ist öffentlich lesbar,
Admin-Bereich (/admin/) ist via Middleware geschützt.

### ADR-007: Tiptap als Rich-Text Editor
Tiptap (headless Editor auf Basis von ProseMirror) für den Journal-Editor. Erweiterbar,
Markdown-Shortcuts, sauberes HTML-Output, gute React-Integration, Open Source.
Speichert HTML in der DB.

### ADR-008: Übersetzungs-Strategie (Phase 3+)
AI-Übersetzung mit Caching. Konkretes Tooling wird in Phase 3 evaluiert.

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

# Content (neu via Web-Editor im Browser)
# Einträge werden unter /admin/entries/new im Browser erstellt.
# Kein CLI-Befehl mehr nötig für neue Einträge.

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
