# SMS Integration with Infobip

This document explains the SMS integration implemented in Smart-Kollect for sending Promise To Pay (PTP) confirmation messages to customers.

## Overview

The system automatically sends SMS notifications to customers when:
- A new Promise To Pay (PTP) arrangement is created
- A Manual PTP arrangement is created

## Configuration

### Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Infobip SMS API Configuration
INFOBIP_BASE_URL=http://wpmnqd.api.infobip.com
INFOBIP_API_KEY=ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b
INFOBIP_SENDER=SmartKollect
```

### API Endpoint

The SMS functionality is exposed through the `/api/send-ptp-sms` endpoint which accepts POST requests with the following payload:

```json
{
  "customerName": "John Doe",
  "phoneNumber": "+27821234567",
  "amount": 1500.00,
  "paymentDate": "December 25, 2024",
  "paymentMethod": "Bank Transfer",
  "notes": "Optional notes about the arrangement"
}
```

## Features

### Phone Number Validation
- Automatically formats South African phone numbers
- Supports formats: `0821234567`, `27821234567`, `+27821234567`
- Validates phone number format before sending

### SMS Message Template
The SMS message includes:
- Customer name
- Payment amount (formatted as currency)
- Payment date
- Payment method
- Optional notes
- Branded footer with Smart Kollect team signature

Example SMS:
```
Hi John Doe,

Your Promise to Pay has been confirmed:

💰 Amount: R1,500.00
📅 Payment Date: December 25, 2024
💳 Method: Bank Transfer
📝 Notes: Payment arrangement for outstanding balance

Please ensure payment is made on the agreed date. Thank you!

- Smart Kollect Team
```

### Error Handling
- Graceful fallback if SMS sending fails
- User notifications about SMS status
- Detailed error logging for debugging
- Non-blocking - PTP creation succeeds even if SMS fails

### Integration Points

#### PTP Component (`components/PTP.tsx`)
- Automatically sends SMS after successful PTP creation
- Uses customer phone number from Redux state
- Handles missing phone numbers gracefully

#### Manual PTP Component (`components/ManualPTP.tsx`)
- Fetches customer phone number from Debtors table
- Sends SMS after successful manual PTP creation
- Provides user feedback about SMS status

## Technical Implementation

### SMS Service (`lib/sms-service.ts`)
- `InfobipSMSService` class for API integration
- Phone number formatting and validation
- Message template generation
- Error handling and logging

### API Route (`app/api/send-ptp-sms/route.ts`)
- RESTful endpoint for SMS sending
- Request validation
- Response formatting
- Error handling

## Testing

To test the SMS functionality:

1. Create a PTP arrangement through the UI
2. Check the browser console for SMS sending logs
3. Verify the customer receives the SMS
4. Check toast notifications for success/failure status

## Security Considerations

- API key is stored in environment variables
- Server-side validation of all inputs
- Rate limiting should be implemented for production
- Phone numbers are validated before sending

## Troubleshooting

### Common Issues

1. **SMS not sending**
   - Check environment variables are set correctly
   - Verify Infobip API key is valid
   - Check network connectivity to Infobip servers

2. **Invalid phone number format**
   - Ensure phone numbers are in South African format
   - Check phone number validation logic

3. **Missing customer phone numbers**
   - Verify Debtors table has cell_number field populated
   - Check customer data integrity

### Logs

Check browser console and server logs for detailed error messages:
- SMS service errors
- API response errors
- Phone number validation issues
- Network connectivity problems

## Future Enhancements

- Support for international phone numbers
- SMS templates for different message types
- Delivery status tracking
- SMS history and analytics
- Bulk SMS sending capabilities
- Integration with other SMS providers
