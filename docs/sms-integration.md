# SMS Integration with Infobip

This document explains how to use and test the SMS functionality in the Zimako DCMS system.

## Overview

The SMS functionality has been implemented using Infobip as the SMS gateway provider. This allows you to send SMS messages to debtors directly from the customer profile page.

## Configuration

The SMS integration uses the following Infobip credentials:

- **API Base URL**: `wpmnqd.api.infobip.com`
- **API Key**: `ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b`

These credentials are configured in the `infobip-service.ts` file.

## Testing the SMS Integration

### Using the Test Script

1. Open the `scripts/test-sms.js` file
2. Replace the `TEST_PHONE_NUMBER` placeholder with your actual test phone number (e.g., `0721234567`)
3. Run the script using Node.js:

```bash
node scripts/test-sms.js
```

4. Check the console output for the API response
5. Verify that you received the test SMS on your phone

### Using the UI

1. Navigate to a customer profile page
2. Click on the "SMS" button in the action buttons section
3. The SMS interface will open with the customer's phone number and name pre-filled
4. Type your message or select a template
5. Click "Send SMS"
6. You should see a success notification if the SMS was sent successfully

## SMS Features

The SMS functionality includes the following features:

1. **Send SMS to Debtors**: Send SMS messages to debtors directly from their profile page
2. **SMS Templates**: Use pre-defined templates for common messages
3. **Placeholders**: Insert dynamic content like customer name, account number, amount, etc.
4. **SMS History**: View history of sent SMS messages with status (sent, delivered, failed)
5. **Character Count**: Track the number of characters remaining in your message
6. **Message Length Handling**: Messages are limited to 160 characters (standard SMS limit). Longer messages will be automatically truncated with a warning displayed to the user.

## SMS History Feature

The SMS system maintains a complete history of all messages sent to each customer, organized by their account number (`acc_number`). This provides a comprehensive record of all communications with each debtor.

### Features:

1. **Customer-Specific History**: All SMS messages are associated with the customer's `acc_number` and stored in a persistent history.
2. **Status Tracking**: Messages are tracked with their delivery status (sent, delivered, read, or failed).
3. **Chronological Display**: Messages are displayed in reverse chronological order (newest first).
4. **Retry Failed Messages**: Failed messages can be retried directly from the history view.
5. **Persistent Storage**: SMS history is stored in the browser's local storage, ensuring it persists across sessions.

### Implementation Details:

- SMS history is stored in two places:
  1. In the Redux store for the current session
  2. In the browser's localStorage for persistence across sessions
- When viewing a customer's profile, their SMS history is automatically loaded
- New messages are added to both the Redux store and localStorage
- Message status updates (e.g., when a message is delivered) are also persisted

### Accessing SMS History:

1. Open a customer's profile
2. Click the SMS button to open the SMS interface
3. Navigate to the "History" tab to view all messages sent to that customer

### Technical Notes:

- The history uses the `acc_number` field (not `account_number`) to identify customers, as per the database schema
- Each SMS record includes:
  - Message content
  - Timestamp
  - Recipient information
  - Delivery status
  - Account number

## Message Length Limitations

SMS messages have the following limitations:

1. **Standard SMS Limit**: 160 characters per message
2. **Truncation**: Messages exceeding 160 characters will be automatically truncated
3. **Visual Feedback**: The UI shows a warning when a message exceeds the limit
4. **Best Practice**: Keep messages concise and to the point for better delivery rates

## Important Notes

- The SMS integration uses the `acc_number` field from the Debtors table to identify customers
- SMS messages are sent with "SmartColl" as the sender ID
- The system automatically formats phone numbers to include the South African country code (+27)
- Messages longer than 160 characters will be automatically truncated to ensure delivery
- Keep messages concise for better delivery rates and to avoid truncation

## Troubleshooting

If you encounter issues with the SMS functionality:

1. **Check Network Connectivity**: Ensure you have an active internet connection
2. **Verify Phone Number Format**: Phone numbers should be in South African format (e.g., `0721234567`). The system will automatically add the country code.
3. **Check API Credentials**: Verify that the API credentials in `infobip-service.ts` are correct
4. **Check Console Logs**: Look for error messages in the browser console
5. **Test with the Test Script**: Use the test script to verify that the API connection is working
