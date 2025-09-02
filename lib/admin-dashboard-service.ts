// Admin dashboard service with tenant isolation
import { supabase } from './supabaseClient';
import { getCurrentTenantId } from './tenant-context';

export interface AdminDashboardMetrics {
  totalAccounts: number;
  totalAgents: number;
  totalCollections: number;
  totalPTPs: number;
  activeCallsCount: number;
  monthlyCollections: number;
  collectionRate: number;
  bookValue: number;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      throw new Error('No tenant context found');
    }

    // Get total accounts (debtors) for this tenant
    const { count: totalAccounts } = await supabase
      .from('Debtors')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get total agents for this tenant
    const { count: totalAgents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'agent');

    // Get total PTPs for this tenant (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: totalPTPs } = await supabase
      .from('PTP')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString());

    // Get active calls for this tenant
    const { count: activeCallsCount } = await supabase
      .from('active_calls')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['dialing', 'connected', 'on_hold']);

    // Get monthly collections from payment records
    const { data: payments } = await supabase
      .from('payment_records')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString());

    const monthlyCollections = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Get book value (total outstanding balance)
    const { data: debtors } = await supabase
      .from('Debtors')
      .select('outstanding_balance')
      .eq('tenant_id', tenantId);

    const bookValue = debtors?.reduce((sum, debtor) => sum + (debtor.outstanding_balance || 0), 0) || 0;

    // Calculate collection rate
    const collectionRate = bookValue > 0 ? (monthlyCollections / bookValue) * 100 : 0;

    return {
      totalAccounts: totalAccounts || 0,
      totalAgents: totalAgents || 0,
      totalCollections: monthlyCollections,
      totalPTPs: totalPTPs || 0,
      activeCallsCount: activeCallsCount || 0,
      monthlyCollections,
      collectionRate: Math.round(collectionRate * 100) / 100,
      bookValue
    };
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return {
      totalAccounts: 0,
      totalAgents: 0,
      totalCollections: 0,
      totalPTPs: 0,
      activeCallsCount: 0,
      monthlyCollections: 0,
      collectionRate: 0,
      bookValue: 0
    };
  }
}

// Get tenant-specific agent performance data
export async function getTenantAgentPerformance() {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      throw new Error('No tenant context found');
    }

    const { data: agents } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role
      `)
      .eq('tenant_id', tenantId)
      .eq('role', 'agent');

    return agents || [];
  } catch (error) {
    console.error('Error fetching tenant agent performance:', error);
    return [];
  }
}

// Get tenant-specific account allocations
export async function getTenantAccountAllocations() {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      throw new Error('No tenant context found');
    }

    const { data: allocations } = await supabase
      .from('AccountAllocations')
      .select(`
        *,
        profiles!inner (
          full_name,
          email,
          tenant_id
        )
      `)
      .eq('profiles.tenant_id', tenantId);

    return allocations || [];
  } catch (error) {
    console.error('Error fetching tenant account allocations:', error);
    return [];
  }
}
