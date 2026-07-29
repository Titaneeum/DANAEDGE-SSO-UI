import { NextRequest, NextResponse } from 'next/server'

import { i18n } from '@/configs/i18n'
import { SESSION_COOKIE_NAME } from '@/libs/session'

const locales = i18n.locales.join('|')
const protectedRoute = new RegExp(`^/(${locales})/dashboard(?:/|$)`)
const guestRoute = new RegExp(`^/(${locales})/(?:login|register|forgot-password)(?:/|$)`)

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const locale = pathname.split('/')[1] || i18n.defaultLocale
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if (protectedRoute.test(pathname) && !hasSession) {
    const loginUrl = new URL(`/${locale}/login`, request.url)

    loginUrl.searchParams.set('redirectTo', `${pathname}${search}`)

    return NextResponse.redirect(loginUrl)
  }

  if (guestRoute.test(pathname) && hasSession) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}

