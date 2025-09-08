const https = require('https');

// Your MyMobileAPI credentials  
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

function sendSimpleSMS() {
  return new Promise((resolve) => {
    // Simple message without special characters
    const smsData = JSON.stringify({
      Messages: [
        {
          Content: 'Simple test: SmartKollect SMS working!',
          Destination: '0606424958'
        }
      ]
    });

    console.log('📋 Request data:');
    console.log(smsData);
    console.log('📋 Request length:', smsData.length);
    console.log('─'.repeat(50));

    const options = {
      hostname: 'rest.mymobileapi.com',
      path: '/v1/bulkmessages',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getAuthHeader()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(smsData, 'utf8')
      }
    };

    console.log('📤 Sending simple SMS...');

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          const result = JSON.parse(responseData);
          console.log('✅ SUCCESS!');
          console.log(`Event ID: ${result.eventId}`);
          console.log('🎉 SMS sent to 0606424958!');
        } else {
          console.log('❌ Error:', responseData);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve();
    });

    req.write(smsData);
    req.end();
  });
}

sendSimpleSMS();