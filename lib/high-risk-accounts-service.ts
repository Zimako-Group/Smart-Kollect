import { supabaseAdmin } from './supabaseClient';
// Dynamic import for XLSX to avoid SSR issues
import type * as XLSX from 'xlsx';

/**
 * Helper function to convert date from format '20210629' to '2021/06/29'
 * @param dateString Date string in format YYYYMMDD
 * @returns Formatted date string in YYYY/MM/DD format
 */
function formatDateString(dateString: string): string {
  if (!dateString || dateString.length !== 8) {
    return 'Unknown';
  }
  
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  return `${year}/${month}/${day}`;
}

/**
 * Generate a high risk accounts report from the Debtors table
 * Categorizes accounts based on last payment date:
 * - Low risk: Payment in current month
 * - Medium risk: Payment 1-3 months ago
 * - High risk: Payment more than 3 months ago or no payment
 * @returns Promise with the generated report data
 */
export async function generateHighRiskAccountsReport() {
  try {
    console.log('Generating accounts category risk report...');
    
    // Use pagination to fetch all accounts with outstanding balances
    const PAGE_SIZE = 1000; // Supabase default page size
    let allRecords: any[] = [];
    let page = 0;
    let hasMore = true;
    
    console.log('Fetching accounts using pagination...');
    
    while (hasMore) {
      // Build the query for this page - use supabaseAdmin for better permissions
      console.log('Fetching accounts with payment history data');
      
      let query = supabaseAdmin
        .from('Debtors')
        .select(`
          id,
          acc_number,
          acc_holder,
          surname_company_trust,
          name,
          outstanding_balance,
          last_payment_date,
          last_payment_amount,
          cellphone_1,
          cellphone_2,
          email_addr_1,
          email_addr_2,
          street_addr,
          post_addr_1,
          post_addr_2,
          post_code,
          status,
          created_at,
          updated_at
        `)
        .not('outstanding_balance', 'is', null) // Only accounts with a balance
        .order('outstanding_balance', { ascending: false }) // Highest outstanding balance first
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      // Execute the query for this page
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching accounts (page ${page + 1}):`, error);
        throw new Error(`Failed to generate report: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        // No more data, exit the loop
        hasMore = false;
      } else {
        // Add the records from this page to our collection
        allRecords = [...allRecords, ...data];
        console.log(`Fetched page ${page + 1}, got ${data.length} records, total so far: ${allRecords.length}`);
        
        // Debug: Log sample of payment dates from first page
        if (page === 0 && data.length > 0) {
          console.log('=== SAMPLE PAYMENT DATES FROM DATABASE ===');
          data.slice(0, 5).forEach(record => {
            console.log(`Account ${record.acc_number}: last_payment_date = ${record.last_payment_date}, outstanding_balance = ${record.outstanding_balance}`);
          });
          console.log('=== END SAMPLE ===');
        }
        
        // Check if we got a full page of results
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          // Move to the next page
          page++;
        }
      }
    }
    
    if (allRecords.length === 0) {
      console.log('No accounts found');
      return {
        data: [],
        totalRecords: 0,
        generatedAt: new Date().toISOString()
      };
    }
    
    console.log(`Successfully fetched all ${allRecords.length} accounts for risk categorization`);
    
    // Process the data for the report
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const reportData = allRecords.map(record => {
      // Determine risk level based on last payment date
      let riskLevel = 'high';
      let daysWithoutPayment = 'Unknown';
      
      if (record.last_payment_date) {
        const lastPaymentDate = new Date(record.last_payment_date);
        
        // Validate date parsing
        if (isNaN(lastPaymentDate.getTime())) {
          console.warn(`Invalid date format for account ${record.acc_number}: ${record.last_payment_date}`);
          riskLevel = 'high';
          daysWithoutPayment = 'Invalid date format';
        } else {
          // Calculate days since last payment
          const diffTime = Math.abs(today.getTime() - lastPaymentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysWithoutPayment = diffDays.toString();
          
          // Categorize based on days since last payment (more accurate than months)
          if (diffDays <= 30) {
            // Payment within last 30 days (current month)
            riskLevel = 'low';
          } else if (diffDays > 30 && diffDays <= 90) {
            // Payment 1-3 months ago (31-90 days)
            riskLevel = 'medium';
          } else {
            // Payment more than 90 days ago
            riskLevel = 'high';
          }
          
          // Only log first few accounts to avoid spam
          if (allRecords.indexOf(record) < 5) {
            console.log(`Account ${record.acc_number}: Last payment ${lastPaymentDate.toDateString()}, ${diffDays} days ago, risk: ${riskLevel}`);
          }
        }
      } else {
        // No payment date recorded - highest risk
        riskLevel = 'high';
        daysWithoutPayment = 'No payment recorded';
        if (allRecords.indexOf(record) < 5) {
          console.log(`Account ${record.acc_number}: No payment date, risk: high`);
        }
      }
      
      // Format the record date for display
      const recordDate = record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Unknown';
      
      // We're now using last_payment_date for risk categorization instead of balance
      
      return {
        Account_Number: record.acc_number || 'Unknown',
        Account_Holder: record.acc_holder || 'Unknown',
        Name: record.name || 'Unknown',
        Surname_Company: record.surname_company_trust || 'Unknown',
        Outstanding_Balance: record.outstanding_balance ? 
          `R${parseFloat(record.outstanding_balance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : 
          'Unknown',
        Last_Payment_Date: record.last_payment_date ? new Date(record.last_payment_date).toLocaleDateString() : 'No payment recorded',
        Last_Payment_Amount: record.last_payment_amount ? 
          `R${parseFloat(record.last_payment_amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : 
          'Unknown',
        Risk_Level: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1), // Capitalize first letter
        Days_Without_Payment: daysWithoutPayment,
        Contact_Number: record.cellphone_1 || record.cellphone_2 || 'Unknown',
        Email_Address: record.email_addr_1 || record.email_addr_2 || 'Unknown',
        Address: record.street_addr || record.post_addr_1 || 'Unknown',
        Postal_Code: record.post_code || 'Unknown'
      };
    });
    
    // Count records by risk level
    const riskCounts = {
      high: reportData.filter(record => record.Risk_Level === 'High').length,
      medium: reportData.filter(record => record.Risk_Level === 'Medium').length,
      low: reportData.filter(record => record.Risk_Level === 'Low').length
    };
    
    // Debug: Log sample records from each risk category
    const highRiskSample = reportData.filter(record => record.Risk_Level === 'High').slice(0, 3);
    const mediumRiskSample = reportData.filter(record => record.Risk_Level === 'Medium').slice(0, 3);
    const lowRiskSample = reportData.filter(record => record.Risk_Level === 'Low').slice(0, 3);
    
    console.log('=== RISK CATEGORIZATION SUMMARY ===');
    console.log(`Total accounts processed: ${reportData.length}`);
    console.log(`High risk: ${riskCounts.high} accounts`);
    console.log(`Medium risk: ${riskCounts.medium} accounts`);
    console.log(`Low risk: ${riskCounts.low} accounts`);
    
    if (highRiskSample.length > 0) {
      console.log('High risk sample:', highRiskSample.map(r => `${r.Account_Number} (${r.Days_Without_Payment} days)`));
    }
    if (mediumRiskSample.length > 0) {
      console.log('Medium risk sample:', mediumRiskSample.map(r => `${r.Account_Number} (${r.Days_Without_Payment} days)`));
    }
    if (lowRiskSample.length > 0) {
      console.log('Low risk sample:', lowRiskSample.map(r => `${r.Account_Number} (${r.Days_Without_Payment} days)`));
    }
    
    console.log('=== END SUMMARY ===');
    
    return {
      data: reportData,
      totalRecords: reportData.length,
      riskCounts: riskCounts,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error('Error generating accounts category risk report:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

/**
 * Export high risk accounts report to PDF
 * @param reportData The report data to export
 * @param fileName Optional filename (defaults to high_risk_accounts_YYYY-MM-DD.pdf)
 * @returns Promise indicating success
 */
export async function exportHighRiskAccountsToPDF(reportData: any[], fileName?: string) {
  try {
    // Check for empty data array
    if (!reportData || reportData.length === 0) {
      console.log('No data provided to export to PDF');
      throw new Error('No high risk accounts found');
    }
    
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (!isBrowser) {
      throw new Error('PDF export is only available in browser environments');
    }
    
    // Dynamically import jsPDF and jsPDF-autotable
    const jsPDF = (await import('jspdf')).default;
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title page
    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Accounts Category Risk Report', 105, 40, { align: 'center' });
        
    // Add subtitle
    doc.setFontSize(14);
    doc.text('Accounts with outstanding balances categorized by risk level', 105, 50, { align: 'center' });
        
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 60, { align: 'center' });
        
    // Add second page for summary
    doc.addPage();
        
    // Count records by risk level
    const highRiskCount = reportData.filter(record => record.Risk_Level === 'High').length;
    const mediumRiskCount = reportData.filter(record => record.Risk_Level === 'Medium').length;
    const lowRiskCount = reportData.filter(record => record.Risk_Level === 'Low').length;
        
    
    // Add summary section title
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Summary', 105, 20, { align: 'center' });
    
    // Add summary content with better spacing
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Accounts: ${reportData.length}`, 20, 40);
    doc.text(`High Risk Accounts: ${highRiskCount}`, 20, 50);
    doc.text(`Medium Risk Accounts: ${mediumRiskCount}`, 20, 60);
    doc.text(`Low Risk Accounts: ${lowRiskCount}`, 20, 70);
    
    // Calculate total outstanding balance
    const totalOutstanding = reportData.reduce((sum, record) => {
      const amount = parseFloat(record.Outstanding_Balance.replace('R', '').replace(',', ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Format currency
    const formattedTotal = `R${totalOutstanding.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const averageOutstanding = totalOutstanding / reportData.length;
    const formattedAverage = `R${averageOutstanding.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    
    doc.text(`Total Outstanding Balance: ${formattedTotal}`, 20, 85);
    doc.text(`Average Outstanding Balance: ${formattedAverage}`, 20, 95);
    
    // Add risk categorization explanation
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Risk Categorization Criteria:', 20, 115);
    doc.text('• Low Risk: Payment in current month', 25, 125);
    doc.text('• Medium Risk: Payment 1-3 months ago', 25, 135);
    doc.text('• High Risk: Payment more than 3 months ago or no payment recorded', 25, 145);
    
    // Add accounts table on a new page
    doc.addPage();
    
    // Add table title
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Accounts by Risk Category', 105, 15, { align: 'center' });
    
    // Set up table header
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(44, 62, 80);
    doc.rect(10, 25, 190, 8, 'F');
    
    // Add table headers with better spacing
    doc.text('Account #', 12, 30);
    doc.text('Account Holder', 45, 30);
    doc.text('Balance', 85, 30);
    doc.text('Last Payment Date', 115, 30);
    doc.text('Last Payment', 150, 30);
    doc.text('Risk Level', 175, 30);
    
    // Add table rows
    doc.setTextColor(0, 0, 0);
    let yPos = 40;
    
    // Only show first 100 records to avoid huge PDFs
    const recordsToShow = reportData.slice(0, 100);
    
    recordsToShow.forEach((record, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(10, yPos - 5, 190, 8, 'F');
      }
      
      // Set risk level color
      let riskColor = [0, 0, 0]; // Default black
      if (record.Risk_Level === 'High') {
        riskColor = [192, 57, 43]; // Red
      } else if (record.Risk_Level === 'Medium') {
        riskColor = [243, 156, 18]; // Orange
      } else if (record.Risk_Level === 'Low') {
        riskColor = [39, 174, 96]; // Green
      }
      
      // Add row data with better truncation and spacing
      doc.setFontSize(8); // Smaller font for data
      doc.setTextColor(0, 0, 0);
      
      // Account number
      const accNum = record.Account_Number || 'Unknown';
      doc.text(accNum.length > 10 ? accNum.substring(0, 10) + '...' : accNum, 12, yPos);
      
      // Account holder
      const holder = record.Account_Holder || 'Unknown';
      doc.text(holder.length > 15 ? holder.substring(0, 15) + '...' : holder, 45, yPos);
      
      // Balance
      doc.text(record.Outstanding_Balance || 'Unknown', 85, yPos);
      
      // Last payment date
      doc.text(record.Last_Payment_Date || 'None', 115, yPos);
      
      // Last payment amount
      doc.text(record.Last_Payment_Amount || 'None', 150, yPos);
      
      // Set risk level with color
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.text(record.Risk_Level || 'Unknown', 175, yPos);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Move to next row
      yPos += 8;
      
      // Add new page if needed
      if (yPos > 280) {
        doc.addPage();
        
        // Add table header on new page
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(44, 62, 80);
        doc.rect(10, 15, 190, 8, 'F');
        
        // Add table headers with better spacing
        doc.text('Account #', 12, 20);
        doc.text('Account Holder', 45, 20);
        doc.text('Balance', 85, 20);
        doc.text('Last Payment Date', 115, 20);
        doc.text('Last Payment', 150, 20);
        doc.text('Risk Level', 175, 20);
        
        // Reset position and text color
        doc.setTextColor(0, 0, 0);
        yPos = 30;
      }
    });
    
    // Add note about limited records if needed
    if (reportData.length > 100) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Note: Showing first 100 of ${reportData.length} total records. Export to Excel for complete data.`, 105, 285, { align: 'center' });
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Gray color
      doc.text(
        `Mahikeng DCMS - Accounts Category Risk Report - Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Generate filename if not provided
    const defaultFileName = `accounts_category_risk_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(fileName || defaultFileName);
    
    return true;
  } catch (error: any) {
    console.error('Error exporting to PDF:', error);
    throw new Error(`Failed to export report to PDF: ${error.message}`);
  }
}

/**
 * Export accounts category risk report to Excel
 * @param reportData The report data to export
 * @param fileName Optional filename (defaults to accounts_category_risk_YYYY-MM-DD.xlsx)
 * @returns Promise indicating success
 */
export async function exportHighRiskAccountsToExcel(reportData: any[], fileName?: string) {
  try {
    // Check for empty data array
    if (!reportData || reportData.length === 0) {
      throw new Error('No data available to export');
    }

    console.log(`Exporting ${reportData.length} records to Excel...`);

    // Dynamically import XLSX to avoid SSR issues
    const XLSX = await import('xlsx');
    
    // Prepare data for Excel
    const workbookData = reportData.map(record => ({
      'Account Number': record.Account_Number,
      'Account Holder': record.Account_Holder,
      'Name': record.Name,
      'Surname/Company': record.Surname_Company,
      'Outstanding Balance': record.Outstanding_Balance,
      'Last Payment Date': record.Last_Payment_Date,
      'Last Payment Amount': record.Last_Payment_Amount,
      'Risk Level': record.Risk_Level,
      'Days Without Payment': record.Days_Without_Payment,
      'Contact Number': record.Contact_Number,
      'Email': record.Email_Address,
      'Address': record.Address,
      'Postal Code': record.Postal_Code
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(workbookData);

    // Count records by risk level
    const highRiskCount = reportData.filter(record => record.Risk_Level === 'High').length;
    const mediumRiskCount = reportData.filter(record => record.Risk_Level === 'Medium').length;
    const lowRiskCount = reportData.filter(record => record.Risk_Level === 'Low').length;
    
    // Calculate total outstanding balance
    const totalAccounts = reportData.length;
    const totalOutstanding = reportData.reduce((sum, record) => {
      const amount = parseFloat(record.Outstanding_Balance.replace('R', '').replace(',', ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const averageOutstanding = totalOutstanding / totalAccounts;

    const statsData = [
      ['Metric', 'Value'],
      ['Total Accounts', totalAccounts],
      ['High Risk Accounts', highRiskCount],
      ['Medium Risk Accounts', mediumRiskCount],
      ['Low Risk Accounts', lowRiskCount],
      ['Total Outstanding Balance', `R${totalOutstanding.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`],
      ['Average Outstanding Balance', `R${averageOutstanding.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`],
      ['Risk Categorization Criteria', ''],
      ['Low Risk', 'Payment in current month'],
      ['Medium Risk', 'Payment 1-3 months ago'],
      ['High Risk', 'Payment more than 3 months ago or no payment'],
      ['Report Generated', new Date().toLocaleString()]
    ];

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Details');

    // Generate filename if not provided
    const defaultFileName = `accounts_category_risk_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFileName = fileName || defaultFileName;

    // Write to file and trigger download
    XLSX.writeFile(workbook, finalFileName);
    console.log(`Excel report successfully generated: ${finalFileName}`);

    return true;
  } catch (error: any) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Failed to export report to Excel: ${error.message}`);
  }
}
