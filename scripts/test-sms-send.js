/**
 * SMS Test Script for MyMobileAPI Integration
 * 
 * This script tests the SMS service by sending a test message to a specified number.
 * Make sure you have set up your environment variables before running this script.
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Configuration
const TEST_PHONE_NUMBER = '0606424958';
const BASE_URL = process.env.MYMOBILEAPI_BASE_URL || 'https://rest.mymobileapi.com/v1';
const CLIENT_ID = process.env.MYMOBILEAPI_CLIENT_ID;
const API_SECRET = process.env.MYMOBILEAPI_API_SECRET;
const SENDER = process.env.MYMOBILEAPI_SENDER || 'SmartKollect';

// Helper function to format phone number to E.164
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

// Helper function to create Basic Auth header
function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

// Main test function
async function testSMSService() {
  console.log('🚀 Starting SMS Service Test...\n');
  
  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Client ID: ${CLIENT_ID ? '✅ Set' : '❌ Not Set'}`);
  console.log(`   API Secret: ${API_SECRET ? '✅ Set' : '❌ Not Set'}`);
  console.log(`   Sender: ${SENDER}`);
  console.log(`   Test Number: ${TEST_PHONE_NUMBER}`);
  console.log('');
  
  if (!CLIENT_ID || !API_SECRET) {
    console.error('❌ Missing required environment variables!');
    console.error('Please set MYMOBILEAPI_CLIENT_ID and MYMOBILEAPI_API_SECRET in your .env.local file');
    process.exit(1);
  }
  
  // Format phone number
  const formattedNumber = formatPhoneNumber(TEST_PHONE_NUMBER);
  console.log(`📱 Formatted phone number: ${formattedNumber}\n`);
  
  // Test message
  const testMessage = `Hello! This is a test message from Smart-Kollect SMS service.
  
🎯 If you receive this message, the MyMobileAPI integration is working correctly!

Test sent at: ${new Date().toLocaleString()}

- Smart-Kollect Team`;

  // Try different endpoints
  const endpoints = ['/messages', '/sms', '/send', '/api/sms'];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Testing endpoint: ${endpoint}`);
      
      const requestBody = {
        to: formattedNumber,
        from: SENDER,
        body: testMessage,
        testMode: process.env.NODE_ENV !== 'production'
      };
      
      const url = `${BASE_URL}${endpoint}`;
      console.log(`   URL: ${url}`);
      console.log(`   Test Mode: ${requestBody.testMode}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getAuthHeader()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`   Response Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ SMS sent successfully!');
        console.log('📄 Response:', JSON.stringify(result, null, 2));
        
        // Success - exit the loop
        console.log(`\n🎉 Test completed successfully using endpoint: ${endpoint}`);
        console.log('📱 Check your phone for the test message!');
        return;
        
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed with status ${response.status}`);
        console.log(`   Error: ${errorText}`);
        
        // If it's not a 404, this might be the right endpoint with a different error
        if (response.status !== 404) {
          console.log(`\n⚠️  Endpoint ${endpoint} exists but returned an error.`);
          console.log('This might be a configuration or authentication issue.');
          break;
        }
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${endpoint}:`, error.message);
    }
    
    console.log(''); // Empty line between attempts
  }
  
  console.log('❌ All endpoints failed. Please check:');
  console.log('   1. Your MyMobileAPI credentials are correct');
  console.log('   2. Your account has SMS API access enabled');
  console.log('   3. The base URL is correct for your account');
  console.log('   4. Your account has sufficient balance');
}

// Test authentication separately
async function testAuthentication() {
  console.log('🔐 Testing Authentication...\n');
  
  const authEndpoints = ['/account', '/profile', '/user', '/me', '/status'];
  
  for (const endpoint of authEndpoints) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${getAuthHeader()}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ Authentication successful!');
        const data = await response.json();
        console.log('Account info:', JSON.stringify(data, null, 2));
        return true;
      }
      
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
  }
  
  console.log('❌ Authentication test failed on all endpoints');
  return false;
}

// Run the tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('           SMS SERVICE TEST SCRIPT');
  console.log('='.repeat(60));
  console.log('');
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  console.log('');
  
  if (authSuccess) {
    console.log('✅ Authentication passed, proceeding with SMS test...\n');
  } else {
    console.log('⚠️  Authentication failed, but trying SMS anyway...\n');
  }
  
  // Test SMS sending
  await testSMSService();
  
  console.log('\n' + '='.repeat(60));
  console.log('                    TEST COMPLETE');
  console.log('='.repeat(60));
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testSMSService,
  testAuthentication,
  formatPhoneNumber,
  getAuthHeader
};