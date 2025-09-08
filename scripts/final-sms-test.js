const https = require('https');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const BASE_URL = 'rest.mymobileapi.com';
const TEST_PHONE = '27606424958'; // Phone number without + prefix

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

async function sendFinalTestSMS() {
  return new Promise((resolve, reject) => {
    const smsData = JSON.stringify({
      Messages: [
        {
          Content: 'Final test: Smart-Kollect SMS service is now fully operational! 🚀✅ Integration with MyMobileAPI completed successfully.',
          Destination: TEST_PHONE
        }
      ]
    });

    const options = {
      hostname: BASE_URL,
      path: '/v1/bulkmessages',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SmartKollect/1.0',
        'Content-Length': smsData.length
      }
    };

    console.log('📱 FINAL SMS TEST');
    console.log('================');
    console.log(`📞 Sending to: ${TEST_PHONE} (0606424958)`);
    console.log(`🔗 Endpoint: https://${BASE_URL}${options.path}`);
    console.log(`📝 Message: Final test: Smart-Kollect SMS service is now fully operational!`);
    console.log('─'.repeat(60));

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(responseData);
            console.log('🎉 SUCCESS! Final SMS sent successfully!');
            console.log('─'.repeat(60));
            console.log(`🆔 Event ID: ${result.eventId}`);
            console.log(`📱 Messages: ${result.messages}`);
            console.log(`💰 Cost: ${result.cost} credits`);
            console.log(`💳 Balance: ${result.remainingBalance} credits`);
            console.log(`📄 Sample: ${result.sample}`);
            console.log('─'.repeat(60));
            console.log('✅ SMS SERVICE MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('✅ Phone number 0606424958 should receive the message');
            console.log('✅ MyMobileAPI integration is fully functional');
            resolve(result);
          } catch (e) {
            console.log('⚠️  Success but JSON parse error:', responseData);
            resolve({ success: true });
          }
        } else {
          console.log(`❌ Error ${res.statusCode}:`, responseData);
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Connection Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.write(smsData);
    req.end();
  });
}

// Send the final test SMS
sendFinalTestSMS();