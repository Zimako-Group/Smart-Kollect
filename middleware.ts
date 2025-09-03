import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to check if we're in build time
const isBuildTime = () => {
  return false; // Disable build-time check to prevent issues
};

// RBAC Route Configuration
const ROUTE_PERMISSIONS = {
  // Public routes - no authentication required (marketing pages)
  public: [
    '/login', 
    '/', 
    '/marketing/about', 
    '/marketing/pricing', 
    '/marketing/contact', 
    '/privacy-policy', 
    '/terms-and-conditions', 
    '/popi-act',
    '/api/auth', 
    '/_next', 
    '/favicon.ico', 
    '/sounds', 
    '.mp3', 
    '.svg',
    '/images'
  ],
  
  // Agent routes - requires 'agent' role
  agent: ['/user'],
  
  // Admin routes - requires 'admin' or 'super_admin' role
  admin: ['/admin', '/admin/dashboard', '/admin/accounts', '/admin/campaigns', '/admin/all-accounts'],
  
  // Super admin routes - requires 'super_admin' role only
  superAdmin: ['/super-admin', '/admin/tenants', '/admin/system']
};

// Role hierarchy - higher roles inherit permissions from lower roles
const ROLE_HIERARCHY = {
  'agent': 0,
  'manager': 1,
  'supervisor': 2,
  'indigent clerk': 3,
  'system': 4,
  'admin': 5,
  'super_admin': 6
};

type UserRole = 'agent' | 'admin' | 'super_admin' | 'manager' | 'supervisor' | 'indigent clerk' | 'system';

// Check if user has permission to access route
function hasPermission(userRole: UserRole, pathname: string): boolean {
  // Check public routes
  if (ROUTE_PERMISSIONS.public.some(route => 
    pathname.startsWith(route) || pathname.includes(route) || pathname === route
  )) {
    return true;
  }
  
  // Check role-specific routes
  const userRoleLevel = ROLE_HIERARCHY[userRole];
  
  // Super admin has access to everything
  if (userRole === 'super_admin') return true;
  
  // Admin can access admin and agent routes, but not super admin routes
  if (userRole === 'admin') {
    // Check if it's a super admin only route
    if (ROUTE_PERMISSIONS.superAdmin.some(route => pathname.startsWith(route))) {
      return false;
    }
    // Admin can access admin and agent routes
    if (ROUTE_PERMISSIONS.admin.some(route => pathname.startsWith(route)) ||
        ROUTE_PERMISSIONS.agent.some(route => pathname.startsWith(route))) {
      return true;
    }
  }
  
  // Other roles (agent, manager, supervisor, etc.) can access agent routes
  if (ROUTE_PERMISSIONS.agent.some(route => pathname.startsWith(route))) {
    return true;
  }
  
  return false;
}

import { extractSubdomain } from '@/lib/tenant-service';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hostname = req.headers.get('host') || '';
  
  console.log('[RBAC-MIDDLEWARE] Processing:', {
    pathname,
    hostname,
    method: req.method
  });
  
  // Always allow static files and API routes
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api/') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    console.log('[RBAC-MIDDLEWARE] Static/API route, allowing access:', pathname);
    return NextResponse.next();
  }
  
  // Extract subdomain to determine if this is main domain or tenant subdomain
  const subdomain = extractSubdomain(hostname);
  const isMainDomain = !subdomain;
  
  console.log('[RBAC-MIDDLEWARE] Domain check:', {
    hostname,
    subdomain,
    isMainDomain,
    pathname
  });
  
  // If this is the main domain (smartkollect.co.za or www.smartkollect.co.za), allow all access without authentication
  if (isMainDomain) {
    console.log('[RBAC-MIDDLEWARE] Main domain detected, allowing full access:', pathname);
    return NextResponse.next();
  }
  
  // For tenant subdomains, check if this is a public route
  const isPublicRoute = ROUTE_PERMISSIONS.public.some(route => 
    pathname.startsWith(route) || pathname.includes(route) || pathname === route
  );
  
  if (isPublicRoute) {
    console.log('[RBAC-MIDDLEWARE] Public route, allowing access:', pathname);
    return NextResponse.next();
  }
  
  // Skip middleware during build time
  if (isBuildTime()) {
    console.log('[RBAC-MIDDLEWARE] Skipping authentication - build time');
    return NextResponse.next();
  }
  
  // Create Supabase server client for authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // We can't modify request cookies in middleware, so we skip this
        },
        remove(name: string, options: CookieOptions) {
          // We can't modify request cookies in middleware, so we skip this
        },
      },
    }
  );

  try {
    // Get session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[RBAC-MIDDLEWARE] Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    // If no session, redirect to login
    if (!session) {
      console.log('[RBAC-MIDDLEWARE] No session, redirecting to login');
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status, tenant_id')
      .eq('id', session.user.id)
      .single();
    
    console.log('[RBAC-MIDDLEWARE] Profile check:', {
      profile,
      profileError: profileError?.message
    });
    
    // If no profile found, redirect to login
    if (!profile || profileError) {
      console.log('[RBAC-MIDDLEWARE] No profile found, redirecting to login');
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user account is active
    if (profile.status !== 'active') {
      console.log('[RBAC-MIDDLEWARE] User account not active:', profile.status);
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'account_inactive');
      return NextResponse.redirect(loginUrl);
    }
    
    // Check RBAC permissions
    const userRole = profile.role as UserRole;
    const hasAccess = hasPermission(userRole, pathname);
    
    console.log('[RBAC-MIDDLEWARE] Permission check:', {
      userRole,
      pathname,
      hasAccess
    });
    
    if (!hasAccess) {
      console.log('[RBAC-MIDDLEWARE] Access denied, insufficient permissions');
      // Redirect to appropriate dashboard based on role
      let redirectPath = '/login';
      if (userRole === 'agent') {
        redirectPath = '/user/dashboard';
      } else if (userRole === 'super_admin') {
        redirectPath = '/super-admin';
      } else if (userRole === 'admin') {
        redirectPath = '/admin';
      }
      
      if (pathname !== redirectPath) {
        return NextResponse.redirect(new URL(redirectPath, req.url));
      }
    }
    
    // Set user context headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-user-email', session.user.email || '');
    if (profile.tenant_id) {
      response.headers.set('x-tenant-id', profile.tenant_id);
    }
    
    console.log('[RBAC-MIDDLEWARE] Access granted for:', userRole, 'to', pathname);
    return response;
    
  } catch (error) {
    console.error('[RBAC-MIDDLEWARE] Error:', error);
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'auth_error');
    return NextResponse.redirect(loginUrl);
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)',
  ],
};
