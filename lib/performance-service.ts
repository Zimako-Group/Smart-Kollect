// Performance service for fetching tenant-isolated collection and payment data
import { supabase } from './supabaseClient';
import { getCurrentTenantId } from './tenant-context';

export interface CollectionPerformanceData {
  name: string;
  collections: number;
  target: number;
}

export interface ConsolidatedPaymentData {
  month: string;
  amount: number;
}

/**
 * Fetch collection performance data for the current tenant
 */
export async function getCollectionPerformanceData(): Promise<CollectionPerformanceData[]> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      console.error('No tenant context found');
      return [];
    }

    const { data, error } = await supabase
      .from('collection_performance')
      .select('month_name, collections, target')
      .eq('tenant_id', tenantId)
      .eq('year', 2025)
      .order('month', { ascending: true });

    if (error) {
      console.error('Error fetching collection performance data:', error);
      return [];
    }

    return data.map(item => ({
      name: item.month_name,
      collections: parseFloat(item.collections) || 0,
      target: parseFloat(item.target) || 0
    }));
  } catch (error) {
    console.error('Error in getCollectionPerformanceData:', error);
    return [];
  }
}

/**
 * Fetch consolidated payments data for the current tenant
 */
export async function getConsolidatedPaymentsData(): Promise<ConsolidatedPaymentData[]> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      console.error('No tenant context found');
      return [];
    }

    const { data, error } = await supabase
      .from('consolidated_payments')
      .select('month_display, amount')
      .eq('tenant_id', tenantId)
      .eq('year', 2025)
      .order('month', { ascending: true });

    if (error) {
      console.error('Error fetching consolidated payments data:', error);
      return [];
    }

    return data.map(item => ({
      month: item.month_display,
      amount: parseFloat(item.amount) || 0
    }));
  } catch (error) {
    console.error('Error in getConsolidatedPaymentsData:', error);
    return [];
  }
}

/**
 * Update collection performance data for a specific month
 */
export async function updateCollectionPerformance(
  month: number,
  year: number,
  monthName: string,
  collections: number,
  target: number
): Promise<boolean> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      console.error('No tenant context found');
      return false;
    }

    const { error } = await supabase
      .from('collection_performance')
      .upsert({
        tenant_id: tenantId,
        month,
        year,
        month_name: monthName,
        collections,
        target,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id,month,year'
      });

    if (error) {
      console.error('Error updating collection performance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCollectionPerformance:', error);
    return false;
  }
}

/**
 * Update consolidated payment data for a specific month
 */
export async function updateConsolidatedPayment(
  month: number,
  year: number,
  monthDisplay: string,
  amount: number
): Promise<boolean> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      console.error('No tenant context found');
      return false;
    }

    const { error } = await supabase
      .from('consolidated_payments')
      .upsert({
        tenant_id: tenantId,
        month,
        year,
        month_display: monthDisplay,
        amount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id,month,year'
      });

    if (error) {
      console.error('Error updating consolidated payment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateConsolidatedPayment:', error);
    return false;
  }
}
