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
      content: `<p>Heute beginnt das Projekt. Der erste Tag von 365.</p><h2>Was ich heute gelernt habe</h2><p>Der erste Schritt ist oft der schwerste. Aber er ist gemacht.</p><h2>Wie ich mich fühle</h2><p>Motiviert und ein bisschen nervös — aber bereit.</p>`,
      date: new Date('2026-03-26'),
      movement: MovementLevel.STEPS_ONLY,
      nutrition: NutritionLevel.TWO_MEALS,
      smoking: SmokingStatus.SMOKE_FREE,
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
