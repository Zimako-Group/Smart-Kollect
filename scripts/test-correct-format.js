const https = require('https');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const BASE_URL = 'rest.mymobileapi.com';
const SENDER = 'SmartKollect';
const TEST_PHONE = '+27606424958';

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

function testCorrectFormat() {
  return new Promise((resolve, reject) => {
    // Correct JSON format based on documentation
    const smsData = JSON.stringify({
      Messages: [
        {
          Content: 'Test SMS from SmartKollect - MyMobileAPI integration is working! 🎉',
          Destination: TEST_PHONE.replace('+', '') // Remove + for destination
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

    console.log('🚀 Testing MyMobileAPI with correct format...');
    console.log(`🔗 URL: https://${BASE_URL}${options.path}`);
    console.log(`🔐 Auth: Basic ${getAuthHeader()}`);
    console.log('📤 Request Body:');
    console.log(smsData);
    console.log('─'.repeat(60));

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📋 Content-Type: ${res.headers['content-type']}`);
        console.log('─'.repeat(60));
        
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 202) {
          console.log('✅ SUCCESS! SMS sent successfully!');
          try {
            const result = JSON.parse(responseData);
            console.log('📄 JSON Response:');
            console.log(JSON.stringify(result, null, 2));
            
            if (result.EventId) {
              console.log(`🎯 Event ID: ${result.EventId}`);
            }
            if (result.Messages) {
              console.log(`📱 Messages sent: ${result.Messages}`);
            }
            if (result.Cost) {
              console.log(`💰 Cost: ${result.Cost}`);
            }
            if (result.RemainingBalance) {
              console.log(`💳 Remaining balance: ${result.RemainingBalance}`);
            }
            
            resolve({ success: true, response: result });
          } catch (e) {
            console.log('📄 Raw Response:');
            console.log(responseData);
            resolve({ success: true, response: responseData });
          }
        } else if (res.statusCode === 400) {
          console.log('❌ BAD REQUEST - Check request format:');
          console.log(responseData);
          resolve({ success: false, status: 400, error: responseData });
        } else if (res.statusCode === 401) {
          console.log('🔐 UNAUTHORIZED - Check credentials:');
          console.log(responseData);
          resolve({ success: false, status: 401, error: responseData });
        } else if (res.statusCode === 404) {
          console.log('❌ NOT FOUND - Check endpoint:');
          console.log(responseData);
          resolve({ success: false, status: 404, error: responseData });
        } else {
          console.log(`⚠️  Error ${res.statusCode}:`);
          console.log(responseData);
          resolve({ success: false, status: res.statusCode, error: responseData });
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

// Test with the correct format
testCorrectFormat()
  .then(result => {
    console.log('─'.repeat(60));
    console.log('🏁 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SMS SERVICE IS NOW WORKING!');
      console.log('✅ You can now send SMS messages to 0606424958');
      console.log('✅ Integration with MyMobileAPI is successful');
    } else {
      console.log('\n❌ Still having issues. Response details above.');
    }
  })
  .catch(console.error);