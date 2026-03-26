#!/bin/bash
# ============================================
# MVP Issues für Project 365 Blog erstellen
# Ausführen im Projektordner:
#   chmod +x create-issues.sh && ./create-issues.sh
# ============================================

echo "🚀 Erstelle MVP Issues für Project 365 Blog..."
echo ""

# --- Issue 1: Projekt-Grundgerüst ---
gh issue create \
  --title "feat: Next.js Projekt initialisieren mit TypeScript, Tailwind, Prisma" \
  --label "enhancement" \
  --body "## Beschreibung
Next.js 14+ Projekt aufsetzen mit dem kompletten Tech-Stack gemäss CLAUDE.md.

## Akzeptanzkriterien
- [ ] \`pnpm create next-app\` mit App Router, TypeScript, Tailwind, ESLint
- [ ] pnpm als Package Manager konfiguriert
- [ ] TypeScript strict mode aktiviert in \`tsconfig.json\`
- [ ] Prisma installiert und konfiguriert (\`prisma init\`)
- [ ] Prisma-Schema gemäss CLAUDE.md (DailyHabits, DailyMetrics, Reaction)
- [ ] Erste Migration erstellt und lauffähig
- [ ] Prisma Client Singleton in \`src/lib/db.ts\`
- [ ] \`next.config.ts\` mit standalone output für Docker
- [ ] Ordnerstruktur gemäss CLAUDE.md angelegt
- [ ] Alle pnpm-Scripts in package.json (dev, build, lint, type-check, db:*)
- [ ] \`pnpm dev\` startet fehlerfrei
- [ ] \`docker compose up -d\` startet PostgreSQL + Adminer

## Technische Notizen
- Recharts, next-mdx-remote als Dependencies installieren
- Vitest + React Testing Library für Tests aufsetzen
- ESLint + Prettier Konfiguration

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 1 erstellt"

# --- Issue 2: MDX Integration ---
gh issue create \
  --title "feat: MDX-Integration mit Frontmatter-Parsing für Journal-Einträge" \
  --label "enhancement" \
  --body "## Beschreibung
MDX-Dateien als Content-Quelle einrichten. Journal-Einträge werden als \`.mdx\`-Dateien in \`content/journal/\` gespeichert und zur Build-Zeit gelesen.

## Akzeptanzkriterien
- [ ] \`next-mdx-remote\` oder \`@next/mdx\` konfiguriert
- [ ] \`gray-matter\` für Frontmatter-Parsing
- [ ] \`src/lib/journal.ts\` — MDX-Dateien laden, parsen, nach Datum sortieren
- [ ] Frontmatter-Schema validieren (Habits required, Banner optional)
- [ ] TypeScript Interfaces für JournalEntry, Habits-Frontmatter
- [ ] Beispiel-Eintrag \`content/journal/2026-03-26.mdx\` mit korrektem Frontmatter
- [ ] \`pnpm new-entry\` Script erstellt Template mit heutigem Datum
- [ ] Unit-Tests für \`lib/journal.ts\` (parsen, sortieren, validieren)

## Technische Notizen
- Frontmatter enthält nur Habits (drei Säulen) — keine Metriken
- Slug = Datum (2026-03-26)
- Sortierung: neueste zuerst

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 2 erstellt"

# --- Issue 3: Habits Sync ---
gh issue create \
  --title "feat: Sync-Script für Frontmatter-Habits nach PostgreSQL" \
  --label "enhancement" \
  --body "## Beschreibung
Script das die Habit-Daten aus dem MDX-Frontmatter liest und in die \`DailyHabits\`-Tabelle synchronisiert.

## Akzeptanzkriterien
- [ ] \`src/lib/habits.ts\` — Habits aus Frontmatter lesen, Enums mappen
- [ ] \`pnpm db:sync\` Befehl der alle MDX-Dateien durchgeht und Habits in DB schreibt
- [ ] Upsert-Logik (existierende Einträge updaten, neue erstellen)
- [ ] Mapping: Frontmatter-Strings → Prisma-Enums (z.B. \"steps_only\" → STEPS_ONLY)
- [ ] Streak-Berechnung pro Säule (konsekutive Tage mit bestem Erfüllungsgrad)
- [ ] Unit-Tests für Mapping, Upsert, Streak-Berechnung

## Technische Notizen
- Wird auch im Build-Prozess ausgeführt
- Streak-Definition: Bewegung ≥ STEPS_ONLY, Ernährung ≥ ONE, Rauchstopp = NONE

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 3 erstellt"

# --- Issue 4: Fitbit API ---
gh issue create \
  --title "feat: Fitbit API Integration für automatischen Metriken-Import" \
  --label "enhancement" \
  --body "## Beschreibung
Fitbit Web API anbinden um Gewicht, Körperfett und Schritte automatisch zu importieren.

## Akzeptanzkriterien
- [ ] \`src/lib/fitbit.ts\` — Fitbit API Client mit OAuth 2.0
- [ ] Token-Refresh-Logik (Access Token automatisch erneuern)
- [ ] Gewicht + Körperfett + BMI abrufen (Body API)
- [ ] Schritte + aktive Minuten + Kalorien abrufen (Activity API)
- [ ] Daten in \`DailyMetrics\`-Tabelle schreiben (source = FITBIT)
- [ ] \`/api/cron/fitbit-sync\` Route (auth-geschützt) für täglichen Sync
- [ ] Error Handling bei Rate Limits (150 req/h)
- [ ] Tests mit gemockten API-Responses

## Technische Notizen
- Fitbit App registrieren unter https://dev.fitbit.com/apps/new (Type: Personal)
- OAuth 2.0 Authorization Code Flow
- Täglicher Sync holt Daten des Vortags
- Env-Variablen: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_ACCESS_TOKEN, FITBIT_REFRESH_TOKEN

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 4 erstellt"

# --- Issue 5: Journal Feed & Post ---
gh issue create \
  --title "feat: Startseite mit Journal-Feed und Einzelansicht" \
  --label "enhancement" \
  --body "## Beschreibung
Die Hauptseiten des Blogs: Startseite mit Feed aller Einträge und Detailansicht für einzelne Posts.

## Akzeptanzkriterien
- [ ] \`src/app/page.tsx\` — Startseite mit Journal-Feed (neueste zuerst)
- [ ] \`JournalFeed.tsx\` — Liste aller Einträge mit Pagination oder Infinite Scroll
- [ ] \`JournalCard.tsx\` — Vorschaukarte (Datum, Titel, Excerpt, Banner-Thumbnail, Habits-Status)
- [ ] \`src/app/journal/[slug]/page.tsx\` — Einzelansicht
- [ ] \`JournalPost.tsx\` — Vollansicht mit Banner-Bild, gerendertem MDX-Content
- [ ] Responsive Design (Mobile-first)
- [ ] Grundlegendes Layout: Header, Navigation, Footer
- [ ] Static Generation für Journal-Seiten (\`generateStaticParams\`)

## Technische Notizen
- Banner-Bild als prominentes Bild oberhalb des Texts (nicht inline)
- Habits-Status als kleine Icons/Badges auf der JournalCard
- Next.js Image-Optimierung nutzen

## Design
- Warmer, editorial Stil gemäss Design-Richtlinien in CLAUDE.md
- Distinctive Typografie (kein Inter/Roboto)

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 5 erstellt"

# --- Issue 6: Emoji Reactions ---
gh issue create \
  --title "feat: Emoji-Reactions System für Journal-Einträge" \
  --label "enhancement" \
  --body "## Beschreibung
Anonyme Emoji-Reactions unter jedem Journal-Eintrag. Leser können mit ❤️ 👏 🔥 💪 ⭐ reagieren.

## Akzeptanzkriterien
- [ ] \`/api/reactions\` Route — GET (Counts pro Slug) und POST (neue Reaction)
- [ ] IP-Hashing mit SHA-256 (IP wird nie gespeichert)
- [ ] Unique Constraint: ein Emoji-Typ pro IP pro Eintrag
- [ ] \`ReactionBar.tsx\` — Leiste mit allen 5 Emojis und Live-Countern
- [ ] \`ReactionButton.tsx\` — Einzelner Button mit Animation beim Klicken
- [ ] Optimistic UI Update (Counter sofort erhöhen, bei Fehler zurücksetzen)
- [ ] Rate Limiting auf API-Ebene
- [ ] Tests für API-Route und Komponenten

## Technische Notizen
- Server Action oder API Route — beides möglich
- localStorage nutzen um bereits vergebene Reactions zu merken (UX)
- Kein Login/Account nötig

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 6 erstellt"

# --- Issue 7: Habits Dashboard ---
gh issue create \
  --title "feat: Gewohnheiten-Dashboard mit Drei-Säulen-Übersicht" \
  --label "enhancement" \
  --body "## Beschreibung
Dashboard auf der Startseite das die drei Säulen (Bewegung, Ernährung, Rauchstopp) prominent visualisiert.

## Akzeptanzkriterien
- [ ] \`HabitsDashboard.tsx\` — Drei-Säulen-Layout auf Startseite (oberhalb Metriken)
- [ ] \`HabitPillar.tsx\` — Einzelne Säule mit aktuellem Status und Trend
- [ ] \`HabitStreak.tsx\` — Streak-Anzeige (\"X Tage rauchfrei\", \"X Tage trainiert\")
- [ ] \`HabitHeatmap.tsx\` — Erfüllungsgrade über letzte 30 Tage als Farbverlauf
- [ ] Farbkodierung pro Säule (Bewegung=Grün, Ernährung=Orange, Rauchstopp=Blau)
- [ ] Erfüllungsgrad als Farbintensität (heller=weniger, satter=mehr)
- [ ] Responsive: Drei Spalten auf Desktop, gestapelt auf Mobile
- [ ] Daten aus DailyHabits-Tabelle (Server Component)

## Design
- Warm und motivierend, kein klinisches Dashboard
- Streaks prominent anzeigen — das ist der emotionale Kern
- Heatmap inspiriert von GitHub Contribution Grid aber mit eigener Ästhetik

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 7 erstellt"

# --- Issue 8: Metrics Dashboard ---
gh issue create \
  --title "feat: Metriken-Dashboard mit Gewichts- und Schritte-Charts" \
  --label "enhancement" \
  --body "## Beschreibung
Dashboard mit Charts für die objektiven Messwerte (aus Fitbit/Apple Health).

## Akzeptanzkriterien
- [ ] \`MetricsDashboard.tsx\` — Container unterhalb Habits-Dashboard
- [ ] \`WeightChart.tsx\` — Linien-Chart mit Gewichtsverlauf (letzte 30 Tage + Gesamttrend)
- [ ] \`StepsChart.tsx\` — Balken-Chart mit täglichen Schritten
- [ ] \`BodyFatChart.tsx\` — Linien-Chart Körperfett-Trend (wenn Daten vorhanden)
- [ ] Zeitraum-Auswahl: 7 Tage / 30 Tage / 90 Tage / Gesamt
- [ ] Recharts für alle Visualisierungen
- [ ] Responsive Charts
- [ ] Daten aus DailyMetrics-Tabelle (Server Component oder API Route)
- [ ] Fallback-UI wenn noch keine Daten vorhanden

## Technische Notizen
- Gewichts-Chart: Trendlinie (Moving Average) neben Einzelwerten
- Schritte-Chart: 10k-Linie als visuelles Ziel markieren
- Neutrale Farben gemäss Design-Richtlinien

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 8 erstellt"

# --- Issue 9: Docker Production Setup ---
gh issue create \
  --title "feat: Docker Compose Production-Setup für HomeLab" \
  --label "enhancement" \
  --body "## Beschreibung
Docker-Setup finalisieren und für HomeLab-Deployment vorbereiten.

## Akzeptanzkriterien
- [ ] Dockerfile baut erfolgreich (Multi-Stage, Standalone)
- [ ] \`docker compose up -d\` startet Next.js + PostgreSQL fehlerfrei
- [ ] Prisma-Migrations laufen beim Container-Start automatisch
- [ ] Health-Check für Next.js Container
- [ ] PostgreSQL-Daten persistent auf Docker Volume
- [ ] Production-taugliche docker-compose.yml (ohne Adminer)
- [ ] \`.env.example\` aktuell mit allen benötigten Variablen
- [ ] Image-Grösse optimiert (< 200MB)
- [ ] README mit Deployment-Anleitung

## Technische Notizen
- Entrypoint-Script für automatische Migration bei Start
- Separate docker-compose.prod.yml oder Umgebungsvariable für Dev/Prod
- Traefik-Labels für HTTPS vorbereiten (aber noch nicht aktivieren)

## Phase
- [x] Phase 1 — MVP"

echo "✅ Issue 9 erstellt"

echo ""
echo "============================================"
echo "✅ Alle 9 MVP-Issues erstellt!"
echo ""
echo "Empfohlene Reihenfolge:"
echo "  #1 → Projekt-Grundgerüst (Basis für alles)"
echo "  #2 → MDX-Integration (Content-Layer)"
echo "  #3 → Habits-Sync (Habits → DB)"
echo "  #4 → Fitbit API (Metriken → DB)"
echo "  #5 → Journal Feed & Post (erste sichtbare UI)"
echo "  #6 → Emoji Reactions (Interaktion)"
echo "  #7 → Habits Dashboard (Drei-Säulen-Visualisierung)"
echo "  #8 → Metrics Dashboard (Charts)"
echo "  #9 → Docker Production Setup (Deployment)"
echo ""
echo "Starte mit: git checkout -b feature/1-project-setup"
echo "============================================"