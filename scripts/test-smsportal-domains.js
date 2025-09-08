const https = require('https');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const SENDER = 'SmartKollect';
const TEST_PHONE = '+27606424958';

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

function testAPIEndpoint(baseUrl, endpoint) {
  return new Promise((resolve, reject) => {
    const smsData = JSON.stringify({
      to: TEST_PHONE,
      from: SENDER,
      body: 'Test SMS from SmartKollect - Working!',
      testMode: true
    });

    const options = {
      hostname: baseUrl,
      path: endpoint,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SmartKollect/1.0',
        'Content-Length': smsData.length
      }
    };

    console.log(`🔍 Testing: https://${baseUrl}${endpoint}`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   ✅ SUCCESS! Response:');
          try {
            const result = JSON.parse(responseData);
            console.log('   📄 JSON Response:', JSON.stringify(result, null, 2));
            resolve({ success: true, baseUrl, endpoint, response: result });
          } catch (e) {
            console.log('   📄 Text Response:', responseData.substring(0, 300));
            resolve({ success: true, baseUrl, endpoint, response: responseData });
          }
        } else if (res.statusCode === 401) {
          console.log('   🔐 Authentication Error - credentials might be wrong');
          console.log('   📄 Response:', responseData.substring(0, 200));
        } else if (res.statusCode === 404) {
          console.log('   ❌ Endpoint not found');
        } else if (res.statusCode === 302) {
          console.log('   ↪️  Redirecting to:', res.headers.location);
        } else {
          console.log(`   ⚠️  Error ${res.statusCode}:`, responseData.substring(0, 200));
        }
        
        resolve({ success: false, baseUrl, endpoint, status: res.statusCode });
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Connection Error: ${error.message}`);
      resolve({ success: false, baseUrl, endpoint, error: error.message });
    });

    req.write(smsData);
    req.end();
  });
}

async function testVariousEndpoints() {
  console.log('🚀 Testing various MyMobileAPI/SMSPortal endpoints...');
  console.log(`🔐 Client ID: ${CLIENT_ID}`);
  console.log(`🔐 Auth Header: Basic ${getAuthHeader()}`);
  console.log('─'.repeat(70));

  // Based on the conversation summary, SMSPortal might be the parent company
  const baseUrls = [
    'rest.smsportal.co.za',
    'api.smsportal.co.za', 
    'www.smsportal.co.za',
    'smsportal.co.za',
    'rest.mymobileapi.com',
    'api.mymobileapi.com',
    'www.mymobileapi.com',
    'mymobileapi.com'
  ];

  const endpoints = [
    '/bulkmessages',
    '/rest/bulkmessages',
    '/api/bulkmessages',
    '/v1/bulkmessages',
    '/sms/send',
    '/v1/sms/send',
    '/api/v1/sms/send',
    '/rest/v1/sms/send',
    '/messages',
    '/v1/messages',
    '/send',
    '/v1/send'
  ];

  for (const baseUrl of baseUrls) {
    console.log(`\n🏠 Testing base URL: ${baseUrl}`);
    
    for (const endpoint of endpoints) {
      try {
        const result = await testAPIEndpoint(baseUrl, endpoint);
        
        if (result.success) {
          console.log(`\n🎉 FOUND WORKING ENDPOINT!`);
          console.log(`✅ Base URL: https://${baseUrl}`);
          console.log(`✅ Endpoint: ${endpoint}`);
          console.log(`✅ Full URL: https://${baseUrl}${endpoint}`);
          return result; // Stop on first success
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n❌ No working endpoints found');
}

testVariousEndpoints().catch(console.error);