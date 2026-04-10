/**
 * Seed script: inserts 45 sample journal entries + metrics into the local DB.
 * Run: npx tsx scripts/seed-sample-data.ts
 *
 * Safe to re-run — uses upsert so existing entries are not duplicated.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Project starts 45 days ago
const today = new Date()
const START_DATE = new Date(today)
START_DATE.setDate(today.getDate() - 44)

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

import type { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'

// Realistic-ish habit patterns — not perfect every day
const MOVEMENT_PATTERN: MovementLevel[] = [
  'STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED','MINIMAL','STEPS_ONLY',
  'STEPS_TRAINED','STEPS_TRAINED','STEPS_ONLY','TRAINED_ONLY','STEPS_TRAINED',
  'MINIMAL','STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED','STEPS_TRAINED',
  'STEPS_ONLY','STEPS_TRAINED','MINIMAL','STEPS_TRAINED','STEPS_ONLY',
  'STEPS_TRAINED','STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED','TRAINED_ONLY',
  'STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED','STEPS_TRAINED','MINIMAL',
  'STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED','STEPS_TRAINED','STEPS_ONLY',
  'STEPS_TRAINED','TRAINED_ONLY','STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED',
  'STEPS_TRAINED','MINIMAL','STEPS_TRAINED','STEPS_ONLY','STEPS_TRAINED',
]

const NUTRITION_PATTERN: NutritionLevel[] = [
  'THREE_MEALS','TWO_MEALS','THREE_MEALS','ONE_MEAL','TWO_MEALS',
  'THREE_MEALS','THREE_MEALS','TWO_MEALS','THREE_MEALS','TWO_MEALS',
  'ONE_MEAL','THREE_MEALS','TWO_MEALS','THREE_MEALS','TWO_MEALS',
  'THREE_MEALS','TWO_MEALS','TWO_MEALS','THREE_MEALS','ONE_MEAL',
  'THREE_MEALS','TWO_MEALS','THREE_MEALS','THREE_MEALS','TWO_MEALS',
  'THREE_MEALS','ONE_MEAL','THREE_MEALS','TWO_MEALS','THREE_MEALS',
  'THREE_MEALS','TWO_MEALS','THREE_MEALS','THREE_MEALS','ONE_MEAL',
  'THREE_MEALS','TWO_MEALS','THREE_MEALS','THREE_MEALS','TWO_MEALS',
  'THREE_MEALS','TWO_MEALS','THREE_MEALS','ONE_MEAL','THREE_MEALS',
]

const SMOKING_PATTERN: SmokingStatus[] = [
  'SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','NICOTINE_REPLACEMENT','SMOKE_FREE',
  'SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','NICOTINE_REPLACEMENT','SMOKE_FREE',
  'SMOKE_FREE','SMOKED','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE',
  'SMOKE_FREE','SMOKE_FREE','NICOTINE_REPLACEMENT','SMOKE_FREE','SMOKE_FREE',
  'SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','NICOTINE_REPLACEMENT',
  'SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE',
  'SMOKE_FREE','SMOKE_FREE','NICOTINE_REPLACEMENT','SMOKE_FREE','SMOKE_FREE',
  'SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE',
  'SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE','SMOKE_FREE',
]

const TITLES = [
  'Neuer Start, alter Rhythmus',
  'Früh raus, trotzdem gute Laune',
  "Regentag — aber ich hab's geschafft",
  'Kleiner Rückfall, großes Aufstehen',
  'Heute war einfach gut',
  'Müde, aber dabei',
  'Training trotz Stress',
  'Ein Schritt nach dem anderen',
  'Fokus auf das Wesentliche',
  'Nicht perfekt, aber ehrlich',
  'Morgens laufen, abends reflektieren',
  'Gewohnheiten brauchen Zeit',
  'Warum ich das hier mache',
  'Guter Tag, schlechte Nacht',
  'Die Säulen halten',
  'Wieder auf Kurs',
  'Kleinigkeiten zählen',
  'Kein grosser Tag — und das ist ok',
  'Mehr Energie heute',
  'Zwischen den Zeilen',
  'Draussen sein hilft',
  'Konsequenz über Motivation',
  'Heute: viel Wasser, wenig Quatsch',
  'Schlechte Ausrede, gute Ausführung',
  'Fortschritt ist nicht linear',
  'Willenskraft ist trainierbar',
  'Die kleinen Momente',
  'Alles im Grünen',
  'Wochenende ohne Ausrede',
  'Auf mich selbst hören',
  'Rückschritt als Lektion',
  'Heute hab ich mich selbst überrascht',
  'Wieder angefangen',
  'Warum Ehrlichkeit wichtig ist',
  'Tag 35 — Halbzeit',
  'Momentum aufbauen',
  'Ich bin kein Roboter',
  'Klarheit durch Bewegung',
  'Drei Säulen, ein Ziel',
  'Heute war hart — ich bin trotzdem hier',
  'Die Lücken füllen',
  'Augen auf, Kopf hoch',
  'Nächste Woche ist auch noch ein Tag',
  'Kurz innehalten',
  "Weiter geht's",
]

const EXCERPTS = [
  'Heute Morgen um 6 raus, Laufrunde um den See. Der Kopf war klar danach.',
  'Wieder mal einen Rückschlag gehabt, aber aufgestanden und weitergemacht.',
  'Drei Mahlzeiten, 12.000 Schritte — ich merk, wie sich das aufbaut.',
  'Manchmal reicht es, einfach dabei zu bleiben.',
  'Der Körper will sich bewegen. Ich hab aufgehört zu kämpfen.',
  'Kein grosser Tag, aber ein ehrlicher.',
  'Schlechter Schlaf, trotzdem Training — manchmal macht man es einfach.',
  'Heute zum ersten Mal seit Wochen keinen Gedanken ans Rauchen.',
  'Kleine Schritte, grosse Wirkung.',
  'Accountability durch Öffentlichkeit — das ist der Punkt.',
]

const CONTENT = `<p>Heute war wieder ein Tag, der zeigt: Konsequenz schlägt Motivation. Ich hatte keine grosse Lust, aber ich hab es trotzdem gemacht.</p><p>Die drei Säulen halten sich gut. Bewegung ist inzwischen fast automatisch. Ernährung braucht noch Aufmerksamkeit. Beim Rauchstopp bin ich stolz auf mich.</p>`

async function main() {
  console.log('🌱 Seeding sample data...\n')

  // Ensure UserProfile with start date exists
  await prisma.userProfile.upsert({
    where: { id: 'singleton' },
    update: { projectStartDate: dateStr(START_DATE) },
    create: {
      id: 'singleton',
      projectStartDate: dateStr(START_DATE),
      heightCm: 180,
      targetWeight: 78,
      targetSteps: 10000,
    },
  })
  console.log(`✓ UserProfile: project starts ${dateStr(START_DATE)}`)

  // Insert 45 journal entries
  let created = 0
  let skipped = 0

  for (let i = 0; i < 45; i++) {
    const date = addDays(START_DATE, i)
    const slug = `tag-${String(i + 1).padStart(3, '0')}-sample`

    try {
      await prisma.journalEntry.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          title: TITLES[i % TITLES.length],
          content: CONTENT,
          excerpt: EXCERPTS[i % EXCERPTS.length],
          date: new Date(dateStr(date) + 'T12:00:00Z'),
          published: true,
          movement:  MOVEMENT_PATTERN[i],
          nutrition: NUTRITION_PATTERN[i],
          smoking:   SMOKING_PATTERN[i],
        },
      })
      created++
    } catch (e) {
      skipped++
    }
  }
  console.log(`✓ JournalEntries: ${created} created, ${skipped} skipped`)

  // Insert 45 days of metrics (weight + steps + body fat)
  let mCreated = 0
  let mSkipped = 0

  for (let i = 0; i < 45; i++) {
    const date = addDays(START_DATE, i)
    const noise = () => (Math.random() - 0.5) * 0.4
    const stepsNoise = () => Math.round((Math.random() - 0.3) * 3000)

    try {
      await prisma.dailyMetrics.upsert({
        where: { date: new Date(dateStr(date) + 'T00:00:00Z') },
        update: {},
        create: {
          date: new Date(dateStr(date) + 'T00:00:00Z'),
          weight: parseFloat((84.2 - i * 0.08 + noise()).toFixed(1)),
          bodyFat: parseFloat((22.5 - i * 0.04 + noise() * 0.3).toFixed(1)),
          steps: Math.max(3000, 9500 + stepsNoise()),
          source: 'MANUAL',
        },
      })
      mCreated++
    } catch (e) {
      mSkipped++
    }
  }
  console.log(`✓ DailyMetrics:   ${mCreated} created, ${mSkipped} skipped`)

  console.log('\n✅ Done! Restart the dev server or hard-refresh to see the data.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
