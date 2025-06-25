import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Skip auth check for public routes to reduce unnecessary requests
  const isPublicRoute = 
    req.nextUrl.pathname === '/' || 
    req.nextUrl.pathname === '/login' ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('favicon') ||
    /\.(svg|png|jpg|jpeg|gif|webp|js|css)$/.test(req.nextUrl.pathname);

  if (isPublicRoute) {
    return res;
  }

  // Check if we need to protect this route
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/admin') || 
    req.nextUrl.pathname.startsWith('/user') || 
    req.nextUrl.pathname.startsWith('/api/settings');

  if (!isProtectedRoute) {
    return res;
  }

  // For API routes that require auth, check session minimally
  if (req.nextUrl.pathname.startsWith('/api/')) {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: You must be logged in' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Error getting session for API route:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      );
    }
    return res;
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)',
  ],
};
