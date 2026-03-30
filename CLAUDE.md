# CLAUDE.md — Phasen-Update (Phase 2 → Done, Phase 3 detailliert)
# ================================================================
#
# Ersetze in deiner CLAUDE.md die gesamte "Features & Phasen" Sektion
# (ab "## Features & Phasen" bis zum Ende der Phase 4)
# mit folgendem Inhalt:
# ================================================================

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

### Phase 3 — Mehrsprachigkeit (aktuell)
- [ ] next-intl Setup mit Locale-Routing (/de, /en)
- [ ] UI-Übersetzungen für Navigation, Footer und Dashboard
- [ ] Sprachumschalter in Navigation
- [ ] AI-Übersetzung der Journal-Einträge (DE → EN) via Claude API
- [ ] Übersetzungs-Cache und Admin-UI für Übersetzungen
- [ ] SEO für mehrsprachige Inhalte (hreflang, locale Meta-Tags)

### Phase 4 — Erweitert
- [ ] Jahres-Übersicht (GitHub-style Contribution Grid) für die drei Säulen
- [ ] Monats-Zusammenfassungen (automatisch generiert)
- [ ] PostgreSQL Backup-Strategie
- [ ] Statistiken & Seitenaufrufe im Admin
