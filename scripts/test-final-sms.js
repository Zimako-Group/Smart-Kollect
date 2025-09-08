const fetch = require('node-fetch');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const BASE_URL = 'https://api.mymobileapi.com/v1';
const SENDER = 'SmartKollect';

// Test phone number
const TEST_PHONE = '0606424958';

function formatPhoneNumber(phoneNumber) {
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  let formattedNumber = cleanedNumber;
  if (cleanedNumber.startsWith('0')) {
    formattedNumber = '+27' + cleanedNumber.substring(1);
  } else if (cleanedNumber.startsWith('27')) {
    formattedNumber = '+' + cleanedNumber;
  } else if (!cleanedNumber.startsWith('+')) {
    formattedNumber = '+27' + cleanedNumber;
  }

  return formattedNumber;
}

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

async function sendTestSMS() {
  try {
    const formattedPhone = formatPhoneNumber(TEST_PHONE);
    console.log(`📱 Sending SMS to: ${formattedPhone}`);
    
    const requestBody = {
      to: formattedPhone,
      from: SENDER,
      body: 'Test SMS from SmartKollect - MyMobileAPI integration is working! 🎉',
      testMode: true
    };

    console.log('📤 Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! SMS sent successfully:');
      console.log(JSON.stringify(result, null, 2));
      
      return {
        success: true,
        messageId: result.id,
        status: result.status,
        to: result.to,
        from: result.from,
        createdAt: result.created_at
      };
    } else {
      const errorText = await response.text();
      console.error('❌ FAILED! Error response:');
      console.error(`Status: ${response.status}`);
      console.error(`Error: ${errorText}`);
      
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }

  } catch (error) {
    console.error('❌ EXCEPTION! Error sending SMS:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
console.log('🚀 Testing MyMobileAPI SMS service...');
console.log(`🔗 Base URL: ${BASE_URL}`);
console.log(`📧 Client ID: ${CLIENT_ID}`);
console.log(`👤 Sender: ${SENDER}`);
console.log('─'.repeat(50));

sendTestSMS().then(result => {
  console.log('─'.repeat(50));
  console.log('📋 Final Result:', JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('💥 Unexpected error:', error);
});