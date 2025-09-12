#!/usr/bin/env node

/**
 * University of Venda Master File Import Script
 * This script imports Excel data into the univen_customers table in Supabase
 * 
 * Usage: node import-univen-master-file.js [path-to-excel-file]
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and Service Key are required.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default path to the Excel file in Downloads folder
const defaultFilePath = path.join(require('os').homedir(), 'Downloads', 'univen_master_file.xlsx');

// Get file path from command line argument or use default
const filePath = process.argv[2] || defaultFilePath;

// Column mapping from Excel to database fields
// Updated to match the actual column names in your Excel file
const columnMapping = {
  // Client Information
  'Client Reference': 'Client Reference',
  'Interest rate': 'Interest rate',
  'Interest date': 'Interest date',
  'In Duplum': 'In Duplum',
  'Masked Client Reference': 'Masked Client Reference',
  'Client': 'Client',
  'Client Group': 'Client Group',
  'Status': 'Status',
  'Status Date': 'Status Date',
  'Debtor under DC?': 'Debtor under DC?',
  'Debtor Status Date': 'Debtor Status Date',
  'Days Overdue': 'Days Overdue',
  'Client Division': 'Client Division',
  'Old Client Ref': 'Old Client Ref',
  'Client Profile Account': 'Client Profile Account',
  'EasyPay Reference': 'EasyPay Reference',
  
  // Financial Information
  'Original Cost': 'Original Cost',
  'Capital on Default': 'Capital on Default',
  'Date Opened': 'Date Opened',
  'Hand Over Date': 'Hand Over Date',
  'Hand Over Amount': 'Hand Over Amount',
  'Payments To Date': 'Payments To Date',
  'Interest To Date': 'Interest To Date',
  'Adjustments To Date': 'Adjustments To Date',
  'Fees & Expenses': 'Fees & Expenses',
  'Collection Commission': 'Collection Commission',
  'FCC (excl VAT)': 'FCC (excl VAT)',
  'Current Balance': 'Current Balance',
  'Capital Amount': 'Capital Amount',
  
  // Payment Information
  'Last Payment Method': 'Last Payment Method',
  'Days since Last Payment': 'Days since Last Payment',
  'Last Payment Date': 'Last Payment Date',
  'Last Payment Amount': 'Last Payment Amount',
  
  // Call Information
  'Outbound Phone Call Outcome': 'Outbound Phone Call Outcome',
  'Outbound Phone Call Comment': 'Outbound Phone Call Comment',
  'Last Inbound Phone Call Date': 'Last Inbound Phone Call Date',
  'Inbound Phone Call Outcome': 'Inbound Phone Call Outcome',
  
  // Contact Information
  'Cellphone': 'Cellphone',
  'Cellphone 2': 'Cellphone 2',
  'Cellphone 3': 'Cellphone 3',
  'Cellphone 4': 'Cellphone 4',
  'Email': 'Email',
  'Email 2': 'Email 2',
  'Email 3': 'Email 3',
  
  // Address Information
  'Street Address 1': 'Street Address 1',
  'Street Address 2': 'Street Address 2',
  'Street Address 3': 'Street Address 3',
  'Street Address 4': 'Street Address 4',
  'Street Code': 'Street Code',
  'Combined Street': 'Combined Street',
  
  // Personal Information
  'Gender': 'Gender',
  'Occupation': 'Occupation',
  'Employer Name': 'Employer Name',
  'Employer Contact': 'Employer Contact',
  'Last Contact': 'Last Contact',
  'ID Number': 'ID Number',
  'Title': 'Title',
  'Initials': 'Initials',
  'First Name': 'First Name',
  'Second Name': 'Second Name',
  'Surname': 'Surname',
  
  // Account Information
  'Account Load Date': 'Account Load Date',
  'Debtor Flags': 'Debtor Flags',
  'Account Flags': 'Account Flags',
  'Linked Account': 'Linked Account',
  'Bucket': 'Bucket',
  'Campaign Exclusions': 'Campaign Exclusions',
  'Original Line': 'Original Line',
  
  // Error field
  'error': 'error',
  'Error': 'error',
  'Issues found in spreadsheet': 'error'
};

// List of date fields that need special handling
const dateFields = [
  'Interest date',
  'Status Date',
  'Debtor Status Date',
  'Date Opened',
  'Hand Over Date',
  'Last Payment Date',
  'Last Inbound Phone Call Date',
  'Last Contact',
  'Account Load Date'
];

// List of currency/numeric fields that need special handling
const currencyFields = [
  'Interest rate',
  'Original Cost',
  'Capital on Default',
  'Hand Over Amount',
  'Payments To Date',
  'Interest To Date',
  'Adjustments To Date',
  'Fees & Expenses',
  'Collection Commission',
  'FCC (excl VAT)',
  'Current Balance',
  'Capital Amount',
  'Last Payment Amount'
];

// List of integer fields that need special handling
const integerFields = [
  'Days Overdue',
  'Days since Last Payment'
];

async function getUnivenTenantId() {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', 'univen')
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('University of Venda tenant not found');
    
    return data.id;
  } catch (error) {
    console.error('Error fetching University of Venda tenant ID:', error.message);
    throw error;
  }
}

function convertExcelDate(excelDate) {
  // Handle Excel date serial numbers
  if (typeof excelDate === 'number') {
    // Excel dates start from 1900-01-01, but there's a leap year bug
    // JavaScript dates start from 1970-01-01
    // Excel serial date 1 = 1900-01-01, but we need to account for the leap year bug
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }
  
  // Handle string dates
  if (typeof excelDate === 'string') {
    // Try to parse common date formats
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // If we can't convert it, return null to avoid database errors
  return null;
}

function convertCurrency(value) {
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const numericValue = value.replace(/[^0-9.-]+/g, '');
    return parseFloat(numericValue) || 0;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  return 0;
}

function convertInteger(value) {
  if (typeof value === 'string') {
    const numericValue = value.replace(/[^0-9-]+/g, '');
    return parseInt(numericValue) || 0;
  }
  
  if (typeof value === 'number') {
    return Math.floor(value);
  }
  
  return 0;
}

// Function to clean and validate column names
function cleanColumnNames(record) {
  const cleanedRecord = {};
  for (const [key, value] of Object.entries(record)) {
    // Skip empty keys
    if (!key || key.trim() === '') continue;
    
    // Skip keys that are just whitespace
    if (key.trim().length === 0) continue;
    
    // Add the valid key-value pair
    cleanedRecord[key] = value;
  }
  return cleanedRecord;
}

async function importExcelData() {
  try {
    console.log('Starting University of Venda master file import...');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at ${filePath}`);
      console.error('Please provide the correct path to your Excel file:');
      console.error('Usage: node import-univen-master-file.js [path-to-excel-file]');
      process.exit(1);
    }
    
    console.log(`Reading Excel file from: ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with proper date handling
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    console.log(`Found ${jsonData.length} records in the Excel file`);
    
    if (jsonData.length === 0) {
      console.log('No data found in the Excel file');
      process.exit(0);
    }
    
    // Get University of Venda tenant ID
    const tenantId = await getUnivenTenantId();
    console.log(`University of Venda tenant ID: ${tenantId}`);
    
    // Process data and map to database fields
    const processedData = jsonData.map((row, index) => {
      const processedRow = {
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Log the first row's keys to help with debugging
      if (index === 0) {
        console.log('Excel column headers found:', Object.keys(row));
      }
      
      // Map columns based on the mapping
      for (const [excelColumn, dbColumn] of Object.entries(columnMapping)) {
        let value = row[excelColumn];
        
        // Skip undefined values
        if (value === undefined || value === null) continue;
        
        // Handle date fields
        if (dateFields.includes(dbColumn)) {
          value = convertExcelDate(value);
          // Skip if we couldn't convert the date
          if (value === null) continue;
        } 
        // Handle currency fields
        else if (currencyFields.includes(dbColumn)) {
          value = convertCurrency(value);
        } 
        // Handle integer fields
        else if (integerFields.includes(dbColumn)) {
          value = convertInteger(value);
        }
        
        // Only add non-empty values to avoid empty column references
        if (value !== undefined && value !== null && value !== '') {
          processedRow[dbColumn] = value;
        }
      }
      
      // Generate a UUID if Client Reference is not provided
      if (!processedRow['Client Reference']) {
        processedRow['Client Reference'] = `UNIVEN_${Date.now()}_${index}`;
      }
      
      // Clean the record to remove any empty column names
      return cleanColumnNames(processedRow);
    });
    
    console.log(`Processed ${processedData.length} records`);
    
    // Import data to Supabase in batches
    const batchSize = 1000;
    let importedCount = 0;
    
    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      // Log first record of batch for debugging
      if (batch.length > 0) {
        console.log('Sample record structure:', Object.keys(batch[0]));
      }
      
      console.log(`Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(processedData.length/batchSize)} (${batch.length} records)`);
      
      // Clean each record in the batch to ensure no empty column names
      const cleanedBatch = batch.map(record => cleanColumnNames(record));
      
      const { data, error } = await supabase
        .from('univen_customers')
        .insert(cleanedBatch);
      
      if (error) {
        console.error(`Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        // Log the first record in the batch for debugging
        if (cleanedBatch.length > 0) {
          console.error('Sample record that failed:', JSON.stringify(cleanedBatch[0], null, 2));
        }
        // Continue with next batch instead of stopping completely
      } else {
        importedCount += cleanedBatch.length;
        console.log(`Successfully imported ${cleanedBatch.length} records in batch ${Math.floor(i/batchSize) + 1}`);
      }
    }
    
    console.log(`\nImport completed! Successfully imported ${importedCount} records out of ${processedData.length} total records.`);
    
    // Verify import by counting records
    const { count, error: countError } = await supabase
      .from('univen_customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (countError) {
      console.error('Error verifying import:', countError.message);
    } else {
      console.log(`Total records in univen_customers table for University of Venda tenant: ${count}`);
    }
    
  } catch (error) {
    console.error('Error during import process:', error.message);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importExcelData();
}

module.exports = { importExcelData };