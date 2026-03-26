import { PrismaClient } from '@prisma/client'
import { getAllEntries } from '../src/lib/journal'
import { MOVEMENT_ENUM_MAP, NUTRITION_ENUM_MAP, SMOKING_ENUM_MAP } from '../src/lib/habits'

const prisma = new PrismaClient()

async function syncHabits() {
  const entries = getAllEntries()

  if (entries.length === 0) {
    console.log('No journal entries found.')
    return
  }

  console.log(`Syncing ${entries.length} entries...`)

  let synced = 0
  let skipped = 0

  for (const entry of entries) {
    const date = new Date(entry.date)
    const movement = MOVEMENT_ENUM_MAP[entry.habits.movement]
    const nutrition = NUTRITION_ENUM_MAP[entry.habits.nutrition]
    const smoking = SMOKING_ENUM_MAP[entry.habits.smoking]

    await prisma.dailyHabits.upsert({
      where: { date },
      update: { movement, nutrition, smoking },
      create: { date, movement, nutrition, smoking },
    })

    console.log(`  ✓ ${entry.slug}`)
    synced++
  }

  console.log(`\nSync complete: ${synced} synced, ${skipped} skipped.`)
}

syncHabits()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
