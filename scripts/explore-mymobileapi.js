const https = require('https');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const BASE_URL = 'api.mymobileapi.com';

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: method,
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Accept': 'application/json',
        'User-Agent': 'SmartKollect/1.0'
      }
    };

    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = data.length;
    }

    console.log(`🔍 Testing ${method} ${path}`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        if (res.headers.location) {
          console.log(`   Redirect: ${res.headers.location}`);
        }
        
        // Only show response body for successful requests or specific errors
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 401 || res.statusCode === 403) {
          try {
            const result = JSON.parse(responseData);
            console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
          } catch (e) {
            console.log(`   Response: ${responseData.substring(0, 200)}...`);
          }
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseData,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      console.log(`   Error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function exploreAPI() {
  console.log('🕵️  Exploring MyMobileAPI endpoints...');
  console.log(`🔗 Base URL: https://${BASE_URL}`);
  console.log(`🔐 Auth: Basic ${getAuthHeader()}`);
  console.log('─'.repeat(60));

  // Test various endpoints to find the correct structure
  const endpoints = [
    '/v1',
    '/v1/account',
    '/v1/me',
    '/v1/user',
    '/v1/profile',
    '/v1/status',
    '/v1/sms',
    '/v1/messages',
    '/v1/message',
    '/v1/send',
    '/v1/send-sms',
    '/v1/sms/send',
    '/v1/sms/messages',
    '/api/v1',
    '/api/v1/sms',
    '/api/v1/sms/send',
    '/',
    '/api'
  ];

  for (const endpoint of endpoints) {
    try {
      await testEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    } catch (error) {
      console.log(`   Failed: ${error.message}`);
    }
  }

  console.log('─'.repeat(60));
  console.log('🧪 Testing SMS send with different endpoints...');

  const smsData = JSON.stringify({
    to: '+27606424958',
    from: 'SmartKollect',
    body: 'Test SMS',
    testMode: true
  });

  const smsEndpoints = [
    '/v1/sms/send',
    '/v1/messages',
    '/v1/send',
    '/api/v1/sms/send'
  ];

  for (const endpoint of smsEndpoints) {
    try {
      await testEndpoint(endpoint, 'POST', smsData);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`   Failed: ${error.message}`);
    }
  }
}

exploreAPI().catch(console.error);