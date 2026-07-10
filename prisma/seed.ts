import {
  PrismaClient,
  MovementLevel,
  FulfillmentStatus,
  SmokingStatus,
  MetricSource,
  Sex,
  DeficitMethod,
  PhaseMode,
} from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition-Umbau (N-01): Anker-Datum der ersten Eckdaten. Entspricht dem
// Berechnungsstand aus der Fibel-Methodik (Notion-Sub-Page, Stand 2026-07-08).
// Bewusst ein fixes Datum statt `new Date()` → reproduzierbarer, idempotenter Seed.
const INITIAL_TARGETS_VALID_FROM = new Date('2026-07-08')
const INITIAL_PHASE_ID = 'seed-phase-deficit-1'

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
      nutrition: FulfillmentStatus.FULFILLED,
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

  // =============================================
  // Nutrition-Tracking (N-01) — Erste Eckdaten + aktive Defizit-Phase
  // Werte aus der Fibel-Methodik (Notion-Sub-Page „Ernährungs-Eckdaten"):
  // BMR HB#1+#2 → Ø 1'856 → ×1,55 = TDEE 2'877 → ×0,8 = 2'301 kcal,
  // Protein auf Zielgewicht korrigiert (185 g), Fett 20 %/min (51 g), KH Rest (275 g).
  // =============================================

  const targets = await prisma.nutritionTargets.upsert({
    where: { validFrom: INITIAL_TARGETS_VALID_FROM },
    update: {},
    create: {
      validFrom: INITIAL_TARGETS_VALID_FROM,
      baseWeightKg: 94,
      sex: Sex.MALE,
      heightCm: 170,
      age: 43,
      bodyFatPct: 27,
      activityFactor: 1.55,
      deficitMode: DeficitMethod.MODERATE, // TDEE × 0,8
      targetKcal: 2301,
      proteinG: 185,
      fatG: 51,
      carbsG: 275,
      mealsPerDay: 4,
      calcNote:
        'Fibel/Roscher: BMR HB#1 1793 + HB#2 1919 → Ø 1856 → ×1,55 (moderat) = TDEE 2877 → ×0,8 = 2301 kcal. ' +
        'Protein auf Zielgewicht (~80 kg) korrigiert wegen ~27 % KF (185 g statt 226 g). Fett 20 % (51 g, min. 47 g ✓). KH Rest (275 g).',
    },
  })

  await prisma.phase.upsert({
    where: { id: INITIAL_PHASE_ID },
    update: {},
    create: {
      id: INITIAL_PHASE_ID,
      mode: PhaseMode.DEFICIT,
      startDate: INITIAL_TARGETS_VALID_FROM,
      status: 'ACTIVE',
      targetsId: targets.id,
      note: 'Erste Defizit-Phase (Seed) — 20 % Defizit, Start der Fettverlust-Fibel-Methodik.',
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
