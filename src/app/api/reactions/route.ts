import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }
  // TODO: implement
  return NextResponse.json({ reactions: [] })
}

export async function POST(_request: NextRequest) {
  // TODO: implement
  return NextResponse.json({ success: true })
}
