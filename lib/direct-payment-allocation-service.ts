import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { updateAgentPerformance, batchUpdateAgentPerformance, AgentPerformanceUpdate } from './agent-performance-service';
import { createPaymentFileUpload, processPaymentFileRecords } from './payment-history-service';
import type { PaymentFileRecord } from './payment-history-service';

// Constants for performance tuning
const MAX_RETRIES = 3;      // Maximum number of retries for database operations
const RETRY_DELAY_BASE = 1000; // Base delay in ms before retrying (will be multiplied by 2^retryCount)

/**
 * Extracts the payment date from a payment record, looking in all possible locations
 * @param record The payment record from which to extract the payment date
 * @returns The extracted payment date or null if not found
 */
/**
 * Extracts the payment date from a payment record
 * @param record The payment record from which to extract the payment date
 * @returns The extracted payment date exactly as it appears in the file, or null if not found
 */
function extractPaymentDateFromRecord(record: PaymentRecord): string | null {
  console.log('Extracting payment date for account:', record.account_number);
  
  // Now we're storing LAST_PAYMENT_DATE in the raw_data field
  if (record.raw_data) {
    // Check if raw_data is an object with LAST_PAYMENT_DATE
    if (typeof record.raw_data === 'object' && record.raw_data.LAST_PAYMENT_DATE) {
      const paymentDate = record.raw_data.LAST_PAYMENT_DATE?.toString();
      console.log('Found LAST_PAYMENT_DATE in raw_data:', paymentDate);
      
      // Handle 'N/A' or empty values
      if (!paymentDate || paymentDate === 'N/A' || paymentDate === '' || paymentDate === 'null' || paymentDate === 'undefined') {
        console.log('Payment date is N/A or empty, will use null');
        return null;
      }
      
      // Validate date format to ensure we have a valid date for PostgreSQL
      // We're expecting YYYYMMDD format
      if (/^\d{8}$/.test(paymentDate)) {
        // Format as YYYY-MM-DD which PostgreSQL accepts
        const year = paymentDate.substring(0, 4);
        const month = paymentDate.substring(4, 6);
        const day = paymentDate.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;
        console.log(`Formatted ${paymentDate} to ${formattedDate}`);
        return formattedDate;
      }
      
      return paymentDate;
    }
    
    // Try parsing raw_data if it's a string
    if (typeof record.raw_data === 'string') {
      try {
        const parsedData = JSON.parse(record.raw_data);
        if (parsedData.LAST_PAYMENT_DATE) {
          const paymentDate = parsedData.LAST_PAYMENT_DATE?.toString();
          console.log('Found LAST_PAYMENT_DATE in parsed raw_data:', paymentDate);
          
          // Handle 'N/A' or empty values
          if (!paymentDate || paymentDate === 'N/A' || paymentDate === '' || paymentDate === 'null' || paymentDate === 'undefined') {
            console.log('Payment date is N/A or empty, will use null');
            return null;
          }
          
          // Validate date format to ensure we have a valid date for PostgreSQL
          // We're expecting YYYYMMDD format
          if (/^\d{8}$/.test(paymentDate)) {
            // Format as YYYY-MM-DD which PostgreSQL accepts
            const year = paymentDate.substring(0, 4);
            const month = paymentDate.substring(4, 6);
            const day = paymentDate.substring(6, 8);
            const formattedDate = `${year}-${month}-${day}`;
            console.log(`Formatted ${paymentDate} to ${formattedDate}`);
            return formattedDate;
          }
          
          return paymentDate;
        }
      } catch (e) {
        console.log('Failed to parse raw_data as JSON');
      }
    }
  }
  
  // Log failure to find payment date
  console.log('No payment date found in record');
  return null;
}

/**
 * This function previously formatted payment dates, but we now need to keep the original format
 * We're keeping the function just in case we need it in the future, but it's not used in the main flow
 */
function formatPaymentDate(dateString: string | undefined | null): string | undefined {
  if (!dateString) return undefined;
  // We're now keeping the exact date format from the file, no formatting needed
  return dateString;
}
// Define our own interfaces to avoid dependencies on the Edge Function service
export interface AllocationProgress {
  total_processed: number;
  accounts_updated: number;
  accounts_created: number;
  failed_allocations: number;
  total_time_ms: number;
  is_complete: boolean;
  current_offset?: number; // Track the current offset to support resuming
  errors: Array<{
    account_number: string;
    error: string;
  }>;
}

/**
 * Direct payment allocation service that processes payments without using Edge Functions
 * This provides an alternative implementation when the Edge Function approach fails
 */

interface PaymentRecord {
  id: string;
  account_number: string;
  account_holder_name?: string;
  amount?: number;
  outstanding_balance_total?: number;
  outstanding_balance_capital?: number;
  outstanding_balance_interest?: number;
  // Raw data from original payment file containing fields like LAST_PAYMENT_DATE
  raw_data?: string | Record<string, any>;
  email_address?: string;
  cell_number?: string;
  postal_address_1?: string;
  postal_address_2?: string;
  postal_address_3?: string;
  street_address?: string;
  town?: string;
  suburb?: string;
  ward?: string;
  property_category?: string;
  owner_category?: string;
  account_status?: string;
  agreement_type?: string;
  agreement_number?: string;
  occ_own?: string;
  indigent?: boolean;
  pensioner?: boolean;
  hand_over?: boolean;
  created_at: string;
  payment_file_id: string;
  processing_status: string;
}

interface DebtorRecord {
  id?: string;
  acc_number: string;
  acc_holder?: string;
  last_payment_amount?: number;
  last_payment_date?: string;
  outstanding_balance?: number;
  email_addr_1?: string;
  cell_number?: string;
  post_addr_1?: string;
  post_addr_2?: string;
  post_addr_3?: string;
  street_addr?: string;
  town?: string;
  suburb?: string;
  ward_description?: string;
  property_category_description?: string;
  owner_type_description?: string;
  account_status_description?: string;
  indigent_yn?: string;
  pensioner_yn?: string;
  updated_at?: string;
  created_at?: string;
}

/**
 * Allocate payments directly using the Supabase client
 * This is an alternative to the Edge Function approach
 */
export async function allocatePaymentsDirect(
  paymentFileId: string,
  batchId?: string,
  onProgress?: (progress: AllocationProgress) => void,
  startOffset: number = 0 // New parameter to support resuming from a specific point
): Promise<AllocationProgress> {
  console.log(`Starting direct payment allocation for file ID: ${paymentFileId}`);
  
  // Initialize progress tracking
  let progress: AllocationProgress = {
    total_processed: 0,
    accounts_updated: 0,
    accounts_created: 0,
    failed_allocations: 0,
    total_time_ms: 0,
    is_complete: false,
    errors: []
  };
  
  const startTime = Date.now();
  // Increased batch size to process more records at once
  const BATCH_SIZE = 1000; 
  // Set a much longer execution time (30 minutes) to process all records
  const MAX_EXECUTION_TIME_MS = 1800000; // 30 minutes
  let offset = startOffset;
  let hasMore = true;
  let consecutiveErrorCount = 0;
  const MAX_CONSECUTIVE_ERRORS = 3; // Maximum number of consecutive batch errors before aborting
  
  try {
    while (hasMore) {
      // Check if we're approaching the timeout limit, but with a much higher threshold
      const currentExecutionTime = Date.now() - startTime;
      if (currentExecutionTime > MAX_EXECUTION_TIME_MS) {
        console.log(`Reached extended timeout limit (${currentExecutionTime}ms). Pausing execution.`);
        // Mark as incomplete but not failed
        progress.is_complete = false;
        progress.total_time_ms = currentExecutionTime;
        progress.current_offset = offset; // Store current offset for resuming
        
        if (onProgress) {
          onProgress({ ...progress });
        }
        
        // Log resumption instructions
        console.log(`To resume processing, call allocatePaymentsDirect with startOffset=${offset}`);
        
        // Return current progress
        return progress;
      }
      
      // Log progress periodically
      if (progress.total_processed > 0 && progress.total_processed % 1000 === 0) {
        console.log(`Processed ${progress.total_processed} records so far`);
        if (onProgress) {
          progress.total_time_ms = Date.now() - startTime;
          onProgress({ ...progress });
        }
      }
      // Get a batch of pending payment records with retry logic for network issues
      let paymentRecords = null;
      let fetchError = null;
      let retryCount = 0;
      
      while (retryCount < MAX_RETRIES) {
        try {
          // Fetch all fields including raw_data which contains the LAST_PAYMENT_DATE
          console.log('Fetching payment records with raw_data');
          // Optimize query - only select fields we actually need to reduce data transfer
          const response = await supabase
            .from('payment_records')
            .select('id, account_number, amount, outstanding_balance_total, created_at, raw_data, payment_file_id, processing_status')
            .eq('payment_file_id', paymentFileId)
            .eq('processing_status', 'pending')
            .order('created_at', { ascending: true })
            .limit(BATCH_SIZE);
          
          paymentRecords = response.data;
          fetchError = response.error;
          
          // Log the first record to see its structure for debugging
          if (paymentRecords && paymentRecords.length > 0) {
            console.log('Record count:', paymentRecords.length);
            console.log('First payment record ID:', paymentRecords[0].id);
            console.log('First payment record account:', paymentRecords[0].account_number);
            
            // Check for raw_data field which should contain LAST_PAYMENT_DATE
            if (paymentRecords[0].raw_data) {
              console.log('raw_data present in first record:', JSON.stringify(paymentRecords[0].raw_data));
            } else {
              console.log('Warning: raw_data missing from first record');
            }
          }
          
          if (!fetchError) break;
          
          console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} - Error fetching payment records:`, fetchError);
          
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          retryCount++;
          
        } catch (e) {
          console.error(`Unexpected error during fetch (attempt ${retryCount + 1}/${MAX_RETRIES}):`, e);
          fetchError = { message: e instanceof Error ? e.message : 'Unknown error during fetch' };
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          retryCount++;
        }
      }
      
      if (fetchError) {
        console.error('Error fetching payment records:', fetchError);
        throw new Error(`Failed to fetch payment records: ${fetchError.message}`);
      }
      
      if (!paymentRecords || paymentRecords.length === 0) {
        // No more records to process
        hasMore = false;
        break;
      }
      
      console.log(`Processing batch of ${paymentRecords.length} records starting at offset ${offset}`);
      
      // Group records by account number to get the latest record for each account
      const latestRecordsByAccount = new Map<string, PaymentRecord>();
      for (const record of paymentRecords) {
        if (!record.account_number) continue;
        
        // If we haven't seen this account yet, or this record is newer
        const existingRecord = latestRecordsByAccount.get(record.account_number);
        if (!existingRecord || new Date(record.created_at) > new Date(existingRecord.created_at)) {
          const paymentRecord: PaymentRecord = {
            id: record.id,
            account_number: record.account_number,
            amount: record.amount,
            outstanding_balance_total: record.outstanding_balance_total,
            raw_data: record.raw_data,
            created_at: record.created_at,
            payment_file_id: record.payment_file_id || "",
            processing_status: record.processing_status || "pending",
            // Copy other optional properties if they exist
            ...(record as Partial<PaymentRecord>)
          };
          latestRecordsByAccount.set(record.account_number, paymentRecord);
        }
      }
      
      // Convert map to array
      const uniqueRecords = Array.from(latestRecordsByAccount.values());
      console.log(`Processing ${uniqueRecords.length} unique accounts from ${paymentRecords.length} records`);
      
      // Get all existing debtors for the accounts we're processing (bulk fetch)
      // Only select the fields we need to minimize data transfer
      const accountNumbers = uniqueRecords.map(r => r.account_number);
      
      // Retry logic for fetching debtors
      let existingDebtors = null;
      let debtorsError = null;
      let debtorFetchRetryCount = 0;
      
      while (debtorFetchRetryCount < MAX_RETRIES) {
        try {
          const response = await supabase
            .from('Debtors')
            .select('id,acc_number,outstanding_balance,last_payment_amount,last_payment_date,assigned_agent_id')
            .in('acc_number', accountNumbers);
          
          existingDebtors = response.data;
          debtorsError = response.error;

          if (!debtorsError) break;
          
          console.log(`Retry ${debtorFetchRetryCount + 1}/${MAX_RETRIES} - Error fetching debtors:`, debtorsError);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, debtorFetchRetryCount)));
          debtorFetchRetryCount++;
          
        } catch (e) {
          console.error(`Unexpected error during debtor fetch (attempt ${debtorFetchRetryCount + 1}/${MAX_RETRIES}):`, e);
          debtorsError = { message: e instanceof Error ? e.message : 'Unknown error during fetch' };
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, debtorFetchRetryCount)));
          debtorFetchRetryCount++;
        }
      }
      
      if (debtorsError) {
        console.error('Error fetching existing debtors after retries:', debtorsError);
        // If we've had too many consecutive errors, abort
        if (consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`Too many consecutive errors (${consecutiveErrorCount}). Aborting.`);
          
          // Instead of throwing an error, return partial progress
          progress.is_complete = false;
          progress.total_time_ms = Date.now() - startTime;
          
          if (onProgress) {
            onProgress({ ...progress });
          }
          
          return progress;
        }
        
        // Skip this batch but continue processing
        console.warn(`Skipping batch at offset ${offset} due to debtor fetch error`);
        offset += BATCH_SIZE;
        continue;
      }
      
      // Reset consecutive error count on success
      consecutiveErrorCount = 0;
      
      // Create a map for quick lookup
      const existingDebtorsMap = new Map<string, any>();
      existingDebtors?.forEach(debtor => {
        existingDebtorsMap.set(debtor.acc_number, debtor);
      });
      
      // Process each unique record
      const processedRecordIds: string[] = [];
      const debtorsToUpdate: Array<DebtorRecord & { id: string }> = [];
      const debtorsToInsert: DebtorRecord[] = [];
      const agentPerformanceUpdates: AgentPerformanceUpdate[] = []; // Track agent performance updates
      
      for (const record of uniqueRecords) {
        try {
          const existingDebtor = existingDebtorsMap.get(record.account_number);
          
          // Extract the payment date from the record
          const paymentDate = extractPaymentDateFromRecord(record);
          
          // Prepare debtor data - only update specific fields as requested
          // These are the only fields we'll update: outstanding_balance, last_payment_amount, last_payment_date
          const debtorData: any = {
            acc_number: record.account_number,
            last_payment_amount: record.amount || 0,
            outstanding_balance: record.outstanding_balance_total || 0,
            updated_at: new Date().toISOString()
          };
          
          // Only include last_payment_date if we have a valid date to avoid SQL errors with 'N/A'
          if (paymentDate) {
            debtorData.last_payment_date = paymentDate;
          } else {
            // Don't update the date field at all if we don't have a valid date
            console.log(`Skipping date update for account ${record.account_number} - no valid date`);
          }
          
          if (existingDebtor && existingDebtor.id) {
            // Add to update batch - only update specific fields
            debtorsToUpdate.push({
              id: existingDebtor.id,
              acc_number: record.account_number,
              last_payment_amount: record.amount || 0,
              outstanding_balance: record.outstanding_balance_total || 0,
              updated_at: new Date().toISOString()
            });
            
            // Only include last_payment_date if we have a valid date to avoid SQL errors with 'N/A'
            if (paymentDate) {
              debtorsToUpdate[debtorsToUpdate.length - 1].last_payment_date = paymentDate;
            }
            
            // Track agent performance update if debtor has assigned agent and payment amount > 0
            if (existingDebtor.assigned_agent_id && (record.amount || 0) > 0) {
              agentPerformanceUpdates.push({
                agent_id: existingDebtor.assigned_agent_id,
                payment_amount: record.amount || 0,
                account_number: record.account_number,
                payment_date: paymentDate || undefined
              });
            }
            
            progress.accounts_updated++;
          } else {
            // Skip inserts - we're only updating existing records
            // This prevents errors with missing required fields
            console.log(`Skipping insert for non-existent account: ${record.account_number}`);
            progress.failed_allocations++;
          }
          
          // Track processed record IDs
          processedRecordIds.push(record.id);
          progress.total_processed++;
          
        } catch (error) {
          console.error(`Error preparing data for ${record.account_number}:`, error);
          progress.errors.push({
            account_number: record.account_number,
            error: `Preparation error: ${error instanceof Error ? error.message : String(error)}`
          });
          progress.failed_allocations++;
        }
      }
      
      // Update agent performance in batches
      if (agentPerformanceUpdates.length > 0) {
        console.log(`Updating agent performance for ${agentPerformanceUpdates.length} records`);
        await batchUpdateAgentPerformance(agentPerformanceUpdates);
        console.log(`Completed agent performance updates for ${agentPerformanceUpdates.length} payment records`);
      }
      
      // Bulk update existing debtors
      if (debtorsToUpdate.length > 0) {
        console.log(`Bulk updating ${debtorsToUpdate.length} debtors`);
        let updateRetryCount = 0;
        
        // Process debtors in larger chunks for better performance
        const DEBTOR_UPDATE_CHUNK_SIZE = 50;
        const debtorChunks = [];
        
        // Split debtors into chunks
        for (let i = 0; i < debtorsToUpdate.length; i += DEBTOR_UPDATE_CHUNK_SIZE) {
          debtorChunks.push(debtorsToUpdate.slice(i, i + DEBTOR_UPDATE_CHUNK_SIZE));
        }
        
        console.log(`Processing ${debtorChunks.length} chunks of debtors`);
        
        // Track successful and failed updates
        const successfulUpdates = [];
        const failedUpdates = [];
        
        // Process each chunk
        for (let chunkIndex = 0; chunkIndex < debtorChunks.length; chunkIndex++) {
          const chunk = debtorChunks[chunkIndex];
          console.log(`Processing chunk ${chunkIndex + 1}/${debtorChunks.length} with ${chunk.length} debtors`);
          
          updateRetryCount = 0;
          let chunkSuccess = false;
          
          while (updateRetryCount < MAX_RETRIES && !chunkSuccess) {
            try {
              // Process each record in the chunk
              let chunkHasErrors = false;
              
              // Process each debtor in the chunk individually
              for (const debtor of chunk) {
                // Define the update data for this debtor
                const updateData: any = {
                  outstanding_balance: debtor.outstanding_balance,
                  last_payment_amount: debtor.last_payment_amount,
                  updated_at: new Date().toISOString()
                };
                
                // Only include last_payment_date if it exists and is valid to avoid SQL errors
                if (debtor.last_payment_date) {
                  updateData.last_payment_date = debtor.last_payment_date;
                } else {
                  console.log(`Skipping date update for ${debtor.acc_number} - null or invalid date`);
                }
                
                try {
                  const retryResult = await supabase
                    .from('Debtors')
                    .update(updateData)
                    .eq('id', debtor.id);
                    
                  if (retryResult.error) {
                    console.error(`Retry also failed for ${debtor.acc_number}:`, retryResult.error);
                    failedUpdates.push({
                      acc_number: debtor.acc_number,
                      error: retryResult.error.message
                    });
                    chunkHasErrors = true;
                  } else {
                    console.log(`Successfully updated ${debtor.acc_number}`);
                    successfulUpdates.push(debtor.acc_number);
                  }
                } catch (error) {
                  // For other errors, add to errors list
                  failedUpdates.push({
                    acc_number: debtor.acc_number,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  });
                  chunkHasErrors = true;
                }
              }
              
              // If no errors in this chunk, mark as successful
              if (!chunkHasErrors) {
                chunkSuccess = true;
              } else {
                console.log(`Chunk ${chunkIndex + 1} had errors, retry ${updateRetryCount + 1}/${MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, updateRetryCount)));
                updateRetryCount++;
              }
            } catch (chunkError) {
              console.error(`Unexpected error processing chunk ${chunkIndex + 1} (attempt ${updateRetryCount + 1}/${MAX_RETRIES}):`, chunkError);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, updateRetryCount)));
              updateRetryCount++;
            }
          }
          
          // If we've exhausted retries for this chunk, log it
          if (!chunkSuccess) {
            console.error(`Failed to process chunk ${chunkIndex + 1} after ${MAX_RETRIES} retries`);
          }
        }
        
        // Update progress with results
        console.log(`Successfully updated ${successfulUpdates.length} debtors, failed to update ${failedUpdates.length} debtors`);
        
        // Add failed updates to progress errors
        failedUpdates.forEach(failure => {
          progress.errors.push({
            account_number: failure.acc_number,
            error: `Update failed: ${failure.error}`
          });
        });
        
        // Adjust progress counters
        progress.accounts_updated = successfulUpdates.length;
        progress.failed_allocations += failedUpdates.length;
      }
      
      // Bulk insert new debtors
      if (debtorsToInsert.length > 0) {
        console.log(`Bulk inserting ${debtorsToInsert.length} debtors`);
        const { error: insertError } = await supabase
          .from('Debtors')
          .insert(debtorsToInsert);
        
        if (insertError) {
          console.error('Bulk insert error:', insertError);
          // If bulk insert fails, mark all as failed
          debtorsToInsert.forEach(debtor => {
            progress.errors.push({
              account_number: debtor.acc_number,
              error: `Bulk insert failed: ${insertError.message}`
            });
          });
          progress.failed_allocations += debtorsToInsert.length;
          progress.accounts_created -= debtorsToInsert.length;
        }
      }
      
      // =====================================================
      // PAYMENT HISTORY INTEGRATION
      // =====================================================
      // Create PaymentHistory records for successfully processed payments
      if (paymentRecords && paymentRecords.length > 0) {
        console.log('Creating PaymentHistory records for processed payments...');
        
        try {
          // Check for existing PaymentFileUpload record for this week
          const currentDate = new Date();
          const currentWeekStart = new Date(currentDate);
          currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
          const weekStartString = currentWeekStart.toISOString().split('T')[0];
          
          // Check if there's already an upload for this week
          const { data: existingWeeklyUpload } = await supabase
            .from('PaymentFileUploads')
            .select('id, file_name')
            .eq('upload_week', weekStartString)
            .single();
          
          let paymentUploadId: string;
          
          if (existingWeeklyUpload) {
            // Reuse existing weekly upload record
            paymentUploadId = existingWeeklyUpload.id;
            console.log(`Reusing existing PaymentFileUpload for this week: ${paymentUploadId}`);
          } else {
            // Create new upload record for this week
            console.log('Creating new PaymentFileUpload record for this week...');
            
            // Get current user for uploadedBy field
            const { data: { user } } = await supabase.auth.getUser();
            const uploadedBy = user?.id || null;
            
            if (!uploadedBy) {
              console.error('No user ID found for PaymentFileUpload creation');
              throw new Error('User authentication required for PaymentHistory creation');
            }
            
            // Create a new upload batch record for this week
            const uploadResult = await createPaymentFileUpload(
              `payment-file-week-${weekStartString}`, // fileName based on week
              0, // fileSize (unknown for direct allocation)
              uploadedBy, // uploadedBy (user ID)
              paymentRecords.length // totalRecords
            );
            
            if (!uploadResult || !uploadResult.id) {
              throw new Error('Failed to create PaymentFileUpload record for PaymentHistory');
            }
            
            paymentUploadId = uploadResult.id;
            console.log('Created new PaymentFileUpload with ID:', paymentUploadId);
          }
          
          // Convert payment records to PaymentFileRecord format
          const paymentFileRecords: PaymentFileRecord[] = paymentRecords.map(record => {
            // Extract payment date from raw_data
            let lastPaymentDate = '';
            if (record.raw_data) {
              if (typeof record.raw_data === 'object' && record.raw_data.LAST_PAYMENT_DATE) {
                lastPaymentDate = String(record.raw_data.LAST_PAYMENT_DATE || '');
              } else if (typeof record.raw_data === 'string') {
                try {
                  const parsedData = JSON.parse(record.raw_data);
                  lastPaymentDate = String(parsedData.LAST_PAYMENT_DATE || '');
                } catch (e) {
                  console.log('Failed to parse raw_data for payment history');
                }
              }
            }
            
            return {
              ACCOUNT_NO: String(record.account_number || ''),
              ACCOUNT_HOLDER_NAME: String(record.raw_data?.ACCOUNT_HOLDER_NAME || ''),
              ACCOUNT_STATUS: String(record.raw_data?.ACCOUNT_STATUS || ''),
              'OCC/OWN': String(record.raw_data?.OCC_OWN || ''),
              INDIGENT: String(record.raw_data?.INDIGENT === true ? 'Y' : String(record.raw_data?.INDIGENT || 'N')),
              OUTSTANDING_TOTAL_BALANCE: String(record.outstanding_balance_total || '0'),
              LAST_PAYMENT_AMOUNT: String(record.amount || '0'),
              LAST_PAYMENT_DATE: lastPaymentDate
            };
          });
          
          console.log(`Processing ${paymentFileRecords.length} payment records for PaymentHistory...`);
          
          // Process the payment file records to create PaymentHistory entries
          const processResult = await processPaymentFileRecords(
            paymentUploadId,
            paymentFileRecords
          );
          
          console.log('PaymentHistory processing result:', processResult);
          
          if (processResult.successful > 0) {
            console.log(`Successfully created ${processResult.successful} PaymentHistory records`);
          }
          
          if (processResult.failed > 0) {
            console.log(`Failed to create ${processResult.failed} PaymentHistory records:`, processResult.errors);
          }
          
        } catch (paymentHistoryError) {
          console.error('Error creating PaymentHistory records:', paymentHistoryError);
          // Don't fail the entire allocation if PaymentHistory creation fails
          // Just log the error and continue
        }
      }
      
      // Mark processed records as processed - using smaller chunks to avoid CORS errors with long URLs
      if (processedRecordIds.length > 0) {
        console.log(`Marking ${processedRecordIds.length} records as processed`);
        
        // Define chunk size for payment record updates to avoid CORS issues with long URLs
        const PAYMENT_UPDATE_CHUNK_SIZE = 50;
        const recordChunks = [];
        
        // Split records into smaller chunks
        for (let i = 0; i < processedRecordIds.length; i += PAYMENT_UPDATE_CHUNK_SIZE) {
          recordChunks.push(processedRecordIds.slice(i, i + PAYMENT_UPDATE_CHUNK_SIZE));
        }
        
        console.log(`Processing ${recordChunks.length} chunks of payment records`);
        
        // Process each chunk of record IDs
        for (let chunkIndex = 0; chunkIndex < recordChunks.length; chunkIndex++) {
          const chunk = recordChunks[chunkIndex];
          console.log(`Processing payment record chunk ${chunkIndex + 1}/${recordChunks.length} with ${chunk.length} records`);
          
          // Retry logic for each chunk
          let updateError = null;
          let retryCount = 0;
          let chunkSuccess = false;
          
          while (retryCount < MAX_RETRIES && !chunkSuccess) {
            try {
              const response = await supabase
                .from('payment_records')
                .update({
                  processing_status: 'processed',
                  processed_at: new Date().toISOString(),
                })
                .in('id', chunk);
              
              updateError = response.error;
              
              if (!updateError) {
                chunkSuccess = true;
                console.log(`Successfully updated chunk ${chunkIndex + 1}/${recordChunks.length}`);
                break;
              }
              
              console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} - Error updating payment records chunk ${chunkIndex + 1}:`, updateError);
              
              // Wait with exponential backoff before retrying
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, retryCount)));
              retryCount++;
              
            } catch (e) {
              console.error(`Unexpected error during update of chunk ${chunkIndex + 1} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, e);
              updateError = { message: e instanceof Error ? e.message : 'Unknown error during update' };
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, retryCount)));
              retryCount++;
            }
          }
          
          if (!chunkSuccess) {
            console.error(`Failed to process payment record chunk ${chunkIndex + 1} after ${MAX_RETRIES} retries:`, updateError);
          }
        }
      }
      
      // Update progress
      progress.total_time_ms = Date.now() - startTime;
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress({ ...progress });
      }
      
      // Move to next batch
      offset += BATCH_SIZE;
      
      // Check if there are more records to process
      const { count: remainingCount } = await supabase
        .from('payment_records')
        .select('*', { count: 'exact', head: true })
        .eq('payment_file_id', paymentFileId)
        .eq('processing_status', 'pending');
      
      hasMore = (remainingCount || 0) > 0;
    }
    
    // Mark as complete
    progress.is_complete = true;
    progress.total_time_ms = Date.now() - startTime;
    
    // Final progress update
    if (onProgress) {
      onProgress({ ...progress });
    }
    
    console.log('Direct payment allocation completed:', progress);
    return progress;
    
  } catch (error) {
    console.error('Direct payment allocation error:', error);
    
    // Update progress with error but don't mark as complete
    // This allows for resuming from where we left off
    progress.is_complete = false;
    progress.total_time_ms = Date.now() - startTime;
    
    if (onProgress) {
      onProgress({ ...progress });
    }
    
    // Return partial progress instead of throwing
    // This prevents the UI from showing a complete failure
    return progress;
  }
}

/**
 * Reset failed payment records to pending status for retry
 */
export async function resetFailedPaymentRecords(paymentFileId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .update({ processing_status: 'pending' })
      .eq('payment_file_id', paymentFileId)
      .eq('processing_status', 'failed')
      .select('id');
    
    if (error) {
      console.error('Error resetting failed records:', error);
      throw new Error(`Failed to reset failed records: ${error.message}`);
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Reset failed records error:', error);
    throw new Error(`Failed to reset failed records: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process a large payment file by automatically handling timeouts and resuming
 * This is a more robust approach for very large files (20k+ records)
 */
export async function processLargePaymentFile(
  paymentFileId: string,
  onProgress?: (progress: AllocationProgress) => void,
  maxAttempts: number = 10 // Maximum number of resume attempts
): Promise<AllocationProgress> {
  let currentProgress: AllocationProgress = {
    total_processed: 0,
    accounts_updated: 0,
    accounts_created: 0,
    failed_allocations: 0,
    total_time_ms: 0,
    is_complete: false,
    current_offset: 0,
    errors: []
  };
  
  let attempts = 0;
  const startTime = Date.now();
  
  // Loop until processing is complete or we exceed max attempts
  while (!currentProgress.is_complete && attempts < maxAttempts) {
    console.log(`Starting processing attempt ${attempts + 1}/${maxAttempts} from offset ${currentProgress.current_offset || 0}`);
    
    // Call the main allocation function with the current offset
    const attemptResult = await allocatePaymentsDirect(
      paymentFileId, 
      undefined, 
      (progress) => {
        // Combine progress with previous runs
        const combinedProgress = {
          ...progress,
          total_processed: (currentProgress.total_processed || 0) + progress.total_processed,
          accounts_updated: (currentProgress.accounts_updated || 0) + progress.accounts_updated,
          accounts_created: (currentProgress.accounts_created || 0) + progress.accounts_created,
          failed_allocations: (currentProgress.failed_allocations || 0) + progress.failed_allocations,
          errors: [...(currentProgress.errors || []), ...(progress.errors || [])],
          total_time_ms: (Date.now() - startTime) // Overall time
        };
        
        if (onProgress) {
          onProgress(combinedProgress);
        }
      },
      currentProgress.current_offset || 0
    );
    
    // Update our tracking progress
    currentProgress = {
      ...currentProgress,
      total_processed: (currentProgress.total_processed || 0) + attemptResult.total_processed,
      accounts_updated: (currentProgress.accounts_updated || 0) + attemptResult.accounts_updated,
      accounts_created: (currentProgress.accounts_created || 0) + attemptResult.accounts_created,
      failed_allocations: (currentProgress.failed_allocations || 0) + attemptResult.failed_allocations,
      errors: [...(currentProgress.errors || []), ...(attemptResult.errors || [])],
      is_complete: attemptResult.is_complete,
      current_offset: attemptResult.current_offset || currentProgress.current_offset,
      total_time_ms: (Date.now() - startTime)
    };
    
    if (currentProgress.is_complete) {
      console.log('Processing completed successfully');
      break;
    }
    
    console.log(`Processing paused at offset ${currentProgress.current_offset}, will resume automatically`);
    attempts++;
    
    // Add a short delay between attempts to avoid overloading the database
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  if (!currentProgress.is_complete) {
    console.log(`Reached maximum processing attempts (${maxAttempts}). Some records may not have been processed.`);
  }
  
  return currentProgress;
}
