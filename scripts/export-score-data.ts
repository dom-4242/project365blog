/**
 * Export der Score-System-Daten (MealLog + MealPlan) als JSON und CSV.
 *
 * ZWINGEND vor dem Deploy der Migration `20260710150000_score_removal`
 * ausführen — danach sind die Tabellen unwiederbringlich entfernt (N-09).
 *
 * Nutzung (auf dem Server / gegen die Produktions-DB):
 *   DATABASE_URL=postgres://… pnpm tsx scripts/export-score-data.ts
 *
 * Verwendet Raw-SQL, damit das Script unabhängig vom (bereits umgebauten)
 * Prisma-Client gegen die noch bestehenden Tabellen läuft. Schreibt nach
 * ./backups/score-export-<timestamp>/.
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const cols = Object.keys(rows[0])
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = v instanceof Date ? v.toISOString() : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = cols.join(',')
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n')
  return `${header}\n${body}\n`
}

const jsonReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value

async function dump(table: string, outDir: string): Promise<number> {
  let rows: Record<string, unknown>[]
  try {
    rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "${table}" ORDER BY "date"`,
    )
  } catch (e) {
    console.warn(`⚠️  Tabelle "${table}" nicht lesbar (evtl. bereits entfernt): ${String(e)}`)
    return 0
  }
  writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, jsonReplacer, 2))
  writeFileSync(path.join(outDir, `${table}.csv`), toCsv(rows))
  console.log(`✓ ${table}: ${rows.length} Zeilen → ${table}.json / ${table}.csv`)
  return rows.length
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join(process.cwd(), 'backups', `score-export-${stamp}`)
  mkdirSync(outDir, { recursive: true })
  console.log(`Export nach: ${outDir}`)

  const mealLogs = await dump('MealLog', outDir)
  const mealPlans = await dump('MealPlan', outDir)

  writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ exportedAt: new Date().toISOString(), mealLogs, mealPlans }, null, 2),
  )
  console.log(`\nFertig. MealLog: ${mealLogs}, MealPlan: ${mealPlans}. Backup in ${outDir}.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
