import { supabase } from '@/lib/supabaseClient';
import { PaymentRecord } from '@/lib/payment-file-parser';

export interface PaymentRecordData {
  id?: string;
  payment_file_id: string;
  batch_id?: string;
  
  // Account Information
  account_number: string;
  account_holder_name?: string;
  account_status?: string;
  
  // Address Information
  postal_address_1?: string;
  postal_address_2?: string;
  postal_address_3?: string;
  street_address?: string;
  town?: string;
  suburb?: string;
  ward?: string;
  property_category?: string;
  
  // Financial Information
  outstanding_balance_capital?: number;
  outstanding_balance_interest?: number;
  outstanding_balance_other?: number;
  outstanding_balance_total?: number;
  agreement_outstanding?: number;
  housing_outstanding?: number;
  amount?: number;
  
  // Agreement Information
  agreement_type?: string;
  agreement_number?: string;
  
  // Customer Information
  owner_category?: string;
  occ_own?: string;
  
  // Contact Information
  email_address?: string;
  cell_number?: string;
  
  // Special Flags
  indigent?: boolean;
  pensioner?: boolean;
  hand_over?: boolean;
  
  // Raw data storage - includes original fields from payment file
  raw_data?: any;
  
  // Processing Information
  processing_status?: 'pending' | 'processed' | 'failed' | 'skipped';
  processing_error?: string;
  processed_at?: string;
  
  // Audit Information
  created_by?: string;
}

export interface BatchProcessingResult {
  total_records: number;
  successful_records: number;
  failed_records: number;
  batch_id: string;
  errors: Array<{
    record_index: number;
    account_number: string;
    error: string;
  }>;
  processing_time_ms: number;
}

/**
 * Convert PaymentRecord to PaymentRecordData format
 */
export function convertPaymentRecordToData(
  record: PaymentRecord, 
  paymentFileId: string, 
  batchId?: string,
  userId?: string
): PaymentRecordData {
  // For debugging
  console.log('Record before conversion:', record);
  
  const result: PaymentRecordData = {
    payment_file_id: paymentFileId,
    batch_id: batchId,
    account_number: record.ACCOUNT_NO || '',
    account_holder_name: record.ACCOUNT_HOLDER_NAME,
    account_status: record.ACCOUNT_STATUS,
    postal_address_1: record.POSTAL_ADDRESS_1,
    postal_address_2: record.POSTAL_ADDRESS_2,
    postal_address_3: record.POSTAL_ADDRESS_3,
    street_address: record.STREET_ADDRESS,
    town: record.TOWN,
    suburb: record.SUBURB,
    ward: record.WARD,
    property_category: record.PROPERTY_CATEGORY,
    outstanding_balance_capital: parseFloat(record.OUTSTANDING_BALANCE_CAPITAL?.toString() || '0') || undefined,
    outstanding_balance_interest: parseFloat(record.OUTSTANDING_BALANCE_INTEREST?.toString() || '0') || undefined,
    outstanding_balance_other: parseFloat(record.outstanding_balance_other?.toString() || '0') || undefined,
    outstanding_balance_total: parseFloat(record.OUTSTANDING_TOTAL_BALANCE?.toString() || '0') || undefined,
    agreement_outstanding: parseFloat(record.AGREEMENT_OUTSTANDING?.toString() || '0') || undefined,
    housing_outstanding: parseFloat(record.HOUSING_OUTSTANDING?.toString() || '0') || undefined,
    amount: parseFloat(record.LAST_PAYMENT_AMOUNT?.toString() || '0') || undefined,
    agreement_type: record.AGREEMENT_TYPE,
    agreement_number: record.AGREEMENT_NUMBER || record.ERF_NUMBER,
    owner_category: record.OWNER_CATEGORY,
    occ_own: record.OCC_OWN,
    email_address: record.EMAIL_ADDRESS,
    cell_number: record.CELL_NUMBER,
    indigent: record.INDIGENT === 'YES' || record.INDIGENT === true,
    pensioner: record.PENSIONER === 'YES' || record.PENSIONER === true,
    hand_over: record.HAND_OVER === 'YES' || record.HAND_OVER === true,
    // Store important original fields like LAST_PAYMENT_DATE in the raw_data field
    raw_data: {
      LAST_PAYMENT_DATE: record.LAST_PAYMENT_DATE?.toString(),
      LAST_PAYMENT_AMOUNT: record.LAST_PAYMENT_AMOUNT,
      // Include other original fields you might need
      ACCOUNT_NO: record.ACCOUNT_NO,
      ACCOUNT_HOLDER_NAME: record.ACCOUNT_HOLDER_NAME
    },
    processing_status: 'pending' as 'pending',
    created_by: userId,
  };
  
  // For debugging
  console.log('Converted record:', result);
  
  return result;
}

/**
 * Insert payment records in batches to handle large datasets efficiently
 */
export async function insertPaymentRecordsBatch(
  records: PaymentRecord[],
  paymentFileId: string,
  batchSize: number = 1000,
  onProgress?: (processed: number, total: number) => void
): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const batchId = crypto.randomUUID();
  
  let successfulRecords = 0;
  let failedRecords = 0;
  const errors: Array<{ record_index: number; account_number: string; error: string }> = [];
  
  // Get current user
  let userId = 'system';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (error) {
    console.warn('Could not get authenticated user, using system user instead:', error);
  }
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchData = batch.map((record, index) => 
      convertPaymentRecordToData(record, paymentFileId, batchId, userId)
    );
    
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .insert(batchData)
        .select('id, account_number');
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        
        // Record errors for this entire batch
        batch.forEach((record, batchIndex) => {
          errors.push({
            record_index: i + batchIndex,
            account_number: record.account_number || 'Unknown',
            error: error.message
          });
          failedRecords++;
        });
      } else {
        successfulRecords += data?.length || batch.length;
      }
    } catch (error: any) {
      console.error(`Unexpected error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
      
      // Record errors for this entire batch
      batch.forEach((record, batchIndex) => {
        errors.push({
          record_index: i + batchIndex,
          account_number: record.account_number || 'Unknown',
          error: error.message || 'Unexpected error'
        });
        failedRecords++;
      });
    }
    
    // Report progress
    const processed = Math.min(i + batchSize, records.length);
    if (onProgress) {
      onProgress(processed, records.length);
    }
    
    // Small delay to prevent overwhelming the database
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    total_records: records.length,
    successful_records: successfulRecords,
    failed_records: failedRecords,
    batch_id: batchId,
    errors,
    processing_time_ms: processingTime
  };
}

/**
 * Get payment records for a specific payment file
 */
export async function getPaymentRecordsByFileId(
  paymentFileId: string,
  limit: number = 100,
  offset: number = 0
) {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('payment_file_id', paymentFileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  return { data, error };
}

/**
 * Get payment records by batch ID
 */
export async function getPaymentRecordsByBatchId(batchId: string) {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Update processing status for a batch of records
 */
export async function updateBatchProcessingStatus(
  batchId: string,
  status: 'pending' | 'processed' | 'failed' | 'skipped',
  errorMessage?: string
) {
  const updateData: any = {
    processing_status: status,
    processed_at: new Date().toISOString()
  };
  
  if (errorMessage) {
    updateData.processing_error = errorMessage;
  }
  
  const { data, error } = await supabase
    .from('payment_records')
    .update(updateData)
    .eq('batch_id', batchId);
  
  return { data, error };
}

/**
 * Get payment records statistics for a file
 */
export async function getPaymentRecordsStats(paymentFileId: string) {
  const { data, error } = await supabase
    .from('payment_records')
    .select('processing_status, amount')
    .eq('payment_file_id', paymentFileId);
  
  if (error) {
    return { 
      total_records: 0, 
      pending_records: 0, 
      processed_records: 0, 
      failed_records: 0,
      total_amount: 0,
      error 
    };
  }
  
  const stats = data.reduce((acc, record) => {
    acc.total_records++;
    
    switch (record.processing_status) {
      case 'pending':
        acc.pending_records++;
        break;
      case 'processed':
        acc.processed_records++;
        break;
      case 'failed':
        acc.failed_records++;
        break;
    }
    
    if (record.amount) {
      acc.total_amount += parseFloat(record.amount.toString());
    }
    
    return acc;
  }, {
    total_records: 0,
    pending_records: 0,
    processed_records: 0,
    failed_records: 0,
    total_amount: 0
  });
  
  return { ...stats, error: null };
}

/**
 * Delete payment records for a specific payment file
 */
export async function deletePaymentRecordsByFileId(paymentFileId: string) {
  const { data, error } = await supabase
    .from('payment_records')
    .delete()
    .eq('payment_file_id', paymentFileId);
  
  return { data, error };
}

/**
 * Get recent payment records across all files for the current user
 */
export async function getRecentPaymentRecords(limit: number = 50) {
  const { data, error } = await supabase
    .from('payment_records_with_file_info')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
}
