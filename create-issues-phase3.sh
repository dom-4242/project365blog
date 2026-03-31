#!/bin/bash

echo "🌐 Erstelle Phase 3 Issues — Mehrsprachigkeit..."
echo ""

# --- next-intl Setup & Routing ---
gh issue create \
  --title "feat: next-intl Setup mit Locale-Routing (/de, /en)" \
  --label "enhancement" \
  --body "## Beschreibung
Internationalisierung mit next-intl einrichten. Deutsche und englische Locale mit URL-Präfix-Routing.

## Akzeptanzkriterien
- [ ] next-intl installiert und konfiguriert
- [ ] Middleware für Locale-Detection und Routing
- [ ] URL-Struktur: \`/de/...\` und \`/en/...\` (Default: /de)
- [ ] Redirect von \`/\` auf \`/de\`
- [ ] Alle bestehenden Seiten funktionieren unter \`/de/...\`
- [ ] Layout mit IntlProvider/NextIntlClientProvider
- [ ] messages/de.json und messages/en.json Grundstruktur

## Technische Notizen
- next-intl mit App Router: https://next-intl-docs.vercel.app/docs/getting-started/app-router
- Middleware-basiertes Routing mit \`createMiddleware\`
- Bestehende NextAuth-Middleware muss mit i18n-Middleware kombiniert werden

## Phase
Phase 3 — Mehrsprachigkeit"

echo "✅ next-intl Setup Issue erstellt"

# --- UI-Übersetzungen ---
gh issue create \
  --title "feat: UI-Übersetzungen für Navigation, Footer und Dashboard" \
  --label "enhancement" \
  --body "## Beschreibung
Alle statischen UI-Texte (Navigation, Footer, Dashboard-Labels, Buttons, Fehlermeldungen) über next-intl Übersetzungsdateien verwalten.

## Akzeptanzkriterien
- [ ] Alle hardcodierten deutschen Strings durch \`useTranslations()\` / \`getTranslations()\` ersetzt
- [ ] messages/de.json mit allen UI-Strings
- [ ] messages/en.json mit englischen Übersetzungen
- [ ] Namespaces: common, navigation, dashboard, habits, metrics, journal, admin, reactions
- [ ] Datumsformatierung locale-abhängig (de: 26. März 2026 / en: March 26, 2026)
- [ ] Zahlenformatierung locale-abhängig (de: 1.234,5 / en: 1,234.5)

## Phase
Phase 3 — Mehrsprachigkeit"

echo "✅ UI-Übersetzungen Issue erstellt"

# --- Sprachumschalter ---
gh issue create \
  --title "feat: Sprachumschalter in Navigation" \
  --label "enhancement" \
  --body "## Beschreibung
Ein Sprachumschalter in der Navigation, der zwischen Deutsch und Englisch wechselt.

## Akzeptanzkriterien
- [ ] Sprachumschalter im Header/Navigation sichtbar
- [ ] Wechsel zwischen DE und EN ohne Seiten-Reload (Client-Side Navigation)
- [ ] Aktuelle Sprache visuell hervorgehoben
- [ ] URL ändert sich korrekt (/de/... ↔ /en/...)
- [ ] Auswahl wird per Cookie gespeichert für nächsten Besuch
- [ ] Mobile-responsive Design
- [ ] Dark Mode kompatibel

## Technische Notizen
- next-intl \`useRouter\` und \`usePathname\` für Navigation
- Link-Komponente mit locale-Prop

## Phase
Phase 3 — Mehrsprachigkeit"

echo "✅ Sprachumschalter Issue erstellt"

# --- AI-Übersetzung Journal-Einträge ---
gh issue create \
  --title "feat: AI-Übersetzung der Journal-Einträge (DE → EN) via Claude API" \
  --label "enhancement" \
  --body "## Beschreibung
Journal-Einträge werden auf Deutsch verfasst und automatisch via Claude API ins Englische übersetzt. Die Übersetzung erfolgt on-demand oder beim Speichern.

## Akzeptanzkriterien
- [ ] Claude API (Anthropic SDK) Integration
- [ ] Übersetzung von Titel und Content (Rich-Text/HTML)
- [ ] Übersetzungs-Ergebnis in DB speichern (neues Feld oder separate Tabelle)
- [ ] Admin kann Übersetzung manuell auslösen (Button im Admin)
- [ ] Automatische Übersetzung beim Publizieren (optional, konfigurierbar)
- [ ] Englische Version unter /en/journal/[slug] abrufbar
- [ ] Übersetzungs-Status sichtbar im Admin (übersetzt / nicht übersetzt / veraltet)
- [ ] Bei Änderung am Original: Status auf \"veraltet\" setzen

## Technische Notizen
- Anthropic SDK: \`@anthropic-ai/sdk\`
- Model: claude-sonnet-4-20250514 (gutes Preis/Leistungs-Verhältnis)
- System-Prompt für konsistente Blog-Übersetzungen (Ton, Stil beibehalten)
- Rate-Limiting beachten
- ANTHROPIC_API_KEY in .env

## Phase
Phase 3 — Mehrsprachigkeit"

echo "✅ AI-Übersetzung Issue erstellt"

# --- Übersetzungs-Cache & Admin-UI ---
gh issue create \
  --title "feat: Übersetzungs-Cache und Admin-UI für Übersetzungen" \
  --label "enhancement" \
  --body "## Beschreibung
Cache-System für Übersetzungen und eine Admin-Oberfläche zur Verwaltung.

## Akzeptanzkriterien
- [ ] DB-Schema für Übersetzungen (JournalEntryTranslation oder Felder auf JournalEntry)
- [ ] Übersetzungen werden gecacht und nur bei Änderung neu generiert
- [ ] Admin-Seite: Liste aller Einträge mit Übersetzungs-Status
- [ ] Admin: Manuelles Auslösen einer Übersetzung pro Eintrag
- [ ] Admin: Bulk-Übersetzung aller fehlenden/veralteten Einträge
- [ ] Admin: Vorschau der Übersetzung vor Veröffentlichung
- [ ] Admin: Manuelles Bearbeiten der Übersetzung möglich
- [ ] Kosten-Tracking: API-Aufrufe und geschätzte Kosten anzeigen

## Phase
Phase 3 — Mehrsprachigkeit"

echo "✅ Übersetzungs-Cache Issue erstellt"

# --- SEO für Mehrsprachigkeit ---
gh issue create \
  --title "feat: SEO für mehrsprachige Inhalte (hreflang, locale Meta-Tags)" \
  --label "enhancement" \
  --body "## Beschreibung
SEO-Optimierung für die mehrsprachige Seite, damit Suchmaschinen die Sprachversionen korrekt zuordnen.

## Akzeptanzkriterien
- [ ] hreflang-Tags auf allen Seiten (\`<link rel=\"alternate\" hreflang=\"de\">\` / \`hreflang=\"en\">\`)
- [ ] Open Graph locale-Tags (og:locale, og:locale:alternate)
- [ ] Sitemap mit allen Sprachversionen (xhtml:link alternates)
- [ ] Canonical URLs pro Sprache
- [ ] HTML lang-Attribut dynamisch gesetzt
- [ ] RSS-Feed pro Sprache oder mit Sprachkennung
- [ ] Structured Data (JSON-LD) mit inLanguage

## Technische Notizen
- next-intl Metadata-Integration
- Bestehende Sitemap erweitern
- Google Search Console für beide Sprachen

## Phase
Phase 3 — Mehrsprachigkeit"

echo "✅ SEO Mehrsprachigkeit Issue erstellt"

echo ""
echo "============================================"
echo "✅ Alle 6 Phase-3-Issues erstellt!"
echo ""
echo "Empfohlene Reihenfolge:"
echo "  1. next-intl Setup & Routing (Grundlage)"
echo "  2. UI-Übersetzungen (alle Strings)"
echo "  3. Sprachumschalter (Navigation)"
echo "  4. AI-Übersetzung Journal-Einträge (Claude API)"
echo "  5. Übersetzungs-Cache & Admin-UI"
echo "  6. SEO für Mehrsprachigkeit"
echo ""
echo "Starte mit: git checkout -b feature/XX-i18n-setup"
echo "(XX = die Issue-Nummer die gh erstellt hat)"
echo "============================================"