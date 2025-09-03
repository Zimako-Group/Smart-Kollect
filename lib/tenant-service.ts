import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabaseClient';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data;
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data;
}

/**
 * Create a new tenant (admin only)
 */
export async function createTenant(tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant | null> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .insert(tenant)
    .select()
    .single();

  if (error) {
    console.error('Error creating tenant:', error);
    return null;
  }

  return data;
}

/**
 * Update tenant (admin only)
 */
export async function updateTenant(id: string, updates: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>): Promise<Tenant | null> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tenant:', error);
    return null;
  }

  return data;
}

/**
 * Get all tenants (admin only)
 */
export async function getAllTenants(): Promise<Tenant[]> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return [];
  }
  
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }

  return data || [];
}

/**
 * Get current user's tenant
 */
export async function getCurrentUserTenant(): Promise<Tenant | null> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  // First get the current user
  const supabase = getSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error fetching user:', userError);
    return null;
  }

  // Get user's profile to find their tenant
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.tenant_id) {
    console.error('Error fetching user profile:', profileError);
    return null;
  }

  // Get the tenant
  return getTenantById(profile.tenant_id);
}

/**
 * Set tenant context for RLS
 */
export async function setTenantContext(subdomain: string): Promise<string | null> {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('set_tenant_context', {
    tenant_subdomain: subdomain
  });

  if (error) {
    console.error('Error setting tenant context:', error);
    return null;
  }

  return data;
}

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Handle localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'mahikeng'; // Default tenant for development
  }
  
  // Handle www prefix - treat as main domain
  if (host.startsWith('www.')) {
    const nonWwwHost = host.substring(4); // Remove 'www.'
    // If it's www.smartkollect.co.za, treat as main domain
    if (nonWwwHost === 'smartkollect.co.za') {
      return null;
    }
  }
  
  // Extract subdomain from production domain
  const parts = host.split('.');
  
  // If it's just smartkollect.co.za (main domain), return null
  if (parts.length === 3 && parts[0] === 'smartkollect' && parts[1] === 'co' && parts[2] === 'za') {
    return null;
  }
  
  // Check if it's a subdomain (subdomain.smartkollect.co.za)
  if (parts.length === 4 && parts[1] === 'smartkollect' && parts[2] === 'co' && parts[3] === 'za') {
    const subdomain = parts[0];
    // Valid subdomains
    const validSubdomains = ['mahikeng', 'triplem'];
    if (validSubdomains.includes(subdomain)) {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Check if user belongs to tenant
 */
export async function userBelongsToTenant(userId: string, tenantId: string): Promise<boolean> {
  
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Get tenant from request headers or hostname
 */
export function getTenantFromRequest(headers: Headers): string | null {
  // Check for tenant header first
  const tenantHeader = headers.get('x-tenant-subdomain');
  if (tenantHeader) {
    return tenantHeader;
  }
  
  // Fall back to hostname
  const host = headers.get('host');
  if (host) {
    return extractSubdomain(host);
  }
  
  return null;
}
