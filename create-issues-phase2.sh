#!/bin/bash
# ============================================
# Phase 2 Issues — Polish, Fitbit & Apple Health
# Ausführen im Projektordner:
#   chmod +x create-issues-phase2.sh && ./create-issues-phase2.sh
# ============================================

echo "🚀 Erstelle Phase 2 Issues (Polish, Fitbit & Apple Health)..."
echo ""

# --- Fitbit Inbetriebnahme ---
gh issue create \
  --title "feat: Fitbit API in Betrieb nehmen und testen" \
  --label "enhancement" \
  --body "## Beschreibung
Die Fitbit-Integration ist bereits implementiert (src/lib/fitbit.ts, /api/cron/fitbit-sync). Der Code muss jetzt konfiguriert, mit echten Daten getestet und ein Cron-Job eingerichtet werden.

## Akzeptanzkriterien
- [ ] Fitbit Developer App registrieren auf dev.fitbit.com (Type: Personal)
- [ ] OAuth 2.0 Authorization Code Flow durchlaufen, Tokens generieren
- [ ] Env-Variablen setzen: FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_ACCESS_TOKEN, FITBIT_REFRESH_TOKEN, CRON_SECRET
- [ ] Cron-Endpoint manuell testen: \`curl -H 'Authorization: Bearer <CRON_SECRET>' http://localhost:3000/api/cron/fitbit-sync\`
- [ ] Prüfen: Gewicht, BMI, Körperfett von Aria Waage kommen korrekt in DailyMetrics an
- [ ] Prüfen: Schritte, Distanz, aktive Minuten, Kalorien kommen korrekt an
- [ ] Token-Refresh testen (Access Token ablaufen lassen, prüfen ob Refresh funktioniert)
- [ ] Metriken-Dashboard auf Startseite zeigt echte Fitbit-Daten
- [ ] Cron-Job einrichten (z.B. GitHub Actions Schedule oder Server-Cron täglich 03:00)
- [ ] Dokumentation: Was tun wenn Refresh-Token abläuft (manueller Re-Auth Flow)

## Technische Notizen
- Bestehender Code: src/lib/fitbit.ts (fetchFitbitBodyLog, fetchFitbitActivitySummary, syncFitbitDay)
- Cron-Route: src/app/api/cron/fitbit-sync/route.ts
- Synct immer den Vortag (Fitbit-Daten erst am nächsten Tag vollständig)
- Bei Token-Refresh werden neue Tokens ins Server-Log geschrieben → .env manuell updaten
- Fitbit Rate Limit: 150 Requests/Stunde (täglicher Sync braucht nur ~3-5)

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Fitbit Inbetriebnahme Issue erstellt"

# --- Apple Health Integration ---
gh issue create \
  --title "feat: Apple Health Integration via Health Auto Export App" \
  --label "enhancement" \
  --body "## Beschreibung
Apple Health Daten automatisch importieren über die iOS App \"Health Auto Export\" (~3 CHF). Die App sendet Daten per REST API an unseren Blog.

## Akzeptanzkriterien
- [ ] POST /api/health-import Endpoint implementieren
- [ ] Authentifizierung via HEALTH_IMPORT_API_KEY (Bearer Token)
- [ ] JSON-Payload parsen (Health Auto Export Format)
- [ ] Relevante Metriken extrahieren: Ruheherzfrequenz, Schlaf, Schritte, Kalorien
- [ ] Daten in DailyMetrics speichern (source = APPLE_HEALTH)
- [ ] Merge-Logik: Bei Duplikaten mit Fitbit-Daten intelligent zusammenführen
  - Fitbit primär für Gewicht/Körperfett (Aria Waage)
  - Apple Watch primär für Herzfrequenz
  - Bei Schritten: höherer Wert gewinnt
  - source auf MERGED setzen wenn kombiniert
- [ ] Health Auto Export App konfigurieren (REST API, JSON, stündlich)
- [ ] Tests mit gemockten Health Auto Export Payloads

## Technische Notizen
- Health Auto Export App: https://www.healthyapps.dev/
- Export Format Docs: https://github.com/Lybron/health-auto-export/wiki
- App sendet POST mit JSON-Body, Content-Type: application/json
- Bestehende Route: src/app/api/health-import/route.ts (Placeholder vorhanden)

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Apple Health Issue erstellt"

# --- Dark Mode ---
gh issue create \
  --title "feat: Dark Mode implementieren" \
  --label "enhancement" \
  --body "## Beschreibung
Dark Mode für den gesamten Blog. Automatische Erkennung der System-Einstellung mit manuellem Toggle.

## Akzeptanzkriterien
- [ ] Dark/Light Mode Toggle in der Navigation
- [ ] System-Präferenz automatisch erkennen (prefers-color-scheme)
- [ ] Präferenz in localStorage speichern
- [ ] Alle Komponenten korrekt gestylt in beiden Modi
- [ ] Charts (Recharts) in Dark Mode lesbar
- [ ] Habits-Dashboard Farben in Dark Mode angepasst
- [ ] Kein Flash of Unstyled Content beim Laden
- [ ] Admin-Bereich ebenfalls Dark Mode fähig

## Technische Notizen
- Tailwind dark: Klasse nutzen (class strategy)
- next-themes Library für Theme-Management
- CSS-Variablen für Farben die sich ändern

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Dark Mode Issue erstellt"

# --- SEO ---
gh issue create \
  --title "feat: SEO-Optimierung mit Meta-Tags und Open Graph" \
  --label "enhancement" \
  --body "## Beschreibung
SEO und Social-Media-Sharing optimieren damit geteilte Links gut aussehen.

## Akzeptanzkriterien
- [ ] Dynamische Meta-Tags pro Journal-Eintrag (Titel, Beschreibung, Datum)
- [ ] Open Graph Tags (og:title, og:description, og:image, og:type)
- [ ] Twitter Card Tags
- [ ] Banner-Bild als og:image verwenden
- [ ] Fallback-Bild wenn kein Banner vorhanden
- [ ] Sitemap.xml automatisch generieren
- [ ] robots.txt konfigurieren
- [ ] Structured Data (JSON-LD) für Blog-Posts
- [ ] Canonical URLs

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ SEO Issue erstellt"

# --- RSS Feed ---
gh issue create \
  --title "feat: RSS-Feed für Journal-Einträge" \
  --label "enhancement" \
  --body "## Beschreibung
RSS-Feed damit Leser den Blog in ihrem Feed-Reader abonnieren können.

## Akzeptanzkriterien
- [ ] RSS 2.0 Feed unter /feed.xml oder /rss.xml
- [ ] Alle published Journal-Einträge im Feed
- [ ] Titel, Datum, Excerpt, Link pro Eintrag
- [ ] RSS-Link in HTML-Head (\`<link rel=\"alternate\" type=\"application/rss+xml\">\`)
- [ ] RSS-Icon/Link in Footer oder Navigation

## Technische Notizen
- Next.js Route Handler für XML-Output
- Oder: next-sitemap Package (kann auch RSS)

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ RSS Feed Issue erstellt"

# --- Suchfunktion ---
gh issue create \
  --title "feat: Suchfunktion über Journal-Einträge" \
  --label "enhancement" \
  --body "## Beschreibung
Volltextsuche über alle Journal-Einträge.

## Akzeptanzkriterien
- [ ] Suchfeld in der Navigation oder auf der Startseite
- [ ] Suche über Titel und Content (Volltextsuche)
- [ ] Suchergebnisse als Liste mit Highlighting
- [ ] Debounced Input (nicht bei jedem Tastendruck suchen)
- [ ] Responsive Suchergebnisse
- [ ] Keine Ergebnisse → freundliche Meldung

## Technische Notizen
- PostgreSQL Volltext-Suche (ts_vector, ts_query) oder ILIKE für den Anfang
- API Route: GET /api/search?q=suchbegriff
- Client Component mit useState/useEffect

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Suchfunktion Issue erstellt"

# --- Animationen ---
gh issue create \
  --title "style: Smooth Animationen und Reaction-Effekte" \
  --label "enhancement" \
  --body "## Beschreibung
Animationen und Micro-Interactions für ein poliertes Erlebnis.

## Akzeptanzkriterien
- [ ] Page Transitions (smooth Fade/Slide beim Seitenwechsel)
- [ ] Emoji-Reaction Animation (Pop/Confetti-Effekt beim Klicken)
- [ ] Journal-Cards: Hover-Animation (leichtes Anheben/Schatten)
- [ ] Habits-Dashboard: Streak-Counter Animation beim Laden
- [ ] Charts: Animate on scroll (einblenden wenn sichtbar)
- [ ] Loading-States mit Skeleton-Screens statt Spinner
- [ ] Alle Animationen respektieren prefers-reduced-motion

## Technische Notizen
- Framer Motion oder CSS-only Animationen
- Intersection Observer für scroll-basierte Animationen

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Animationen Issue erstellt"

# --- Eintrag löschen ---
gh issue create \
  --title "feat: Eintrag löschen im Admin-Bereich" \
  --label "enhancement" \
  --body "## Beschreibung
Möglichkeit einen Journal-Eintrag im Admin-Bereich zu löschen.

## Akzeptanzkriterien
- [ ] Löschen-Button pro Eintrag im Admin-Dashboard
- [ ] Bestätigungsdialog vor dem Löschen (\"Bist du sicher?\")
- [ ] Löscht JournalEntry und zugehörige Reactions (Cascade)
- [ ] Erfolgsmeldung nach Löschen
- [ ] Redirect zum Admin-Dashboard

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Eintrag löschen Issue erstellt"

# --- Admin-Link ---
gh issue create \
  --title "feat: Admin-Link auf Startseite für eingeloggte User" \
  --label "enhancement" \
  --body "## Beschreibung
Wenn der Admin eingeloggt ist, soll ein dezenter Link zum Admin-Bereich auf der öffentlichen Seite sichtbar sein.

## Akzeptanzkriterien
- [ ] Admin-Link in Navigation oder Footer (nur wenn eingeloggt)
- [ ] Nicht sichtbar für normale Besucher
- [ ] Optional: \"Bearbeiten\"-Link direkt auf jedem Journal-Eintrag (nur für Admin)

## Phase
- [x] Phase 2 — Polish, Fitbit & Apple Health"

echo "✅ Admin-Link Issue erstellt"

echo ""
echo "============================================"
echo "✅ Alle 9 Phase-2-Issues erstellt!"
echo ""
echo "Empfohlene Reihenfolge:"
echo "  1. Fitbit in Betrieb nehmen (echte Daten!)"
echo "  2. Apple Health Integration"
echo "  3. Eintrag löschen + Admin-Link (schnelle Wins)"
echo "  4. Dark Mode"
echo "  5. SEO-Optimierung"
echo "  6. RSS-Feed"
echo "  7. Suchfunktion"
echo "  8. Animationen"
echo ""
echo "Starte mit: git checkout -b feature/XX-fitbit-setup"
echo "(XX = die Issue-Nummer die gh erstellt hat)"
echo "============================================"