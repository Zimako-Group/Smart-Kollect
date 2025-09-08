/**
 * Simple API Test Script for SMS Service
 * 
 * This script tests the SMS service via the Next.js API endpoint
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001'; // Change this if your server runs on a different port
const TEST_PHONE_NUMBER = '0606424958';

async function testSMSAPI() {
  console.log('🚀 Testing SMS API Endpoint...\n');
  
  try {
    // Test the configuration first
    console.log('📋 Testing SMS service configuration...');
    const configResponse = await fetch(`${API_BASE_URL}/api/test-sms`, {
      method: 'GET'
    });
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('✅ Configuration test passed:');
      console.log(JSON.stringify(configData, null, 2));
    } else {
      console.log('❌ Configuration test failed:', await configResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Send test SMS
    console.log('📱 Sending test SMS...');
    const smsResponse = await fetch(`${API_BASE_URL}/api/test-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: TEST_PHONE_NUMBER
      })
    });
    
    const smsData = await smsResponse.json();
    
    if (smsResponse.ok) {
      console.log('✅ SMS sent successfully!');
      console.log('📄 Response:', JSON.stringify(smsData, null, 2));
      console.log('\n📱 Check your phone for the test message!');
    } else {
      console.log('❌ SMS sending failed:');
      console.log('📄 Error:', JSON.stringify(smsData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running with: npm run dev');
  }
}

// Alternative: Test PTP SMS endpoint
async function testPTPSMS() {
  console.log('\n🔄 Testing PTP SMS endpoint...\n');
  
  try {
    const ptpData = {
      customerName: 'Test Customer',
      phoneNumber: TEST_PHONE_NUMBER,
      amount: 1500.00,
      paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      paymentMethod: 'bank_transfer',
      notes: 'Test PTP from SMS integration script'
    };
    
    console.log('📋 PTP Data:', JSON.stringify(ptpData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/send-ptp-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ptpData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ PTP SMS sent successfully!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ PTP SMS failed:');
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ PTP SMS test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('           SMS API TEST SCRIPT');
  console.log('='.repeat(60));
  console.log(`📱 Test Number: ${TEST_PHONE_NUMBER}`);
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));
  console.log('');
  
  // Test basic SMS
  await testSMSAPI();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test PTP SMS
  await testPTPSMS();
  
  console.log('\n' + '='.repeat(60));
  console.log('                  TESTS COMPLETE');
  console.log('='.repeat(60));
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSMSAPI,
  testPTPSMS
};