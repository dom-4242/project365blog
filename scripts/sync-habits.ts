import { PrismaClient, MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const prisma = new PrismaClient()
const JOURNAL_DIR = path.join(process.cwd(), 'content/journal')

const MOVEMENT_MAP: Record<string, MovementLevel> = {
  minimal: MovementLevel.MINIMAL,
  steps_only: MovementLevel.STEPS_ONLY,
  steps_trained: MovementLevel.STEPS_TRAINED,
}

const NUTRITION_MAP: Record<string, NutritionLevel> = {
  none: NutritionLevel.NONE,
  one: NutritionLevel.ONE,
  two: NutritionLevel.TWO,
  three: NutritionLevel.THREE,
}

const SMOKING_MAP: Record<string, SmokingStatus> = {
  smoked: SmokingStatus.SMOKED,
  replacement: SmokingStatus.REPLACEMENT,
  none: SmokingStatus.NONE,
}

async function syncHabits() {
  if (!fs.existsSync(JOURNAL_DIR)) {
    console.log('No journal entries found.')
    return
  }

  const files = fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith('.mdx'))
  console.log(`Syncing ${files.length} entries...`)

  for (const filename of files) {
    const slug = filename.replace('.mdx', '')
    const filePath = path.join(JOURNAL_DIR, filename)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(fileContent)

    if (!data.habits) {
      console.warn(`No habits in ${filename}, skipping`)
      continue
    }

    const date = new Date(data.date as string)
    const movement = MOVEMENT_MAP[data.habits.movement as string]
    const nutrition = NUTRITION_MAP[data.habits.nutrition as string]
    const smoking = SMOKING_MAP[data.habits.smoking as string]

    if (!movement || !nutrition || !smoking) {
      console.warn(`Invalid habit values in ${filename}, skipping`)
      continue
    }

    await prisma.dailyHabits.upsert({
      where: { date },
      update: { movement, nutrition, smoking },
      create: { date, movement, nutrition, smoking },
    })

    console.log(`Synced ${slug}`)
  }

  console.log('Sync complete.')
  await prisma.$disconnect()
}

syncHabits().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
