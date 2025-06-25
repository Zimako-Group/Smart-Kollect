# SMS Troubleshooting Guide

## SMS Delivery Issues

If you're experiencing issues with SMS delivery through Infobip, here are some troubleshooting steps:

### 1. Account Configuration Issues

- **Account Status**: Ensure your Infobip account is fully activated and not in trial mode.
- **Account Balance**: Check if you have sufficient credits in your Infobip account.
- **Service Availability**: Confirm that SMS services are enabled for your account.

### 2. Sender ID Issues

- **Sender ID Registration**: In many countries, including South Africa, sender IDs need to be pre-registered with mobile networks.
- **Alphanumeric Sender IDs**: Text-based sender IDs (like "SmartColl") often require pre-approval.
- **Try Numeric Sender**: Use a numeric sender ID (like a phone number) which typically has fewer restrictions.

### 3. Number Formatting Issues

- **Country Code**: Ensure the phone number includes the correct country code (+27 for South Africa).
- **Number Format**: Remove any spaces, dashes, or other non-numeric characters.
- **Test with Different Numbers**: Try sending to multiple phone numbers to rule out carrier-specific issues.

### 4. API Configuration

- **API Credentials**: Verify that your API key is correct and active.
- **API Endpoints**: Ensure you're using the correct API endpoints for your region.
- **Request Format**: Check that your request payload matches Infobip's requirements.

### 5. Network and Carrier Issues

- **Carrier Filtering**: Some carriers may filter messages from unrecognized sources.
- **DND (Do Not Disturb)**: The recipient might be on a DND list.
- **Network Congestion**: During high traffic periods, message delivery might be delayed.

## Steps to Resolve

1. **Contact Infobip Support**: Reach out to Infobip support with your account details and message IDs.
2. **Check Delivery Reports**: Use the Infobip dashboard to check delivery reports for your messages.
3. **Register Your Sender ID**: Request Infobip to register your sender ID with local carriers.
4. **Use a Dedicated Number**: Consider purchasing a dedicated number from Infobip for more reliable delivery.
5. **Test with Different API Endpoints**: Try both the simple and advanced API endpoints.

## Alternative Solutions

If you continue to experience issues with Infobip, consider:

1. **Using a Different SMS Provider**: Other providers like Twilio, Vonage (formerly Nexmo), or local South African providers might work better.
2. **Using a Different Communication Channel**: Consider email, push notifications, or in-app messaging as alternatives.
3. **Setting Up Webhooks**: Configure webhooks to receive delivery status updates from Infobip.

## Technical Verification

You can verify that your SMS implementation is working correctly by checking:

1. **API Response**: A 200 status code indicates that Infobip accepted your request.
2. **Message ID**: If you receive a message ID, your request was properly formatted.
3. **Status Reports**: Use the Infobip dashboard or API to check message delivery status.

Remember that SMS delivery is not guaranteed and can be affected by various factors outside your control. It's always good practice to implement fallback communication methods.
