// IMPORTANT: Import the singleton Supabase client to avoid multiple instances
import { supabase } from './supabaseClient';
import { AccountRecord } from "./file-parsers";

export interface BatchInfo {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  status: "processing" | "completed" | "failed";
}

/**
 * Create a new import batch
 */
export async function createBatch(
  name: string,
  description: string,
  fileName: string,
  fileSize: number
): Promise<BatchInfo | null> {
  try {
    const { data, error } = await supabase
      .from("Batches")
      .insert({
        name,
        description,
        file_name: fileName,
        file_size: fileSize,
        status: "processing",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating batch:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      fileName: data.file_name,
      fileSize: data.file_size,
      recordCount: 0,
      status: data.status,
    };
  } catch (error) {
    console.error("Error creating batch:", error);
    return null;
  }
}

/**
 * Update batch status and record count
 */
export async function updateBatchStatus(
  batchId: string,
  status: "processing" | "completed" | "failed",
  recordCount: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("Batches")
      .update({
        status,
        record_count: recordCount,
      })
      .eq("id", batchId);

    if (error) {
      console.error("Error updating batch status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating batch status:", error);
    return false;
  }
}

/**
 * Insert parsed records into the Debtors table
 */
export async function insertDebtors(
  records: AccountRecord[],
  batchId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    // Process records in smaller batches to avoid hitting request size limits
    const batchSize = 50;
    const totalRecords = records.length;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Map AccountRecord fields to database fields
      const debtorRecords = batch.map((record) => ({
        acc_number: record.acc_number,
        acc_holder: record.acc_holder,
        surname_company_trust: record.surname_company_trust,
        name: record.name,
        initials: record.initials,
        street_addr: record.street_addr,
        post_addr_1: record.post_addr_1,
        post_addr_2: record.post_addr_2,
        post_addr_3: record.post_addr_3,
        post_code: record.post_code,
        work_addr_1: record.work_addr_1,
        work_addr_2: record.work_addr_2,
        home_tel: record.home_tel,
        work_tel: record.work_tel,
        cellphone_1: record.cellphone_1,
        cellphone_2: record.cellphone_2,
        cellphone_3: record.cellphone_3,
        cellphone_4: record.cellphone_4,
        cell_number: record.cell_number,
        cell_number2: record.cell_number2,
        id_number_1: record.id_number_1,
        id_number_2: record.id_number_2,
        email_addr_1: record.email_addr_1,
        email_addr_2: record.email_addr_2,
        vat_reg_no: record.vat_reg_no,
        easypay_number: record.easypay_number,
        account_status_code: record.account_status_code,
        account_status_description: record.account_status_description,
        account_type_code: record.account_type_code,
        account_type_description: record.account_type_description,
        sub_account_type_code: record.sub_account_type_code,
        sub_account_type_description: record.sub_account_type_description,
        owner_type_code: record.owner_type_code,
        owner_type_description: record.owner_type_description,
        group_account_number: record.group_account_number,
        date_opened: record.date_opened !== "N/A" ? record.date_opened : null,
        ward_code: record.ward_code,
        ward_description: record.ward_description,
        street_name: record.street_name,
        street_number: record.street_number,
        property_category_code: record.property_category_code,
        property_category_description: record.property_category_description,
        usage_code: record.usage_code,
        usage_desc: record.usage_desc,
        market_value:
          record.market_value !== "N/A" ? record.market_value : null,
        outstanding_balance:
          record.outstanding_balance !== "N/A"
            ? record.outstanding_balance
            : null,
        last_payment_amount:
          record.last_payment_amount !== "N/A"
            ? record.last_payment_amount
            : null,
        last_payment_date:
          record.last_payment_date !== "N/A" ? record.last_payment_date : null,
        indigent_yn: record.indigent_yn,
        indigent_exp_date:
          record.indigent_exp_date !== "N/A" ? record.indigent_exp_date : null,
        pensioner_yn: record.pensioner_yn,
        batch_id: batchId,
        // Set risk level based on outstanding balance
        risk_level: determineRiskLevel(record.outstanding_balance),
      }));

      const { error } = await supabase.from("Debtors").insert(debtorRecords);

      if (error) {
        errors.push(
          `Error inserting batch ${i / batchSize + 1}: ${error.message}`
        );
      } else {
        successCount += batch.length;
      }

      // Report progress if callback is provided
      if (onProgress) {
        onProgress(Math.min(i + batchSize, totalRecords), totalRecords);
      }

      // Add a small delay between batches to prevent overwhelming the server
      if (i + batchSize < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(`Unexpected error: ${errorMessage}`);
    return {
      success: false,
      count: successCount,
      errors,
    };
  }
}

/**
 * Resume inserting records from a specific offset
 */
export async function resumeDebtorsUpload(
  records: AccountRecord[],
  batchId: string,
  startOffset: number = 0,
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    // Skip records that have already been processed
    const remainingRecords = records.slice(startOffset);
    console.log(
      `Resuming upload from offset ${startOffset}. Processing ${remainingRecords.length} remaining records.`
    );

    // Process records in smaller batches to avoid hitting request size limits
    const batchSize = 25; // Even smaller batch size for resuming
    const totalRecords = remainingRecords.length;

    for (let i = 0; i < remainingRecords.length; i += batchSize) {
      const batch = remainingRecords.slice(i, i + batchSize);

      // Map AccountRecord fields to database fields
      const debtorRecords = batch.map((record) => ({
        acc_number: record.acc_number,
        acc_holder: record.acc_holder,
        surname_company_trust: record.surname_company_trust,
        name: record.name,
        initials: record.initials,
        street_addr: record.street_addr,
        post_addr_1: record.post_addr_1,
        post_addr_2: record.post_addr_2,
        post_addr_3: record.post_addr_3,
        post_code: record.post_code,
        work_addr_1: record.work_addr_1,
        work_addr_2: record.work_addr_2,
        home_tel: record.home_tel,
        work_tel: record.work_tel,
        cell_number: record.cell_number,
        cell_number2: record.cell_number2,
        id_number_1: record.id_number_1,
        id_number_2: record.id_number_2,
        email_addr_1: record.email_addr_1,
        email_addr_2: record.email_addr_2,
        vat_reg_no: record.vat_reg_no,
        easypay_number: record.easypay_number,
        account_status_code: record.account_status_code,
        account_status_description: record.account_status_description,
        account_type_code: record.account_type_code,
        account_type_description: record.account_type_description,
        sub_account_type_code: record.sub_account_type_code,
        sub_account_type_description: record.sub_account_type_description,
        owner_type_code: record.owner_type_code,
        owner_type_description: record.owner_type_description,
        group_account_number: record.group_account_number,
        date_opened: record.date_opened !== "N/A" ? record.date_opened : null,
        ward_code: record.ward_code,
        ward_description: record.ward_description,
        street_name: record.street_name,
        street_number: record.street_number,
        property_category_code: record.property_category_code,
        property_category_description: record.property_category_description,
        usage_code: record.usage_code,
        usage_desc: record.usage_desc,
        market_value:
          record.market_value !== "N/A" ? record.market_value : null,
        outstanding_balance:
          record.outstanding_balance !== "N/A"
            ? record.outstanding_balance
            : null,
        last_payment_amount:
          record.last_payment_amount !== "N/A"
            ? record.last_payment_amount
            : null,
        last_payment_date:
          record.last_payment_date !== "N/A" ? record.last_payment_date : null,
        indigent_yn: record.indigent_yn,
        indigent_exp_date:
          record.indigent_exp_date !== "N/A" ? record.indigent_exp_date : null,
        pensioner_yn: record.pensioner_yn,
        batch_id: batchId,
        // Set risk level based on outstanding balance
        risk_level: determineRiskLevel(record.outstanding_balance),
      }));

      const { error } = await supabase.from("Debtors").insert(debtorRecords);

      if (error) {
        errors.push(
          `Error inserting batch ${i / batchSize + 1}: ${error.message}`
        );
        console.error(`Error inserting batch: ${error.message}`);
      } else {
        successCount += batch.length;
        console.log(
          `Successfully inserted batch ${
            i / batchSize + 1
          }. Total success: ${successCount}`
        );
      }

      // Report progress if callback is provided
      if (onProgress) {
        const totalProcessed =
          startOffset + Math.min(i + batchSize, totalRecords);
        onProgress(totalProcessed, startOffset + totalRecords);
      }

      // Add a longer delay between batches to prevent overwhelming the server
      if (i + batchSize < remainingRecords.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Update the batch status with the total count (including previously uploaded)
    const totalCount = startOffset + successCount;
    await updateBatchStatus(
      batchId,
      errors.length === 0 ? "completed" : "processing",
      totalCount
    );

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(`Unexpected error: ${errorMessage}`);
    console.error(`Unexpected error during resume: ${errorMessage}`);
    return {
      success: false,
      count: successCount,
      errors,
    };
  }
}

/**
 * Get current upload status for a batch
 */
export async function getBatchUploadStatus(batchId: string) {
  try {
    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from("Batches")
      .select("*")
      .eq("id", batchId)
      .single();

    if (batchError) {
      console.error("Error fetching batch:", batchError);
      return { success: false, error: batchError.message };
    }

    // Count records for this batch
    const { count, error: countError } = await supabase
      .from("Debtors")
      .select("*", { count: "exact" })
      .eq("batch_id", batchId);

    if (countError) {
      console.error("Error counting records:", countError);
      return { success: false, error: countError.message };
    }

    return {
      success: true,
      batch,
      recordCount: count,
      isComplete: batch.status === "completed",
      error: null,
    };
  } catch (error) {
    console.error("Error getting batch status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Determine risk level based on outstanding balance
 */
function determineRiskLevel(
  outstandingBalance: string | number
): "low" | "medium" | "high" {
  if (outstandingBalance === "N/A") {
    return "medium";
  }

  const balance =
    typeof outstandingBalance === "string"
      ? parseFloat(outstandingBalance)
      : outstandingBalance;

  if (isNaN(balance)) {
    return "medium";
  }

  if (balance < 5000) {
    return "low";
  } else if (balance < 20000) {
    return "medium";
  } else {
    return "high";
  }
}

/**
 * Get all debtors with pagination
 */
export async function getDebtors(
  page = 1,
  pageSize = 20,
  searchTerm = "",
  filters: Record<string, any> = {}
) {
  try {
    let query = supabase.from("Debtors").select("*", { count: "exact" });

    // Apply search term if provided
    if (searchTerm) {
      query = query.or(
        `name.ilike.%${searchTerm}%,surname_company_trust.ilike.%${searchTerm}%,acc_number.ilike.%${searchTerm}%`
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query = query.eq(key, value);
      }
    });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching debtors:", error);
      return { data: [], count: 0, error: error.message };
    }

    return { data, count, error: null };
  } catch (error) {
    console.error("Error fetching debtors:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { data: [], count: 0, error: errorMessage };
  }
}

/**
 * Get a single debtor by ID
 */
export async function getDebtorById(id: string) {
  try {
    const { data, error } = await supabase
      .from("Debtors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching debtor:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching debtor:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: errorMessage };
  }
}

/**
 * Get debtors by batch ID
 */
export async function getDebtorsByBatch(
  batchId: string,
  page = 1,
  pageSize = 20
) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("Debtors")
      .select("*", { count: "exact" })
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching debtors by batch:", error);
      return { data: [], count: 0, error: error.message };
    }

    return { data, count, error: null };
  } catch (error) {
    console.error("Error fetching debtors by batch:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { data: [], count: 0, error: errorMessage };
  }
}

/**
 * Get all batches
 */
export async function getBatches() {
  try {
    const { data, error } = await supabase
      .from("Batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching batches:", error);
      return { data: [], error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching batches:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { data: [], error: errorMessage };
  }
}

/**
 * Delete a batch and all associated debtors
 */
export async function deleteBatch(batchId: string) {
  try {
    // First delete all debtors associated with the batch
    const { error: debtorsError } = await supabase
      .from("Debtors")
      .delete()
      .eq("batch_id", batchId);

    if (debtorsError) {
      console.error("Error deleting debtors:", debtorsError);
      return { success: false, error: debtorsError.message };
    }

    // Then delete the batch itself
    const { error: batchError } = await supabase
      .from("Batches")
      .delete()
      .eq("id", batchId);

    if (batchError) {
      console.error("Error deleting batch:", batchError);
      return { success: false, error: batchError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting batch:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
