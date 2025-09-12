// Test subdomain extraction logic
// This script tests the extractSubdomain function logic

function extractSubdomain(hostname) {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  console.log('Testing host:', host);
  
  // Handle localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    console.log('Localhost detected, using mahikeng as default tenant');
    return 'mahikeng'; // Default tenant for development
  }
  
  // Handle www prefix - treat as main domain
  if (host.startsWith('www.')) {
    const nonWwwHost = host.substring(4); // Remove 'www.'
    // If it's www.smartkollect.co.za, treat as main domain
    if (nonWwwHost === 'smartkollect.co.za') {
      console.log('www.smartkollect.co.za detected, treating as main domain');
      return null;
    }
  }
  
  // Extract subdomain from production domain
  const parts = host.split('.');
  
  // If it's just smartkollect.co.za (main domain), return null
  if (parts.length === 3 && parts[0] === 'smartkollect' && parts[1] === 'co' && parts[2] === 'za') {
    console.log('Main domain smartkollect.co.za detected');
    return null;
  }
  
  // Check if it's a subdomain (subdomain.smartkollect.co.za)
  if (parts.length === 4 && parts[1] === 'smartkollect' && parts[2] === 'co' && parts[3] === 'za') {
    const subdomain = parts[0];
    // Valid subdomains
    const validSubdomains = ['mahikeng', 'triplem', 'univen'];
    if (validSubdomains.includes(subdomain)) {
      console.log('Valid subdomain detected:', subdomain);
      return subdomain;
    } else {
      console.log('Invalid subdomain detected:', subdomain);
      return null;
    }
  }
  
  console.log('No valid subdomain pattern detected for host:', host);
  return null;
}

// Test cases
const testCases = [
  'mahikeng.smartkollect.co.za',
  'triplem.smartkollect.co.za',
  'univen.smartkollect.co.za',
  'smartkollect.co.za',
  'www.smartkollect.co.za',
  'localhost:3000',
  'invalid.smartkollect.co.za',
  'mahikeng.smartkollect.co.za:3000'
];

console.log('Testing subdomain extraction logic:\n');

testCases.forEach(testCase => {
  const result = extractSubdomain(testCase);
  console.log(`Host: ${testCase} -> Subdomain: ${result}`);
});

console.log('\nTest completed.');