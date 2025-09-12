# University of Venda Master File Import Script

This script imports Excel data into the `univen_customers` table in Supabase.

## Prerequisites

1. Node.js v18 or higher
2. An Excel file with the University of Venda master data
3. Properly configured Supabase environment variables

## Installation

1. Navigate to the scripts directory:
   ```bash
   cd c:\Users\tjmar\OneDrive\Documents\GitHub\Smart-Kollect\scripts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Ensure your Supabase credentials are configured in the `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Usage

### Default Usage (file in Downloads folder)
If your Excel file is named `univen_master_file.xlsx` and is in your Downloads folder:
```bash
npm run import
```

Or directly:
```bash
node import-univen-master-file.js
```

### Custom File Path
If your Excel file is in a different location:
```bash
npm run import:custom "C:\path\to\your\file.xlsx"
```

Or directly:
```bash
node import-univen-master-file.js "C:\path\to\your\file.xlsx"
```

## Excel File Format

The script expects the Excel file to have column headers that match the following mapping:

### Client Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Client Reference          | "Client Reference"       |
| Interest rate             | "Interest rate"          |
| Interest date             | "Interest date"          |
| In Duplum                 | "In Duplum"              |
| Masked Client Reference   | "Masked Client Reference"|
| Client                    | "Client"                 |
| Client Group              | "Client Group"           |
| Status                    | "Status"                 |
| Status Date               | "Status Date"            |
| Debtor under DC?          | "Debtor under DC?"       |
| Debtor Status Date        | "Debtor Status Date"     |
| Days Overdue              | "Days Overdue"           |
| Client Division           | "Client Division"        |
| Old Client Ref            | "Old Client Ref"         |
| Client Profile Account    | "Client Profile Account" |
| EasyPay Reference         | "EasyPay Reference"      |

### Financial Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Original Cost             | "Original Cost"          |
| Capital on Default        | "Capital on Default"     |
| Date Opened               | "Date Opened"            |
| Hand Over Date            | "Hand Over Date"         |
| Hand Over Amount          | "Hand Over Amount"       |
| Payments To Date          | "Payments To Date"       |
| Interest To Date          | "Interest To Date"       |
| Adjustments To Date       | "Adjustments To Date"    |
| Fees & Expenses           | "Fees & Expenses"        |
| Collection Commission     | "Collection Commission"  |
| FCC (excl VAT)            | "FCC (excl VAT)"         |
| Current Balance           | "Current Balance"        |
| Capital Amount            | "Capital Amount"         |

### Payment Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Last Payment Method       | "Last Payment Method"    |
| Days since Last Payment   | "Days since Last Payment"|
| Last Payment Date         | "Last Payment Date"      |
| Last Payment Amount       | "Last Payment Amount"    |

### Call Information
| Excel Column Header              | Database Field                 |
|---------------------------------|--------------------------------|
| Outbound Phone Call Outcome     | "Outbound Phone Call Outcome"  |
| Outbound Phone Call Comment     | "Outbound Phone Call Comment"  |
| Last Inbound Phone Call Date    | "Last Inbound Phone Call Date" |
| Inbound Phone Call Outcome      | "Inbound Phone Call Outcome"   |

### Contact Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Cellphone                 | "Cellphone"              |
| Cellphone 2               | "Cellphone 2"            |
| Cellphone 3               | "Cellphone 3"            |
| Cellphone 4               | "Cellphone 4"            |
| Email                     | "Email"                  |
| Email 2                   | "Email 2"                |
| Email 3                   | "Email 3"                |

### Address Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Street Address 1          | "Street Address 1"       |
| Street Address 2          | "Street Address 2"       |
| Street Address 3          | "Street Address 3"       |
| Street Address 4          | "Street Address 4"       |
| Street Code               | "Street Code"            |
| Combined Street           | "Combined Street"        |

### Personal Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Gender                    | "Gender"                 |
| Occupation                | "Occupation"             |
| Employer Name             | "Employer Name"          |
| Employer Contact          | "Employer Contact"       |
| Last Contact              | "Last Contact"           |
| ID Number                 | "ID Number"              |
| Title                     | "Title"                  |
| Initials                  | "Initials"               |
| First Name                | "First Name"             |
| Second Name               | "Second Name"            |
| Surname                   | "Surname"                |

### Account Information
| Excel Column Header        | Database Field           |
|---------------------------|--------------------------|
| Account Load Date         | "Account Load Date"      |
| Debtor Flags              | "Debtor Flags"           |
| Account Flags             | "Account Flags"          |
| Linked Account            | "Linked Account"         |
| Bucket                    | "Bucket"                 |
| Campaign Exclusions       | "Campaign Exclusions"    |
| Original Line             | "Original Line"          |
| error                     | "error"                  |

## How It Works

1. Reads the Excel file using the `xlsx` library
2. Maps Excel columns to database fields using the column mapping
3. Converts data types (dates, currency, integers) as needed
4. Retrieves the University of Venda tenant ID
5. Inserts data into the `univen_customers` table in batches of 1000 records
6. Verifies the import by counting records

## Error Handling

- The script will continue importing even if some batches fail
- Detailed error messages are displayed for troubleshooting
- Data type conversions are handled gracefully

## Troubleshooting

### "File not found" error
Make sure your Excel file is named `univen_master_file.xlsx` and is in your Downloads folder, or provide the full path to the file.

### "University of Venda tenant not found" error
Run the tenant setup script first:
```sql
INSERT INTO tenants (name, subdomain, domain, status)
VALUES ('University of Venda', 'univen', 'univen.smartkollect.co.za', 'active')
ON CONFLICT (subdomain) DO NOTHING;
```

### Authentication errors
Ensure your `SUPABASE_SERVICE_ROLE_KEY` is correct and has the necessary permissions.

## Customization

You can modify the `columnMapping` object in the script to match your specific Excel file structure if needed.