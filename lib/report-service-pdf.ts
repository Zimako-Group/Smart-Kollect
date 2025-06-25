import { supabase, supabaseAdmin } from './supabaseClient';
// Dynamic import for XLSX to avoid SSR issues
import type * as XLSX from 'xlsx';

/**
 * Generate a payment analysis report from the payment_records table
 * @param startDate Optional start date for filtering (YYYY-MM-DD)
 * @param endDate Optional end date for filtering (YYYY-MM-DD)
 * @returns Promise with the generated report data
 */
export async function generatePaymentAnalysisReport(startDate?: string, endDate?: string) {
  try {
    console.log('Generating payment analysis report...');
    
    // Use pagination to fetch all records
    const PAGE_SIZE = 1000; // Supabase default page size
    let allRecords: any[] = [];
    let page = 0;
    let hasMore = true;
    
    // Show a loading message
    console.log('Fetching all payment records using pagination...');
    
    while (hasMore) {
      // Build the query for this page - use supabaseAdmin for better permissions
      let query = supabaseAdmin
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
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      // Apply date filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      
      // Execute the query for this page
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching payment records (page ${page + 1}):`, error);
        throw new Error(`Failed to generate report: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        // No more data, exit the loop
        hasMore = false;
      } else {
        // Add the records from this page to our collection
        allRecords = [...allRecords, ...data];
        console.log(`Fetched page ${page + 1}, got ${data.length} records, total so far: ${allRecords.length}`);
        
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
      console.log('No payment records found for the specified criteria');
      // Return empty data instead of throwing an error
      return {
        data: [],
        totalRecords: 0,
        generatedAt: new Date().toISOString()
      };
    }
    
    console.log(`Successfully fetched all ${allRecords.length} payment records for report`);
    
    // Process the data for the report
    const reportData = allRecords.map(record => ({
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
 * Calculate payment statistics from report data
 * @param reportData The report data to analyze
 * @returns Object with payment statistics
 */
export function calculatePaymentStatistics(reportData: any[]) {
  try {
    // Check for empty data array
    if (!reportData || reportData.length === 0) {
      console.log('No data provided to calculate statistics');
      // Return default statistics with zero values
      return {
        totalRecords: 0,
        totalPaymentAmount: 0,
        averagePaymentAmount: 0,
        totalOutstandingBalance: 0,
        averageOutstandingBalance: 0,
        negativePaymentsTotal: 0,
        negativePaymentsCount: 0,
        positivePaymentsTotal: 0,
        positivePaymentsCount: 0,
        processingStatusCounts: {
          pending: 0,
          processed: 0,
          failed: 0,
          allocated: 0
        },
        paymentStatusDistribution: [
          { status: 'Processed', count: 0, percentage: 0 },
          { status: 'Pending', count: 0, percentage: 0 },
          { status: 'Failed', count: 0, percentage: 0 },
          { status: 'Allocated', count: 0, percentage: 0 }
        ]
      };
    }
    
    // Initialize statistics
    const stats = {
      totalRecords: reportData.length,
      totalPaymentAmount: 0,
      averagePaymentAmount: 0,
      totalOutstandingBalance: 0,
      averageOutstandingBalance: 0,
      negativePaymentsTotal: 0,
      negativePaymentsCount: 0,
      positivePaymentsTotal: 0,
      positivePaymentsCount: 0,
      processingStatusCounts: {
        pending: 0,
        processed: 0,
        failed: 0,
        skipped: 0
      },
      accountStatusCounts: {} as Record<string, number>,
      paymentVsOutstandingData: {
        totalPayments: 0,
        outstandingBalance: 0,
        totalPaymentsPercentage: 0,
        outstandingBalancePercentage: 0
      }
    };
    
    // Process each record
    reportData.forEach(record => {
      // Process payment amounts (convert to number)
      const paymentAmount = typeof record.Payment_Amount === 'string' 
        ? parseFloat(record.Payment_Amount) 
        : (record.Payment_Amount || 0);
      
      // Track negative payments separately
      if (paymentAmount < 0) {
        stats.negativePaymentsTotal += Math.abs(paymentAmount);
        stats.negativePaymentsCount++;
      } else {
        stats.positivePaymentsTotal += paymentAmount;
        stats.positivePaymentsCount++;
      }
      
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
    if (reportData.length > 0) {
      stats.averagePaymentAmount = stats.totalPaymentAmount / reportData.length;
      stats.averageOutstandingBalance = stats.totalOutstandingBalance / reportData.length;
    }
    
    // Calculate payment vs outstanding balance data for the pie chart
    stats.paymentVsOutstandingData.totalPayments = stats.totalPaymentAmount; // Using total payments instead of just negative payments
    stats.paymentVsOutstandingData.outstandingBalance = stats.totalOutstandingBalance;
    
    // Calculate percentages for the pie chart
    const total = stats.totalPaymentAmount + stats.totalOutstandingBalance;
    if (total > 0) {
      stats.paymentVsOutstandingData.totalPaymentsPercentage = (stats.totalPaymentAmount / total) * 100;
      stats.paymentVsOutstandingData.outstandingBalancePercentage = (stats.totalOutstandingBalance / total) * 100;
    }
    
    console.log('Payment statistics calculated:', stats);
    return stats;
  } catch (error: any) {
    console.error('Error calculating payment statistics:', error);
    throw new Error(`Failed to calculate payment statistics: ${error.message}`);
  }
}

/**
 * Export payment analysis report to PDF with a pie chart
 * @param reportData The report data to export
 * @param stats The statistics data
 * @param fileName Optional filename (defaults to payment_analysis_YYYY-MM-DD)
 */
export async function exportPaymentAnalysisToPDF(reportData: any[], stats: any, fileName?: string) {
  try {
    // Check for empty data array
    if (!reportData || reportData.length === 0) {
      console.log('No data provided to export to PDF');
      throw new Error('No payment records found for the specified criteria');
    }
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (!isBrowser) {
      throw new Error('PDF export is only available in browser environments');
    }
    
    // Dynamically import the required libraries
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default;
    
    // Import ApexCharts for better graphics
    const ApexCharts = (await import('apexcharts')).default;
    
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add report title
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Payment Analysis Report', 105, 20, { align: 'center' });
    
    // Add report date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Gray color
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 27, { align: 'center' });
    
    // Add Mahikeng Local Municipality header
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Mahikeng Local Municipality', 105, 35, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(44, 62, 80); // Dark blue color
    doc.line(20, 40, 190, 40);
    
    // Add summary statistics
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Summary Statistics', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Total Records: ${stats.totalRecords}`, 20, 60);
    doc.text(`Total Payment Amount: R${stats.totalPaymentAmount.toFixed(2)}`, 20, 67);
    doc.text(`Average Payment Amount: R${stats.averagePaymentAmount.toFixed(2)}`, 20, 74);
    doc.text(`Total Outstanding Balance: R${stats.totalOutstandingBalance.toFixed(2)}`, 20, 81);
    doc.text(`Average Outstanding Balance: R${stats.averageOutstandingBalance.toFixed(2)}`, 20, 88);
    
    // Add a title for the total payments vs outstanding balance chart
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Total Payments vs Outstanding Balance', 105, 95, { align: 'center' });
    
    // Create a div element for the ApexCharts pie chart
    const chartDiv = document.createElement('div');
    chartDiv.id = 'payment-chart';
    chartDiv.style.width = '600px';
    chartDiv.style.height = '450px';
    chartDiv.style.margin = '0 auto';
    document.body.appendChild(chartDiv);
    
    // Calculate percentages for labels
    const totalPaymentsPercentage = stats.paymentVsOutstandingData.totalPaymentsPercentage.toFixed(1);
    const outstandingBalancePercentage = stats.paymentVsOutstandingData.outstandingBalancePercentage.toFixed(1);
    
    // Format currency values
    const formattedTotalPayments = `R${stats.totalPaymentAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    const formattedOutstandingBalance = `R${stats.totalOutstandingBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Prepare ApexCharts options for a proper pie chart with improved UI
    const options = {
      series: [
        stats.paymentVsOutstandingData.totalPayments,
        stats.paymentVsOutstandingData.outstandingBalance
      ],
      chart: {
        type: 'pie',  // Changed from donut to pie
        height: 450,
        width: 600,
        fontFamily: 'Helvetica, Arial, sans-serif',
        background: '#ffffff',
        animations: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        offsetY: 0
      },
      colors: ['#22c55e', '#3b82f6'], // Brighter green and blue colors for better contrast
      labels: [
        `Total Payments (${totalPaymentsPercentage}%)`,
        `Outstanding Balance (${outstandingBalancePercentage}%)`
      ],
      dataLabels: {
        enabled: true,
        formatter: function(val: number) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '22px',  // Increased font size
          fontWeight: 'bold',
          colors: ['#fff'],
          textOutline: 'none'
        },
        background: {
          enabled: true,
          foreColor: '#000',
          borderWidth: 0,
          opacity: 0.5,
          borderRadius: 6  // Slightly larger radius
        },
        dropShadow: {
          enabled: true,
          blur: 3,
          opacity: 0.5
        },
        position: 'centroid',  // Position labels in the center of each slice
        distributed: true
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          offsetX: 0,
          offsetY: 0,
          customScale: 1,
          dataLabels: {
            offset: -10, // Move labels closer to the edge
            minAngleToShowLabel: 10
          },
          startAngle: 0,
          endAngle: 360,
        }
      },
      legend: {
        show: true,
        showForSingleSeries: true,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '16px',  // Adjusted font size
        fontWeight: 600,
        labels: {
          colors: '#333333'
        },
        markers: {
          width: 16,  // Slightly smaller markers for better fit
          height: 16,
          radius: 8,
          strokeWidth: 0,
          strokeColor: '#fff',
          fillColors: undefined,
          offsetX: 0,
          offsetY: 0
        },
        itemMargin: {
          horizontal: 25,  // More horizontal spacing
          vertical: 5     // Less vertical spacing to keep items closer together
        },
        floating: false,
        onItemClick: {
          toggleDataSeries: false
        },
        formatter: function(seriesName: string, opts: any) {
          // Add the value to the legend
          const value = opts.w.globals.series[opts.seriesIndex];
          const formattedValue = `R${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          return `${seriesName} (${formattedValue})`;
        },
        offsetY: 10,  // Adjusted space above the legend
        height: 80    // Explicitly set height for the legend area
      },
      tooltip: {
        y: {
          formatter: function(value: number) {
            return `R${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          }
        }
      },
      stroke: {
        width: 2
      },
      title: {
        text: 'Total Payments vs Outstanding Balance',
        align: 'center',
        margin: 25,
        offsetY: 0,
        style: {
          fontSize: '24px',  // Larger title font
          fontWeight: 700,
          color: '#1e293b',
          fontFamily: 'Helvetica, Arial, sans-serif'
        }
      },
      subtitle: {
        text: `Total: ${formattedTotalPayments}`,
        align: 'center',
        offsetY: 35,
        style: {
          fontSize: '20px',  // Larger subtitle font
          fontWeight: 600,
          color: '#475569'
        }
      }
    };
    
    // Create the ApexCharts instance
    const chart = new ApexCharts(chartDiv, options);
    await chart.render();
    
    // Wait for chart rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Convert the chart to an image using html2canvas
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(chartDiv, {
      scale: 2, // Higher scale for better quality
      backgroundColor: '#ffffff',
      logging: false
    });
    
    // Add the chart image to the PDF
    const chartImage = canvas.toDataURL('image/png');
    doc.addImage(chartImage, 'PNG', 10, 105, 190, 120); // Wider and taller image with less left margin
    
    // Remove the chart div
    document.body.removeChild(chartDiv);
    
    // Add a note about total payments
    doc.setFontSize(10); // Slightly larger font
    doc.setTextColor(100, 100, 100); // Gray color
    doc.text(`Note: Total payments represent all customer payments made. The chart compares payments received vs outstanding balances.`, 105, 250, { align: 'center' });
    
    // Add payment records table
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Payment Records', 105, 20, { align: 'center' });
    
    // Prepare table data
    const tableHeaders = [
      'Account Number', 
      'Account Holder', 
      'Payment Amount', 
      'Outstanding Balance'
    ];
    
    // Optimize for large datasets by processing in chunks
    const recordsPerPage = 1000; // Number of records per page
    const totalPages = Math.ceil(reportData.length / recordsPerPage);
    
    console.log(`Processing ${reportData.length} records across ${totalPages} pages`);
    
    // Add summary information about the dataset size
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Records: ${reportData.length.toLocaleString()} | Pages: ${totalPages}`, 105, 25, { align: 'center' });
    
    // Process records in chunks to avoid memory issues
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIdx = pageIndex * recordsPerPage;
      const endIdx = Math.min(startIdx + recordsPerPage, reportData.length);
      const pageRecords = reportData.slice(startIdx, endIdx);
      
      // Create table data for this chunk
      const tableData = pageRecords.map(record => [
        record.Account_Number,
        record.Account_Holder,
        `R${parseFloat(record.Payment_Amount).toFixed(2)}`,
        `R${parseFloat(record.Outstanding_Balance).toFixed(2)}`
      ]);
      
      // Add a new page for each chunk (except the first one which already has a page)
      if (pageIndex > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(`Payment Records (Page ${pageIndex + 1} of ${totalPages})`, 105, 20, { align: 'center' });
      }
      
      // Add the table for this chunk
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 30 },
        styles: {
          fontSize: 8,
          cellPadding: 3
        }
      });
      
      // Add progress indicator for large datasets
      console.log(`Processed page ${pageIndex + 1} of ${totalPages}`);
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Gray color
      doc.text(
        `Mahikeng DCMS - Payment Analysis Report - Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Generate filename if not provided
    const defaultFileName = `payment_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(fileName || defaultFileName);
    
    return true;
  } catch (error: any) {
    console.error('Error exporting to PDF:', error);
    throw new Error(`Failed to export report to PDF: ${error.message}`);
  }
}

/**
 * Export payment analysis report to Excel
 * @param reportData The report data to export
 * @param stats The statistics data
 * @param fileName Optional filename (defaults to payment_analysis_YYYY-MM-DD.xlsx)
 * @returns Promise indicating success
 */
export async function exportPaymentAnalysisToExcel(reportData: any[], stats: any, fileName?: string) {
  try {
    // Check for empty data array
    if (!reportData || reportData.length === 0) {
      throw new Error('No data available to export');
    }

    console.log(`Exporting ${reportData.length} payment records to Excel...`);

    // Dynamically import XLSX to avoid SSR issues
    const XLSX = await import('xlsx');
    
    // Prepare data for Excel - clean up and format for better readability
    const workbookData = reportData.map(record => ({
      'Account Number': record.Account_Number,
      'Account Holder': record.Account_Holder,
      'Account Status': record.Account_Status,
      'Payment Amount': typeof record.Payment_Amount === 'string' && record.Payment_Amount.startsWith('R') 
        ? record.Payment_Amount 
        : `R${parseFloat(record.Payment_Amount || 0).toFixed(2)}`,
      'Outstanding Balance': typeof record.Outstanding_Balance === 'string' && record.Outstanding_Balance.startsWith('R') 
        ? record.Outstanding_Balance 
        : `R${parseFloat(record.Outstanding_Balance || 0).toFixed(2)}`,
      'Processing Status': record.Processing_Status,
      'Processed Date': record.Processed_Date,
      'Created Date': record.Created_Date
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(workbookData);

    // Add statistics to a separate worksheet
    const statsData = [
      ['Metric', 'Value'],
      ['Total Payment Records', stats.totalRecords],
      ['Total Payment Amount', `R${stats.totalPaymentAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`],
      ['Average Payment Amount', `R${stats.averagePaymentAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`],
      ['Total Outstanding Balance', `R${stats.totalOutstandingBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`],
      ['Average Outstanding Balance', `R${stats.averageOutstandingBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`],
      ['Processed Records', stats.processedCount],
      ['Pending Records', stats.pendingCount],
      ['Failed Records', stats.failedCount],
      ['Report Generated', new Date().toLocaleString()]
    ];

    // Add payment status breakdown
    statsData.push(['', '']);
    statsData.push(['Payment Status Breakdown', '']);
    Object.entries(stats.statusCounts).forEach(([status, count]: [string, any]) => {
      statsData.push([status, count]);
    });

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);

    // Set column widths for better readability
    const setCellWidths = (worksheet: any) => {
      const columnWidths = [
        { wch: 25 }, // Column A width
        { wch: 20 }, // Column B width
      ];
      worksheet['!cols'] = columnWidths;
    };

    setCellWidths(statsWorksheet);
    setCellWidths(worksheet);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Records');

    // Generate filename if not provided
    const defaultFileName = `payment_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
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
