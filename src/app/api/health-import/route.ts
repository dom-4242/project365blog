import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.HEALTH_IMPORT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // TODO: implement Apple Health import
  return NextResponse.json({ success: true })
}
