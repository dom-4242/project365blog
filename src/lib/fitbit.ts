interface FitbitTokens {
  accessToken: string
  refreshToken: string
}

interface FitbitWeightLog {
  weight: number
  bmi: number
  fat?: number
  date: string
}

interface FitbitActivitySummary {
  steps: number
  distances: Array<{ activity: string; distance: number }>
  caloriesOut: number
  activeScore: number
  activityCalories: number
}

export async function refreshFitbitToken(tokens: FitbitTokens): Promise<FitbitTokens> {
  const clientId = process.env.FITBIT_CLIENT_ID!
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Fitbit token refresh failed: ${response.status}`)
  }

  const data = await response.json() as { access_token: string; refresh_token: string }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}

export async function fetchFitbitWeightLog(date: string, accessToken: string): Promise<FitbitWeightLog | null> {
  const response = await fetch(
    `https://api.fitbit.com/1/user/-/body/log/weight/date/${date}.json`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) return null

  const data = await response.json() as { weight: FitbitWeightLog[] }
  return data.weight[0] ?? null
}

export async function fetchFitbitActivitySummary(date: string, accessToken: string): Promise<FitbitActivitySummary | null> {
  const response = await fetch(
    `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) return null

  const data = await response.json() as { summary: FitbitActivitySummary }
  return data.summary
}
