import { NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/libs/session'

type JsonObject = Record<string, unknown>

const asObject = (value: unknown): JsonObject | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : null

const findToken = (payload: unknown) => {
  const root = asObject(payload)
  const data = asObject(root?.data)

  for (const value of [
    root?.accessToken,
    root?.access_token,
    root?.token,
    data?.accessToken,
    data?.access_token,
    data?.token
  ]) {
    if (typeof value === 'string' && value.length > 0) return value
  }
}

const messageFrom = (payload: unknown, fallback: string) => {
  const root = asObject(payload)
  const message = root?.message

  if (typeof message === 'string') return message
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0]

  return fallback
}

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    return NextResponse.json({ message: ['Authentication service is not configured.'] }, { status: 503 })
  }

  let credentials: unknown

  try {
    credentials = await request.json()
  } catch {
    return NextResponse.json({ message: ['Invalid login request.'] }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-store'
    })
    const text = await upstream.text()
    let payload: unknown = null

    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { message: [messageFrom(payload, 'The email or password is incorrect.')] },
        { status: upstream.status }
      )
    }

    const token = findToken(payload)

    if (!token) {
      return NextResponse.json(
        { message: ['The authentication service did not return an access token.'] },
        { status: 502 }
      )
    }

    const response = NextResponse.json({ ok: true })

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE
    })

    return response
  } catch {
    return NextResponse.json({ message: ['Authentication service is unavailable.'] }, { status: 502 })
  }
}

