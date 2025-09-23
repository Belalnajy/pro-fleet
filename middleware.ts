import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from "next-auth/middleware"
import { locales, defaultLocale, type Locale } from "@/lib/types"

// Get locale from request
function getLocale(request: NextRequest): Locale {
  // First priority: Check for saved language preference in cookies
  const savedLanguage = request.cookies.get('preferred-language')?.value as Locale
  console.log('🍪 Cookie saved language:', savedLanguage)
  
  if (savedLanguage && locales.includes(savedLanguage)) {
    console.log('✅ Using saved language from cookie:', savedLanguage)
    return savedLanguage
  }

  // Second priority: Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language')
  console.log('🌐 Accept-Language header:', acceptLanguage)
  
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .find(lang => locales.includes(lang.split('-')[0] as Locale))
    
    if (preferredLocale) {
      const locale = preferredLocale.split('-')[0] as Locale
      console.log('🌐 Using Accept-Language locale:', locale)
      return locale
    }
  }

  // Default fallback
  console.log('🔄 Using default locale:', defaultLocale)
  return defaultLocale
}

// Main middleware function
export default function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE CALLED!', new Date().toISOString())
  const pathname = request.nextUrl.pathname
  console.log('🔍 Middleware processing:', pathname)

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    console.log('⏭️ Skipping middleware for:', pathname)
    return NextResponse.next()
  }

  // Check if pathname has locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  console.log('🔍 Pathname has locale:', pathnameHasLocale)
  console.log('🔍 Current pathname:', pathname)

  // Only redirect if no locale in pathname
  if (!pathnameHasLocale) {
    const locale = getLocale(request)
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    
    console.log('🔄 Redirecting to:', newUrl.toString())
    
    // Preserve search params
    newUrl.search = request.nextUrl.search
    
    return NextResponse.redirect(newUrl)
  }

  // Add locale and pathname to headers for root layout
  const response = NextResponse.next()
  const currentLocale = pathname.split('/')[1] as Locale
  response.headers.set('x-locale', currentLocale)
  response.headers.set('x-pathname', pathname)
  
  console.log('✅ Setting headers - locale:', currentLocale, 'pathname:', pathname)
  return response
}

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
