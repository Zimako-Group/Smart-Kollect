
/**
 * Check the status of an SMS message
 * Run with: node check-sms-status.js MESSAGE_ID
 */
const fetch = require('node-fetch');

const INFOBIP_API_BASE_URL = 'https://wpmnqd.api.infobip.com';
const INFOBIP_API_KEY = 'ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b';

async function checkMessageStatus(messageId) {
  try {
    console.log(`Checking status for message ID: ${messageId}...`);
    
    const response = await fetch(`${INFOBIP_API_BASE_URL}/sms/1/reports?messageId=${messageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log(`\nStatus: ${result.status.name}`);
      console.log(`Description: ${result.status.description}`);
      console.log(`Sent At: ${new Date(result.sentAt).toLocaleString()}`);
      if (result.doneAt) {
        console.log(`Delivered At: ${new Date(result.doneAt).toLocaleString()}`);
      }
      console.log(`Error: ${result.error ? result.error.name : 'None'}`);
    } else {
      console.log('No status information available for this message ID.');
    }
  } catch (error) {
    console.error('Error checking message status:', error);
  }
}

// Get message ID from command line arguments
const messageId = process.argv[2];
if (!messageId) {
  console.error('Please provide a message ID as a command line argument.');
  console.error('Usage: node check-sms-status.js MESSAGE_ID');
  process.exit(1);
}

checkMessageStatus(messageId);
