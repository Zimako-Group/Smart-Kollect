// Test the updated SMS service
const { mobileApiSMSService } = require('../lib/sms-service.ts');

async function testSMSService() {
  try {
    console.log('🧪 Testing updated SMS service...');
    console.log('📞 Target phone: 0606424958');
    console.log('─'.repeat(50));

    // Test data for PTP SMS
    const ptpData = {
      customerName: 'John Doe',
      phoneNumber: '0606424958',
      amount: 1500.00,
      paymentDate: '2025-09-15',
      paymentMethod: 'bank_transfer',
      notes: 'Payment arrangement confirmed'
    };

    console.log('📋 PTP Data:');
    console.log(JSON.stringify(ptpData, null, 2));
    console.log('─'.repeat(50));

    // Send PTP confirmation SMS
    const result = await mobileApiSMSService.sendPTPConfirmationSMS(ptpData);

    console.log('✅ SMS sent successfully!');
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));

    console.log('─'.repeat(50));
    console.log('🎯 Key Information:');
    console.log(`Event ID: ${result.eventId}`);
    console.log(`Messages sent: ${result.messages}`);
    console.log(`Cost: ${result.cost} credits`);
    console.log(`Remaining balance: ${result.remainingBalance} credits`);
    console.log(`Sample message: ${result.sample}`);

    if (result.errorReport && result.errorReport.faults.length > 0) {
      console.log('⚠️  Errors reported:');
      console.log(result.errorReport.faults);
    } else {
      console.log('✅ No errors reported');
    }

  } catch (error) {
    console.error('❌ Error testing SMS service:', error.message);
    console.error('Details:', error);
  }
}

// Run the test
testSMSService();