import {
  PrismaClient,
  MovementLevel,
  NutritionLevel,
  SmokingStatus,
  MetricSource,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // =============================================
  // Journal-Einträge (Migration von MDX → DB)
  // =============================================

  await prisma.journalEntry.upsert({
    where: { slug: '2026-03-26' },
    update: {},
    create: {
      slug: '2026-03-26',
      title: 'Tag 1 — Der Anfang',
      excerpt: 'Heute beginnt das Projekt. Der erste Tag von 365.',
      content: `Heute beginnt das Projekt. Der erste Tag von 365.

## Was ich heute gelernt habe

Der erste Schritt ist oft der schwerste. Aber er ist gemacht.

## Wie ich mich fühle

Motiviert und ein bisschen nervös — aber bereit.`,
      date: new Date('2026-03-26'),
      movement: MovementLevel.STEPS_ONLY,
      nutrition: NutritionLevel.TWO,
      smoking: SmokingStatus.NONE,
      tags: ['motivation', 'start'],
      published: true,
    },
  })

  // =============================================
  // Metriken
  // =============================================

  await prisma.dailyMetrics.upsert({
    where: { date: new Date('2026-03-26') },
    update: {},
    create: {
      date: new Date('2026-03-26'),
      steps: 10500,
      weight: 85.0,
      source: MetricSource.MANUAL,
    },
  })

  console.log('Seed complete.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
