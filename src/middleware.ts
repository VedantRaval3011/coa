import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Define paths that are always allowed
  const publicPaths = [
    '/_next',       // Next.js internal resources (scripts, styles)
    '/static',      // Static folder
    '/favicon.ico', // Favicon
    '/provision',   // The page where Admin enters the key
    '/api/provision', // The API route to verify the key
    '/access-denied', // The page shown to blocked users
  ]

  // 2. Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // 3. Check for the specific cookie that authorizes the device
  const authorizedCookie = request.cookies.get('device_authorized')

  // 4. If cookie is valid, allow access
  if (authorizedCookie?.value === 'true') {
    return NextResponse.next()
  }

  // 5. Handle unauthorized access
  
  // If it's an API route, return a JSON error instead of redirecting
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, message: 'Access Denied: Device not authorized' },
      { status: 401 }
    )
  }

  // Otherwise, redirect to the Access Denied page
  return NextResponse.redirect(new URL('/access-denied', request.url))
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> We MIGHT want to protect API routes too, but let's exclude the provision one specifically above.
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
