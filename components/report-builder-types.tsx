import {
  Users,
  CreditCard,
  Clock,
  Percent,
  Activity,
  FileText,
  AlertCircle,
} from "lucide-react";

// Define comprehensive data source configurations
export const DATA_SOURCES = {
  debtors: {
    name: 'Debtors',
    table: 'Debtors',
    icon: <Users className="h-4 w-4" />,
    description: 'Complete debtor information including personal details, contact info, and balances',
    primaryKey: 'id',
    fields: {
      // Basic Info
      id: { label: 'ID', type: 'text', category: 'Basic' },
      acc_number: { label: 'Account Number', type: 'text', category: 'Basic' },
      acc_holder: { label: 'Account Holder', type: 'text', category: 'Basic' },
      name: { label: 'First Name', type: 'text', category: 'Basic' },
      surname_company_trust: { label: 'Surname/Company', type: 'text', category: 'Basic' },
      initials: { label: 'Initials', type: 'text', category: 'Basic' },
      
      // Contact Information
      home_tel: { label: 'Home Telephone', type: 'text', category: 'Contact' },
      work_tel: { label: 'Work Telephone', type: 'text', category: 'Contact' },
      cellphone_1: { label: 'Primary Cell', type: 'text', category: 'Contact' },
      cellphone_2: { label: 'Secondary Cell', type: 'text', category: 'Contact' },
      cellphone_3: { label: 'Tertiary Cell', type: 'text', category: 'Contact' },
      cell_number: { label: 'Cell Number', type: 'text', category: 'Contact' },
      email_addr_1: { label: 'Primary Email', type: 'text', category: 'Contact' },
      email_addr_2: { label: 'Secondary Email', type: 'text', category: 'Contact' },
      
      // Address Information
      street_addr: { label: 'Street Address', type: 'text', category: 'Address' },
      post_addr_1: { label: 'Postal Address 1', type: 'text', category: 'Address' },
      post_addr_2: { label: 'Postal Address 2', type: 'text', category: 'Address' },
      post_addr_3: { label: 'Postal Address 3', type: 'text', category: 'Address' },
      post_code: { label: 'Postal Code', type: 'text', category: 'Address' },
      work_addr_1: { label: 'Work Address 1', type: 'text', category: 'Address' },
      work_addr_2: { label: 'Work Address 2', type: 'text', category: 'Address' },
      
      // Financial Information
      outstanding_balance: { label: 'Outstanding Balance', type: 'currency', category: 'Financial' },
      last_payment_amount: { label: 'Last Payment Amount', type: 'currency', category: 'Financial' },
      last_payment_date: { label: 'Last Payment Date', type: 'date', category: 'Financial' },
      market_value: { label: 'Market Value', type: 'currency', category: 'Financial' },
      
      // Account Classification
      account_status_code: { label: 'Account Status Code', type: 'text', category: 'Classification' },
      account_status_description: { label: 'Account Status', type: 'text', category: 'Classification' },
      account_type_code: { label: 'Account Type Code', type: 'text', category: 'Classification' },
      account_type_description: { label: 'Account Type', type: 'text', category: 'Classification' },
      sub_account_type_code: { label: 'Sub Account Type Code', type: 'text', category: 'Classification' },
      sub_account_type_description: { label: 'Sub Account Type', type: 'text', category: 'Classification' },
      owner_type_code: { label: 'Owner Type Code', type: 'text', category: 'Classification' },
      owner_type_description: { label: 'Owner Type', type: 'text', category: 'Classification' },
      risk_level: { label: 'Risk Level', type: 'text', category: 'Classification' },
      
      // Property Information
      ward_code: { label: 'Ward Code', type: 'text', category: 'Property' },
      ward_description: { label: 'Ward Description', type: 'text', category: 'Property' },
      property_category_code: { label: 'Property Category Code', type: 'text', category: 'Property' },
      property_category_description: { label: 'Property Category', type: 'text', category: 'Property' },
      usage_code: { label: 'Usage Code', type: 'text', category: 'Property' },
      usage_desc: { label: 'Usage Description', type: 'text', category: 'Property' },
      
      // Special Classifications
      indigent_yn: { label: 'Indigent Status', type: 'text', category: 'Special' },
      indigent_exp_date: { label: 'Indigent Expiry Date', type: 'date', category: 'Special' },
      pensioner_yn: { label: 'Pensioner Status', type: 'text', category: 'Special' },
      
      // System Fields
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
      updated_at: { label: 'Last Updated', type: 'datetime', category: 'System' },
      batch_id: { label: 'Batch ID', type: 'text', category: 'System' },
    }
  },
  
  payments: {
    name: 'Payments',
    table: 'Payments',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Payment transactions and history',
    primaryKey: 'id',
    fields: {
      id: { label: 'Payment ID', type: 'text', category: 'Basic' },
      debtor_id: { label: 'Debtor ID', type: 'text', category: 'Basic' },
      account_number: { label: 'Account Number', type: 'text', category: 'Basic' },
      amount: { label: 'Payment Amount', type: 'currency', category: 'Financial' },
      payment_date: { label: 'Payment Date', type: 'date', category: 'Financial' },
      payment_method: { label: 'Payment Method', type: 'text', category: 'Financial' },
      reference_number: { label: 'Reference Number', type: 'text', category: 'Financial' },
      description: { label: 'Description', type: 'text', category: 'Basic' },
      recorded_by: { label: 'Recorded By', type: 'text', category: 'System' },
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
      updated_at: { label: 'Updated Date', type: 'datetime', category: 'System' },
    }
  },
  
  ptp: {
    name: 'Promise to Pay (PTP)',
    table: 'PTP',
    icon: <Clock className="h-4 w-4" />,
    description: 'Payment promises and arrangements',
    primaryKey: 'id',
    fields: {
      id: { label: 'PTP ID', type: 'text', category: 'Basic' },
      debtor_id: { label: 'Debtor ID', type: 'text', category: 'Basic' },
      amount: { label: 'PTP Amount', type: 'currency', category: 'Financial' },
      date: { label: 'Promise Date', type: 'date', category: 'Financial' },
      payment_method: { label: 'Payment Method', type: 'text', category: 'Financial' },
      notes: { label: 'Notes', type: 'text', category: 'Basic' },
      status: { label: 'Status', type: 'text', category: 'Basic' },
      created_by: { label: 'Created By', type: 'text', category: 'System' },
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
      updated_at: { label: 'Updated Date', type: 'datetime', category: 'System' },
    }
  },
  
  settlements: {
    name: 'Settlements',
    table: 'Settlements',
    icon: <Percent className="h-4 w-4" />,
    description: 'Settlement offers and agreements',
    primaryKey: 'id',
    fields: {
      id: { label: 'Settlement ID', type: 'text', category: 'Basic' },
      customer_id: { label: 'Customer ID', type: 'text', category: 'Basic' },
      customer_name: { label: 'Customer Name', type: 'text', category: 'Basic' },
      account_number: { label: 'Account Number', type: 'text', category: 'Basic' },
      original_amount: { label: 'Original Amount', type: 'currency', category: 'Financial' },
      settlement_amount: { label: 'Settlement Amount', type: 'currency', category: 'Financial' },
      discount_percentage: { label: 'Discount %', type: 'percentage', category: 'Financial' },
      description: { label: 'Description', type: 'text', category: 'Basic' },
      status: { label: 'Status', type: 'text', category: 'Basic' },
      expiry_date: { label: 'Expiry Date', type: 'date', category: 'Financial' },
      agent_name: { label: 'Agent Name', type: 'text', category: 'System' },
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
    }
  },
  
  paymentHistory: {
    name: 'Payment History',
    table: 'PaymentHistory',
    icon: <Activity className="h-4 w-4" />,
    description: 'Historical payment data from weekly uploads',
    primaryKey: 'id',
    fields: {
      id: { label: 'Record ID', type: 'text', category: 'Basic' },
      debtor_id: { label: 'Debtor ID', type: 'text', category: 'Basic' },
      account_no: { label: 'Account Number', type: 'text', category: 'Basic' },
      account_holder_name: { label: 'Account Holder', type: 'text', category: 'Basic' },
      account_status: { label: 'Account Status', type: 'text', category: 'Basic' },
      outstanding_total_balance: { label: 'Outstanding Balance', type: 'currency', category: 'Financial' },
      last_payment_amount: { label: 'Last Payment Amount', type: 'currency', category: 'Financial' },
      last_payment_date: { label: 'Last Payment Date', type: 'date', category: 'Financial' },
      data_week: { label: 'Data Week', type: 'date', category: 'System' },
      processed_at: { label: 'Processed Date', type: 'datetime', category: 'System' },
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
    }
  },
  
  notes: {
    name: 'Notes',
    table: 'notes',
    icon: <FileText className="h-4 w-4" />,
    description: 'Customer notes and communications',
    primaryKey: 'id',
    fields: {
      id: { label: 'Note ID', type: 'text', category: 'Basic' },
      customer_id: { label: 'Customer ID', type: 'text', category: 'Basic' },
      note: { label: 'Note Content', type: 'text', category: 'Basic' },
      created_by: { label: 'Created By', type: 'text', category: 'System' },
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
    }
  },
  
  flags: {
    name: 'Account Flags',
    table: 'flags',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Account flags and alerts',
    primaryKey: 'id',
    fields: {
      id: { label: 'Flag ID', type: 'text', category: 'Basic' },
      customer_id: { label: 'Customer ID', type: 'text', category: 'Basic' },
      type: { label: 'Flag Type', type: 'text', category: 'Basic' },
      priority: { label: 'Priority', type: 'text', category: 'Basic' },
      notes: { label: 'Notes', type: 'text', category: 'Basic' },
      is_resolved: { label: 'Resolved', type: 'boolean', category: 'Basic' },
      created_by: { label: 'Created By', type: 'text', category: 'System' },
      created_at: { label: 'Created Date', type: 'datetime', category: 'System' },
      resolved_at: { label: 'Resolved Date', type: 'datetime', category: 'System' },
      resolved_by: { label: 'Resolved By', type: 'text', category: 'System' },
    }
  },
};

// Report configuration interface
export interface ReportConfig {
  name: string;
  description: string;
  dataSources: string[];
  selectedFields: Record<string, string[]>;
  filters: FilterCondition[];
  groupBy: string[];
  orderBy: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  joins: JoinConfig[];
  aggregations: AggregationConfig[];
  visualization: {
    type: 'table' | 'chart';
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    xAxis?: string;
    yAxis?: string;
  };
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  value2?: any; // For 'between' operator
}

export interface JoinConfig {
  leftTable: string;
  rightTable: string;
  leftField: string;
  rightField: string;
  type: 'inner' | 'left' | 'right' | 'full';
}

export interface AggregationConfig {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  alias: string;
}