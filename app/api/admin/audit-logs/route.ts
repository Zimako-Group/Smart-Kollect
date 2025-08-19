import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuditLogs, getAuditLogStats } from '@/lib/audit-logs-service';

async function getServerSupabase() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

async function checkAdminRole(supabase: any): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isAdmin: false, userId: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, userId: user.id };
    }

    return { isAdmin: profile.role === 'admin', userId: user.id };
  } catch (error) {
    console.error('Error checking admin role:', error);
    return { isAdmin: false, userId: null };
  }
}

// GET /api/admin/audit-logs - Get audit logs with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { isAdmin } = await checkAdminRole(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action') || undefined;
    const resource_type = searchParams.get('resource_type') || undefined;
    const user_id = searchParams.get('user_id') || undefined;
    const start_date = searchParams.get('start_date') || undefined;
    const end_date = searchParams.get('end_date') || undefined;
    const stats = searchParams.get('stats') === 'true';

    // If stats requested, return statistics
    if (stats) {
      const { data: statsData, error: statsError } = await getAuditLogStats();
      
      if (statsError) {
        return NextResponse.json(
          { error: statsError },
          { status: 500 }
        );
      }

      return NextResponse.json({ stats: statsData });
    }

    // Get audit logs
    const { data, count, error } = await getAuditLogs({
      limit,
      offset,
      action,
      resource_type,
      user_id,
      start_date,
      end_date,
    });

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      logs: data,
      total: count,
      limit,
      offset 
    });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
