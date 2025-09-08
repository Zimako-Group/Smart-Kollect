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

function testDomain(domain, path) {
  return new Promise((resolve, reject) => {
    const smsData = JSON.stringify({
      to: TEST_PHONE,
      from: SENDER,
      body: 'Test SMS from SmartKollect',
      testMode: true
    });

    const options = {
      hostname: domain,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SmartKollect/1.0',
        'Content-Length': smsData.length
      }
    };

    console.log(`🔍 Testing https://${domain}${path}`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode !== 302) {
          // Not a redirect, show more details
          console.log(`   Content-Type: ${res.headers['content-type']}`);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('   ✅ SUCCESS! Response:', responseData.substring(0, 200));
          } else if (res.statusCode === 401) {
            console.log('   🔐 Authentication error:', responseData.substring(0, 200));
          } else if (res.statusCode === 404) {
            console.log('   ❌ Not found');
          } else {
            console.log(`   ⚠️  Other error: ${responseData.substring(0, 200)}`);
          }
        } else {
          console.log(`   ↪️  Redirects to: ${res.headers.location}`);
        }
        
        resolve({
          domain,
          path,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Connection error: ${error.message}`);
      resolve({ domain, path, status: 0, success: false, error: error.message });
    });

    req.write(smsData);
    req.end();
  });
}

async function testDomains() {
  console.log('🌐 Testing different MyMobileAPI domains and endpoints...');
  console.log(`🔐 Auth: Basic ${getAuthHeader()}`);
  console.log('─'.repeat(60));

  // Test different potential domains
  const domains = [
    'api.mymobileapi.com',
    'rest.mymobileapi.com', 
    'www.mymobileapi.com',
    'mymobileapi.com',
    'api.smsportal.co.za',
    'rest.smsportal.co.za',
    'www.smsportal.co.za',
    'smsportal.co.za'
  ];

  const paths = [
    '/v1/sms/send',
    '/v1/messages',
    '/v1/send',
    '/api/v1/sms/send',
    '/api/sms/send',
    '/sms/send',
    '/send'
  ];

  for (const domain of domains) {
    console.log(`\n🏠 Testing domain: ${domain}`);
    
    for (const path of paths) {
      try {
        const result = await testDomain(domain, path);
        if (result.success) {
          console.log(`🎉 FOUND WORKING ENDPOINT: https://${domain}${path}`);
          return; // Stop testing once we find a working endpoint
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
}

testDomains().catch(console.error);