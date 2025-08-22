import { supabase } from './supabase/client';

export interface Debtor {
  id: string;
  acc_number: string;
  acc_holder: string;
  surname_company_trust: string;
  name: string;
  initials?: string;
  street_addr?: string;
  post_addr_1?: string;
  post_addr_2?: string;
  post_addr_3?: string;
  post_code?: string;
  work_addr_1?: string;
  work_addr_2?: string;
  home_tel?: string;
  work_tel?: string;
  cellphone_1?: string;
  cellphone_2?: string;
  cellphone_3?: string;
  cellphone_4?: string;
  cell_number?: string;
  cell_number2?: string;
  id_number_1?: string;
  id_number_2?: string;
  email_addr_1?: string;
  email_addr_2?: string;
  vat_reg_no?: string;
  easypay_number?: string;
  account_status_code?: string;
  account_status_description?: string;
  account_type_code?: string;
  account_type_description?: string;
  sub_account_type_code?: string;
  sub_account_type_description?: string;
  owner_type_code?: string;
  owner_type_description?: string;
  group_account_number?: string;
  date_opened?: string;
  ward_code?: string;
  ward_description?: string;
  street_name?: string;
  street_number?: string;
  property_category_code?: string;
  property_category_description?: string;
  usage_code?: string;
  usage_desc?: string;
  market_value?: number;
  outstanding_balance?: number;
  last_payment_amount?: number;
  last_payment_date?: string;
  indigent_yn?: string;
  indigent_exp_date?: string;
  pensioner_yn?: string;
  batch_id?: string;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at?: string;
}

export interface DebtorStats {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalOutstanding: number;
  averageBalance: number;
  recentlyAdded: number;
  byAccountType: Record<string, number>;
  byBatch: Record<string, number>;
}

/**
 * Get all debtors with advanced admin filtering and pagination
 */
export async function getAllDebtors(
  page = 1,
  pageSize = 100,
  filters: {
    searchTerm?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    accountType?: string;
    batchId?: string;
    minBalance?: number;
    maxBalance?: number;
    dateRange?: { start: string; end: string };
  } = {}
): Promise<{ debtors: Debtor[]; totalCount: number; error: string | null }> {
  try {
    let query = supabase
      .from('Debtors')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (filters.searchTerm) {
      query = query.or(
        `name.ilike.%${filters.searchTerm}%,surname_company_trust.ilike.%${filters.searchTerm}%,acc_number.ilike.%${filters.searchTerm}%,email_addr_1.ilike.%${filters.searchTerm}%,cell_number.ilike.%${filters.searchTerm}%`
      );
    }

    // Apply risk level filter
    if (filters.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel);
    }

    // Apply account type filter
    if (filters.accountType) {
      query = query.eq('account_type_description', filters.accountType);
    }

    // Apply batch filter
    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }

    // Apply balance range filters
    if (filters.minBalance !== undefined) {
      query = query.gte('outstanding_balance', filters.minBalance);
    }
    if (filters.maxBalance !== undefined) {
      query = query.lte('outstanding_balance', filters.maxBalance);
    }

    // Apply date range filter
    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching debtors:', error);
      return { debtors: [], totalCount: 0, error: error.message };
    }

    return {
      debtors: data || [],
      totalCount: count || 0,
      error: null
    };
  } catch (err: any) {
    console.error('Error in getAllDebtors:', err);
    return {
      debtors: [],
      totalCount: 0,
      error: err.message || 'Failed to fetch debtors'
    };
  }
}

/**
 * Get debtor statistics for admin dashboard
 */
export async function getDebtorStats(): Promise<{ stats: DebtorStats | null; error: string | null }> {
  try {
    // Get basic counts and totals
    const { data: allDebtors, error: fetchError } = await supabase
      .from('Debtors')
      .select('risk_level, outstanding_balance, account_type_description, batch_id, created_at');

    if (fetchError) {
      return { stats: null, error: fetchError.message };
    }

    if (!allDebtors) {
      return { stats: null, error: 'No data found' };
    }

    // Calculate statistics
    const total = allDebtors.length;
    const highRisk = allDebtors.filter((d: any) => d.risk_level === 'high').length;
    const mediumRisk = allDebtors.filter((d: any) => d.risk_level === 'medium').length;
    const lowRisk = allDebtors.filter((d: any) => d.risk_level === 'low').length;

    const totalOutstanding = allDebtors.reduce((sum: number, d: any) => sum + (d.outstanding_balance || 0), 0);
    const averageBalance = total > 0 ? totalOutstanding / total : 0;

    // Recently added (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAdded = allDebtors.filter((d: any) => 
      new Date(d.created_at) > thirtyDaysAgo
    ).length;

    // Group by account type
    const byAccountType: Record<string, number> = {};
    allDebtors.forEach((d: any) => {
      const type = d.account_type_description || 'Unknown';
      byAccountType[type] = (byAccountType[type] || 0) + 1;
    });

    // Group by batch
    const byBatch: Record<string, number> = {};
    allDebtors.forEach((d: any) => {
      const batch = d.batch_id || 'No Batch';
      byBatch[batch] = (byBatch[batch] || 0) + 1;
    });

    const stats: DebtorStats = {
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      totalOutstanding,
      averageBalance,
      recentlyAdded,
      byAccountType,
      byBatch
    };

    return { stats, error: null };
  } catch (err: any) {
    console.error('Error getting debtor stats:', err);
    return { stats: null, error: err.message || 'Failed to get statistics' };
  }
}

/**
 * Get a single debtor by ID
 */
export async function getDebtorById(id: string): Promise<{ debtor: Debtor | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { debtor: null, error: error.message };
    }

    return { debtor: data, error: null };
  } catch (err: any) {
    return { debtor: null, error: err.message || 'Failed to fetch debtor' };
  }
}

/**
 * Update debtor information (admin only)
 */
export async function updateDebtor(
  id: string, 
  updates: Partial<Debtor>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('Debtors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update debtor' };
  }
}

/**
 * Bulk update debtors (admin only)
 */
export async function bulkUpdateDebtors(
  ids: string[],
  updates: Partial<Debtor>
): Promise<{ success: boolean; updatedCount: number; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('Debtors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', ids)
      .select('id');

    if (error) {
      return { success: false, updatedCount: 0, error: error.message };
    }

    return { 
      success: true, 
      updatedCount: data?.length || 0, 
      error: null 
    };
  } catch (err: any) {
    return { 
      success: false, 
      updatedCount: 0, 
      error: err.message || 'Failed to bulk update debtors' 
    };
  }
}

/**
 * Delete debtor (admin only)
 */
export async function deleteDebtor(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('Debtors')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete debtor' };
  }
}

/**
 * Bulk delete debtors (admin only)
 */
export async function bulkDeleteDebtors(ids: string[]): Promise<{ success: boolean; deletedCount: number; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('Debtors')
      .delete()
      .in('id', ids)
      .select('id');

    if (error) {
      return { success: false, deletedCount: 0, error: error.message };
    }

    return { 
      success: true, 
      deletedCount: data?.length || 0, 
      error: null 
    };
  } catch (err: any) {
    return { 
      success: false, 
      deletedCount: 0, 
      error: err.message || 'Failed to bulk delete debtors' 
    };
  }
}

/**
 * Export debtors to CSV format
 */
export async function exportDebtors(filters: Parameters<typeof getAllDebtors>[2] = {}): Promise<{ csv: string; error: string | null }> {
  try {
    // Get all matching debtors (no pagination for export)
    const { debtors, error } = await getAllDebtors(1, 10000, filters);
    
    if (error) {
      return { csv: '', error };
    }

    // Create CSV headers
    const headers = [
      'Account Number',
      'Name',
      'Surname/Company/Trust',
      'Email',
      'Phone',
      'Outstanding Balance',
      'Risk Level',
      'Account Type',
      'Last Payment Date',
      'Created At'
    ];

    // Create CSV rows
    const rows = debtors.map(debtor => [
      debtor.acc_number,
      debtor.name,
      debtor.surname_company_trust,
      debtor.email_addr_1 || '',
      debtor.cell_number || debtor.cellphone_1 || '',
      debtor.outstanding_balance?.toString() || '0',
      debtor.risk_level,
      debtor.account_type_description || '',
      debtor.last_payment_date || '',
      new Date(debtor.created_at).toLocaleDateString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return { csv: csvContent, error: null };
  } catch (err: any) {
    return { csv: '', error: err.message || 'Failed to export debtors' };
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
