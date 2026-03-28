#!/bin/bash
# ============================================
# Phase 1.5 Issues — Web-CMS, Auth & Editor
# Ausführen im Projektordner:
#   chmod +x create-issues-phase1.5.sh && ./create-issues-phase1.5.sh
# ============================================

echo "🚀 Erstelle Phase 1.5 Issues (Web-CMS & Auth)..."
echo ""

# --- Issue: Google OAuth Auth ---
gh issue create \
  --title "feat: NextAuth.js mit Google OAuth (Single-Admin Login)" \
  --label "enhancement" \
  --body "## Beschreibung
Authentifizierung einrichten damit nur ein Admin (du) Einträge erstellen und Metriken erfassen kann. Leser brauchen kein Login.

## Akzeptanzkriterien
- [ ] NextAuth.js installiert und konfiguriert
- [ ] Google OAuth Provider eingerichtet
- [ ] Nur ein erlaubter Google-Account (via ADMIN_EMAIL Env-Variable)
- [ ] Login-Seite unter \`/admin/login\`
- [ ] Middleware schützt alle \`/admin/*\` Routen
- [ ] Session-Info verfügbar in Server Components und API Routes
- [ ] Login/Logout Button in der Navigation (nur sichtbar wenn eingeloggt)
- [ ] Nicht-autorisierte Besucher werden auf Login-Seite umgeleitet
- [ ] Env-Variablen: NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAIL

## Technische Notizen
- Google Cloud Console: OAuth 2.0 Client erstellen
- Callback URL: \`/api/auth/callback/google\`
- NextAuth Session Strategy: JWT (kein extra Session-Model nötig)
- .env.example aktualisieren mit neuen Variablen

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ Auth Issue erstellt"

# --- Issue: JournalEntry DB Model ---
gh issue create \
  --title "feat: JournalEntry Datenbank-Model und Migration von MDX" \
  --label "enhancement" \
  --body "## Beschreibung
Neues JournalEntry-Model in Prisma erstellen. Journal-Einträge werden ab jetzt in der DB gespeichert statt als MDX-Dateien. Bestehende MDX-Einträge einmalig migrieren.

## Akzeptanzkriterien
- [ ] Prisma-Schema: JournalEntry Model gemäss CLAUDE.md (Titel, Content als HTML, Excerpt, Banner, Tags, Datum, Published-Flag, die drei Säulen)
- [ ] Habits direkt im JournalEntry eingebettet (kein separates DailyHabits-Model)
- [ ] Reaction mit Foreign Key auf JournalEntry (statt Slug-String)
- [ ] Migration erstellt und lauffähig
- [ ] Einmaliges Migrations-Script: bestehende MDX-Einträge → DB
- [ ] \`src/lib/journal.ts\` umbauen: liest jetzt aus DB statt Filesystem
- [ ] Startseite und Einzelansicht funktionieren weiterhin mit DB-Daten
- [ ] Tests aktualisiert

## Technische Notizen
- DailyHabits-Model kann entfernt werden (Habits sind jetzt im JournalEntry)
- Slug bleibt unique (default = Datum)
- Content wird als HTML gespeichert (Tiptap Output)
- MDX-Dateien können nach erfolgreicher Migration entfernt werden

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ JournalEntry Model Issue erstellt"

# --- Issue: Rich-Text Editor ---
gh issue create \
  --title "feat: Tiptap Rich-Text Editor für Journal-Einträge" \
  --label "enhancement" \
  --body "## Beschreibung
Rich-Text Editor (Tiptap) im Admin-Bereich zum Erstellen und Bearbeiten von Journal-Einträgen. Wie ein Mini-Notion für den Blog.

## Akzeptanzkriterien
- [ ] Tiptap Editor installiert und konfiguriert
- [ ] \`/admin/entries/new\` — Neuen Eintrag erstellen
- [ ] \`/admin/entries/[id]/edit\` — Bestehenden Eintrag bearbeiten
- [ ] Editor-Toolbar: Bold, Italic, Überschriften (H2, H3), Listen, Links, Zitate
- [ ] Markdown-Shortcuts (z.B. \`#\` für Überschrift, \`**\` für Bold)
- [ ] Formular-Felder neben Editor:
  - [ ] Titel (Pflicht)
  - [ ] Datum (Default: heute)
  - [ ] Tags (Multi-Input)
  - [ ] Published Toggle (Draft/Live)
- [ ] Vorschau-Modus (Editor ↔ Vorschau umschalten)
- [ ] Speichern via Server Action
- [ ] Erfolgsmeldung nach Speichern mit Link zum Eintrag
- [ ] Responsive Editor (funktioniert auf Tablet)

## Technische Notizen
- Tiptap Packages: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-link
- Content wird als HTML in der DB gespeichert
- Editor ist eine Client Component, das Formular drumherum nutzt Server Actions

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ Rich-Text Editor Issue erstellt"

# --- Issue: Habits im Editor ---
gh issue create \
  --title "feat: Drei-Säulen Habits-Auswahl im Journal-Editor" \
  --label "enhancement" \
  --body "## Beschreibung
Die drei Gewohnheits-Säulen (Bewegung, Ernährung, Rauchstopp) als Pflichtfelder im Journal-Editor integrieren.

## Akzeptanzkriterien
- [ ] Drei Säulen als eigene UI-Komponente im Editor-Formular
- [ ] Bewegung: Button-Gruppe mit 3 Optionen (Minimal / 10k Schritte / 10k + Training)
- [ ] Ernährung: Button-Gruppe mit 4 Optionen (Keine / 1 / 2 / 3 gesunde Mahlzeiten)
- [ ] Rauchstopp: Button-Gruppe mit 3 Optionen (Geraucht / Nikotinersatz / Rauchfrei)
- [ ] Farbkodierung passend zu den Säulen-Farben (Grün / Orange / Blau)
- [ ] Alle drei required — Formular kann nicht ohne gespeichert werden
- [ ] Visuell ansprechend, nicht wie ein trockenes Dropdown
- [ ] Werte werden als Enums an die DB übergeben

## Design
- Button-Gruppen statt Dropdowns (schneller, visueller)
- Aktiver Button farbig hervorgehoben (Säulenfarbe)
- Inaktive Buttons dezent/grau
- Labels in Deutsch

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ Habits-Auswahl Issue erstellt"

# --- Issue: Banner-Bild Upload ---
gh issue create \
  --title "feat: Banner-Bild Upload für Journal-Einträge" \
  --label "enhancement" \
  --body "## Beschreibung
Bild-Upload im Journal-Editor für das Banner-Bild jedes Eintrags.

## Akzeptanzkriterien
- [ ] Upload-Feld im Editor-Formular (Drag & Drop oder Klick)
- [ ] Bild-Vorschau nach Upload
- [ ] Bilder werden nach \`public/images/journal/\` oder einem Upload-Verzeichnis gespeichert
- [ ] Automatische Bild-Optimierung (Resize auf max. Breite, WebP-Konvertierung)
- [ ] Banner-URL wird im JournalEntry gespeichert
- [ ] Bestehendes Banner beim Bearbeiten anzeigen und austauschbar
- [ ] Maximale Dateigrösse begrenzt (z.B. 5MB)
- [ ] Erlaubte Formate: JPEG, PNG, WebP

## Technische Notizen
- Next.js API Route für File Upload
- Sharp für Bild-Optimierung (oder Next.js Image Optimization)
- Bilder im Docker-Volume persistent speichern (nicht nur im Container)

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ Banner-Upload Issue erstellt"

# --- Issue: Manuelle Metriken ---
gh issue create \
  --title "feat: Manuelle Metriken-Erfassung im Admin-Bereich" \
  --label "enhancement" \
  --body "## Beschreibung
Admin-Seite zum manuellen Erfassen und Überschreiben von Metriken (Gewicht, Schritte etc.) für Tage wo die API-Daten fehlen.

## Akzeptanzkriterien
- [ ] \`/admin/metrics\` — Übersicht der Metriken mit Kalender-Ansicht
- [ ] Metriken für ein spezifisches Datum erfassen/bearbeiten
- [ ] Felder: Gewicht (kg), Körperfett (%), Schritte, Schlaf (h), Kalorien (dynamisch erweiterbar)
- [ ] Anzeige ob Werte manuell oder via API importiert sind (MetricSource)
- [ ] Manuelle Werte überschreiben API-Werte nicht automatisch — klare Kennzeichnung
- [ ] Formular-Validierung (z.B. Gewicht zwischen 30-300 kg)
- [ ] Schnell-Eingabe: heutiges Datum vorausgewählt

## Technische Notizen
- Server Actions für Speichern
- Upsert-Logik: wenn für das Datum schon ein API-Import existiert, Werte mergen
- source auf MANUAL setzen wenn manuell, MERGED wenn kombiniert

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ Manuelle Metriken Issue erstellt"

# --- Issue: Admin Dashboard ---
gh issue create \
  --title "feat: Admin-Dashboard mit Übersicht und Schnellzugriff" \
  --label "enhancement" \
  --body "## Beschreibung
Admin-Startseite nach dem Login mit Übersicht aller Einträge und Schnellzugriff auf wichtige Aktionen.

## Akzeptanzkriterien
- [ ] \`/admin/\` — Dashboard-Seite (geschützt)
- [ ] Button: Neuer Eintrag erstellen
- [ ] Liste aller Einträge (Titel, Datum, Status Published/Draft)
- [ ] Quick-Actions pro Eintrag: Bearbeiten, Ansehen, Draft/Publish Toggle
- [ ] Anzeige ob heute schon ein Eintrag existiert (Erinnerung)
- [ ] Letzte Metriken-Werte auf einen Blick
- [ ] Link zu Metriken-Erfassung

## Phase
- [x] Phase 1.5 — Web-CMS & Auth"

echo "✅ Admin Dashboard Issue erstellt"

echo ""
echo "============================================"
echo "✅ Alle 7 Phase-1.5-Issues erstellt!"
echo ""
echo "Empfohlene Reihenfolge:"
echo "  1. Auth (Google OAuth)     — Basis für Admin-Bereich"
echo "  2. JournalEntry DB-Model   — Neue Content-Architektur"
echo "  3. Rich-Text Editor        — Einträge im Browser schreiben"
echo "  4. Habits-Auswahl          — Drei Säulen im Editor"
echo "  5. Banner-Upload           — Bilder hochladen"
echo "  6. Manuelle Metriken       — Metriken von Hand erfassen"
echo "  7. Admin Dashboard         — Übersicht und Navigation"
echo ""
echo "Starte mit: git checkout -b feature/XX-google-auth"
echo "(XX = die Issue-Nummer die gh erstellt hat)"
echo "============================================"