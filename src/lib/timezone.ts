const TZ = 'Europe/Zurich'

/**
 * Returns the UTC timestamp for midnight of the current day in Europe/Zurich.
 * Use this instead of `new Date(); d.setHours(0,0,0,0)` on UTC servers to get
 * the correct "today" boundary for Swiss users (UTC+1/+2 depending on DST).
 */
export function zurichDayStart(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('de-CH', {
    timeZone: TZ,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')!.value)
  const m = Number(parts.find((p) => p.type === 'minute')!.value)
  const s = Number(parts.find((p) => p.type === 'second')!.value)
  return new Date(now.getTime() - (h * 3600 + m * 60 + s) * 1000 - (now.getTime() % 1000))
}

/**
 * Formats a UTC Date as a time string in Europe/Zurich local time.
 */
export function formatZurichTime(date: Date, locale = 'de-CH'): string {
  return date.toLocaleTimeString(locale, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}
