// Tenant context utilities for admin dashboard
import { supabase } from './supabaseClient';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  name: string;
}

// Get current user's tenant context
export async function getCurrentTenantContext(): Promise<TenantContext | null> {
  console.log('🔍 [getCurrentTenantContext] Starting tenant context lookup...');
  
  try {
    // Get current user
    console.log('🔍 [getCurrentTenantContext] Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('🔍 [getCurrentTenantContext] User lookup result:', { 
      userFound: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      userError: userError?.message 
    });
    
    if (!user) {
      console.log('🔍 [getCurrentTenantContext] No user found, returning null');
      return null;
    }

    // Get user's profile with tenant info
    console.log('🔍 [getCurrentTenantContext] Fetching profile with tenant info for user:', user.id);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        tenant_id,
        tenants!inner (
          id,
          subdomain,
          name
        )
      `)
      .eq('id', user.id)
      .single();

    console.log('🔍 [getCurrentTenantContext] Profile lookup result:', { 
      profileFound: !!profile, 
      tenantId: profile?.tenant_id, 
      error: error?.message,
      errorCode: error?.code
    });

    if (error || !profile) {
      console.error('❌ [getCurrentTenantContext] Error fetching tenant context:', { 
        error: error?.message, 
        code: error?.code, 
        details: error?.details,
        hint: error?.hint 
      });
      return null;
    }

    const tenant = Array.isArray(profile.tenants) ? profile.tenants[0] : profile.tenants;
    
    console.log('🔍 [getCurrentTenantContext] Tenant data extracted:', { 
      tenantId: profile.tenant_id,
      tenantSubdomain: tenant?.subdomain,
      tenantName: tenant?.name,
      tenantIsArray: Array.isArray(profile.tenants)
    });
    
    const result = {
      tenantId: profile.tenant_id,
      subdomain: tenant.subdomain,
      name: tenant.name
    };
    
    console.log('✅ [getCurrentTenantContext] Successfully retrieved tenant context:', result);
    return result;
  } catch (error) {
    console.error('❌ [getCurrentTenantContext] Unhandled error:', { 
      errorMessage: (error as any)?.message, 
      errorStack: (error as any)?.stack 
    });
    return null;
  }
}

// Add tenant filter to Supabase query
export function addTenantFilter(query: any, tenantId: string) {
  return query.eq('tenant_id', tenantId);
}

// Get tenant ID from current user
export async function getCurrentTenantId(): Promise<string | null> {
  console.log('🔍 [getCurrentTenantId] Getting tenant ID...');
  const context = await getCurrentTenantContext();
  const tenantId = context?.tenantId || null;
  
  console.log('🔍 [getCurrentTenantId] Result:', { 
    tenantId, 
    hasContext: !!context,
    context: context ? 'Context found' : 'No context'
  });
  
  return tenantId;
}
