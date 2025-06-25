import { supabase } from './supabaseClient';
import crypto from 'crypto';

export interface PaymentFileMetadata {
  id?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_date?: string;
  upload_week: number;
  upload_year: number;
  upload_month: number;
  upload_day: number;
  records_count?: number;
  valid_records_count?: number;
  invalid_records_count?: number;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  batch_id?: string;
  uploaded_by?: string;
  file_hash?: string;
  errors_count?: number;
  warnings_count?: number;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_duration_ms?: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentFileData {
  file_name: string;
  file_size: number;
  file_type: string;
  file_content?: ArrayBuffer; // For generating hash
  metadata?: Record<string, any>;
}

export interface UpdatePaymentFileData {
  records_count?: number;
  valid_records_count?: number;
  invalid_records_count?: number;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  batch_id?: string;
  errors_count?: number;
  warnings_count?: number;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_duration_ms?: number;
  metadata?: Record<string, any>;
}

/**
 * Generate SHA-256 hash of file content
 */
export const generateFileHash = async (fileContent: ArrayBuffer): Promise<string> => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser environment
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileContent);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment (fallback)
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(fileContent));
    return hash.digest('hex');
  }
};

/**
 * Get week number from date
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Create a new payment file record
 */
export const createPaymentFile = async (data: CreatePaymentFileData): Promise<{ data: PaymentFileMetadata | null, error: any }> => {
  try {
    const uploadDate = new Date();
    const weekNumber = getWeekNumber(uploadDate);
    
    // Generate file hash if content is provided
    let fileHash: string | undefined;
    if (data.file_content) {
      fileHash = await generateFileHash(data.file_content);
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    const paymentFileData: Partial<PaymentFileMetadata> = {
      file_name: data.file_name,
      file_size: data.file_size,
      file_type: data.file_type,
      upload_date: uploadDate.toISOString(),
      upload_week: weekNumber,
      upload_year: uploadDate.getFullYear(),
      upload_month: uploadDate.getMonth() + 1,
      upload_day: uploadDate.getDate(),
      processing_status: 'pending',
      uploaded_by: user?.id,
      file_hash: fileHash,
      metadata: data.metadata || {},
    };

    const { data: result, error } = await supabase
      .from('payment_files')
      .insert(paymentFileData)
      .select()
      .single();

    return { data: result, error };
  } catch (error) {
    console.error('Error creating payment file record:', error);
    return { data: null, error };
  }
};

/**
 * Update payment file record
 */
export const updatePaymentFile = async (id: string, updates: UpdatePaymentFileData): Promise<{ data: PaymentFileMetadata | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('payment_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating payment file record:', error);
    return { data: null, error };
  }
};

/**
 * Mark processing as started
 */
export const markProcessingStarted = async (id: string): Promise<{ data: PaymentFileMetadata | null, error: any }> => {
  return updatePaymentFile(id, {
    processing_status: 'processing',
    processing_started_at: new Date().toISOString(),
  });
};

/**
 * Mark processing as completed
 */
export const markProcessingCompleted = async (
  id: string, 
  results: {
    records_count: number;
    valid_records_count: number;
    invalid_records_count: number;
    errors_count: number;
    warnings_count: number;
    batch_id?: string;
    processing_started_at?: string;
  }
): Promise<{ data: PaymentFileMetadata | null, error: any }> => {
  const completedAt = new Date().toISOString();
  const duration = results.processing_started_at 
    ? new Date(completedAt).getTime() - new Date(results.processing_started_at).getTime()
    : undefined;

  return updatePaymentFile(id, {
    processing_status: 'completed',
    processing_completed_at: completedAt,
    processing_duration_ms: duration,
    records_count: results.records_count,
    valid_records_count: results.valid_records_count,
    invalid_records_count: results.invalid_records_count,
    errors_count: results.errors_count,
    warnings_count: results.warnings_count,
    batch_id: results.batch_id,
  });
};

/**
 * Mark processing as failed
 */
export const markProcessingFailed = async (id: string, error?: string): Promise<{ data: PaymentFileMetadata | null, error: any }> => {
  return updatePaymentFile(id, {
    processing_status: 'failed',
    processing_completed_at: new Date().toISOString(),
    metadata: { error },
  });
};

/**
 * Get payment file by ID
 */
export const getPaymentFile = async (id: string): Promise<{ data: PaymentFileMetadata | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('payment_files')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching payment file:', error);
    return { data: null, error };
  }
};

/**
 * Get payment files for current user
 */
export const getUserPaymentFiles = async (limit: number = 50, offset: number = 0): Promise<{ data: PaymentFileMetadata[] | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('payment_files')
      .select('*')
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  } catch (error) {
    console.error('Error fetching user payment files:', error);
    return { data: null, error };
  }
};

/**
 * Get payment files by week and year
 */
export const getPaymentFilesByWeek = async (week: number, year: number): Promise<{ data: PaymentFileMetadata[] | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('payment_files')
      .select('*')
      .eq('upload_week', week)
      .eq('upload_year', year)
      .order('upload_date', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching payment files by week:', error);
    return { data: null, error };
  }
};

/**
 * Check if file hash already exists (duplicate detection)
 */
export const checkFileHashExists = async (fileHash: string): Promise<{ exists: boolean, file?: PaymentFileMetadata }> => {
  try {
    const { data, error } = await supabase
      .from('payment_files')
      .select('*')
      .eq('file_hash', fileHash)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking file hash:', error);
      return { exists: false };
    }

    return { exists: !!data, file: data || undefined };
  } catch (error) {
    console.error('Error checking file hash:', error);
    return { exists: false };
  }
};

/**
 * Get payment file statistics
 */
export const getPaymentFileStats = async (): Promise<{
  total_files: number;
  total_records: number;
  files_this_week: number;
  files_this_month: number;
  processing_status_counts: Record<string, number>;
}> => {
  try {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get all files for current user
    const { data: allFiles } = await getUserPaymentFiles(1000);
    
    if (!allFiles) {
      return {
        total_files: 0,
        total_records: 0,
        files_this_week: 0,
        files_this_month: 0,
        processing_status_counts: {},
      };
    }

    const stats = {
      total_files: allFiles.length,
      total_records: allFiles.reduce((sum, file) => sum + (file.records_count || 0), 0),
      files_this_week: allFiles.filter(file => file.upload_week === currentWeek && file.upload_year === currentYear).length,
      files_this_month: allFiles.filter(file => file.upload_month === currentMonth && file.upload_year === currentYear).length,
      processing_status_counts: allFiles.reduce((counts, file) => {
        const status = file.processing_status || 'pending';
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>),
    };

    return stats;
  } catch (error) {
    console.error('Error getting payment file stats:', error);
    return {
      total_files: 0,
      total_records: 0,
      files_this_week: 0,
      files_this_month: 0,
      processing_status_counts: {},
    };
  }
};
