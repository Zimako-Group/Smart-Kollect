// Customer service utilities
import { supabase } from './supabaseClient';
import { getCurrentTenantId } from './tenant-context';

export interface Customer {
  id: string;
  acc_number: string;
  acc_holder: string;
  surname_company_trust: string;
  name: string;
  initials: string;
  street_addr: string;
  post_addr_1: string;
  post_addr_2: string;
  post_addr_3: string;
  post_code: string;
  work_addr_1: string;
  work_addr_2: string;
  home_tel: string; // Changed from home_tel_number to match database column
  work_tel: string; // Changed from work_tel_number to match database column
  cell_number: string;
  cell_number2: string;
  // New cellphone fields
  cellphone_1: string;
  cellphone_2: string;
  cellphone_3: string;
  cellphone_4: string;
  id_number_1: string;
  id_number_2: string;
  email_addr_1: string;
  email_addr_2: string;
  vat_reg_no: string;
  easypay_number: string;
  account_status_code: string;
  account_status_description: string;
  account_type_code: string;
  account_type_description: string;
  sub_account_type_code: string;
  sub_account_type_description: string;
  owner_type_code: string;
  owner_type_description: string;
  group_account_number: string;
  date_opened: string | null;
  ward_code: string;
  ward_description: string;
  street_name: string;
  street_number: string;
  property_category_code: string;
  property_category_description: string;
  usage_code: string;
  usage_desc: string;
  market_value: number | null;
  outstanding_balance: number | null;
  last_payment_amount: number | null;
  last_payment_date: string | null;
  indigent_yn: string;
  indigent_exp_date: string | null;
  pensioner_yn: string;
  risk_level: 'low' | 'medium' | 'high';
  batch_id?: string;
  created_at: string | null;
}

/**
 * Fetch all customers from the database with pagination
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 * @param sortBy Field to sort by
 * @param sortOrder Sort order ('asc' or 'desc')
 */
export async function getAllCustomers(
  page: number = 1, 
  pageSize: number = 100,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ customers: Customer[], totalCount: number, error: string | null }> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return { customers: [], totalCount: 0, error: 'No tenant context found' };
    }

    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // First get the total count
    const countQuery = supabase
      .from('Debtors')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    const { count, error: countError } = await countQuery;
      
    if (countError) {
      console.error('Error counting debtors:', countError);
      return { customers: [], totalCount: 0, error: countError.message };
    }
    
    // Then get the paginated data
    const { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching debtors:', error);
      return { customers: [], totalCount: count || 0, error: error.message };
    }
    
    return { customers: data || [], totalCount: count || 0, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching debtors:', err);
    return { customers: [], totalCount: 0, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Get a customer by ID
 * @param customerId Customer ID
 * @returns Promise with customer data
 */
export const getCustomerById = async (customerId: string): Promise<Customer | null> => {
  try {
    // First try to fetch by id (UUID format)
    let { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .eq('id', customerId)
      .single();

    // If that fails, try to fetch by acc_number
    if (error && error.message.includes('invalid input syntax for type uuid')) {
      console.log('Trying to fetch by acc_number instead of id');
      const accNumberResult = await supabase
        .from('Debtors')
        .select('*')
        .eq('acc_number', customerId);
      
      // Check if we got any results
      if (accNumberResult.data && accNumberResult.data.length > 0) {
        // Use the first match if multiple results
        data = accNumberResult.data[0];
        error = null;
      } else {
        // Try searching by phone numbers
        console.log('Trying to fetch by phone numbers');
        const phoneResult = await supabase
          .from('Debtors')
          .select('*')
          .or(
            `cell_number.eq."${customerId}",
            cell_number2.eq."${customerId}",
            cellphone_1.eq."${customerId}",
            cellphone_2.eq."${customerId}",
            cellphone_3.eq."${customerId}",
            cellphone_4.eq."${customerId}",
            home_tel.eq."${customerId}",
            work_tel.eq."${customerId}"`
          );
        
        if (phoneResult.data && phoneResult.data.length > 0) {
          // Use the first match if multiple results
          data = phoneResult.data[0];
          error = null;
        } else {
          data = null;
          error = {
            message: 'No customer found with the provided identifier',
            details: '',
            hint: '',
            code: 'NOT_FOUND',
            name: 'PostgrestError'
          };
        }
      }
    }

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Process the customer data
    const customer: Customer = {
      id: data.id,
      acc_number: data.acc_number || 'N/A',
      acc_holder: data.acc_holder || 'N/A',
      surname_company_trust: data.surname_company_trust || 'N/A',
      name: data.name || 'N/A',
      initials: data.initials || 'N/A',
      street_addr: data.street_addr || 'N/A',
      post_addr_1: data.post_addr_1 || 'N/A',
      post_addr_2: data.post_addr_2 || 'N/A',
      post_addr_3: data.post_addr_3 || 'N/A',
      post_code: data.post_code || 'N/A',
      work_addr_1: data.work_addr_1 || 'N/A',
      work_addr_2: data.work_addr_2 || 'N/A',
      home_tel: data.home_tel || 'N/A', // Map from home_tel in database
      work_tel: data.work_tel || 'N/A', // Map from work_tel in database
      cell_number: data.cell_number || 'N/A',
      cell_number2: data.cell_number2 || 'N/A',
      // Map the new cellphone fields
      cellphone_1: data.cellphone_1 || 'N/A',
      cellphone_2: data.cellphone_2 || 'N/A',
      cellphone_3: data.cellphone_3 || 'N/A',
      cellphone_4: data.cellphone_4 || 'N/A',
      id_number_1: data.id_number_1 || 'N/A',
      id_number_2: data.id_number_2 || 'N/A',
      email_addr_1: data.email_addr_1 || 'N/A',
      email_addr_2: data.email_addr_2 || 'N/A',
      vat_reg_no: data.vat_reg_no || 'N/A',
      easypay_number: data.easypay_number || 'N/A',
      account_status_code: data.account_status_code || 'N/A',
      account_status_description: data.account_status_description || 'Active',
      account_type_code: data.account_type_code || 'N/A',
      account_type_description: data.account_type_description || 'N/A',
      sub_account_type_code: data.sub_account_type_code || 'N/A',
      sub_account_type_description: data.sub_account_type_description || 'N/A',
      owner_type_code: data.owner_type_code || 'N/A',
      owner_type_description: data.owner_type_description || 'N/A',
      group_account_number: data.group_account_number || 'N/A',
      date_opened: data.date_opened || null,
      ward_code: data.ward_code || 'N/A',
      ward_description: data.ward_description || 'N/A',
      street_name: data.street_name || 'N/A',
      street_number: data.street_number || 'N/A',
      property_category_code: data.property_category_code || 'N/A',
      property_category_description: data.property_category_description || 'N/A',
      usage_code: data.usage_code || 'N/A',
      usage_desc: data.usage_desc || 'N/A',
      market_value: data.market_value || null,
      outstanding_balance: data.outstanding_balance || null,
      last_payment_amount: data.last_payment_amount || null,
      last_payment_date: data.last_payment_date || null,
      indigent_yn: data.indigent_yn || 'N',
      indigent_exp_date: data.indigent_exp_date || null,
      pensioner_yn: data.pensioner_yn || 'N',
      risk_level: determineRiskLevel(data.outstanding_balance),
      batch_id: data.batch_id || undefined,
      created_at: data.created_at || null,
    };

    return customer;
  } catch (error: any) {
    console.error('Error in getCustomerById:', error);
    throw new Error(`Failed to fetch customer: ${error.message}`);
  }
};

/**
 * Search customers by various criteria with pagination
 * @param searchTerm Term to search for
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 */
export async function searchCustomers(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ customers: Customer[], totalCount: number, error: string | null }> {
  try {
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // First get the total count of matching records
    const countQuery = supabase
      .from('Debtors')
      .select('*', { count: 'exact', head: true })
      .or(`name.ilike.%${searchTerm}%,surname_company_trust.ilike.%${searchTerm}%,email_addr_1.ilike.%${searchTerm}%,cell_number.ilike.%${searchTerm}%,id_number_1.ilike.%${searchTerm}%,acc_number.ilike.%${searchTerm}%`);
    const { count, error: countError } = await countQuery;
      
    if (countError) {
      console.error('Error counting search results:', countError);
      return { customers: [], totalCount: 0, error: countError.message };
    }
    
    // Then get the paginated data
    const { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,surname_company_trust.ilike.%${searchTerm}%,email_addr_1.ilike.%${searchTerm}%,cell_number.ilike.%${searchTerm}%,id_number_1.ilike.%${searchTerm}%,acc_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      console.error('Error searching debtors:', error);
      return { customers: [], totalCount: count || 0, error: error.message };
    }
    
    return { customers: data || [], totalCount: count || 0, error: null };
  } catch (error: any) {
    console.error('Error in searchCustomers:', error);
    return { customers: [], totalCount: 0, error: error.message };
  }
}

/**
 * Get customers by status with pagination
 * @param uiStatus Status to filter by
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 */
export async function getCustomersByStatus(
  uiStatus: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ customers: Customer[], totalCount: number, error: string | null }> {
  try {
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from('Debtors').select('*', { count: 'exact' });
    
    // Filter based on UI status
    if (uiStatus === 'active') {
      query = query.eq('account_status_description', 'Active');
    } else if (uiStatus === 'delinquent') {
      query = query.eq('account_status_description', 'Overdue');
    } else if (uiStatus === 'legal') {
      query = query.eq('account_status_description', 'Legal');
    } else if (uiStatus === 'settlement') {
      query = query.eq('account_status_description', 'Settlement');
    }
    
    // First get the total count
    const countQuery = query;
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting debtors by status:', countError);
      return { customers: [], totalCount: 0, error: countError.message };
    }
    
    // Then get the paginated data
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching debtors by status:', error);
      return { customers: [], totalCount: count || 0, error: error.message };
    }

    return { customers: data || [], totalCount: count || 0, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching debtors by status:', err);
    return { customers: [], totalCount: 0, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Helper function to determine risk level based on outstanding balance
 */
export function determineRiskLevel(outstandingBalance: number | null): 'low' | 'medium' | 'high' {
  if (!outstandingBalance) return 'low';
  
  if (outstandingBalance > 20000) {
    return 'high';
  } else if (outstandingBalance > 10000) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Helper function to map database status to UI status
 */
export function mapStatusToUiStatus(status: string | null): 'active' | 'delinquent' | 'legal' | 'settlement' {
  if (!status) return 'active';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('legal')) return 'legal';
  if (statusLower.includes('settlement')) return 'settlement';
  if (statusLower.includes('overdue')) return 'delinquent';
  return 'active';
}

/**
 * Helper function to map UI status to database status
 */
export function mapUiStatusToDbStatus(uiStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'delinquent': 'Overdue',
    'legal': 'Legal',
    'settlement': 'Settlement',
    // Add more mappings as needed
  };
  
  return statusMap[uiStatus.toLowerCase()] || 'Active';
}

/**
 * Format postal address by combining multiple fields
 */
export function formatPostalAddress(addr1?: string, addr2?: string, addr3?: string): string {
  const parts = [addr1, addr2, addr3].filter(part => part && part !== 'N/A');
  return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Format work address by combining multiple fields
 */
export function formatWorkAddress(addr1?: string, addr2?: string): string {
  const parts = [addr1, addr2].filter(part => part && part !== 'N/A');
  return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'R0.00';
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return date;
  }
}

/**
 * Get accounts with last payments older than specified days
 * @param days Number of days to consider as overdue
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 */
export async function getAccountsWithOldPayments(
  days: number = 60,
  page: number = 1,
  pageSize: number = 100
): Promise<{ customers: Customer[], totalCount: number, error: string | null }> {
  try {
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Calculate the cutoff date (60 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // First get the total count
    const countQuery = supabase
      .from('Debtors')
      .select('*', { count: 'exact', head: true })
      .lt('last_payment_date', cutoffDateStr)
      .not('last_payment_date', 'is', null);
      
    const { count, error: countError } = await countQuery;
      
    if (countError) {
      console.error('Error counting overdue accounts:', countError);
      return { customers: [], totalCount: 0, error: countError.message };
    }
    
    // Then get the paginated data
    const { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .lt('last_payment_date', cutoffDateStr)
      .not('last_payment_date', 'is', null)
      .order('last_payment_date', { ascending: true })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching overdue accounts:', error);
      return { customers: [], totalCount: count || 0, error: error.message };
    }
    
    return { customers: data || [], totalCount: count || 0, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching overdue accounts:', err);
    return { customers: [], totalCount: 0, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Get total outstanding value for accounts with last payments older than specified days
 * @param days Number of days to consider as overdue
 */
export async function getTotalOutstandingForOldPayments(
  days: number = 60
): Promise<{ totalOutstanding: number, error: string | null }> {
  try {
    // Calculate the cutoff date (60 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Get all accounts with payments older than the cutoff date
    const { data, error } = await supabase
      .from('Debtors')
      .select('outstanding_balance')
      .lt('last_payment_date', cutoffDateStr)
      .not('last_payment_date', 'is', null)
      .not('outstanding_balance', 'is', null);
      
    if (error) {
      console.error('Error fetching outstanding balances:', error);
      return { totalOutstanding: 0, error: error.message };
    }
    
    // Calculate the total outstanding value
    const totalOutstanding = data.reduce((sum, account) => {
      return sum + (account.outstanding_balance || 0);
    }, 0);
    
    return { totalOutstanding, error: null };
  } catch (err: any) {
    console.error('Unexpected error calculating total outstanding:', err);
    return { totalOutstanding: 0, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Get customers by account type with pagination
 * @param accountType Account type to filter by (Guest House, Government, Residential, Business)
 * @param page Page number (1-based)
 * @param pageSize Number of records per page
 */
export async function getCustomersByAccountType(
  accountType: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ customers: Customer[], totalCount: number, error: string | null }> {
  try {
    console.log(`[CUSTOMER SERVICE] Fetching customers with account type: ${accountType}`);
    
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // First, let's get a sample of account types to debug
    const sampleQuery = await supabase
      .from('Debtors')
      .select('account_type_description')
      .limit(10);
      
    console.log('[CUSTOMER SERVICE] Sample account types:', sampleQuery.data?.map(d => d.account_type_description));
    
    // First get the total count
    const countQuery = supabase
      .from('Debtors')
      .select('*', { count: 'exact', head: true })
      .ilike('account_type_description', accountType);
      
    const { count, error: countError } = await countQuery;
    
    console.log(`[CUSTOMER SERVICE] Count result for ${accountType}:`, { count, error: countError?.message });
      
    if (countError) {
      console.error(`Error counting ${accountType} accounts:`, countError);
      return { customers: [], totalCount: 0, error: countError.message };
    }
    
    // Then get the paginated data
    const { data, error } = await supabase
      .from('Debtors')
      .select('*')
      .ilike('account_type_description', accountType)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    console.log(`[CUSTOMER SERVICE] Query result for ${accountType}:`, { 
      dataCount: data?.length || 0, 
      error: error?.message,
      firstRecord: data && data.length > 0 ? data[0].account_type_description : 'none'
    });
    
    if (error) {
      console.error(`Error fetching ${accountType} accounts:`, error);
      return { customers: [], totalCount: count || 0, error: error.message };
    }
    
    // Add risk level to each customer
    const customersWithRisk = data?.map(customer => ({
      ...customer,
      risk_level: determineRiskLevel(customer.outstanding_balance)
    })) || [];
    
    return { customers: customersWithRisk, totalCount: count || 0, error: null };
  } catch (err: any) {
    console.error(`Unexpected error fetching ${accountType} accounts:`, err);
    return { customers: [], totalCount: 0, error: err.message || 'An unexpected error occurred' };
  }
}
