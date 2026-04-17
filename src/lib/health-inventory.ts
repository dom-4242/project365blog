import { prisma } from '@/lib/db'

// ── Static mapping: Apple Health metric name → display info ──────────────────
// Key = lowercase normalized metric name (spaces, case-insensitive match)
// Covers common HealthKit identifiers sent by Health Auto Export app.

interface MetricMeta {
  displayName: string
  category: string
  mappedToDb?: string  // DailyMetrics field name if actively stored
  usedInDashboard?: boolean
  dashboardNote?: string
}

// Normalize: lowercase + collapse whitespace
function normalizeMetricName(name: string): string {
  return name.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

const METRIC_MAP: Record<string, MetricMeta> = {
  // Activity
  'step count':                     { displayName: 'Schritte',                      category: 'Aktivität',          mappedToDb: 'steps',          usedInDashboard: true,  dashboardNote: 'Ø 30 Tage in Bento-Grid' },
  'steps':                          { displayName: 'Schritte',                      category: 'Aktivität',          mappedToDb: 'steps',          usedInDashboard: true,  dashboardNote: 'Ø 30 Tage in Bento-Grid' },
  'active energy burned':           { displayName: 'Aktive Energie',                category: 'Aktivität',          mappedToDb: 'caloriesBurned', usedInDashboard: false },
  'active energy':                  { displayName: 'Aktive Energie',                category: 'Aktivität',          mappedToDb: 'caloriesBurned', usedInDashboard: false },
  'basal energy burned':            { displayName: 'Ruheumsatz (Basal Energy)',      category: 'Aktivität',          mappedToDb: 'caloriesBurned', usedInDashboard: false },
  'resting energy':                 { displayName: 'Ruheumsatz',                    category: 'Aktivität',          mappedToDb: 'caloriesBurned', usedInDashboard: false },
  'walking + running distance':     { displayName: 'Lauf-/Gehdistanz',              category: 'Aktivität',          mappedToDb: 'distance',       usedInDashboard: false },
  'walking running distance':       { displayName: 'Lauf-/Gehdistanz',              category: 'Aktivität',          mappedToDb: 'distance',       usedInDashboard: false },
  'distance walking running':       { displayName: 'Lauf-/Gehdistanz',              category: 'Aktivität',          mappedToDb: 'distance',       usedInDashboard: false },
  'exercise minutes':               { displayName: 'Trainingsminuten',              category: 'Aktivität' },
  'exercise time':                  { displayName: 'Trainingszeit',                 category: 'Aktivität' },
  'stand time':                     { displayName: 'Stehzeit',                      category: 'Aktivität' },
  'stand hours':                    { displayName: 'Stehstunden',                   category: 'Aktivität' },
  'flights climbed':                { displayName: 'Treppenstufen (Stockwerke)',     category: 'Aktivität' },
  'walking speed':                  { displayName: 'Gehgeschwindigkeit',             category: 'Aktivität' },
  'walking step length':            { displayName: 'Schrittlänge',                  category: 'Aktivität' },
  'walking asymmetry percentage':   { displayName: 'Gehasymmetrie',                 category: 'Aktivität' },
  'walking double support percentage': { displayName: 'Doppelstützphase',           category: 'Aktivität' },
  'apple exercise time':            { displayName: 'Apple Trainingszeit',            category: 'Aktivität' },
  'apple stand time':               { displayName: 'Apple Stehzeit',                category: 'Aktivität' },
  'apple stand hour':               { displayName: 'Apple Stehstunden',             category: 'Aktivität' },
  'move minutes':                   { displayName: 'Bewegungsminuten',              category: 'Aktivität' },
  'stair speed up':                 { displayName: 'Treppengeschwindigkeit aufwärts', category: 'Aktivität' },
  'stair speed down':               { displayName: 'Treppengeschwindigkeit abwärts',  category: 'Aktivität' },
  'six minute walking test distance': { displayName: '6-Minuten-Gehtest Distanz',    category: 'Aktivität' },
  'cycling distance':               { displayName: 'Raddistanz',                    category: 'Aktivität' },
  'swimming distance':              { displayName: 'Schwimmdistanz',                category: 'Aktivität' },
  'swimming stroke count':          { displayName: 'Schwimmzüge',                   category: 'Aktivität' },
  'push count':                     { displayName: 'Rollstuhl-Schübe',              category: 'Aktivität' },
  'nike fuel':                      { displayName: 'Nike Fuel',                     category: 'Aktivität' },
  'physical effort':                { displayName: 'Körperliche Anstrengung',       category: 'Aktivität' },

  // Body Measurements
  'body mass':                      { displayName: 'Körpergewicht',                 category: 'Körper',             mappedToDb: 'weight',         usedInDashboard: true,  dashboardNote: 'Startseite – primär Fitbit' },
  'weight':                         { displayName: 'Körpergewicht',                 category: 'Körper',             mappedToDb: 'weight',         usedInDashboard: true,  dashboardNote: 'Startseite – primär Fitbit' },
  'body fat percentage':            { displayName: 'Körperfettanteil',              category: 'Körper',             mappedToDb: 'bodyFat',        usedInDashboard: true,  dashboardNote: 'Startseite – primär Fitbit' },
  'body fat':                       { displayName: 'Körperfettanteil',              category: 'Körper',             mappedToDb: 'bodyFat',        usedInDashboard: true,  dashboardNote: 'Startseite – primär Fitbit' },
  'body mass index':                { displayName: 'BMI',                           category: 'Körper' },
  'bmi':                            { displayName: 'BMI',                           category: 'Körper' },
  'lean body mass':                 { displayName: 'Magermasse',                    category: 'Körper' },
  'height':                         { displayName: 'Körpergrösse',                  category: 'Körper' },
  'waist circumference':            { displayName: 'Taillenumfang',                 category: 'Körper' },
  'wrist circumference':            { displayName: 'Handgelenkumfang',              category: 'Körper' },
  'apple sleeping wrist temperature': { displayName: 'Handgelenk-Schlaftemperatur', category: 'Herz & Vitalwerte' },

  // Heart & Vitals
  'resting heart rate':             { displayName: 'Ruheherzfrequenz',              category: 'Herz & Vitalwerte',  mappedToDb: 'restingHR',      usedInDashboard: false },
  'heart rate':                     { displayName: 'Herzfrequenz',                  category: 'Herz & Vitalwerte' },
  'heart rate variability sdnn':    { displayName: 'HRV (SDNN)',                    category: 'Herz & Vitalwerte' },
  'heart rate variability':         { displayName: 'Herzfrequenzvariabilität',      category: 'Herz & Vitalwerte' },
  'walking heart rate average':     { displayName: 'Herzfrequenz beim Gehen',       category: 'Herz & Vitalwerte' },
  'blood oxygen saturation':        { displayName: 'Blutsauerstoff (SpO2)',         category: 'Herz & Vitalwerte' },
  'oxygen saturation':              { displayName: 'Sauerstoffsättigung',           category: 'Herz & Vitalwerte' },
  'blood pressure systolic':        { displayName: 'Blutdruck systolisch',          category: 'Herz & Vitalwerte' },
  'blood pressure diastolic':       { displayName: 'Blutdruck diastolisch',         category: 'Herz & Vitalwerte' },
  'respiratory rate':               { displayName: 'Atemfrequenz',                  category: 'Herz & Vitalwerte' },
  'body temperature':               { displayName: 'Körpertemperatur',              category: 'Herz & Vitalwerte' },
  'wrist temperature':              { displayName: 'Handgelenktemperatur',          category: 'Herz & Vitalwerte' },
  'electrodermal activity':         { displayName: 'Elektrodermale Aktivität',      category: 'Herz & Vitalwerte' },
  'cardio fitness':                 { displayName: 'Kardiorespiratorische Fitness', category: 'Herz & Vitalwerte' },
  'vo2 max':                        { displayName: 'VO₂ Max',                       category: 'Herz & Vitalwerte' },
  'forced vital capacity':          { displayName: 'Vitalkapazität',                category: 'Herz & Vitalwerte' },
  'peak expiratory flow rate':      { displayName: 'Spitzenatem-Fluss',             category: 'Herz & Vitalwerte' },
  'peripheral perfusion index':     { displayName: 'Peripherer Perfusionsindex',    category: 'Herz & Vitalwerte' },

  // Sleep
  'sleep analysis':                 { displayName: 'Schlafanalyse',                 category: 'Schlaf',             mappedToDb: 'sleepDuration',  usedInDashboard: false },
  'sleep':                          { displayName: 'Schlaf',                        category: 'Schlaf',             mappedToDb: 'sleepDuration',  usedInDashboard: false },
  'time in daylight':               { displayName: 'Tageslicht-Exposition',         category: 'Schlaf' },

  // Nutrition
  'dietary energy consumed':        { displayName: 'Nahrungsenergie',               category: 'Ernährung' },
  'dietary energy':                 { displayName: 'Nahrungsenergie',               category: 'Ernährung' },
  'water':                          { displayName: 'Wasser',                        category: 'Ernährung' },
  'dietary protein':                { displayName: 'Protein',                       category: 'Ernährung' },
  'dietary carbohydrates':          { displayName: 'Kohlenhydrate',                 category: 'Ernährung' },
  'dietary fat total':              { displayName: 'Fett gesamt',                   category: 'Ernährung' },
  'dietary fiber':                  { displayName: 'Ballaststoffe',                 category: 'Ernährung' },
  'dietary sugar':                  { displayName: 'Zucker',                        category: 'Ernährung' },
  'dietary sodium':                 { displayName: 'Natrium',                       category: 'Ernährung' },
  'dietary caffeine':               { displayName: 'Koffein',                       category: 'Ernährung' },
  'dietary vitamin c':              { displayName: 'Vitamin C',                     category: 'Ernährung' },
  'dietary vitamin d':              { displayName: 'Vitamin D',                     category: 'Ernährung' },
  'dietary calcium':                { displayName: 'Calcium',                       category: 'Ernährung' },
  'dietary iron':                   { displayName: 'Eisen',                         category: 'Ernährung' },
  'dietary potassium':              { displayName: 'Kalium',                        category: 'Ernährung' },

  // Mind & Other
  'mindful minutes':                { displayName: 'Achtsamkeitsminuten',           category: 'Mind & Sonstiges' },
  'mindfulness minutes':            { displayName: 'Achtsamkeitsminuten',           category: 'Mind & Sonstiges' },
  'audio exposure':                 { displayName: 'Lärm-Exposition',               category: 'Mind & Sonstiges' },
  'headphone audio exposure':       { displayName: 'Kopfhörer-Lautstärke',         category: 'Mind & Sonstiges' },
  'environmental audio exposure':   { displayName: 'Umgebungslärm',                category: 'Mind & Sonstiges' },
  'handwashing':                    { displayName: 'Händewaschen',                  category: 'Mind & Sonstiges' },
  'toothbrushing duration':         { displayName: 'Zahnputzdauer',                 category: 'Mind & Sonstiges' },
  'sexual activity':                { displayName: 'Sexuelle Aktivität',            category: 'Mind & Sonstiges' },
  'menstrual flow':                 { displayName: 'Menstruationsfluss',            category: 'Mind & Sonstiges' },
  'blood glucose':                  { displayName: 'Blutzucker',                    category: 'Mind & Sonstiges' },
  'insulin delivery':               { displayName: 'Insulinabgabe',                 category: 'Mind & Sonstiges' },
  'number of times fallen':         { displayName: 'Stürze',                        category: 'Mind & Sonstiges' },
  'uv exposure':                    { displayName: 'UV-Exposition',                 category: 'Mind & Sonstiges' },
}

function lookupMeta(rawName: string): MetricMeta {
  const key = normalizeMetricName(rawName)
  return (
    METRIC_MAP[key] ?? {
      displayName: rawName,
      category: 'Sonstiges',
    }
  )
}

export interface InventoryRow {
  metricName: string
  displayName: string
  category: string
  unit: string
  sampleCount: number
  lastValue: number | null
  lastValueDate: string | null
  lastReceivedAt: Date
  mappedToDb: string | undefined
  usedInDashboard: boolean
  dashboardNote: string | undefined
}

export async function getHealthInventory(): Promise<InventoryRow[]> {
  const rows = await prisma.healthMetricInventory.findMany({
    orderBy: { metricName: 'asc' },
  })

  return rows.map((row) => {
    const meta = lookupMeta(row.metricName)
    return {
      metricName: row.metricName,
      displayName: meta.displayName,
      category: meta.category,
      unit: row.unit,
      sampleCount: row.sampleCount,
      lastValue: row.lastValue,
      lastValueDate: row.lastValueDate,
      lastReceivedAt: row.lastReceivedAt,
      mappedToDb: meta.mappedToDb,
      usedInDashboard: meta.usedInDashboard ?? false,
      dashboardNote: meta.dashboardNote,
    }
  })
}

export const CATEGORY_ORDER = [
  'Aktivität',
  'Körper',
  'Herz & Vitalwerte',
  'Schlaf',
  'Ernährung',
  'Mind & Sonstiges',
  'Sonstiges',
]
