# University of Venda Tenant Setup

This document explains how to set up and configure the University of Venda (Univen) tenant in the SmartKollect system.

## Overview

The University of Venda has been added as a new tenant with the subdomain `univen.smartkollect.co.za`. This tenant has a custom customer profile page that displays their specific data fields.

## Setup Steps

### 1. Database Configuration

Run the following SQL script to add the University of Venda tenant to the database:

```sql
INSERT INTO tenants (name, subdomain, domain) VALUES 
  ('University of Venda', 'univen', 'univen.smartkollect.co.za')
ON CONFLICT (subdomain) DO NOTHING;
```

This script is located at `scripts/add-univen-tenant.sql`.

### 2. Tenant Data Import

The University of Venda will need to import their customer data with the following fields:

- Client Reference
- Interest rate
- Interest date
- In Duplum
- Masked Client Reference
- Client
- Client Group
- Status
- Status Date
- Debtor under DC?
- Debtor Status Date
- Days Overdue
- Client Division
- Old Client Ref
- Client Profile Account
- EasyPay Reference
- Original Cost
- Capital on Default
- Date Opened
- Hand Over Date
- Hand Over Amount
- Payments To Date
- Interest To Date
- Adjustments To Date
- Fees & Expenses
- Collection Commission
- FCC (excl VAT)
- Current Balance
- Capital Amount
- Last Payment Method
- Days since Last Payment
- Last Payment Date
- Last Payment Amount
- Outbound Phone Call Outcome
- Outbound Phone Call Comment
- Last Inbound Phone Call Date
- Inbound Phone Call Outcome
- Cellphone
- Cellphone 2
- Cellphone 3
- Cellphone 4
- Email
- Email 2
- Email 3
- Street Address 1
- Street Address 2
- Street Address 3
- Street Address 4
- Street Code
- Combined Street
- Gender
- Occupation
- Employer Name
- Employer Contact
- Last Contact
- ID Number
- Title
- Initials
- First Name
- Second Name
- Surname
- Account Load Date
- Debtor Flags
- Account Flags
- Linked Account
- Bucket
- Campaign Exclusions
- Error
- Original Line

### 3. Custom Customer Page

A custom customer profile page has been created at:
`app/user/customers/univen/[id]/page.tsx`

This page displays all the University of Venda specific fields in an organized layout.

### 4. Domain Configuration

The subdomain `univen.smartkollect.co.za` is configured to:
1. Route to the custom customer page for customer profiles
2. Use the standard SmartKollect interface for all other functionality

### 5. Verification

To verify the setup:
1. Access `univen.smartkollect.co.za` 
2. Log in with a University of Venda agent account
3. Navigate to the customer list
4. Open a customer profile to see the custom University of Venda layout

## Custom Features

### Financial Summary
The custom page includes a dedicated financial summary section showing:
- Current Balance
- Capital Amount
- Original Cost
- Days Overdue
- Interest Rate
- Last Payment Date
- Last Payment Amount
- Payments To Date

### Client Information
Detailed client information section including:
- Client details
- Personal information
- Gender
- Names

### Account Details
University of Venda specific account fields:
- Masked Client Reference
- Client Division
- EasyPay Reference
- In Duplum status
- Various date fields

### Contact Information
Comprehensive contact section with:
- Multiple cellphone numbers (up to 4)
- Multiple email addresses (up to 3)
- Last contact date

### Address Information
Complete address details:
- Street addresses (up to 4 lines)
- Street code
- Combined street field

### Employment Information
Employment details:
- Occupation
- Employer name
- Employer contact

### Account Management
University of Venda specific management fields:
- Account load date
- Debtor and account flags
- Linked account information
- Bucket classification
- Campaign exclusions
- Error tracking
- Original line data

## Maintenance

To update the University of Venda custom page:
1. Modify `app/user/customers/univen/[id]/page.tsx`
2. Test changes on a development environment
3. Deploy to production

For database schema changes:
1. Update the tenant data import process
2. Ensure backward compatibility
3. Test with sample data

## Support

For issues with the University of Venda tenant setup, contact the SmartKollect support team.