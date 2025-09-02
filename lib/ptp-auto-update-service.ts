import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * Service for handling automatic PTP status updates when payments are processed
 */

export interface PTPUpdateResult {
  updatedPTPs: number;
  updatedManualPTPs: number;
  errors: string[];
}

/**
 * Manually trigger PTP status updates for a specific debtor
 * This can be used as a fallback or for testing purposes
 */
export async function manuallyUpdatePTPStatus(
  debtorId: string,
  paymentAmount: number,
  paymentDate: string
): Promise<PTPUpdateResult> {
  const result: PTPUpdateResult = {
    updatedPTPs: 0,
    updatedManualPTPs: 0,
    errors: []
  };

  try {
    console.log(`Manually updating PTP status for debtor ${debtorId}, amount: ${paymentAmount}, date: ${paymentDate}`);

    // Update regular PTPs
    const { data: updatedPTPs, error: ptpError } = await supabaseAdmin
      .from('PTP')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('debtor_id', debtorId)
      .in('status', ['pending', 'defaulted'])
      .lte('date', paymentDate)
      .lte('amount', paymentAmount)
      .select('id');

    if (ptpError) {
      result.errors.push(`Error updating PTPs: ${ptpError.message}`);
    } else {
      result.updatedPTPs = updatedPTPs?.length || 0;
      console.log(`Updated ${result.updatedPTPs} regular PTPs`);
    }

    // Update manual PTPs
    const { data: updatedManualPTPs, error: manualPtpError } = await supabaseAdmin
      .from('ManualPTP')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('debtor_id', debtorId)
      .in('status', ['pending', 'defaulted'])
      .lte('date', paymentDate)
      .lte('amount', paymentAmount)
      .select('id');

    if (manualPtpError) {
      result.errors.push(`Error updating Manual PTPs: ${manualPtpError.message}`);
    } else {
      result.updatedManualPTPs = updatedManualPTPs?.length || 0;
      console.log(`Updated ${result.updatedManualPTPs} manual PTPs`);
    }

  } catch (error: any) {
    console.error('Error in manuallyUpdatePTPStatus:', error);
    result.errors.push(`Unexpected error: ${error.message}`);
  }

  return result;
}

/**
 * Get PTPs that would be affected by a payment
 * Useful for preview/confirmation before processing
 */
export async function getPTPsAffectedByPayment(
  debtorId: string,
  paymentAmount: number,
  paymentDate: string
): Promise<{
  regularPTPs: any[];
  manualPTPs: any[];
}> {
  try {
    // Get regular PTPs that would be updated
    const { data: regularPTPs, error: ptpError } = await supabaseAdmin
      .from('PTP')
      .select('id, amount, date, status, notes')
      .eq('debtor_id', debtorId)
      .in('status', ['pending', 'defaulted'])
      .lte('date', paymentDate)
      .lte('amount', paymentAmount);

    if (ptpError) {
      console.error('Error fetching regular PTPs:', ptpError);
    }

    // Get manual PTPs that would be updated
    const { data: manualPTPs, error: manualPtpError } = await supabaseAdmin
      .from('ManualPTP')
      .select('id, amount, date, status, notes')
      .eq('debtor_id', debtorId)
      .in('status', ['pending', 'defaulted'])
      .lte('date', paymentDate)
      .lte('amount', paymentAmount);

    if (manualPtpError) {
      console.error('Error fetching manual PTPs:', manualPtpError);
    }

    return {
      regularPTPs: regularPTPs || [],
      manualPTPs: manualPTPs || []
    };

  } catch (error: any) {
    console.error('Error in getPTPsAffectedByPayment:', error);
    return {
      regularPTPs: [],
      manualPTPs: []
    };
  }
}

/**
 * Bulk update PTP statuses for multiple debtors
 * Useful when processing large payment files
 */
export async function bulkUpdatePTPStatuses(
  paymentRecords: Array<{
    debtorId: string;
    paymentAmount: number;
    paymentDate: string;
  }>
): Promise<{
  totalUpdatedPTPs: number;
  totalUpdatedManualPTPs: number;
  processedRecords: number;
  errors: string[];
}> {
  const result = {
    totalUpdatedPTPs: 0,
    totalUpdatedManualPTPs: 0,
    processedRecords: 0,
    errors: [] as string[]
  };

  console.log(`Processing bulk PTP updates for ${paymentRecords.length} payment records`);

  for (const record of paymentRecords) {
    try {
      const updateResult = await manuallyUpdatePTPStatus(
        record.debtorId,
        record.paymentAmount,
        record.paymentDate
      );

      result.totalUpdatedPTPs += updateResult.updatedPTPs;
      result.totalUpdatedManualPTPs += updateResult.updatedManualPTPs;
      result.processedRecords++;

      if (updateResult.errors.length > 0) {
        result.errors.push(...updateResult.errors.map(err => 
          `Debtor ${record.debtorId}: ${err}`
        ));
      }

    } catch (error: any) {
      result.errors.push(`Debtor ${record.debtorId}: ${error.message}`);
    }
  }

  console.log(`Bulk update completed: ${result.totalUpdatedPTPs} PTPs, ${result.totalUpdatedManualPTPs} Manual PTPs updated`);
  return result;
}

/**
 * Get statistics about automatic PTP updates
 */
export async function getPTPUpdateStats(tenantId?: string): Promise<{
  totalPTPs: number;
  paidPTPs: number;
  pendingPTPs: number;
  defaultedPTPs: number;
  autoUpdatedToday: number;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Build query conditions
    let ptpQuery = supabaseAdmin.from('PTP').select('status, updated_at');
    let manualPtpQuery = supabaseAdmin.from('ManualPTP').select('status, updated_at');
    
    if (tenantId) {
      ptpQuery = ptpQuery.eq('tenant_id', tenantId);
      manualPtpQuery = manualPtpQuery.eq('tenant_id', tenantId);
    }

    const [ptpResult, manualPtpResult] = await Promise.all([
      ptpQuery,
      manualPtpQuery
    ]);

    const allPTPs = [
      ...(ptpResult.data || []),
      ...(manualPtpResult.data || [])
    ];

    const stats = {
      totalPTPs: allPTPs.length,
      paidPTPs: allPTPs.filter(ptp => ptp.status === 'paid').length,
      pendingPTPs: allPTPs.filter(ptp => ptp.status === 'pending').length,
      defaultedPTPs: allPTPs.filter(ptp => ptp.status === 'defaulted').length,
      autoUpdatedToday: allPTPs.filter(ptp => 
        ptp.status === 'paid' && 
        ptp.updated_at && 
        ptp.updated_at.startsWith(today)
      ).length
    };

    return stats;

  } catch (error: any) {
    console.error('Error in getPTPUpdateStats:', error);
    return {
      totalPTPs: 0,
      paidPTPs: 0,
      pendingPTPs: 0,
      defaultedPTPs: 0,
      autoUpdatedToday: 0
    };
  }
}
