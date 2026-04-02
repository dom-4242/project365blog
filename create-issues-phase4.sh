#!/bin/bash
# ============================================
# Phase 4 Issues — Visualisierung, Analytics & Datenqualität
# Ausführen im Projektordner:
#   chmod +x create-issues-phase4.sh && ./create-issues-phase4.sh
# ============================================

echo "🚀 Erstelle Phase 4 Issues..."
echo ""

# --- 1. Jahres-Übersicht Contribution Grid ---
gh issue create \
  --title "feat: Jahres-Übersicht als GitHub-style Contribution Grid für die drei Säulen" \
  --label "enhancement" \
  --body "## Beschreibung
Visuelle Jahres-Übersicht im Stil von GitHubs Contribution-Graph für jede der drei Säulen.

## Akzeptanzkriterien
- [ ] Contribution Grid Komponente mit 365 Tagen (ähnlich GitHub)
- [ ] Drei separate Grids — eines pro Säule
- [ ] Farbcodierung: erfüllt (farbig), nicht erfüllt (grau), kein Eintrag (transparent)
- [ ] Tooltip bei Hover/Tap mit Datum und Status
- [ ] Aktuelle Streak-Anzeige pro Säule
- [ ] Längste Streak aller Zeiten anzeigen
- [ ] Responsive: auf Mobile horizontal scrollbar
- [ ] Öffentlich sichtbar (eigene Route oder Dashboard)
- [ ] Jahreswechsel: Dropdown für verschiedene Jahre
- [ ] i18n: Labels und Tooltips in DE und EN

## Technische Notizen
- Daten aus JournalEntry (habitMovement, habitNutrition, habitSmoking)
- Tage ohne Eintrag als unbekannt darstellen
- SVG oder CSS Grid für die Darstellung
- Performance: Alle Daten eines Jahres in einer Query

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 1/7 Jahres-Übersicht erstellt"

# --- 2. Monats-Zusammenfassungen ---
gh issue create \
  --title "feat: AI-generierte Monats-Zusammenfassungen via Claude API" \
  --label "enhancement" \
  --body "## Beschreibung
Am Monatsende wird eine AI-generierte Zusammenfassung erstellt, die Journal-Einträge analysiert und Highlights, Fortschritte und Muster zusammenfasst.

## Akzeptanzkriterien
- [ ] DB-Model für MonthSummary (Monat, Jahr, Content DE, Content EN, generatedAt)
- [ ] Admin-Button: Zusammenfassung für Monat generieren
- [ ] Claude API analysiert alle Einträge des Monats:
    - Highlights und Meilensteine
    - Habits-Statistiken (Erfüllungsrate pro Säule)
    - Metriken-Trends (Gewicht, Schritte etc.)
    - Persönliche Reflexion / Motivationstext
- [ ] Zusammenfassung öffentlich anzeigen (z.B. /monthly/2026-03)
- [ ] Admin: Zusammenfassung vor Veröffentlichung editierbar
- [ ] DE generieren, EN über bestehenden Übersetzungs-Flow
- [ ] Monats-Übersichtsseite mit allen Zusammenfassungen

## Technische Notizen
- Bestehende Claude API Integration aus Phase 3 wiederverwenden
- System-Prompt für Zusammenfassungen designen
- Ein API-Call pro Monat — kostengünstig
- Alle Einträge als Kontext mitgeben (Titel, Habits, Metriken, gekürzte Texte)

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 2/7 Monats-Zusammenfassungen erstellt"

# --- 3. Admin Analytics ---
gh issue create \
  --title "feat: Seitenaufrufe & Besucher-Statistiken im Admin-Bereich" \
  --label "enhancement" \
  --body "## Beschreibung
Analytics-Dashboard im Admin-Bereich für Seitenaufrufe und Besucher-Trends — privacy-first, ohne externe Tracking-Dienste.

## Akzeptanzkriterien
- [ ] DB-Model für PageView (path, timestamp, referrer, userAgentHash)
- [ ] Serverseitiges Tracking via Middleware (kein Client-JS, kein Cookie)
- [ ] Admin-Dashboard unter /admin/analytics:
    - Seitenaufrufe gesamt (heute, 7d, 30d, gesamt)
    - Top 10 beliebteste Einträge
    - Views pro Tag als Linien-Chart (Recharts)
    - Referrer-Übersicht
- [ ] Bots und Crawler filtern (User-Agent basiert)
- [ ] Eigene Besuche ausschliessen (Admin eingeloggt)
- [ ] Daten-Retention: Rohdaten nach 90 Tagen löschen, aggregierte behalten
- [ ] i18n: Dashboard-Labels in DE und EN

## Technische Notizen
- Inspiration: Plausible/Umami-Style, selbst gebaut
- IP-Adressen NICHT speichern (DSGVO)
- Middleware-basiertes Tracking ist performanter als API-Route

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 3/7 Admin Analytics erstellt"

# --- 4. PostgreSQL Backup ---
gh issue create \
  --title "feat: PostgreSQL Backup-Strategie mit automatisiertem Backup & Restore" \
  --label "enhancement" \
  --body "## Beschreibung
Robuste Backup-Strategie für die PostgreSQL-Datenbank mit automatisierten täglichen Backups und einfacher Restore-Möglichkeit.

## Akzeptanzkriterien
- [ ] Backup-Script (scripts/backup.sh) das pg_dump ausführt
- [ ] Tägliches automatisiertes Backup (Cron-Job im HomeLab)
- [ ] Rotation: Letzte 7 tägliche + 4 wöchentliche + 3 monatliche Backups
- [ ] Komprimierte Backup-Dateien (.sql.gz)
- [ ] Restore-Script (scripts/restore.sh) mit Anleitung
- [ ] Backup auf separatem Volume (/container/project365blog/backups/)
- [ ] Dokumentation in CLAUDE.md und README
- [ ] Optional: Healthcheck-Ping nach erfolgreichem Backup
- [ ] Test: Restore auf frischer DB verifizieren

## Technische Notizen
- Docker exec: docker exec project365blog-db pg_dump -U postgres | gzip
- Cron-Job auf dem HomeLab Host (nicht im Container)
- Backup VOR docker compose pull/up bei Updates
- Restore: gunzip < backup.sql.gz | docker exec -i ... psql

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 4/7 PostgreSQL Backup erstellt"

# --- 5. i18n-Lücken ---
gh issue create \
  --title "fix: Übersetzungs-Lücken schliessen (Metriken-Diagramme, Vorschau-Box)" \
  --label "bug" \
  --body "## Beschreibung
Nach Phase 3 sind noch einige UI-Elemente nicht vollständig übersetzt. Diese Lücken sollen geschlossen werden.

## Akzeptanzkriterien
- [ ] Metriken-Diagramme: Achsen, Tooltips und Legenden in DE und EN
- [ ] Eintrag-Vorschau-Box: Übersetzt bei maschinell übersetzten Einträgen
- [ ] Alle verbleibenden hardcodierten deutschen Strings finden und übersetzen
- [ ] Datumsformate locale-spezifisch (DE: 1. April 2026, EN: April 1, 2026)
- [ ] Zahlenformate locale-spezifisch (DE: 1.234,56 / EN: 1,234.56)
- [ ] Error-Messages und Toasts übersetzt
- [ ] Meta-Descriptions für Spezialseiten übersetzt
- [ ] Audit: Jeden Screen auf DE und EN durchgehen

## Technische Notizen
- next-intl useFormatter() für Datum und Zahlen
- messages/de.json und messages/en.json erweitern
- Recharts: locale-spezifische tickFormatter und tooltipFormatter

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 5/7 i18n-Lücken erstellt"

# --- 6. Live-Vorschau ---
gh issue create \
  --title "feat: Live-Vorschau im Journal-Editor vor Veröffentlichung" \
  --label "enhancement" \
  --body "## Beschreibung
Im Admin-Editor eine Live-Vorschau, die zeigt wie der Eintrag auf der öffentlichen Seite aussieht — inklusive Styling, Banner-Bild und Habits.

## Akzeptanzkriterien
- [ ] Vorschau-Button/Tab im Editor
- [ ] Rendert den Eintrag exakt wie auf der öffentlichen Seite
- [ ] Banner-Bild in der Vorschau angezeigt
- [ ] Habits-Status (drei Säulen) sichtbar
- [ ] Metriken sichtbar (falls erfasst)
- [ ] Funktioniert auch für noch nicht gespeicherte Änderungen
- [ ] Öffnet sich als Side-Panel oder Modal

## Technische Notizen
- Bestehende JournalPost-Komponente wiederverwenden
- Client-seitig: Tiptap HTML direkt an Vorschau übergeben
- Kein Server-Roundtrip nötig

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 6/7 Live-Vorschau erstellt"

# --- 7. Statische Werte ---
gh issue create \
  --title "feat: Statische Werte (Körpergrösse, Ziele) im Admin erfassbar" \
  --label "enhancement" \
  --body "## Beschreibung
Werte wie Körpergrösse ändern sich selten und sollten einmalig erfasst werden statt bei jedem Eintrag. Sie werden für Berechnungen (BMI) und Anzeigen verwendet.

## Akzeptanzkriterien
- [ ] Admin-Seite unter /admin/settings oder /admin/profile
- [ ] Erfassbare Werte: Körpergrösse (cm), Geburtsdatum, Ziel-Gewicht, Schritte-Ziel
- [ ] DB-Model: UserProfile oder Settings-Tabelle
- [ ] BMI-Berechnung aus Grösse + aktuellem Gewicht
- [ ] BMI im Metriken-Dashboard anzeigen
- [ ] Ziel-Gewicht als Linie im Gewichts-Chart
- [ ] Schritte-Ziel als Referenzlinie im Schritte-Chart
- [ ] Werte editierbar und historisch nachvollziehbar
- [ ] i18n: Labels in DE und EN

## Technische Notizen
- Einfaches Key-Value Model oder feste Felder auf UserProfile
- Einmalige Erfassung, selten geändert
- In Metriken-Berechnungen und Charts einbinden

## Phase
Phase 4 — Visualisierung, Analytics & Datenqualität"

echo "✅ 7/7 Statische Werte erstellt"

echo ""
echo "============================================"
echo "✅ Alle 7 Phase-4-Issues erstellt!"
echo ""
echo "Empfohlene Reihenfolge:"
echo "  1. i18n-Lücken schliessen (schneller Win, räumt Phase 3 auf)"
echo "  2. Statische Werte (Grundlage für BMI etc.)"
echo "  3. Jahres-Übersicht Contribution Grid (visuelles Highlight)"
echo "  4. Live-Vorschau im Editor (Admin-Komfort)"
echo "  5. PostgreSQL Backup (wichtig vor mehr Daten)"
echo "  6. Admin Analytics (Seitenaufrufe)"
echo "  7. Monats-Zusammenfassungen (AI-generiert)"
echo ""
echo "Starte mit: git checkout -b feature/XX-i18n-gaps"
echo "(XX = die Issue-Nummer die gh erstellt hat)"
echo "============================================"
