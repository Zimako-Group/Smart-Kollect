import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentIds = searchParams.get('agentIds')?.split(',') || [];
    const tenantSubdomains = searchParams.get('tenantSubdomains')?.split(',') || [];

    // Fetch agent names
    const { data: agentsData, error: agentsError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', agentIds);

    // Fetch tenant names
    const { data: tenantsData, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('subdomain, name')
      .in('subdomain', tenantSubdomains);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
    }

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
    }

    return NextResponse.json({
      agents: agentsData || [],
      tenants: tenantsData || [],
      errors: {
        agents: agentsError,
        tenants: tenantsError
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
