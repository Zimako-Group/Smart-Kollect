import { supabase } from '@/lib/supabaseClient';

export interface PaymentAllocationRequest {
  payment_file_id: string;
  batch_id?: string;
  offset?: number;
  limit?: number;
}

export interface AllocationResult {
  total_records_processed: number;
  accounts_updated: number;
  accounts_created: number;
  failed_allocations: number;
  processing_time_ms: number;
  has_more: boolean;
  next_offset?: number;
  errors: Array<{
    account_number: string;
    error: string;
  }>;
}

export interface PaymentAllocationResponse {
  message: string;
  result: AllocationResult;
}

export interface AllocationProgress {
  total_processed: number;
  accounts_updated: number;
  accounts_created: number;
  failed_allocations: number;
  total_time_ms: number;
  is_complete: boolean;
  errors: Array<{
    account_number: string;
    error: string;
  }>;
}

/**
 * Allocate payments for a payment file
 * This now redirects to the direct allocation method since we've removed the Edge Function
 */
export async function allocatePayments(
  paymentFileId: string,
  batchId?: string,
  onProgress?: (progress: AllocationProgress) => void
): Promise<AllocationProgress> {
  // Import the direct allocation method
  const { allocatePaymentsDirect } = await import('./direct-payment-allocation-service');
  
  // Redirect to direct allocation method
  return allocatePaymentsDirect(paymentFileId, batchId, onProgress);
}

/**
 * Legacy function for backward compatibility - calls the new batch processing function
 */
export async function allocatePaymentsLegacy(
  paymentFileId: string,
  batchId?: string
): Promise<PaymentAllocationResponse> {
  const progress = await allocatePayments(paymentFileId, batchId);
  
  return {
    message: progress.is_complete ? 'Payment allocation completed' : 'Payment allocation in progress',
    result: {
      total_records_processed: progress.total_processed,
      accounts_updated: progress.accounts_updated,
      accounts_created: progress.accounts_created,
      failed_allocations: progress.failed_allocations,
      processing_time_ms: progress.total_time_ms,
      has_more: !progress.is_complete,
      next_offset: undefined,
      errors: progress.errors
    }
  };
}

/**
 * Get allocation statistics for a payment file
 */
export async function getAllocationStats(paymentFileId: string) {
  try {
    console.log(`Getting allocation stats for file ID: ${paymentFileId}`);
    
    const { data, error } = await supabase
      .from('payment_records')
      .select('processing_status, amount')
      .eq('payment_file_id', paymentFileId);

    if (error) {
      throw new Error(`Failed to get allocation stats: ${error.message}`);
    }

    const stats = data.reduce((acc, record) => {
      const amount = typeof record.amount === 'number' ? record.amount : 0;
      
      acc.total++;
      acc.total_amount += amount;
      
      if (record.processing_status === 'processed') {
        acc.allocated++;
        acc.allocated_amount += amount;
      } else if (record.processing_status === 'pending') {
        acc.pending++;
        acc.pending_amount += amount;
      } else if (record.processing_status === 'failed') {
        acc.failed++;
        acc.failed_amount += amount;
      }
      return acc;
    }, {
      total: 0,
      allocated: 0,
      pending: 0,
      failed: 0,
      total_amount: 0,
      allocated_amount: 0,
      pending_amount: 0,
      failed_amount: 0
    });

    console.log('Allocation stats:', stats);
    
    return {
      ...stats,
      allocation_percentage: stats.total > 0 ? (stats.allocated / stats.total) * 100 : 0
    };
  } catch (error: any) {
    console.error('Get allocation stats error:', error);
    throw new Error(`Failed to get allocation statistics: ${error.message}`);
  }
}

/**
 * Check if a payment file has any records ready for allocation
 */
export async function canAllocatePayments(paymentFileId: string): Promise<boolean> {
  try {
    // Check if there are any pending records to allocate
    const { count, error } = await supabase
      .from('payment_records')
      .select('id', { count: 'exact', head: true })
      .eq('payment_file_id', paymentFileId)
      .eq('processing_status', 'pending');

    if (error) {
      console.error('Error checking allocation eligibility:', error);
      return false;
    }

    // If no pending records, check if there are any records at all
    if (!count || count === 0) {
      const { count: totalCount, error: totalError } = await supabase
        .from('payment_records')
        .select('id', { count: 'exact', head: true })
        .eq('payment_file_id', paymentFileId);
        
      if (totalError) {
        console.error('Error checking total records:', totalError);
        return false;
      }
      
      // If there are records but none are pending, we'll allow allocation
      // This will trigger the reset of failed records in the allocatePayments function
      return totalCount !== null && totalCount > 0;
    }

    return count > 0;
  } catch (error) {
    console.error('Can allocate payments error:', error);
    return false;
  }
}

/**
 * Get detailed allocation results for a payment file
 */
export async function getAllocationDetails(paymentFileId: string) {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        id,
        account_number,
        account_holder_name,
        amount,
        processing_status,
        processing_error,
        processed_at,
        created_at
      `)
      .eq('payment_file_id', paymentFileId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get allocation details: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Get allocation details error:', error);
    throw new Error(`Failed to get allocation details: ${error.message}`);
  }
}
