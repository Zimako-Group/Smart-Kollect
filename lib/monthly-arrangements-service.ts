import { supabase, supabaseAdmin } from './supabaseClient';
import { ManualPTP } from './manual-ptp-service';

/**
 * Get agent name from user ID
 * @param userId User ID to look up
 * @returns Promise with the agent's name
 */
async function getAgentName(userId: string | null): Promise<string> {
  if (!userId) {
    console.log('getAgentName called with null/undefined userId, returning "System"');
    return 'System';
  }
  
  console.log(`🔍 Looking up agent name for user ID: ${userId}`);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error(`❌ Error fetching agent name for ${userId}:`, error);
      return 'Unknown';
    }
    
    if (!data) {
      console.log(`❌ No profile found for user ID: ${userId}`);
      return 'Unknown';
    }
    
    console.log(`📋 Raw profile data for ${userId}:`, JSON.stringify(data, null, 2));
    
    let agentName = data.full_name;
    if (!agentName && data.email) {
      // Fallback to email username if full_name is not available
      agentName = data.email.split('@')[0];
      console.log(`📧 Using email fallback for ${userId}: ${agentName}`);
    }
    
    // Clean up the name by removing extra spaces
    const finalName = agentName ? agentName.replace(/\s+/g, ' ').trim() : 'Unknown';
    console.log(`✅ Resolved agent name for ${userId}: "${finalName}"`);
    return finalName;
  } catch (error) {
    console.error(`💥 Exception in getAgentName for ${userId}:`, error);
    return 'Unknown';
  }
}

/**
 * Test function to debug agent name extraction
 * @param userId User ID to test
 * @returns Promise with test results
 */
export async function testAgentNameExtraction(userId: string) {
  console.log(`🧪 Testing agent name extraction for: ${userId}`);
  const result = await getAgentName(userId);
  console.log(`🧪 Test result: "${result}"`);
  return result;
}

/**
 * Get debtor information from debtor ID
 * @param debtorId Debtor ID to look up
 * @returns Promise with the debtor's account number and name
 */
async function getDebtorInfo(debtorId: string): Promise<{ accountNumber: string; name: string }> {
  if (!debtorId) {
    return { accountNumber: 'N/A', name: 'N/A' };
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('Debtors')
      .select('acc_number, name, surname_company_trust, acc_holder')
      .eq('id', debtorId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching debtor info:', error);
      return { accountNumber: 'Unknown', name: 'Unknown' };
    }
    
    if (!data) {
      return { accountNumber: 'Unknown', name: 'Unknown' };
    }
    
    const accountNumber = data.acc_number || 'N/A';
    // Use acc_holder if available, otherwise combine name and surname
    const name = data.acc_holder || `${data.name || ''} ${data.surname_company_trust || ''}`.trim() || 'N/A';
    
    return { accountNumber, name };
  } catch (error) {
    console.error('Error in getDebtorInfo:', error);
    return { accountNumber: 'Unknown', name: 'Unknown' };
  }
}

/**
 * Generate a monthly arrangements report from ManualPTP, PTP, and Settlements tables
 * @param month Month to filter by (1-12)
 * @param year Year to filter by (e.g., 2025)
 * @returns Promise with the combined report data
 */
export async function generateMonthlyArrangementsReport(month?: number, year?: number) {
  try {
    console.log('Generating monthly arrangements report...');
    
    // Default to current month if not specified
    const currentDate = new Date();
    const reportMonth = month || currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const reportYear = year || currentDate.getFullYear();
    
    // Calculate the start and end dates for the specified month
    const startDate = new Date(reportYear, reportMonth - 1, 1); // First day of month
    const endDate = new Date(reportYear, reportMonth, 0); // Last day of month
    
    // Format dates for query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`Fetching arrangements for period: ${startDateStr} to ${endDateStr}`);
    
    // 1. Query the ManualPTP table for arrangements in the specified month
    const { data: manualPTPData, error: manualPTPError } = await supabaseAdmin
      .from('ManualPTP')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });
    
    if (manualPTPError) {
      console.error('Error fetching manual PTP arrangements:', manualPTPError);
      throw new Error(`Failed to generate report: ${manualPTPError.message}`);
    }
    
    // 2. Query the PTP table for arrangements in the specified month
    const { data: ptpData, error: ptpError } = await supabaseAdmin
      .from('PTP')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });
    
    if (ptpError) {
      console.error('Error fetching PTP arrangements:', ptpError);
      throw new Error(`Failed to generate report: ${ptpError.message}`);
    }
    
    // 3. Query the Settlements table for settlements in the specified month
    const { data: settlementsData, error: settlementsError } = await supabaseAdmin
      .from('Settlements')
      .select('*')
      .gte('created_at', `${startDateStr}T00:00:00.000Z`)
      .lte('created_at', `${endDateStr}T23:59:59.999Z`)
      .order('created_at', { ascending: true });
    
    if (settlementsError) {
      console.error('Error fetching Settlements:', settlementsError);
      throw new Error(`Failed to generate report: ${settlementsError.message}`);
    }
    
    // Combine the data from all three tables
    const manualPTPCount = manualPTPData?.length || 0;
    const ptpCount = ptpData?.length || 0;
    const settlementsCount = settlementsData?.length || 0;
    const totalCount = manualPTPCount + ptpCount + settlementsCount;
    
    console.log(`Found ${manualPTPCount} manual PTP arrangements, ${ptpCount} PTP arrangements, and ${settlementsCount} settlements for the report`);
    
    if (totalCount === 0) {
      console.log('No arrangements found for the specified period');
      return {
        data: [],
        totalRecords: 0,
        generatedAt: new Date().toISOString(),
        period: {
          month: reportMonth,
          year: reportYear,
          startDate: startDateStr,
          endDate: endDateStr
        }
      };
    }
    
    // Process the data for the report - include all fields exactly as they are in the database
    // We'll need to fetch agent names and debtor information
    const reportData = [];
    
    // Collect all unique user IDs from all tables
    const allUserIds = new Set<string>();
    
    manualPTPData?.forEach(record => {
      if (record.created_by) allUserIds.add(record.created_by);
    });
    
    ptpData?.forEach(record => {
      if (record.created_by) allUserIds.add(record.created_by);
    });
    
    // Fetch all agent names in one query
    console.log(`🔍 Fetching agent names for ${allUserIds.size} unique users...`);
    const agentNameCache = new Map<string, string>();
    
    if (allUserIds.size > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', Array.from(allUserIds));
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        profilesData?.forEach(profile => {
          let agentName = 'Unknown';
          if (profile.full_name) {
            agentName = profile.full_name.replace(/\s+/g, ' ').trim();
          } else if (profile.email) {
            agentName = profile.email.split('@')[0];
          }
          agentNameCache.set(profile.id, agentName);
          console.log(`📋 Cached agent name for ${profile.id}: "${agentName}"`);
        });
      }
    }
    
    // Helper function to get cached agent name
    const getCachedAgentName = (userId: string | null): string => {
      if (!userId) return 'System';
      return agentNameCache.get(userId) || 'Unknown';
    };
    
    // Process ManualPTP records
    if (manualPTPData && manualPTPData.length > 0) {
      console.log(`Processing ${manualPTPData.length} ManualPTP records...`);
      
      for (const record of manualPTPData) {
        try {
          console.log(`Processing ManualPTP record ${record.id} with created_by: ${record.created_by}`);
          
          // Get agent name from cache
          const agentName = getCachedAgentName(record.created_by);
          console.log(`✅ Agent name resolved to: "${agentName}"`);
          
          // Get debtor information
          const debtorInfo = await getDebtorInfo(record.debtor_id);
          
          reportData.push({
            id: record.id,
            source: 'ManualPTP', // Indicate the source table
            account_number: debtorInfo.accountNumber,
            customer_name: debtorInfo.name,
            debtor_id: record.debtor_id,
            amount: record.amount,
            date: record.date,
            payment_method: record.payment_method,
            notes: record.notes || '',
            status: record.status,
            created_by: agentName,
            created_by_id: record.created_by || null,
            created_at: record.created_at,
            updated_at: record.updated_at,
            sms_sent: record.sms_sent !== undefined ? record.sms_sent : null
          });
        } catch (error) {
          console.error(`Error processing ManualPTP record ${record.id}:`, error);
          // Still add the record but with fallback values
          reportData.push({
            id: record.id,
            source: 'ManualPTP',
            account_number: 'Error',
            customer_name: 'Error',
            debtor_id: record.debtor_id,
            amount: record.amount,
            date: record.date,
            payment_method: record.payment_method,
            notes: record.notes || '',
            status: record.status,
            created_by: 'Error Loading',
            created_by_id: record.created_by || null,
            created_at: record.created_at,
            updated_at: record.updated_at,
            sms_sent: record.sms_sent !== undefined ? record.sms_sent : null
          });
        }
      }
      
      console.log(`Completed processing ManualPTP records`);
    }
    
    // Process PTP records
    if (ptpData && ptpData.length > 0) {
      console.log(`Processing ${ptpData.length} PTP records...`);
      
      for (const record of ptpData) {
        try {
          console.log(`Processing PTP record ${record.id} with created_by: ${record.created_by}`);
          
          // Get agent name from cache
          const agentName = getCachedAgentName(record.created_by);
          console.log(`✅ Agent name resolved to: "${agentName}"`);
          
          // Get debtor information
          const debtorInfo = await getDebtorInfo(record.debtor_id);
          
          reportData.push({
            id: record.id,
            source: 'PTP', // Indicate the source table
            account_number: debtorInfo.accountNumber,
            customer_name: debtorInfo.name,
            debtor_id: record.debtor_id,
            amount: record.amount,
            date: record.date,
            payment_method: record.payment_method,
            notes: record.notes || '',
            status: record.status,
            created_by: agentName,
            created_by_id: record.created_by || null,
            created_at: record.created_at,
            updated_at: record.updated_at,
            sms_sent: null // PTP table doesn't have sms_sent field
          });
        } catch (error) {
          console.error(`Error processing PTP record ${record.id}:`, error);
          // Still add the record but with fallback values
          reportData.push({
            id: record.id,
            source: 'PTP',
            account_number: 'Error',
            customer_name: 'Error',
            debtor_id: record.debtor_id,
            amount: record.amount,
            date: record.date,
            payment_method: record.payment_method,
            notes: record.notes || '',
            status: record.status,
            created_by: 'Error Loading',
            created_by_id: record.created_by || null,
            created_at: record.created_at,
            updated_at: record.updated_at,
            sms_sent: null
          });
        }
      }
      
      console.log(`Completed processing PTP records`);
    }
    
    // Process Settlements records
    if (settlementsData && settlementsData.length > 0) {
      console.log(`Processing ${settlementsData.length} Settlement records...`);
      
      for (const record of settlementsData) {
        // Settlements already have agent_name and customer info directly in the table
        reportData.push({
          id: record.id,
          source: 'Settlement', // Indicate the source table
          account_number: record.account_number || 'N/A',
          customer_name: record.customer_name || 'N/A',
          debtor_id: record.customer_id || null,
          amount: record.settlement_amount,
          original_amount: record.original_amount,
          discount_percentage: record.discount_percentage,
          date: record.created_at ? new Date(record.created_at).toISOString().split('T')[0] : null,
          expiry_date: record.expiry_date,
          payment_method: 'Settlement',
          notes: record.description || '',
          status: record.status,
          created_by: record.agent_name || 'Unknown',
          created_by_id: null, // Settlements table doesn't store created_by ID
          created_at: record.created_at,
          updated_at: null, // Settlements table doesn't have updated_at
          sms_sent: null // Settlements table doesn't have sms_sent field
        });
      }
      
      console.log(`Completed processing Settlement records`);
    }
    
    // Log a sample of the final report data to verify agent names are resolved
    console.log('Sample of final report data:');
    console.log(JSON.stringify(reportData.slice(0, 3), null, 2));
    
    return {
      data: reportData,
      totalRecords: reportData.length,
      generatedAt: new Date().toISOString(),
      period: {
        month: reportMonth,
        year: reportYear,
        startDate: startDateStr,
        endDate: endDateStr
      }
    };
  } catch (error: any) {
    console.error('Report generation error:', error);
    throw new Error(`Failed to generate monthly arrangements report: ${error.message}`);
  }
}

/**
 * Export monthly arrangements report to Excel
 * @param reportData The report data to export
 * @param period Period information for the report
 * @param fileName Optional filename (defaults to monthly_arrangements_YYYY-MM)
 */
export async function exportMonthlyArrangementsToExcel(
  reportData: any[], 
  period: { month: number; year: number },
  fileName?: string
) {
  try {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (!isBrowser) {
      throw new Error('Excel export is only available in browser environments');
    }
    
    // Dynamically import the required libraries
    const XLSX = await import('xlsx');
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    
    // Auto-size columns
    const colWidths = reportData.reduce((widths: Record<string, number>, row: any) => {
      Object.keys(row).forEach(key => {
        const value = String(row[key] || '');
        widths[key] = Math.max(widths[key] || 10, Math.min(50, value.length + 2));
      });
      return widths;
    }, {});
    
    worksheet['!cols'] = Object.keys(colWidths).map(key => ({ wch: colWidths[key] }));
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    
    // Get month name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[period.month - 1];
    
    // Add sheet with month and year in the name
    XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${period.year}`);
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the buffer
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Generate filename if not provided
    const defaultFileName = `monthly_arrangements_${period.year}-${period.month.toString().padStart(2, '0')}.xlsx`;
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || defaultFileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error: any) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Failed to export report to Excel: ${error.message}`);
  }
}

/**
 * Calculate statistics for monthly arrangements
 * @param reportData The report data to analyze
 * @returns Object with arrangement statistics
 */
export function calculateArrangementStatistics(reportData: any[]) {
  try {
    // Initialize statistics
    const stats = {
      totalRecords: reportData.length,
      totalArrangementAmount: 0,
      averageArrangementAmount: 0,
      statusCounts: {
        pending: 0,
        paid: 0,
        defaulted: 0
      },
      paymentMethodCounts: {
        cash: 0,
        eft: 0,
        easypay: 0,
        other: 0
      },
      smsSentCount: 0
    };
    
    // Process each record
    reportData.forEach(record => {
      // Sum arrangement amounts
      const arrangementAmount = typeof record.amount === 'string' 
        ? parseFloat(record.amount) 
        : (record.amount || 0);
      
      stats.totalArrangementAmount += arrangementAmount;
      
      // Count statuses
      const status = record.status?.toLowerCase();
      if (status === 'pending') stats.statusCounts.pending++;
      else if (status === 'paid') stats.statusCounts.paid++;
      else if (status === 'defaulted') stats.statusCounts.defaulted++;
      
      // Count payment methods
      const paymentMethod = record.payment_method?.toLowerCase();
      if (paymentMethod === 'cash') stats.paymentMethodCounts.cash++;
      else if (paymentMethod === 'eft') stats.paymentMethodCounts.eft++;
      else if (paymentMethod === 'easypay') stats.paymentMethodCounts.easypay++;
      else stats.paymentMethodCounts.other++;
      
      // Count SMS sent
      if (record.sms_sent) stats.smsSentCount++;
    });
    
    // Calculate averages
    stats.averageArrangementAmount = stats.totalRecords > 0 
      ? stats.totalArrangementAmount / stats.totalRecords 
      : 0;
    
    return stats;
  } catch (error: any) {
    console.error('Error calculating arrangement statistics:', error);
    throw new Error(`Failed to calculate arrangement statistics: ${error.message}`);
  }
}
