const https = require('https');

// Your MyMobileAPI credentials
const CLIENT_ID = '1a3be1ae-e72e-4afa-89c0-dee4eb2b6ace';
const API_SECRET = 'fe3404b9-8cd8-4c31-bd9b-9977f3ce21db';
const BASE_URL = 'rest.mymobileapi.com';

function getAuthHeader() {
  const credentials = `${CLIENT_ID}:${API_SECRET}`;
  return Buffer.from(credentials).toString('base64');
}

async function testDifferentFormats() {
  console.log('🔍 Testing different request formats to find the correct one...');
  console.log('─'.repeat(70));

  // Test different phone number formats and request structures
  const testCases = [
    {
      name: 'Format 1: With + prefix',
      data: {
        Messages: [
          {
            Content: 'Test format 1',
            Destination: '+27606424958'
          }
        ]
      }
    },
    {
      name: 'Format 2: Without + prefix',
      data: {
        Messages: [
          {
            Content: 'Test format 2', 
            Destination: '27606424958'
          }
        ]
      }
    },
    {
      name: 'Format 3: Local format',
      data: {
        Messages: [
          {
            Content: 'Test format 3',
            Destination: '0606424958'
          }
        ]
      }
    },
    {
      name: 'Format 4: With message object array (different structure)',
      data: {
        messages: [
          {
            content: 'Test format 4',
            destination: '27606424958'
          }
        ]
      }
    },
    {
      name: 'Format 5: Single message (not array)',
      data: {
        Content: 'Test format 5',
        Destination: '27606424958'
      }
    }
  ];

  for (const testCase of testCases) {
    await testFormat(testCase.name, testCase.data);
    console.log(''); // Add spacing between tests
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
}

async function testFormat(name, requestData) {
  return new Promise((resolve) => {
    const smsData = JSON.stringify(requestData);

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

    console.log(`🧪 Testing: ${name}`);
    console.log(`📤 Request: ${smsData}`);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📊 Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          console.log('   ✅ SUCCESS! This format works!');
          try {
            const result = JSON.parse(responseData);
            console.log(`   🆔 Event ID: ${result.eventId}`);
            console.log(`   📱 Messages: ${result.messages}`);
          } catch (e) {
            console.log('   📄 Response:', responseData.substring(0, 100));
          }
        } else if (res.statusCode === 400) {
          console.log('   ❌ Bad Request:');
          try {
            const error = JSON.parse(responseData);
            console.log(`   📄 Error: ${error.errors[0].errorMessage}`);
          } catch (e) {
            console.log('   📄 Raw Error:', responseData.substring(0, 100));
          }
        } else {
          console.log(`   ⚠️  Status ${res.statusCode}:`, responseData.substring(0, 100));
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Connection Error: ${error.message}`);
      resolve();
    });

    req.write(smsData);
    req.end();
  });
}

testDifferentFormats();