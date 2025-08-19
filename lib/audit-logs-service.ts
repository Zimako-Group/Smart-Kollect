import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateAuditLogRequest {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Create a new audit log entry
 */
export async function createAuditLog(
  logData: CreateAuditLogRequest,
  userId: string
): Promise<{ data: AuditLog | null; error: string | null }> {
  try {
    // Get user details for the log
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert([
        {
          action: logData.action,
          user_id: userId,
          user_email: user?.user?.email || null,
          user_name: user?.user?.user_metadata?.full_name || user?.user?.email || null,
          resource_type: logData.resource_type,
          resource_id: logData.resource_id || null,
          details: logData.details || {},
          ip_address: logData.ip_address || null,
          user_agent: logData.user_agent || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createAuditLog:', error);
    return { data: null, error: 'Failed to create audit log' };
  }
}

/**
 * Get audit logs with pagination and filtering (admin only)
 */
export async function getAuditLogs(
  options: {
    limit?: number;
    offset?: number;
    action?: string;
    resource_type?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<{ data: AuditLog[] | null; count: number | null; error: string | null }> {
  try {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.action) {
      query = query.eq('action', options.action);
    }
    if (options.resource_type) {
      query = query.eq('resource_type', options.resource_type);
    }
    if (options.user_id) {
      query = query.eq('user_id', options.user_id);
    }
    if (options.start_date) {
      query = query.gte('created_at', options.start_date);
    }
    if (options.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { data: null, count: null, error: error.message };
    }

    return { data: data || [], count, error: null };
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return { data: null, count: null, error: 'Failed to fetch audit logs' };
  }
}

/**
 * Get audit log statistics (admin only)
 */
export async function getAuditLogStats(): Promise<{
  data: {
    total_logs: number;
    unique_users: number;
    actions_today: number;
    top_actions: Array<{ action: string; count: number }>;
  } | null;
  error: string | null;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get total logs count
    const { count: totalLogs, error: totalError } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw totalError;
    }

    // Get unique users count
    const { data: uniqueUsersData, error: usersError } = await supabaseAdmin
      .from('audit_logs')
      .select('user_id')
      .not('user_id', 'is', null);

    if (usersError) {
      throw usersError;
    }

    const uniqueUsers = new Set(uniqueUsersData?.map(log => log.user_id) || []).size;

    // Get actions today count
    const { count: actionsToday, error: todayError } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (todayError) {
      throw todayError;
    }

    // Get top actions
    const { data: topActionsData, error: actionsError } = await supabaseAdmin
      .from('audit_logs')
      .select('action')
      .limit(1000); // Get recent actions for analysis

    if (actionsError) {
      throw actionsError;
    }

    // Count actions
    const actionCounts: Record<string, number> = {};
    topActionsData?.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      data: {
        total_logs: totalLogs || 0,
        unique_users: uniqueUsers,
        actions_today: actionsToday || 0,
        top_actions: topActions,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getAuditLogStats:', error);
    return { data: null, error: 'Failed to fetch audit log statistics' };
  }
}

/**
 * Helper function to log common admin actions
 */
export async function logAdminAction(
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  userId?: string,
  request?: Request
) {
  try {
    if (!userId) {
      // Try to get user from request context if not provided
      return;
    }

    const ip = request?.headers.get('x-forwarded-for') || 
               request?.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    await createAuditLog(
      {
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: ip,
        user_agent: userAgent,
      },
      userId
    );
  } catch (error) {
    // Don't throw errors for audit logging failures
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get server-side Supabase client with user context
 */
export async function getServerSupabase() {
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
