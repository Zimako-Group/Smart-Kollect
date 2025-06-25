import * as XLSX from 'xlsx';

export interface AccountRecord {
  // New fields
  acc_number: string;
  acc_holder: string;
  surname_company_trust: string;
  name: string;
  initials: string;
  street_addr: string;
  post_addr_1: string;
  post_addr_2: string;
  post_addr_3: string;
  post_code: string;
  work_addr_1: string;
  work_addr_2: string;
  home_tel: string;
  work_tel: string;
  cell_number: string;
  cell_number2: string;
  // Additional cellphone fields
  cellphone_1: string;
  cellphone_2: string;
  cellphone_3: string;
  cellphone_4: string;
  id_number_1: string;
  id_number_2: string;
  email_addr_1: string;
  email_addr_2: string;
  vat_reg_no: string;
  easypay_number: string;
  account_status_code: string;
  account_status_description: string;
  account_type_code: string;
  account_type_description: string;
  sub_account_type_code: string;
  sub_account_type_description: string;
  owner_type_code: string;
  owner_type_description: string;
  group_account_number: string;
  date_opened: string;
  ward_code: string;
  ward_description: string;
  street_name: string;
  street_number: string;
  property_category_code: string;
  property_category_description: string;
  usage_code: string;
  usage_desc: string;
  market_value: string | number;
  outstanding_balance: string | number;
  last_payment_amount: string | number;
  last_payment_date: string;
  indigent_yn: string;
  indigent_exp_date: string;
  pensioner_yn: string;
  
  [key: string]: any; // Allow for additional fields
}

export interface ValidationResult {
  validRecords: AccountRecord[];
  invalidRecords: { record: AccountRecord; issues: string[] }[];
}

/**
 * Normalize field names by converting to lowercase and replacing spaces with underscores
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName.toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Map common variations of field names to our standardized fields
 */
function mapFieldName(fieldName: string): string {
  const normalizedField = normalizeFieldName(fieldName);
  
  const fieldMappings: Record<string, string> = {
    // Account number variations
    'account_number': 'acc_number',
    'account_no': 'acc_number',
    'acc_no': 'acc_number',
    
    // Account holder variations
    'account_holder': 'acc_holder',
    'account_holder_name': 'acc_holder',
    'holder_name': 'acc_holder',
    
    // Surname/Company/Trust variations
    'surname_company': 'surname_company_trust',
    'company_name': 'surname_company_trust',
    'trust_name': 'surname_company_trust',
    'surname': 'surname_company_trust',
    'last_name': 'surname_company_trust',
    
    // Name variations
    'first_name': 'name',
    'firstname': 'name',
    'debtor_name': 'name',
    
    // Initials variations
    'initial': 'initials',
    
    // Address variations
    'street_address': 'street_addr',
    'street': 'street_addr',
    'postal_address_1': 'post_addr_1',
    'postal_address_2': 'post_addr_2',
    'postal_address_3': 'post_addr_3',
    'postal_code': 'post_code',
    'zip_code': 'post_code',
    'zip': 'post_code',
    'work_address_1': 'work_addr_1',
    'work_address_2': 'work_addr_2',
    
    // Phone variations
    'home_phone': 'home_tel',
    'home_telephone': 'home_tel',
    'work_phone': 'work_tel',
    'work_telephone': 'work_tel',
    'office_tel': 'work_tel',
    'cell': 'cell_number',
    'mobile': 'cell_number',
    'mobile_number': 'cell_number',
    'cell_phone': 'cell_number',
    'cellphone': 'cell_number',
    'phone': 'cell_number',
    'mobile2': 'cell_number2',
    'cellphone2': 'cell_number2',
    'cell_phone2': 'cell_number2',
    'alternative_cell': 'cell_number2',
    // New cellphone variations
    'cell1': 'cellphone_1',
    'cellphone1': 'cellphone_1',
    'cell_phone1': 'cellphone_1',
    'cell2': 'cellphone_2',
    // 'cellphone2' is already mapped to 'cell_number2' above
    // 'cell_phone2' is already mapped to 'cell_number2' above
    'cell3': 'cellphone_3',
    'cellphone3': 'cellphone_3',
    'cell_phone3': 'cellphone_3',
    'mobile3': 'cellphone_3',
    'cell4': 'cellphone_4',
    'cellphone4': 'cellphone_4',
    'cell_phone4': 'cellphone_4',
    'mobile4': 'cellphone_4',
    'cell_1': 'cellphone_1',
    'cell_2': 'cellphone_2',
    'cell_3': 'cellphone_3',
    'cell_4': 'cellphone_4',
    // 'mobile1' would conflict with 'mobile' above
    // 'mobile2' would conflict with 'mobile2' above
    'mobile_1': 'cellphone_1',
    'mobile_2': 'cellphone_2',
    'mobile_3': 'cellphone_3',
    'mobile_4': 'cellphone_4',
    'phone_1': 'cellphone_1',
    'phone_2': 'cellphone_2',
    'phone_3': 'cellphone_3',
    'phone_4': 'cellphone_4',
    'telephone_1': 'cellphone_1',
    'telephone_2': 'cellphone_2',
    'telephone_3': 'cellphone_3',
    'telephone_4': 'cellphone_4',
    
    // ID variations
    'id': 'id_number_1',
    'id_no': 'id_number_1',
    'id_number': 'id_number_1',
    'identity_number': 'id_number_1',
    'id1': 'id_number_1',
    'id2': 'id_number_2',
    
    // Email variations
    'email': 'email_addr_1',
    'email_address': 'email_addr_1',
    'emailaddress': 'email_addr_1',
    'email1': 'email_addr_1',
    'email2': 'email_addr_2',
    
    // VAT variations
    'vat_number': 'vat_reg_no',
    'vat_registration': 'vat_reg_no',
    'vat': 'vat_reg_no',
    
    // Easypay variations
    'easypay': 'easypay_number',
    'easypay_reference': 'easypay_number',
    'easy_pay_ref': 'easypay_number',
    
    // Status variations
    'status_code': 'account_status_code',
    'status_description': 'account_status_description',
    'type_code': 'account_type_code',
    'type_description': 'account_type_description',
    'sub_type_code': 'sub_account_type_code',
    'sub_type_description': 'sub_account_type_description',
    'owner_code': 'owner_type_code',
    'owner_description': 'owner_type_description',
    
    // Account group variations
    'group_account': 'group_account_number',
    'group_acc': 'group_account_number',
    
    // Date variations
    'date_open': 'date_opened',
    'opening_date': 'date_opened',
    
    // Ward variations
    'ward': 'ward_code',
    'ward_desc': 'ward_description',
    
    // Street variations
    'street_no': 'street_number',
    
    // Property variations
    'property_category': 'property_category_code',
    'property_description': 'property_category_description',
    'usage': 'usage_code',
    'usage_description': 'usage_desc',
    'market_val': 'market_value',
    'property_value': 'market_value',
    
    // Balance variations
    'balance': 'outstanding_balance',
    'current_amt': 'outstanding_balance',
    'outstanding': 'outstanding_balance',
    'balance_outstanding': 'outstanding_balance',
    
    // Payment variations
    'last_pmt_amount': 'last_payment_amount',
    'last_amount': 'last_payment_amount',
    'last_pmt': 'last_payment_date',
    'last_payment': 'last_payment_date',
    
    // Special flags
    'indigent': 'indigent_yn',
    'indigent_expiry': 'indigent_exp_date',
    'indigent_expiry_date': 'indigent_exp_date',
    'pensioner': 'pensioner_yn',
  };
  
  return fieldMappings[normalizedField] || normalizedField;
}

/**
 * Parse a spreadsheet file (XLS, XLSX, CSV) and extract account records
 */
export async function parseSpreadsheetFile(file: File): Promise<{
  records: AccountRecord[];
  errors: string[];
  warnings: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
        
        if (jsonData.length < 2) {
          errors.push('File contains insufficient data. Please ensure it has headers and at least one record.');
          resolve({ records: [], errors, warnings });
          return;
        }
        
        // Extract headers (first row)
        const headers = (jsonData[0] as string[]).map((header) => {
          if (!header) {
            warnings.push('Found empty header column. This column will be ignored.');
            return '';
          }
          return mapFieldName(header.toString());
        });
        
        // Check for required fields
        const requiredFields = ['name', 'id_number_1', 'cell_number'];
        const missingRequiredFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingRequiredFields.length > 0) {
          warnings.push(`Missing recommended fields: ${missingRequiredFields.join(', ')}. These will be set to N/A.`);
        }
        
        // Process rows (skip header row)
        const records: AccountRecord[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Skip empty rows
          if (row.every(cell => cell === null || cell === '')) {
            continue;
          }
          
          // Create a record with all fields initialized to N/A
          const record: AccountRecord = {
            acc_number: 'N/A',
            acc_holder: 'N/A',
            surname_company_trust: 'N/A',
            name: 'N/A',
            initials: 'N/A',
            street_addr: 'N/A',
            post_addr_1: 'N/A',
            post_addr_2: 'N/A',
            post_addr_3: 'N/A',
            post_code: 'N/A',
            work_addr_1: 'N/A',
            work_addr_2: 'N/A',
            home_tel: 'N/A',
            work_tel: 'N/A',
            cell_number: 'N/A',
            cell_number2: 'N/A',
            cellphone_1: 'N/A',
            cellphone_2: 'N/A',
            cellphone_3: 'N/A',
            cellphone_4: 'N/A',
            id_number_1: 'N/A',
            id_number_2: 'N/A',
            email_addr_1: 'N/A',
            email_addr_2: 'N/A',
            vat_reg_no: 'N/A',
            easypay_number: 'N/A',
            account_status_code: 'N/A',
            account_status_description: 'N/A',
            account_type_code: 'N/A',
            account_type_description: 'N/A',
            sub_account_type_code: 'N/A',
            sub_account_type_description: 'N/A',
            owner_type_code: 'N/A',
            owner_type_description: 'N/A',
            group_account_number: 'N/A',
            date_opened: 'N/A',
            ward_code: 'N/A',
            ward_description: 'N/A',
            street_name: 'N/A',
            street_number: 'N/A',
            property_category_code: 'N/A',
            property_category_description: 'N/A',
            usage_code: 'N/A',
            usage_desc: 'N/A',
            market_value: 'N/A',
            outstanding_balance: 'N/A',
            last_payment_amount: 'N/A',
            last_payment_date: 'N/A',
            indigent_yn: 'N/A',
            indigent_exp_date: 'N/A',
            pensioner_yn: 'N/A'
          };
          
          // Fill in values from the row
          headers.forEach((header, index) => {
            if (header && index < row.length) {
              const value = row[index];
              
              // Handle empty or null values
              if (value === null || value === '') {
                record[header] = 'N/A';
              } else {
                record[header] = value;
              }
            }
          });
          
          records.push(record);
        }
        
        resolve({ records, errors, warnings });
      } catch (error) {
        errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        resolve({ records: [], errors, warnings });
      }
    };
    
    reader.onerror = () => {
      errors.push('Error reading file. Please try again.');
      resolve({ records: [], errors, warnings });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate account records for common issues
 */
export function validateAccountRecords(records: AccountRecord[]): ValidationResult {
  const validRecords: AccountRecord[] = [];
  const invalidRecords: { record: AccountRecord; issues: string[] }[] = [];
  
  records.forEach(record => {
    const issues: string[] = [];
    
    // Check for valid ID number (should be numeric and 13 digits for SA ID)
    if (record.id_number_1 !== 'N/A' && !/^\d{13}$/.test(record.id_number_1.toString().replace(/\s/g, ''))) {
      issues.push('Invalid ID number format. Should be 13 digits.');
    }
    
    // Check for valid email format
    if (record.email_addr_1 !== 'N/A' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email_addr_1.toString())) {
      issues.push('Invalid email format for primary email.');
    }
    
    if (record.email_addr_2 !== 'N/A' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email_addr_2.toString())) {
      issues.push('Invalid email format for secondary email.');
    }
    
    // Check for valid cellphone format (should be numeric)
    if (record.cell_number !== 'N/A' && !/^[+]?\d+$/.test(record.cell_number.toString().replace(/\s/g, ''))) {
      issues.push('Invalid cellphone format. Should contain only numbers and possibly a + prefix.');
    }
    
    if (record.cell_number2 !== 'N/A' && !/^[+]?\d+$/.test(record.cell_number2.toString().replace(/\s/g, ''))) {
      issues.push('Invalid secondary cellphone format. Should contain only numbers and possibly a + prefix.');
    }
    
    // Check for valid format for additional cellphone fields
    if (record.cellphone_1 !== 'N/A' && !/^[+]?\d+$/.test(record.cellphone_1.toString().replace(/\s/g, ''))) {
      issues.push('Invalid cellphone 1 format. Should contain only numbers and possibly a + prefix.');
    }
    
    if (record.cellphone_2 !== 'N/A' && !/^[+]?\d+$/.test(record.cellphone_2.toString().replace(/\s/g, ''))) {
      issues.push('Invalid cellphone 2 format. Should contain only numbers and possibly a + prefix.');
    }
    
    if (record.cellphone_3 !== 'N/A' && !/^[+]?\d+$/.test(record.cellphone_3.toString().replace(/\s/g, ''))) {
      issues.push('Invalid cellphone 3 format. Should contain only numbers and possibly a + prefix.');
    }
    
    if (record.cellphone_4 !== 'N/A' && !/^[+]?\d+$/.test(record.cellphone_4.toString().replace(/\s/g, ''))) {
      issues.push('Invalid cellphone 4 format. Should contain only numbers and possibly a + prefix.');
    }
    
    // Check for numeric values in amount fields
    const numericFields = [
      'market_value', 'outstanding_balance', 'last_payment_amount'
    ];
    numericFields.forEach(field => {
      if (record[field] !== 'N/A' && isNaN(Number(record[field]))) {
        issues.push(`Invalid ${field.replace(/_/g, ' ')}. Should be a number.`);
      }
    });
    
    // Check for valid date format in date fields
    const dateFields = [
      'date_opened', 'last_payment_date', 'indigent_exp_date'
    ];
    dateFields.forEach(field => {
      if (record[field] !== 'N/A') {
        const dateValue = record[field].toString();
        // Try to parse as date
        const parsedDate = new Date(dateValue);
        if (isNaN(parsedDate.getTime())) {
          issues.push(`Invalid ${field.replace(/_/g, ' ')} format. Should be a valid date.`);
        }
      }
    });
    
    if (issues.length > 0) {
      invalidRecords.push({ record, issues });
    } else {
      validRecords.push(record);
    }
  });
  
  return { validRecords, invalidRecords };
}

/**
 * Format account records for display or export
 */
export function formatAccountRecords(records: AccountRecord[]): AccountRecord[] {
  return records.map(record => {
    const formattedRecord = { ...record };
    
    // Format currency values
    const currencyFields = [
      'market_value', 'outstanding_balance', 'last_payment_amount'
    ];
    currencyFields.forEach(field => {
      if (formattedRecord[field] !== 'N/A' && !isNaN(Number(formattedRecord[field]))) {
        formattedRecord[field] = Number(formattedRecord[field]).toFixed(2);
      }
    });
    
    // Format date values
    const dateFields = [
      'date_opened', 'last_payment_date', 'indigent_exp_date'
    ];
    dateFields.forEach(field => {
      if (formattedRecord[field] !== 'N/A') {
        try {
          const date = new Date(formattedRecord[field].toString());
          if (!isNaN(date.getTime())) {
            formattedRecord[field] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (e) {
          // Keep original value if date parsing fails
        }
      }
    });
    
    return formattedRecord;
  });
}
