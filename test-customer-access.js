const http = require('http');

// Test accessing the customer detail page
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/user/customers/d593e45c-307e-4311-b74f-85eec4083386',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();