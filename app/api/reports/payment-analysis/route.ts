import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

// Define types for our data
interface PaymentRecord {
  id: string;
  account_number: string;
  account_holder_name: string;
  amount: number;
  outstanding_balance_capital: number;
  outstanding_balance_interest: number;
  outstanding_balance_total: number;
  agreement_outstanding: number;
  housing_outstanding: number;
  payment_file_id: string;
  processing_status: string;
  created_at: string;
  email_address: string;
  cell_number: string;
  town: string;
  suburb: string;
  ward: string;
  property_category: string;
  indigent: boolean;
  pensioner: boolean;
  hand_over: boolean;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  status: string;
  created_at: string;
  account_number: string;
  account_holder_name: string;
}

export async function GET(
  request: NextRequest
) {
  console.log('Payment Analysis Report API called');
  
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    console.log('Supabase client created');
    
    // Try to fetch data from both tables to see which one has usable data
    let reportData: any[] = [];
    let dataSource = '';
    
    console.log('Attempting to fetch data from Payments table...');
    // First try the Payments table (capitalized)
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('Payments')
      .select(`
        id,
        amount,
        payment_date,
        payment_method,
        reference_number,
        status,
        created_at,
        account_number,
        account_holder_name
      `)
      .order('created_at', { ascending: false }) as { data: Payment[] | null, error: any };
    
    if (paymentsError) {
      console.error('Error fetching from Payments table:', paymentsError);
    } else {
      console.log(`Successfully fetched ${paymentsData?.length || 0} records from Payments table`);
    }
    
    console.log('Attempting to fetch data from payment_records table...');
    // Then try the payment_records table
    const { data: recordsData, error: recordsError } = await supabase
      .from('payment_records')
      .select(`
        id,
        account_number,
        account_holder_name,
        amount,
        outstanding_balance_capital,
        outstanding_balance_interest,
        outstanding_balance_total,
        agreement_outstanding,
        housing_outstanding,
        created_at,
        processing_status,
        email_address,
        cell_number,
        town,
        suburb,
        ward,
        property_category,
        indigent,
        pensioner,
        hand_over
      `)
      .order('created_at', { ascending: false }) as { data: PaymentRecord[] | null, error: any };
    
    if (recordsError) {
      console.error('Error fetching from payment_records table:', recordsError);
    } else {
      console.log(`Successfully fetched ${recordsData?.length || 0} records from payment_records table`);
    }
    
    // Determine which dataset to use based on data availability
    if (paymentsData && paymentsData.length > 0 && paymentsData.some(p => p.amount > 0)) {
      console.log('Using data from Payments table for report');
      dataSource = 'Payments';
      
      // Process the data from Payments table
      reportData = paymentsData.map((payment: Payment) => ({
        'Payment ID': payment.id,
        'Account Number': payment.account_number || 'N/A',
        'Account Holder': payment.account_holder_name || 'N/A',
        'Amount': payment.amount || 0,
        'Payment Date': payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A',
        'Payment Method': payment.payment_method || 'N/A',
        'Reference Number': payment.reference_number || 'N/A',
        'Status': payment.status || 'N/A',
        'Created At': payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'
      }));
    } else if (recordsData && recordsData.length > 0 && recordsData.some(r => r.amount > 0)) {
      console.log('Using data from payment_records table for report');
      dataSource = 'payment_records';
      
      // Process the data from payment_records table
      reportData = recordsData
        .filter(record => record.processing_status === 'completed')
        .map((record: PaymentRecord) => ({
          'Record ID': record.id,
          'Account Number': record.account_number || 'N/A',
          'Account Holder': record.account_holder_name || 'N/A',
          'Amount': record.amount || 0,
          'Outstanding Capital': record.outstanding_balance_capital || 0,
          'Outstanding Interest': record.outstanding_balance_interest || 0,
          'Total Outstanding': record.outstanding_balance_total || 0,
          'Agreement Outstanding': record.agreement_outstanding || 0,
          'Housing Outstanding': record.housing_outstanding || 0,
          'Email': record.email_address || 'N/A',
          'Cell Number': record.cell_number || 'N/A',
          'Town': record.town || 'N/A',
          'Suburb': record.suburb || 'N/A',
          'Ward': record.ward || 'N/A',
          'Property Category': record.property_category || 'N/A',
          'Indigent': record.indigent ? 'Yes' : 'No',
          'Pensioner': record.pensioner ? 'Yes' : 'No',
          'Hand Over': record.hand_over ? 'Yes' : 'No',
          'Created At': record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'
        }));
    } else {
      // If neither table has usable data, create a fallback dataset with sample data
      console.log('No usable payment data found in either table, using fallback data');
      dataSource = 'fallback';
      
      // Create a sample dataset for demonstration purposes
      reportData = [
        {
          'Note': 'No payment data found in the database',
          'Timestamp': new Date().toISOString()
        }
      ];
    }
    
    console.log(`Preparing Excel report with ${reportData.length} records from ${dataSource}`);
    
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    
    // Add some styling to the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'EFEFEF' } }
      };
    }
    
    // Auto-size columns
    const colWidths = reportData.reduce((widths: any, row: any) => {
      Object.keys(row).forEach((key, i) => {
        const value = String(row[key] || '');
        widths[i] = Math.max(widths[i] || 0, value.length, key.length);
      });
      return widths;
    }, {});
    
    worksheet['!cols'] = Object.keys(colWidths).map(i => ({ wch: colWidths[i] + 2 }));
    
    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Analysis');
    
    // Add a summary sheet
    const summaryData = [
      { 'Metric': 'Total Records', 'Value': reportData.length },
      { 'Metric': 'Data Source', 'Value': dataSource },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() }
    ];
    
    if (dataSource === 'Payments') {
      // Add Payments-specific summary metrics
      const totalAmount = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      summaryData.push({ 'Metric': 'Total Amount', 'Value': totalAmount.toFixed(2) });
      
      const paymentMethods = paymentsData?.reduce((methods: any, p) => {
        const method = p.payment_method || 'Unknown';
        methods[method] = (methods[method] || 0) + 1;
        return methods;
      }, {});
      
      Object.entries(paymentMethods || {}).forEach(([method, count]) => {
        summaryData.push({ 'Metric': `Payment Method: ${method}`, 'Value': count as number });
      });
    } else if (dataSource === 'payment_records') {
      // Add payment_records-specific summary metrics
      const totalAmount = recordsData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalOutstanding = recordsData?.reduce((sum, r) => sum + (r.outstanding_balance_total || 0), 0) || 0;
      
      summaryData.push({ 'Metric': 'Total Amount', 'Value': totalAmount.toFixed(2) });
      summaryData.push({ 'Metric': 'Total Outstanding', 'Value': totalOutstanding.toFixed(2) });
      
      const indigentCount = recordsData?.filter(r => r.indigent).length || 0;
      const pensionerCount = recordsData?.filter(r => r.pensioner).length || 0;
      const handOverCount = recordsData?.filter(r => r.hand_over).length || 0;
      
      summaryData.push({ 'Metric': 'Indigent Accounts', 'Value': indigentCount });
      summaryData.push({ 'Metric': 'Pensioner Accounts', 'Value': pensionerCount });
      summaryData.push({ 'Metric': 'Hand Over Accounts', 'Value': handOverCount });
    }
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Write the workbook to a base64 string
    const excelBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    
    // Convert base64 to buffer
    const buffer = Buffer.from(excelBase64, 'base64');
    
    console.log('Excel report generated successfully, returning file');
    
    // Return the Excel file as a downloadable response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="payment-analysis-report.xlsx"',
        'Content-Length': buffer.byteLength.toString()
      }
    });
    
  } catch (error) {
    console.error('Error generating payment analysis report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
