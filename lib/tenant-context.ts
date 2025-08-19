// Tenant context utilities for admin dashboard
import { supabase } from './supabaseClient';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  name: string;
}

// Get current user's tenant context
export async function getCurrentTenantContext(): Promise<TenantContext | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's profile with tenant info
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

    if (error || !profile) {
      console.error('Error fetching tenant context:', error);
      return null;
    }

    const tenant = Array.isArray(profile.tenants) ? profile.tenants[0] : profile.tenants;
    
    return {
      tenantId: profile.tenant_id,
      subdomain: tenant.subdomain,
      name: tenant.name
    };
  } catch (error) {
    console.error('Error getting tenant context:', error);
    return null;
  }
}

// Add tenant filter to Supabase query
export function addTenantFilter(query: any, tenantId: string) {
  return query.eq('tenant_id', tenantId);
}

// Get tenant ID from current user
export async function getCurrentTenantId(): Promise<string | null> {
  const context = await getCurrentTenantContext();
  return context?.tenantId || null;
}
