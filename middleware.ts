import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to check if we're in build time
const isBuildTime = () => {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

import { extractSubdomain } from '@/lib/tenant-service';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Skip middleware during build time
  if (isBuildTime()) {
    return res;
  }
  
  // Get hostname and extract subdomain
  const hostname = req.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });
  
  // Check if this is the main marketing site (no subdomain)
  const isMarketingSite = !subdomain && !hostname.includes('mahikeng') && !hostname.includes('triplem');
  
  // Public routes that don't require auth
  const pathname = req.nextUrl.pathname;
  
  // Skip middleware for API routes, static files, and public paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname === '/_not-found'
  ) {
    return res;
  }
  
  // If it's the marketing site, allow access to the landing page
  if (isMarketingSite && req.nextUrl.pathname === '/') {
    return res;
  }
  
  // If no subdomain and trying to access protected routes, redirect to main site
  if (!subdomain && pathname !== '/') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // If we have a subdomain, validate it
  if (subdomain) {
    // Set tenant context in headers for downstream use
    const headers = new Headers(res.headers);
    headers.set('x-tenant-subdomain', subdomain);
    
    const isPublicRoute = pathname === '/login' || pathname === '/';
    
    // For public routes on tenant subdomains, just pass through with headers
    if (isPublicRoute) {
      return NextResponse.next({
        headers,
      });
    }
    
    // Check authentication for protected routes
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isPublicRoute) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // If session exists, verify user belongs to this tenant
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', session.user.id)
          .single();
        
        console.log('Middleware Debug:', {
          userId: session.user.id,
          subdomain,
          profile,
          profileError,
          userEmail: session.user.email
        });
        
        if (!profile) {
          console.log('Profile not found for user:', session.user.id);
          return NextResponse.redirect(new URL('/login', req.url));
        }
        
        // Get tenant info
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, subdomain')
          .eq('subdomain', subdomain)
          .single();
        
        console.log('Tenant Debug:', {
          subdomain,
          tenant,
          tenantError,
          profileTenantId: profile.tenant_id,
          tenantMatch: tenant?.id === profile.tenant_id
        });
        
        if (!tenant || profile.tenant_id !== tenant.id) {
          console.log('Tenant mismatch or not found:', {
            tenantExists: !!tenant,
            profileTenantId: profile.tenant_id,
            tenantId: tenant?.id,
            match: profile.tenant_id === tenant?.id
          });
          
          // User doesn't belong to this tenant, redirect to their correct tenant
          const { data: userTenant } = await supabase
            .from('tenants')
            .select('subdomain')
            .eq('id', profile.tenant_id)
            .single();
          
          if (userTenant && userTenant.subdomain) {
            console.log('Redirecting to correct tenant:', userTenant.subdomain);
            const correctUrl = new URL(req.url);
            correctUrl.hostname = correctUrl.hostname.replace(subdomain, userTenant.subdomain);
            return NextResponse.redirect(correctUrl);
          }
          
          console.log('No user tenant found, redirecting to login');
          return NextResponse.redirect(new URL('/login', req.url));
        }
        
        // User is authenticated and belongs to this tenant
        headers.set('x-tenant-id', tenant.id);
        headers.set('x-user-id', session.user.id);
      }
      
      return NextResponse.next({
        headers,
      });
      
    } catch (error) {
      console.error('[MIDDLEWARE] Error:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }
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
