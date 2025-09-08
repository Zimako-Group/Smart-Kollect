const https = require('https');

// Test the PTP SMS API endpoint
async function testPTPAPI() {
  console.log('🧪 Testing PTP SMS API endpoint...');
  console.log('🔗 URL: http://localhost:3002/api/send-ptp-sms');
  console.log('─'.repeat(50));

  const ptpData = {
    customerName: 'John Doe',
    phoneNumber: '0606424958',
    amount: 1500.00,
    paymentDate: '2025-09-15',
    paymentMethod: 'bank_transfer',
    notes: 'Payment arrangement confirmed via API test'
  };

  console.log('📋 Request Data:');
  console.log(JSON.stringify(ptpData, null, 2));
  console.log('─'.repeat(50));

  try {
    const response = await fetch('http://localhost:3002/api/send-ptp-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ptpData)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! PTP SMS sent via API:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ API Error:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testPTPAPI();