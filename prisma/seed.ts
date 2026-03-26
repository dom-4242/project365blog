import { PrismaClient, MovementLevel, NutritionLevel, SmokingStatus, MetricSource } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Example habits entry for day 1
  await prisma.dailyHabits.upsert({
    where: { date: new Date('2026-03-26') },
    update: {},
    create: {
      date: new Date('2026-03-26'),
      movement: MovementLevel.STEPS_ONLY,
      nutrition: NutritionLevel.TWO,
      smoking: SmokingStatus.NONE,
    },
  })

  // Example metrics entry for day 1
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
