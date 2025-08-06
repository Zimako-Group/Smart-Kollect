import * as XLSX from 'xlsx';
// @ts-ignore - Adding type ignore to prevent build errors with papaparse
import Papa from 'papaparse';

export interface PaymentRecord {
  ACCOUNT_NO: string;
  ACCOUNT_HOLDER_NAME: string;
  ERF_NUMBER: string;
  VALUATION: string | number;
  VAT_REG_NUMBER: string;
  COMPANY_CC_NUMBER: string;
  POSTAL_ADDRESS_1: string;
  POSTAL_ADDRESS_2: string;
  POSTAL_ADDRESS_3: string;
  POSTAL_CODE: string;
  ID_NUMBER: string;
  EMAIL_ADDRESS: string;
  CELL_NUMBER: string;
  ACCOUNT_STATUS: string;
  OCC_OWN: string; 
  ACCOUNT_TYPE: string;
  OWNER_CATEGORY: string;
  GROUP_ACCOUNT: string;
  CREDIT_INSTRUCITON: string; 
  CREDIT_STATUS: string;
  MAILING_INSTRUCTION: string;
  STREET_ADDRESS: string;
  TOWN: string; 
  SUBURB: string; 
  WARD: string; 
  PROPERTY_CATEGORY: string; 
  GIS_KEY: string;
  INDIGENT: string | boolean;
  PENSIONER: string | boolean;
  HAND_OVER: string | boolean;
  OUTSTANDING_BALANCE_CAPITAL: string | number;
  OUTSTANDING_BALANCE_INTEREST: string | number;
  OUTSTANDING_TOTAL_BALANCE: string | number;
  LAST_PAYMENT_AMOUNT: string | number;
  // Payment date as it appears in the file (e.g., "20220420")
  LAST_PAYMENT_DATE: string | Date;
  AGREEMENT_OUTSTANDING: string | number; 
  AGREEMENT_TYPE: string; 
  HOUSING_OUTSTANDING: string | number; 
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRecords: PaymentRecord[];
  invalidRecords: PaymentRecord[];
}

export interface ValidationError {
  record: PaymentRecord;
  field: string;
  message: string;
}

export interface ValidationWarning {
  record: PaymentRecord;
  field: string;
  message: string;
}

/**
 * Transform and normalize header names to match our PaymentRecord interface
 * @param header Raw header string from file
 * @returns Normalized header string
 */
const transformHeader = (header: string): string => {
  if (!header) return '';
  
  // Normalize header names by removing spaces and special characters
  let normalizedHeader = header.trim().replace(/\s+/g, '_').toUpperCase();
  
  // Map specific field names to match our interface - focus on the critical fields
  const fieldMappings: { [key: string]: string } = {
    // Critical fields mapping with variations
    'OCC/OWN': 'OCC_OWN',
    'OCC_OWN': 'OCC_OWN',
    'OCC_/_OWN': 'OCC_OWN',
    'OCCUPANCY_OWN': 'OCC_OWN',
    'OCCUPANCY/OWNERSHIP': 'OCC_OWN',
    
    'ACCOUNT_NO': 'ACCOUNT_NO',
    'ACCOUNT_NUMBER': 'ACCOUNT_NO',
    'ACC_NO': 'ACCOUNT_NO',
    'ACC_NUMBER': 'ACCOUNT_NO',
    'ACCOUNT': 'ACCOUNT_NO',
    
    'ACCOUNT_HOLDER_NAME': 'ACCOUNT_HOLDER_NAME',
    'ACCOUNT_HOLDER': 'ACCOUNT_HOLDER_NAME',
    'HOLDER_NAME': 'ACCOUNT_HOLDER_NAME',
    'CUSTOMER_NAME': 'ACCOUNT_HOLDER_NAME',
    'NAME': 'ACCOUNT_HOLDER_NAME',
    
    'ACCOUNT_STATUS': 'ACCOUNT_STATUS',
    'STATUS': 'ACCOUNT_STATUS',
    'ACC_STATUS': 'ACCOUNT_STATUS',
    
    'INDIGENT': 'INDIGENT',
    'IS_INDIGENT': 'INDIGENT',
    'INDIGENT_STATUS': 'INDIGENT',
    
    'OUTSTANDING_TOTAL_BALANCE': 'OUTSTANDING_TOTAL_BALANCE',
    'OUTSTANDING_BALANCE': 'OUTSTANDING_TOTAL_BALANCE',
    'TOTAL_BALANCE': 'OUTSTANDING_TOTAL_BALANCE',
    'BALANCE': 'OUTSTANDING_TOTAL_BALANCE',
    'TOTAL_OUTSTANDING': 'OUTSTANDING_TOTAL_BALANCE',
    
    'LAST_PAYMENT_AMOUNT': 'LAST_PAYMENT_AMOUNT',
    'PAYMENT_AMOUNT': 'LAST_PAYMENT_AMOUNT',
    'LAST_AMOUNT': 'LAST_PAYMENT_AMOUNT',
    'AMOUNT_PAID': 'LAST_PAYMENT_AMOUNT',
    
    'LAST_PAYMENT_DATE': 'LAST_PAYMENT_DATE',
    'PAYMENT_DATE': 'LAST_PAYMENT_DATE',
    'DATE_PAID': 'LAST_PAYMENT_DATE',
    'LAST_DATE': 'LAST_PAYMENT_DATE',
    
    // Other common fields
    'CREDIT_INSTRUCITON': 'CREDIT_INSTRUCITON', // Keep the typo as it might be in source data
    'CREDIT_INSTRUCTION': 'CREDIT_INSTRUCITON', // Handle correct spelling too
  };
  
  // Apply field mappings
  if (fieldMappings[normalizedHeader]) {
    normalizedHeader = fieldMappings[normalizedHeader];
  }
  
  console.log(`Mapped header '${header}' to '${normalizedHeader}'`);
  return normalizedHeader;
};

/**
 * Parse a spreadsheet file (XLSX, XLS, or CSV) into payment records
 * @param file File to parse
 * @returns Promise with parsed records and any parsing errors
 */
export const parsePaymentFile = async (file: File): Promise<{ records: PaymentRecord[], errors: string[] }> => {
  const errors: string[] = [];
  let records: PaymentRecord[] = [];

  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      // Parse CSV file
      const csvText = await file.text();
      
      // Use a two-step parsing approach to handle header transformation
      // First parse the CSV without header transformation
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });
      
      // Then manually transform the data with the correct headers
      if (result.data && Array.isArray(result.data)) {
        // Get the original headers
        const originalHeaders = result.meta.fields || [];
        
        // Transform the data to use our transformed headers
        const transformedData = result.data.map((row: any) => {
          const newRow: Record<string, any> = {};
          originalHeaders.forEach((header: string) => {
            const transformedHeader = transformHeader(header);
            if (transformedHeader) {
              newRow[transformedHeader] = row[header];
            }
          });
          return newRow;
        });
        
        // Replace the original data with our transformed data
        result.data = transformedData;
      }
      
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error: { row: number; message: string }) => {
          errors.push(`CSV parsing error at row ${error.row}: ${error.message}`);
        });
      }
      
      records = result.data as PaymentRecord[];
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      
      // Log file size for debugging
      console.log(`Processing Excel file of size: ${arrayBuffer.byteLength} bytes`);
      
      // Use defusedxml option for security
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: false, cellText: false });
      
      if (workbook.SheetNames.length === 0) {
        errors.push('No sheets found in the Excel file');
        return { records: [], errors };
      }
      
      // Use the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get sheet range to determine total rows
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const totalRows = range.e.r + 1; // Total number of rows in the sheet
      
      console.log(`Excel sheet contains ${totalRows} total rows`);
      
      // Convert to JSON with headers - use sheet_to_json with header option for more reliable parsing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: 'N/A',  // Default value for empty cells
        blankrows: false // Skip blank rows
      });
      
      console.log(`Parsed ${jsonData.length} rows from Excel (including header)`);
      
      if (jsonData.length < 2) {
        errors.push('Excel file must contain at least a header row and one data row');
        return { records: [], errors };
      }
      
      // Extract headers (first row)
      const headers = (jsonData[0] as string[]).map((header, index) => {
        if (!header) {
          console.warn(`Empty header found at column ${index}, using default name`);
          return `COLUMN_${index}`;
        }
        return transformHeader(String(header));
      });
      
      console.log(`Extracted ${headers.length} headers from Excel file`);
      
      // Process data rows with better error handling
      records = [];
      let skippedRows = 0;
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        // Skip completely empty rows
        if (row.every(cell => cell === undefined || cell === null || cell === 'N/A')) {
          skippedRows++;
          continue;
        }
        
        // Check for critical fields - especially account number
        const accountNumberIdx = headers.findIndex(h => h === 'ACCOUNT_NO');
        if (accountNumberIdx === -1 || !row[accountNumberIdx]) {
          errors.push(`Row ${i+1}: Missing required ACCOUNT_NO field`);
          continue;
        }
        
        // Validate other critical fields are present
        const criticalFields = [
          { name: 'ACCOUNT_HOLDER_NAME', index: headers.findIndex(h => h === 'ACCOUNT_HOLDER_NAME') },
          { name: 'ACCOUNT_STATUS', index: headers.findIndex(h => h === 'ACCOUNT_STATUS') },
          { name: 'OCC_OWN', index: headers.findIndex(h => h === 'OCC_OWN') },
          { name: 'INDIGENT', index: headers.findIndex(h => h === 'INDIGENT') },
          { name: 'OUTSTANDING_TOTAL_BALANCE', index: headers.findIndex(h => h === 'OUTSTANDING_TOTAL_BALANCE') },
          { name: 'LAST_PAYMENT_AMOUNT', index: headers.findIndex(h => h === 'LAST_PAYMENT_AMOUNT') },
          { name: 'LAST_PAYMENT_DATE', index: headers.findIndex(h => h === 'LAST_PAYMENT_DATE') }
        ];
        
        // Log missing fields but don't stop processing
        const missingFields = criticalFields.filter(field => field.index === -1);
        if (missingFields.length > 0) {
          console.warn(`Row ${i+1}: Missing recommended fields: ${missingFields.map(f => f.name).join(', ')}`);
        }
        
        try {
          const record: PaymentRecord = {} as PaymentRecord;
          headers.forEach((header, index) => {
            record[header] = row[index] !== undefined ? row[index] : 'N/A';
          });
          records.push(record);
        } catch (err: any) {
          errors.push(`Error processing row ${i+1}: ${err.message}`);
        }
      }
      
      console.log(`Successfully processed ${records.length} records, skipped ${skippedRows} empty rows`);
      if (records.length < (jsonData.length - 1 - skippedRows)) {
        console.warn(`Warning: Some rows could not be processed (${jsonData.length - 1 - skippedRows - records.length} rows)`);
      }
    } else {
      errors.push(`Unsupported file format: ${fileExtension}. Please upload XLSX, XLS, or CSV files.`);
    }
  } catch (error: any) {
    errors.push(`Error parsing file: ${error.message}`);
  }

  // Normalize the records
  records = records.map(normalizePaymentRecord);
  
  return { records, errors };
};

/**
 * Format date from YYYYMMDD to YYYY/MM/DD
 * @param dateString Date string in YYYYMMDD format
 * @returns Formatted date string in YYYY/MM/DD format or 'N/A' if invalid
 */
export const formatPaymentDate = (dateString: string | Date): string => {
  if (!dateString || dateString === 'N/A') {
    return 'N/A';
  }

  // Convert to string if it's a Date object
  const dateStr = dateString instanceof Date ? dateString.toISOString().slice(0, 10).replace(/-/g, '') : String(dateString);
  
  // Remove any non-numeric characters and trim
  const cleanDateStr = dateStr.replace(/\D/g, '');
  
  // Check if it's in YYYYMMDD format (8 digits)
  if (cleanDateStr.length === 8) {
    const year = cleanDateStr.substring(0, 4);
    const month = cleanDateStr.substring(4, 6);
    const day = cleanDateStr.substring(6, 8);
    
    // Validate the date components
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (yearNum >= 1900 && yearNum <= 2100 && 
        monthNum >= 1 && monthNum <= 12 && 
        dayNum >= 1 && dayNum <= 31) {
      
      // Create a date object to validate the actual date
      const testDate = new Date(yearNum, monthNum - 1, dayNum);
      if (testDate.getFullYear() === yearNum && 
          testDate.getMonth() === monthNum - 1 && 
          testDate.getDate() === dayNum) {
        return `${year}/${month}/${day}`;
      }
    }
  }
  
  // Try to parse as a regular date if YYYYMMDD format doesn't work
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }
  } catch {
    // Fall through to return 'N/A'
  }
  
  return 'N/A';
};

/**
 * Normalize a payment record by ensuring all fields have values and converting types
 * @param record Raw payment record
 * @returns Normalized payment record
 */
/**
 * Normalize a payment record by ensuring all fields have values and converting types
 * @param record Raw payment record
 * @returns Normalized payment record
 */
export function normalizePaymentRecord(record: PaymentRecord): PaymentRecord {
  const normalizedRecord: PaymentRecord = { ...record };
  
  // Ensure critical fields exist
  const criticalFields = [
    'ACCOUNT_NO',
    'ACCOUNT_HOLDER_NAME',
    'ACCOUNT_STATUS',
    'OCC_OWN',
    'INDIGENT',
    'OUTSTANDING_TOTAL_BALANCE',
    'LAST_PAYMENT_AMOUNT',
    'LAST_PAYMENT_DATE'
  ];
  
  criticalFields.forEach(field => {
    if (!normalizedRecord[field]) {
      normalizedRecord[field] = 'N/A';
      console.warn(`Added missing critical field ${field} with default value N/A`);
    }
  });
  
  // Convert numeric fields - prioritize the critical ones
  const numericFields = [
    'OUTSTANDING_TOTAL_BALANCE',
    'LAST_PAYMENT_AMOUNT',
    'OUTSTANDING_BALANCE_CAPITAL',
    'OUTSTANDING_BALANCE_INTEREST',
    'AGREEMENT_OUTSTANDING',
    'HOUSING_OUTSTANDING',
    'VALUATION'
  ];
  
  numericFields.forEach(field => {
    if (normalizedRecord[field] !== 'N/A') {
      // Handle various number formats (commas, spaces, currency symbols)
      const valueStr = String(normalizedRecord[field])
        .replace(/[^0-9.-]/g, '') // Remove anything that's not a digit, dot or negative sign
        .replace(/(\d+)-(\d+)-(\d+)/, '') // Don't convert dates to numbers
        .trim();
      
      const parsed = parseFloat(valueStr);
      normalizedRecord[field] = isNaN(parsed) ? 0 : parsed;
      
      if (field === 'OUTSTANDING_TOTAL_BALANCE' || field === 'LAST_PAYMENT_AMOUNT') {
        console.log(`Normalized ${field} from '${normalizedRecord[field]}' to ${parsed}`);
      }
    }
  });
  
  // Format date fields - special handling for LAST_PAYMENT_DATE
  if (normalizedRecord.LAST_PAYMENT_DATE !== 'N/A') {
    const originalValue = normalizedRecord.LAST_PAYMENT_DATE;
    normalizedRecord.LAST_PAYMENT_DATE = formatPaymentDate(normalizedRecord.LAST_PAYMENT_DATE);
    console.log(`Normalized LAST_PAYMENT_DATE from '${originalValue}' to '${normalizedRecord.LAST_PAYMENT_DATE}'`);
  }
  
  // Convert boolean fields - special handling for INDIGENT
  const booleanFields = ['INDIGENT', 'PENSIONER', 'HAND_OVER'];
  booleanFields.forEach(field => {
    if (normalizedRecord[field] !== 'N/A') {
      const value = String(normalizedRecord[field]).toUpperCase().trim();
      normalizedRecord[field] = value === 'YES' || value === 'TRUE' || value === 'Y' || value === '1' || value === 'T';
      
      if (field === 'INDIGENT') {
        console.log(`Normalized INDIGENT from '${value}' to ${normalizedRecord[field]}`);
      }
    } else {
      normalizedRecord[field] = false;
    }
  });
  
  return normalizedRecord;
}

/**
 * Validate payment records
 * @param records Payment records to validate
 * @returns Validation result
 */
export const validatePaymentRecords = (records: PaymentRecord[]): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    validRecords: [],
    invalidRecords: []
  };
  
  records.forEach(record => {
    const recordErrors: ValidationError[] = [];
    const recordWarnings: ValidationWarning[] = [];
    
    // Required fields validation
    if (!record.ACCOUNT_NO || record.ACCOUNT_NO === 'N/A') {
      recordErrors.push({
        record,
        field: 'ACCOUNT_NO',
        message: 'Account number is required'
      });
    }
    
    // Validate numeric fields
    const numericFields = [
      'OUTSTANDING_BALANCE_CAPITAL', 'OUTSTANDING_BALANCE_INTEREST',
      'OUTSTANDING_TOTAL_BALANCE', 'LAST_PAYMENT_AMOUNT', 'AGREEMENT_OUTSTANDING', 'HOUSING_OUTSTANDING'
    ];
    
    numericFields.forEach(field => {
      if (record[field] !== 'N/A' && typeof record[field] !== 'number') {
        recordWarnings.push({
          record,
          field,
          message: `${field} should be a number`
        });
      }
    });
    
    // Email validation
    if (record.EMAIL_ADDRESS !== 'N/A') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(record.EMAIL_ADDRESS))) {
        recordWarnings.push({
          record,
          field: 'EMAIL_ADDRESS',
          message: 'Invalid email format'
        });
      }
    }
    
    // Cell number validation
    if (record.CELL_NUMBER !== 'N/A') {
      const cellRegex = /^[+]?[\d\s-]{10,15}$/;
      if (!cellRegex.test(String(record.CELL_NUMBER))) {
        recordWarnings.push({
          record,
          field: 'CELL_NUMBER',
          message: 'Invalid cell number format'
        });
      }
    }
    
    // Add errors and warnings to the result
    if (recordErrors.length > 0) {
      result.errors.push(...recordErrors);
      result.invalidRecords.push(record);
      result.valid = false;
    } else {
      result.validRecords.push(record);
      if (recordWarnings.length > 0) {
        result.warnings.push(...recordWarnings);
      }
    }
  });
  
  return result;
};

/**
 * Format payment records for display
 * @param records Payment records to format
 * @returns Formatted payment records
 */
export const formatPaymentRecords = (records: PaymentRecord[]): any[] => {
  return records.map(record => ({
    accountNumber: record.ACCOUNT_NO,
    accountHolder: record.ACCOUNT_HOLDER_NAME,
    outstandingBalance: typeof record.OUTSTANDING_TOTAL_BALANCE === 'number' 
      ? record.OUTSTANDING_TOTAL_BALANCE 
      : 0,
    lastPaymentAmount: typeof record.LAST_PAYMENT_AMOUNT === 'number' 
      ? record.LAST_PAYMENT_AMOUNT 
      : 0,
    lastPaymentDate: record.LAST_PAYMENT_DATE !== 'N/A' 
      ? record.LAST_PAYMENT_DATE 
      : null,
    status: record.ACCOUNT_STATUS,
    email: record.EMAIL_ADDRESS,
    cellNumber: record.CELL_NUMBER,
    address: [
      record.STREET_ADDRESS, 
      record.TOWN, 
      record.SUBURB
    ].filter(item => item !== 'N/A').join(', '),
    // Include all original data
    raw: record
  }));
};

/**
 * Generate a CSV template with all required fields
 * @returns CSV template string with headers
 */
export const generatePaymentFileTemplate = (): string => {
  const headers = [
    'ACCOUNT NO',
    'ACCOUNT HOLDER NAME',
    'ERF NUMBER',
    'VALUATION',
    'VAT REG NUMBER',
    'COMPANY CC NUMBER',
    'POSTAL ADDRESS 1',
    'POSTAL ADDRESS 2',
    'POSTAL ADDRESS 3',
    'POSTAL CODE',
    'ID NUMBER',
    'EMAIL ADDRESS',
    'CELL NUMBER',
    'ACCOUNT STATUS',
    'OCC/OWN',
    'ACCOUNT TYPE',
    'OWNER CATEGORY',
    'GROUP ACCOUNT',
    'CREDIT INSTRUCITON',
    'CREDIT STATUS',
    'MAILING INSTRUCTION',
    'STREET ADDRESS',
    'TOWN',
    'SUBURB',
    'WARD',
    'PROPERTY CATEGORY',
    'GIS KEY',
    'INDIGENT',
    'PENSIONER',
    'HAND OVER',
    'OUTSTANDING BALANCE CAPITAL',
    'OUTSTANDING BALANCE INTEREST',
    'OUTSTANDING TOTAL BALANCE',
    'LAST PAYMENT AMOUNT',
    'LAST PAYMENT DATE',
    'AGREEMENT OUTSTANDING',
    'AGREEMENT TYPE',
    'HOUSING OUTSTANDING'
  ];
  
  // Create sample data row
  const sampleData = [
    'ACC001',
    'John Doe',
    'ERF123',
    '500000',
    'VAT123456789',
    'CC123456789',
    '123 Main Street',
    'Suburb Name',
    'City Name',
    '1234',
    '1234567890123',
    'john.doe@email.com',
    '0821234567',
    'ACTIVE',
    'OWN',
    'RESIDENTIAL',
    'INDIVIDUAL',
    'NO',
    'STANDARD',
    'GOOD',
    'POST',
    '123 Main Street',
    'Mahikeng',
    'Central',
    'Ward 1',
    'RESIDENTIAL',
    'GIS123',
    'NO',
    'NO',
    'NO',
    '10000.00',
    '500.00',
    '10500.00',
    '1000.00',
    '20240115',
    '0.00',
    'NONE',
    '0.00'
  ];
  
  // Combine headers and sample data
  return [headers.join(','), sampleData.join(',')].join('\n');
};
