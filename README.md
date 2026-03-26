# Project 365 Blog

Ein öffentliches tägliches Journal (365-Tage-Projekt) mit integriertem Habit-Tracking und Metriken-Visualisierung.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- PostgreSQL + Prisma
- MDX für Content
- Recharts für Visualisierungen

## Setup

```bash
# Dependencies installieren
pnpm install

# Prisma Client generieren
pnpm db:generate

# Datenbank migrieren
pnpm db:migrate

# Dev-Server starten
pnpm dev
```

See CLAUDE.md for full documentation.
