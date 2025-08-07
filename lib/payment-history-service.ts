import { supabaseAdmin } from './supabaseClient';

// =====================================================
// Payment History Service
// For Smart-Kollect Debt Collection System
// =====================================================

export interface PaymentFileUpload {
  id: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  status: 'processing' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_log?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  upload_week: string;
  upload_year: number;
  upload_week_number: number;
}

export interface PaymentHistoryRecord {
  id: string;
  created_at: string;
  updated_at: string;
  debtor_id: string;
  upload_batch_id: string;
  account_no: string;
  account_holder_name?: string;
  account_status?: string;
  occ_own?: string;
  indigent?: string;
  outstanding_total_balance: number;
  last_payment_amount: number;
  last_payment_date?: string;
  raw_last_payment_date?: string;
  processed_at: string;
  data_week: string;
}

export interface PaymentFileRecord {
  ACCOUNT_NO: string;
  ACCOUNT_HOLDER_NAME: string;
  ACCOUNT_STATUS: string;
  'OCC/OWN': string;
  INDIGENT: string;
  OUTSTANDING_TOTAL_BALANCE: string;
  LAST_PAYMENT_AMOUNT: string;
  LAST_PAYMENT_DATE: string;
}

/**
 * Create a new payment file upload batch
 */
export async function createPaymentFileUpload(
  fileName: string,
  fileSize: number,
  uploadedBy: string,
  totalRecords: number
): Promise<PaymentFileUpload> {
  try {
    const uploadDate = new Date();
    const uploadWeek = getWeekStart(uploadDate);
    const uploadYear = uploadDate.getFullYear();
    const uploadWeekNumber = getWeekNumber(uploadDate);

    const { data, error } = await supabaseAdmin
      .from('PaymentFileUploads')
      .insert({
        file_name: fileName,
        file_size: fileSize,
        upload_date: uploadDate.toISOString().split('T')[0],
        uploaded_by: uploadedBy,
        status: 'processing',
        total_records: totalRecords,
        processed_records: 0,
        failed_records: 0,
        processing_started_at: new Date().toISOString(),
        upload_week: uploadWeek.toISOString().split('T')[0],
        upload_year: uploadYear,
        upload_week_number: uploadWeekNumber
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment file upload:', error);
      throw new Error(`Failed to create payment file upload: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error in createPaymentFileUpload:', error);
    throw new Error(`Failed to create payment file upload: ${error.message}`);
  }
}

/**
 * Process payment file records and insert into PaymentHistory table
 */
export async function processPaymentFileRecords(
  uploadBatchId: string,
  records: PaymentFileRecord[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  console.log(`Processing ${records.length} payment records for batch ${uploadBatchId}`);

  for (const record of records) {
    try {
      // Call the database function to process each record
      const { data, error } = await supabaseAdmin.rpc('process_payment_file_record', {
        p_upload_batch_id: uploadBatchId,
        p_account_no: record.ACCOUNT_NO,
        p_account_holder_name: record.ACCOUNT_HOLDER_NAME,
        p_account_status: record.ACCOUNT_STATUS,
        p_occ_own: record['OCC/OWN'],
        p_indigent: record.INDIGENT,
        p_outstanding_total_balance: record.OUTSTANDING_TOTAL_BALANCE,
        p_last_payment_amount: record.LAST_PAYMENT_AMOUNT,
        p_last_payment_date: record.LAST_PAYMENT_DATE
      });

      if (error) {
        console.error(`Error processing record for account ${record.ACCOUNT_NO}:`, error);
        results.failed++;
        results.errors.push(`Account ${record.ACCOUNT_NO}: ${error.message}`);
      } else if (data === true) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(`Account ${record.ACCOUNT_NO}: Debtor not found`);
      }
    } catch (error: any) {
      console.error(`Error processing record for account ${record.ACCOUNT_NO}:`, error);
      results.failed++;
      results.errors.push(`Account ${record.ACCOUNT_NO}: ${error.message}`);
    }
  }

  // Update the upload batch with final results
  await updatePaymentFileUploadStatus(uploadBatchId, 'completed', {
    processed_records: results.successful,
    failed_records: results.failed,
    error_log: results.errors.length > 0 ? results.errors.join('\n') : null
  });

  console.log(`Payment file processing complete: ${results.successful} successful, ${results.failed} failed`);
  return results;
}

/**
 * Update payment file upload status
 */
export async function updatePaymentFileUploadStatus(
  uploadBatchId: string,
  status: 'processing' | 'completed' | 'failed',
  additionalData?: {
    processed_records?: number;
    failed_records?: number;
    error_log?: string | null;
  }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      processing_completed_at: new Date().toISOString()
    };

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    const { error } = await supabaseAdmin
      .from('PaymentFileUploads')
      .update(updateData)
      .eq('id', uploadBatchId);

    if (error) {
      console.error('Error updating payment file upload status:', error);
      throw new Error(`Failed to update payment file upload status: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error in updatePaymentFileUploadStatus:', error);
    throw new Error(`Failed to update payment file upload status: ${error.message}`);
  }
}

/**
 * Get payment history for a specific debtor
 */
export async function getDebtorPaymentHistory(debtorId: string): Promise<PaymentHistoryRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('PaymentHistory')
      .select(`
        *,
        PaymentFileUploads!inner(
          file_name,
          upload_date,
          upload_week
        )
      `)
      .eq('debtor_id', debtorId)
      .order('data_week', { ascending: false })
      .order('processed_at', { ascending: false });

    if (error) {
      console.error('Error fetching debtor payment history:', error);
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getDebtorPaymentHistory:', error);
    throw new Error(`Failed to fetch payment history: ${error.message}`);
  }
}

/**
 * Get latest payment information for a debtor
 */
export async function getLatestPaymentInfo(debtorId: string): Promise<PaymentHistoryRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('LatestPaymentHistory')
      .select('*')
      .eq('debtor_id', debtorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No records found
        return null;
      }
      console.error('Error fetching latest payment info:', error);
      throw new Error(`Failed to fetch latest payment info: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error in getLatestPaymentInfo:', error);
    throw new Error(`Failed to fetch latest payment info: ${error.message}`);
  }
}

/**
 * Get all payment file uploads
 */
export async function getPaymentFileUploads(): Promise<PaymentFileUpload[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('PaymentFileUploads')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment file uploads:', error);
      throw new Error(`Failed to fetch payment file uploads: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getPaymentFileUploads:', error);
    throw new Error(`Failed to fetch payment file uploads: ${error.message}`);
  }
}

/**
 * Get weekly upload summary
 */
export async function getWeeklyUploadSummary(): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('WeeklyUploadSummary')
      .select('*')
      .order('upload_week', { ascending: false });

    if (error) {
      console.error('Error fetching weekly upload summary:', error);
      throw new Error(`Failed to fetch weekly upload summary: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getWeeklyUploadSummary:', error);
    throw new Error(`Failed to fetch weekly upload summary: ${error.message}`);
  }
}

/**
 * Get payment history with debtor information
 */
export async function getPaymentHistoryWithDebtor(
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('PaymentHistoryWithDebtor')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('last_payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history with debtor:', error);
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getPaymentHistoryWithDebtor:', error);
    throw new Error(`Failed to fetch payment history: ${error.message}`);
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the week number for a given date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Convert YYYYMMDD string to Date object
 */
export function convertPaymentDate(dateString: string): Date | null {
  if (!dateString || dateString === 'N/A' || dateString.length !== 8) {
    return null;
  }
  
  try {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(6, 8));
    
    return new Date(year, month, day);
  } catch (error) {
    console.error('Error converting payment date:', error);
    return null;
  }
}
