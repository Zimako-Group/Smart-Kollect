import { supabase } from '@/lib/supabaseClient';

export interface PaymentMetrics {
  files_processed: number;
  payments_processed: number;
  payments_amount: number;
  pending_validations: number;
  failed_uploads: number;
}

export interface PaymentMetricsChanges {
  files_processed_change: number | null;
  payments_amount_change: number | null;
  failed_uploads_change: number | null;
}

export interface PaymentMetricsSummary extends PaymentMetrics {
  period: 'today' | 'week' | 'month';
}

/**
 * Get the current payment metrics summary
 */
export async function getPaymentMetricsSummary(): Promise<PaymentMetricsSummary[]> {
  const { data, error } = await supabase
    .from('payment_metrics_summary')
    .select('*');
    
  if (error) {
    console.error('Error fetching payment metrics summary:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get the percentage changes in metrics
 */
export async function getPaymentMetricsChanges(): Promise<PaymentMetricsChanges> {
  // Don't use single() as it requires exactly one row
  const { data, error } = await supabase
    .from('payment_metrics_changes')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching payment metrics changes:', error);
    return {
      files_processed_change: null,
      payments_amount_change: null,
      failed_uploads_change: null
    };
  }
  
  // Return the first row if available, otherwise return default values
  return (data && data.length > 0) ? data[0] : {
    files_processed_change: null,
    payments_amount_change: null,
    failed_uploads_change: null
  };
}

/**
 * Increment the files processed count
 */
export async function incrementFilesProcessed(): Promise<void> {
  const { error } = await supabase.rpc('increment_files_processed');
  
  if (error) {
    console.error('Error incrementing files processed:', error);
  }
}

/**
 * Update the payments processed metrics
 */
export async function updatePaymentsProcessed(count: number, amount: number): Promise<void> {
  const { error } = await supabase.rpc('update_payments_processed', {
    payment_count: count,
    payment_total: amount
  });
  
  if (error) {
    console.error('Error updating payments processed:', error);
  }
}

/**
 * Update the pending validations count
 */
export async function updatePendingValidations(countChange: number): Promise<void> {
  const { error } = await supabase.rpc('update_pending_validations', {
    count_change: countChange
  });
  
  if (error) {
    console.error('Error updating pending validations:', error);
  }
}

/**
 * Increment the failed uploads count
 */
export async function incrementFailedUploads(): Promise<void> {
  const { error } = await supabase.rpc('increment_failed_uploads');
  
  if (error) {
    console.error('Error incrementing failed uploads:', error);
  }
}

/**
 * Get today's payment metrics
 */
export async function getTodayMetrics(): Promise<PaymentMetrics> {
  const summaries = await getPaymentMetricsSummary();
  const todayMetrics = summaries.find(summary => summary.period === 'today');
  
  if (!todayMetrics) {
    return {
      files_processed: 0,
      payments_processed: 0,
      payments_amount: 0,
      pending_validations: 0,
      failed_uploads: 0
    };
  }
  
  return todayMetrics;
}
