/**
 * Debug MyMobileAPI endpoints and authentication
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env' });

const BASE_URL = process.env.MYMOBILEAPI_BASE_URL || 'https://rest.mymobileapi.com/v1';
const CLIENT_ID = process.env.MYMOBILEAPI_CLIENT_ID;
const API_SECRET = process.env.MYMOBILEAPI_API_SECRET;

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

async function debugAPI() {
  console.log('🔍 MyMobileAPI Debug Tool');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`API Secret: ${API_SECRET ? '[SET]' : '[NOT SET]'}`);
  console.log('='.repeat(50));
  console.log('');

  // Test 1: Try the base URL
  console.log('📡 Testing base URL...');
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  // Test 2: Try different base URLs
  console.log('🌐 Testing alternative base URLs...');
  const alternativeUrls = [
    'https://api.mymobileapi.com/v1',
    'https://rest.mymobileapi.com',
    'https://mymobileapi.com/api/v1',
    'https://api.mymobileapi.com',
    'https://sms.mymobileapi.com/v1'
  ];

  for (const url of alternativeUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${getAuthHeader()}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      if (response.status !== 404) {
        const responseText = await response.text();
        console.log(`  Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  console.log('');

  // Test 3: Check if it's an authentication issue
  console.log('🔐 Testing without authentication...');
  try {
    const response = await fetch(`${BASE_URL}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: '+27606424958',
        from: 'SmartKollect',
        body: 'Test'
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Good! Server is responding, it\'s an authentication format issue');
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log('');

  // Test 4: Try common SMS endpoints
  console.log('📱 Testing common SMS endpoints...');
  const smsEndpoints = [
    '/sms/send',
    '/v1/sms',
    '/send-sms',
    '/sms/messages',
    '/messages',
    '/sms',
    '/send',
    '/api/sms',
    '/outbound/sms',
    '/messaging/sms'
  ];

  for (const endpoint of smsEndpoints) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getAuthHeader()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          to: '+27606424958',
          from: 'SmartKollect',
          body: 'Test message'
        }),
        timeout: 5000
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status !== 404) {
        const responseText = await response.text();
        console.log(`  Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      }
      
      if (response.status === 200 || response.status === 201) {
        console.log(`🎉 SUCCESS! Found working endpoint: ${endpoint}`);
        break;
      }
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
  }

  console.log('');
  console.log('🔍 Debug complete. Check the results above to identify the issue.');
}

if (require.main === module) {
  debugAPI().catch(console.error);
}