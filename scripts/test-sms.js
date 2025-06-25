/**
 * Test script for Infobip SMS integration
 * Run this script to test sending an SMS using the Infobip API
 */

// Import the fetch API for Node.js
const fetch = require('node-fetch');

// Infobip API configuration
const INFOBIP_API_BASE_URL = 'https://wpmnqd.api.infobip.com';
const INFOBIP_API_KEY = 'ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b';

// Test phone number - REPLACE THIS WITH YOUR ACTUAL TEST PHONE NUMBER
const TEST_PHONE_NUMBER = '0606424958'; // Replace with your test phone number (e.g., 0721234567)

/**
 * Format phone number to ensure it has the country code
 * @param {string} phoneNumber Phone number to format
 * @returns {string} Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If the number already starts with a plus sign, return it as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
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
 * Send a test SMS message
 */
async function sendTestSMS() {
  try {
    console.log('Sending test SMS...');
    
    // Format the phone number
    const formattedPhoneNumber = formatPhoneNumber(TEST_PHONE_NUMBER);
    console.log(`Formatted phone number: ${formattedPhoneNumber}`);
    
    // Prepare the request payload
    const payload = {
      messages: [
        {
          destinations: [
            { to: formattedPhoneNumber }
          ],
          from: "InfoSMS", 
          text: "This is a test SMS from SmartCollect DCMS. If you received this message, the SMS integration is working correctly!"
        }
      ]
    };

    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    // Make the API request
    const response = await fetch(`${INFOBIP_API_BASE_URL}/sms/2/text/advanced`, {
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
    
    // Extract and display message details
    const messageId = data.messages?.[0]?.messageId;
    const status = data.messages?.[0]?.status?.name;
    
    console.log(`Message ID: ${messageId}`);
    console.log(`Status: ${status}`);
    
    if (messageId) {
      console.log('\nTo check the delivery status of this message, you can run:');
      console.log(`node scripts/check-sms-status.js ${messageId}`);
      
      // Create the check-sms-status.js file if it doesn't exist
      const fs = require('fs');
      const checkStatusScript = `
/**
 * Check the status of an SMS message
 * Run with: node check-sms-status.js MESSAGE_ID
 */
const fetch = require('node-fetch');

const INFOBIP_API_BASE_URL = 'https://wpmnqd.api.infobip.com';
const INFOBIP_API_KEY = 'ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b';

async function checkMessageStatus(messageId) {
  try {
    console.log(\`Checking status for message ID: \${messageId}...\`);
    
    const response = await fetch(\`\${INFOBIP_API_BASE_URL}/sms/1/reports?messageId=\${messageId}\`, {
      method: 'GET',
      headers: {
        'Authorization': \`App \${INFOBIP_API_KEY}\`
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log(\`\\nStatus: \${result.status.name}\`);
      console.log(\`Description: \${result.status.description}\`);
      console.log(\`Sent At: \${new Date(result.sentAt).toLocaleString()}\`);
      if (result.doneAt) {
        console.log(\`Delivered At: \${new Date(result.doneAt).toLocaleString()}\`);
      }
      console.log(\`Error: \${result.error ? result.error.name : 'None'}\`);
    } else {
      console.log('No status information available for this message ID.');
    }
  } catch (error) {
    console.error('Error checking message status:', error);
  }
}

// Get message ID from command line arguments
const messageId = process.argv[2];
if (!messageId) {
  console.error('Please provide a message ID as a command line argument.');
  console.error('Usage: node check-sms-status.js MESSAGE_ID');
  process.exit(1);
}

checkMessageStatus(messageId);
`;
      
      fs.writeFileSync('scripts/check-sms-status.js', checkStatusScript);
      console.log('\nStatus check script created at scripts/check-sms-status.js');
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

// Run the test
sendTestSMS();
