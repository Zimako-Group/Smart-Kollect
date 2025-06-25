import { supabase } from './supabaseClient';

// Note: These packages need to be installed:
// npm install xlsx file-saver
// We'll use dynamic imports to avoid SSR issues
type XLSXType = typeof import('xlsx');
type SaveAsType = (blob: Blob, filename: string) => void;

/**
 * Generate a payment analysis report from the payment_records table
 * @param startDate Optional start date for filtering (YYYY-MM-DD)
 * @param endDate Optional end date for filtering (YYYY-MM-DD)
 * @returns Promise with the generated report data
 */
export async function generatePaymentAnalysisReport(startDate?: string, endDate?: string) {
  try {
    console.log('Generating payment analysis report...');
    
    // Build the query
    let query = supabase
      .from('payment_records')
      .select(`
        id,
        account_number,
        account_holder_name,
        account_status,
        outstanding_balance_total,
        amount,
        processing_status,
        processed_at,
        created_at
      `)
      .order('created_at', { ascending: false });
    
    // Apply date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching payment records:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No payment records found for the specified criteria');
    }
    
    console.log(`Found ${data.length} payment records for report`);
    
    // Process the data for the report
    const reportData = data.map(record => ({
      Account_Number: record.account_number,
      Account_Holder: record.account_holder_name || 'N/A',
      Account_Status: record.account_status || 'N/A',
      Outstanding_Balance: record.outstanding_balance_total || '0',
      Payment_Amount: record.amount || '0',
      Processing_Status: record.processing_status || 'N/A',
      Processed_Date: record.processed_at ? new Date(record.processed_at).toLocaleDateString() : 'N/A',
      Created_Date: record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'
    }));
    
    return {
      data: reportData,
      totalRecords: reportData.length,
      generatedAt: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Report generation error:', error);
    throw new Error(`Failed to generate payment analysis report: ${error.message}`);
  }
}

/**
 * Export payment analysis report to Excel
 * @param reportData The report data to export
 * @param fileName Optional filename (defaults to payment_analysis_YYYY-MM-DD)
 */
export async function exportPaymentAnalysisToExcel(reportData: any[], fileName?: string) {
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
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Analysis');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the buffer
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Generate filename if not provided
    const defaultFileName = `payment_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    
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
 * Calculate payment statistics from report data
 * @param reportData The report data to analyze
 * @returns Object with payment statistics
 */
export function calculatePaymentStatistics(reportData: any[]) {
  try {
    // Initialize statistics
    const stats = {
      totalRecords: reportData.length,
      totalPaymentAmount: 0,
      averagePaymentAmount: 0,
      totalOutstandingBalance: 0,
      averageOutstandingBalance: 0,
      processingStatusCounts: {
        pending: 0,
        processed: 0,
        failed: 0,
        skipped: 0
      },
      accountStatusCounts: {} as Record<string, number>
    };
    
    // Process each record
    reportData.forEach(record => {
      // Sum payment amounts (convert to number)
      const paymentAmount = typeof record.Payment_Amount === 'string' 
        ? parseFloat(record.Payment_Amount) 
        : (record.Payment_Amount || 0);
      
      stats.totalPaymentAmount += Math.abs(paymentAmount); // Use absolute value for totals
      
      // Sum outstanding balances (convert to number)
      const outstandingBalance = typeof record.Outstanding_Balance === 'string'
        ? parseFloat(record.Outstanding_Balance)
        : (record.Outstanding_Balance || 0);
      
      stats.totalOutstandingBalance += outstandingBalance;
      
      // Count processing statuses
      const status = record.Processing_Status?.toLowerCase();
      if (status === 'pending') stats.processingStatusCounts.pending++;
      else if (status === 'processed') stats.processingStatusCounts.processed++;
      else if (status === 'failed') stats.processingStatusCounts.failed++;
      else if (status === 'skipped') stats.processingStatusCounts.skipped++;
      
      // Count account statuses
      const accountStatus = record.Account_Status || 'Unknown';
      stats.accountStatusCounts[accountStatus] = (stats.accountStatusCounts[accountStatus] || 0) + 1;
    });
    
    // Calculate averages
    stats.averagePaymentAmount = stats.totalRecords > 0 
      ? stats.totalPaymentAmount / stats.totalRecords 
      : 0;
      
    stats.averageOutstandingBalance = stats.totalRecords > 0
      ? stats.totalOutstandingBalance / stats.totalRecords
      : 0;
    
    return stats;
  } catch (error: any) {
    console.error('Error calculating payment statistics:', error);
    throw new Error(`Failed to calculate payment statistics: ${error.message}`);
  }
}
