const https = require('https');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const BASE_URL = 'api.mymobileapi.com';
const SENDER = 'SmartKollect';
const TEST_PHONE = '+27606424958';

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

const testSMS = {
  to: TEST_PHONE,
  from: SENDER,
  body: 'Test SMS from SmartKollect - MyMobileAPI integration working! 🎉',
  testMode: true
};

const data = JSON.stringify(testSMS);

const options = {
  hostname: BASE_URL,
  path: '/v1/sms/send',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${getAuthHeader()}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': data.length,
    'User-Agent': 'SmartKollect/1.0'
  }
};

console.log('🚀 Testing MyMobileAPI SMS service...');
console.log('🔗 Host:', BASE_URL);
console.log('📍 Path:', options.path);
console.log('📧 Client ID:', CLIENT_ID);
console.log('👤 Sender:', SENDER);
console.log('📱 Phone:', TEST_PHONE);
console.log('🔐 Auth:', `Basic ${getAuthHeader()}`);
console.log('─'.repeat(50));
console.log('📤 Request Body:', data);
console.log('─'.repeat(50));

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('📋 Headers:', res.headers);
  console.log('─'.repeat(50));

  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Response Body:');
    console.log(responseData);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const result = JSON.parse(responseData);
        console.log('✅ SUCCESS! SMS sent successfully:');
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('⚠️  Success but invalid JSON response:', responseData);
      }
    } else {
      console.log(`❌ FAILED! Status: ${res.statusCode}`);
      console.log('Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ EXCEPTION! Error:', error.message);
});

req.write(data);
req.end();