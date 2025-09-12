# University of Venda Custom Dashboard Setup Summary

## Overview
This document summarizes the changes made to create a custom dashboard for The University of Venda (Univen) with their specific data requirements.

## Files Created/Modified

### 1. Custom Customer Page
**File**: `app/user/customers/univen/[id]/page.tsx`
- Created a custom customer profile page specifically for University of Venda
- Includes all the specific data fields Univen requested:
  - Client Reference, Interest rate, Interest date, In Duplum
  - Masked Client Reference, Client, Client Group, Status, Status Date
  - Debtor under DC?, Debtor Status Date, Days Overdue, Client Division
  - Old Client Ref, Client Profile Account, EasyPay Reference
  - Original Cost, Capital on Default, Date Opened, Hand Over Date
  - Hand Over Amount, Payments To Date, Interest To Date
  - Adjustments To Date, Fees & Expenses, Collection Commission
  - FCC (excl VAT), Current Balance, Capital Amount
  - Last Payment Method, Days since Last Payment, Last Payment Date
  - Last Payment Amount, Outbound Phone Call Outcome
  - Outbound Phone Call Comment, Last Inbound Phone Call Date
  - Inbound Phone Call Outcome, Cellphone fields (1-4)
  - Email fields (1-3), Street Address fields (1-4)
  - Street Code, Combined Street, Gender, Occupation
  - Employer Name, Employer Contact, Last Contact
  - ID Number, Title, Initials, First Name, Second Name, Surname
  - Account Load Date, Debtor Flags, Account Flags
  - Linked Account, Bucket, Campaign Exclusions, Error, Original Line

### 2. Tenant Service Update
**File**: `lib/tenant-service.ts`
- Modified the `extractSubdomain` function to include 'univen' as a valid subdomain

### 3. Database Setup Script
**File**: `scripts/add-univen-tenant.sql`
- Created SQL script to add University of Venda as a tenant in the database
- Inserts tenant record with subdomain 'univen' and domain 'univen.smartkollect.co.za'

### 4. Next.js Configuration
**File**: `next.config.js`
- Added 'univen.smartkollect.co.za' to allowed origins
- Added redirect rule for www.univen.smartkollect.co.za

### 5. Middleware Update
**File**: `middleware.ts`
- Added special routing logic for University of Venda subdomain
- Routes customer profile requests to the custom Univen customer page

### 6. Directory Structure
**Directories Created**:
- `app/user/customers/univen/`
- `app/user/customers/univen/[id]/`

**Files Created**:
- `app/user/customers/univen/layout.tsx` - Layout for Univen customer pages
- `app/user/customers/univen/page.tsx` - Main Univen customers page
- `app/user/customers/univen/[id]/test-page.tsx` - Test page for verification

### 7. Documentation
**Files Created**:
- `docs/univen-setup.md` - Detailed setup documentation
- `SETUP_SUMMARY.md` - This summary file

## Implementation Details

### Domain Routing
- The subdomain `univen.smartkollect.co.za` will automatically route to the custom customer pages
- All other functionality remains the same as the standard SmartKollect interface

### Data Structure
- The custom page is designed to work with the existing Debtors table structure
- Maps University of Venda specific field names to the standard database fields
- Maintains compatibility with existing SmartKollect features

### UI/UX Features
- Custom financial summary section with University of Venda specific metrics
- Organized sections for different data categories:
  - Client Information
  - Account Details
  - Contact Information
  - Address Information
  - Employment Information
  - Account Management Information
- University of Venda branding elements
- Responsive design that works on all device sizes

## Testing

To test the University of Venda setup:
1. Run the SQL script to add the tenant to the database
2. Access `univen.smartkollect.co.za` 
3. Log in with a University of Venda agent account
4. Navigate to the customer list
5. Open a customer profile to see the custom University of Venda layout

## Maintenance

For future updates to the University of Venda custom page:
1. Modify `app/user/customers/univen/[id]/page.tsx`
2. Test changes on a development environment
3. Deploy to production

## Support

For issues with the University of Venda tenant setup, contact the SmartKollect development team.