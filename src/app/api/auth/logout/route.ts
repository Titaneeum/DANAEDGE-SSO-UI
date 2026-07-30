import { NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME } from '@/libs/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  const isLocal = process.env.NEXT_PUBLIC_ENV === 'local'

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    secure: !isLocal,
    sameSite: 'lax',
    domain: isLocal ? undefined : '.danaedge.com',
    path: '/',
    maxAge: 0
  })

  return response
}
