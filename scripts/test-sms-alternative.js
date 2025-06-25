/**
 * Alternative test script for Infobip SMS integration using a different API endpoint
 */

const fetch = require('node-fetch');

// Infobip API configuration
const INFOBIP_API_BASE_URL = 'https://wpmnqd.api.infobip.com';
const INFOBIP_API_KEY = 'ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b';

// Test phone number
const TEST_PHONE_NUMBER = '0849626748'; // Your test phone number

/**
 * Format phone number to ensure it has the country code
 */
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If the number starts with a zero, replace it with the South Africa country code
  if (digitsOnly.startsWith('0')) {
    return '+27' + digitsOnly.substring(1);
  }
  
  // If the number doesn't have a country code, add the South Africa country code
  if (digitsOnly.length <= 10) {
    return '+27' + digitsOnly;
  }
  
  // Otherwise, add a plus sign at the beginning
  return '+' + digitsOnly;
}

/**
 * Send SMS using the simple text API (different endpoint)
 */
async function sendSimpleSMS() {
  try {
    console.log('Sending SMS using simple text API...');
    
    // Format the phone number
    const formattedPhoneNumber = formatPhoneNumber(TEST_PHONE_NUMBER);
    console.log(`Formatted phone number: ${formattedPhoneNumber}`);
    
    // Short message that should work
    const shortMessage = "This is a test SMS from Zimako SmartCollect DCMS!";
    
    // Long message that would be truncated
    const longMessage = "This is a test SMS from SmartCollect DCMS. This message is intentionally long to demonstrate how messages exceeding the 160 character limit are handled by our system. If you received this message, it means our SMS integration is working correctly!";
    
    // Check message lengths
    console.log(`Short message length: ${shortMessage.length} characters`);
    console.log(`Long message length: ${longMessage.length} characters`);
    
    // Choose which message to send
    const messageToSend = shortMessage; // Change to longMessage to test truncation
    
    // Prepare the request payload for the simple text API
    const payload = {
      from: "SmartColl", // Using a shorter sender ID (max 11 chars)
      to: formattedPhoneNumber,
      text: messageToSend
    };

    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    // Make the API request to the simple text endpoint
    const response = await fetch(`${INFOBIP_API_BASE_URL}/sms/2/text/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `App ${INFOBIP_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    // Parse the response
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check if the request was successful
    if (!response.ok) {
      console.error('Error sending SMS:', data.requestError?.serviceException?.text || 'Unknown error');
      return;
    }

    console.log('SMS sent successfully!');
    
    // Extract message details
    const messageId = data.messageId;
    
    if (messageId) {
      console.log(`Message ID: ${messageId}`);
      
      // Wait 10 seconds and then check the status
      console.log('\nWaiting 10 seconds before checking message status...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      await checkMessageStatus(messageId);
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

/**
 * Check the status of a message
 */
async function checkMessageStatus(messageId) {
  try {
    console.log(`\nChecking status for message ID: ${messageId}...`);
    
    const response = await fetch(`${INFOBIP_API_BASE_URL}/sms/1/reports?messageId=${messageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('Status response:', JSON.stringify(data, null, 2));
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log(`\nStatus: ${result.status.name}`);
      console.log(`Description: ${result.status.description}`);
      console.log(`Sent At: ${new Date(result.sentAt).toLocaleString()}`);
      if (result.doneAt) {
        console.log(`Delivered At: ${new Date(result.doneAt).toLocaleString()}`);
      }
      console.log(`Error: ${result.error ? result.error.name : 'None'}`);
    } else {
      console.log('No status information available yet. This could be because:');
      console.log('1. The message is still being processed');
      console.log('2. There might be an issue with your Infobip account configuration');
      console.log('3. The message ID format might be different for status checks');
      
      console.log('\nYou can try checking the delivery reports in your Infobip dashboard.');
    }
  } catch (error) {
    console.error('Error checking message status:', error);
  }
}

// Run the test
sendSimpleSMS();
