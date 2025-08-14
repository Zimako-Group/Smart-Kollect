import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { extractSubdomain, getTenantBySubdomain, userBelongsToTenant } from '@/lib/tenant-service';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Get hostname and extract subdomain
  const hostname = req.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  // Check if this is the main marketing site (no subdomain)
  const isMarketingSite = !subdomain && !hostname.includes('mahikeng') && !hostname.includes('triplem');
  
  // Public routes that don't require auth
  const isPublicRoute = 
    req.nextUrl.pathname === '/' || 
    req.nextUrl.pathname === '/login' ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('favicon') ||
    /\.(svg|png|jpg|jpeg|gif|webp|js|css)$/.test(req.nextUrl.pathname);

  // If it's the marketing site, allow access to the landing page
  if (isMarketingSite && req.nextUrl.pathname === '/') {
    return res;
  }
  
  // If no subdomain and trying to access protected routes, redirect to main site
  if (!subdomain && !isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // If we have a subdomain, validate it
  if (subdomain) {
    // Set tenant context in headers for downstream use
    const headers = new Headers(res.headers);
    headers.set('x-tenant-subdomain', subdomain);
    
    // For public routes on tenant subdomains, just pass through with headers
    if (isPublicRoute) {
      return NextResponse.next({
        headers,
      });
    }
    
    // Check authentication for protected routes
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Verify user belongs to this tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single();
      
      if (!profile) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      // Get tenant info
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, subdomain')
        .eq('subdomain', subdomain)
        .single();
      
      if (!tenant || profile.tenant_id !== tenant.id) {
        // User doesn't belong to this tenant, redirect to their correct tenant
        const { data: userTenant } = await supabase
          .from('tenants')
          .select('subdomain')
          .eq('id', profile.tenant_id)
          .single();
        
        if (userTenant) {
          const correctUrl = new URL(req.url);
          correctUrl.hostname = correctUrl.hostname.replace(subdomain, userTenant.subdomain);
          return NextResponse.redirect(correctUrl);
        }
        
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      // User is authenticated and belongs to this tenant
      headers.set('x-tenant-id', tenant.id);
      headers.set('x-user-id', session.user.id);
      
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
