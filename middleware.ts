import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { locales, defaultLocale, type Locale } from '@/lib/types'

// Get locale from request
function getLocale(request: NextRequest): Locale {
  // Check URL pathname
  const pathname = request.nextUrl.pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return pathname.split('/')[1] as Locale
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .find(lang => locales.includes(lang.split('-')[0] as Locale))
    
    if (preferredLocale) {
      return preferredLocale.split('-')[0] as Locale
    }
  }

  return defaultLocale
}

// Main middleware function
export default withAuth(
  function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip middleware for API routes, static files, and Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Check if pathname has locale
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // Redirect to locale-prefixed URL if no locale in pathname
    if (!pathnameHasLocale) {
      const locale = getLocale(request)
      const newUrl = new URL(`/${locale}${pathname}`, request.url)
      
      // Preserve search params
      newUrl.search = request.nextUrl.search
      
      return NextResponse.redirect(newUrl)
    }

    // Add locale and pathname to headers for root layout
    const response = NextResponse.next()
    const currentLocale = pathname.split('/')[1] as Locale
    response.headers.set('x-locale', currentLocale)
    response.headers.set('x-pathname', pathname)
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Remove locale prefix for auth check
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/admin',
          '/driver',
          '/customer',
          '/accountant',
          '/customs-broker',
          '/dashboard'
        ]

        // Allow public routes
        if (publicRoutes.includes(pathWithoutLocale)) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
