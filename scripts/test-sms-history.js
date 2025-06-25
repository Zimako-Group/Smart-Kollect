/**
 * Test script for SMS history functionality
 * This script simulates sending SMS messages to customers and viewing their history
 */

// Since we can't directly import TypeScript modules in Node.js scripts,
// we'll implement simplified versions of the required functions here

// Constants
const SMS_HISTORY_KEY = 'zimako_sms_history';

// Simplified SmsHistoryService for testing
const SmsHistoryService = {
  saveHistory(customerSmsHistory) {
    try {
      // In a real environment, this would use localStorage
      // For testing, we'll use a global variable
      global.smsHistoryData = customerSmsHistory;
      console.log('SMS history saved successfully');
    } catch (error) {
      console.error('Error saving SMS history:', error);
    }
  },

  loadHistory() {
    try {
      // In a real environment, this would use localStorage
      // For testing, we'll use a global variable
      return global.smsHistoryData || {};
    } catch (error) {
      console.error('Error loading SMS history:', error);
      return {};
    }
  },

  getHistoryForAccount(accountNumber) {
    if (!accountNumber) return [];
    
    try {
      const allHistory = this.loadHistory();
      return allHistory[accountNumber] || [];
    } catch (error) {
      console.error('Error getting SMS history for account:', error);
      return [];
    }
  }
};

// Initialize global storage
global.smsHistoryData = {};

// Format phone number function (simplified version)
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, replace with +27 (South Africa)
  if (digitsOnly.startsWith('0')) {
    return '+27' + digitsOnly.substring(1);
  }
  
  // If it doesn't have a country code, add +27
  if (!digitsOnly.startsWith('+')) {
    return '+27' + digitsOnly;
  }
  
  return '+' + digitsOnly;
}

// Test phone number
const TEST_PHONE_NUMBER = '0606424958';

// Test account numbers (using acc_number as per system requirements)
const TEST_ACCOUNTS = [
  { acc_number: '7282424', name: 'Rofhiwa Mudau' },
  { acc_number: '7282425', name: 'John Smith' },
  { acc_number: '7282426', name: 'Sarah Johnson' }
];

/**
 * Simulate sending an SMS and recording it in history
 */
function simulateSendSMS(accountNumber, name, phoneNumber, message, status = 'sent') {
  console.log(`Sending SMS to ${name} (${accountNumber}): ${message}`);
  
  // Format the phone number
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Create history entry
  const historyEntry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    recipientPhone: formattedPhone,
    recipientName: name,
    message: message,
    status: status,
    accountNumber: accountNumber
  };
  
  // Load current history
  let customerHistory = SmsHistoryService.loadHistory();
  
  // Add to history
  if (!customerHistory[accountNumber]) {
    customerHistory[accountNumber] = [];
  }
  
  customerHistory[accountNumber].unshift(historyEntry);
  
  // Save updated history
  SmsHistoryService.saveHistory(customerHistory);
  
  console.log(`SMS recorded in history for account ${accountNumber}`);
  
  return historyEntry;
}

/**
 * Display SMS history for an account
 */
function displaySMSHistory(accountNumber) {
  console.log(`\n--- SMS History for Account ${accountNumber} ---`);
  
  const history = SmsHistoryService.getHistoryForAccount(accountNumber);
  
  if (history.length === 0) {
    console.log('No SMS history found for this account');
    return;
  }
  
  history.forEach((sms, index) => {
    console.log(`\n[${index + 1}] ${new Date(sms.timestamp).toLocaleString()}`);
    console.log(`To: ${sms.recipientName} (${sms.recipientPhone})`);
    console.log(`Status: ${sms.status.toUpperCase()}`);
    console.log(`Message: ${sms.message}`);
  });
}

/**
 * Run the test
 */
async function runTest() {
  console.log('=== SMS History Test ===\n');
  
  // Send test messages to each account
  for (const account of TEST_ACCOUNTS) {
    // Send payment reminder
    await simulateSendSMS(
      account.acc_number,
      account.name,
      TEST_PHONE_NUMBER,
      `Dear ${account.name}, this is a friendly reminder that your payment of R1,500.00 is due on 2025-04-01. Please contact us if you need assistance.`
    );
    
    // Wait a bit between messages
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send a second message to the first account only
    if (account.acc_number === TEST_ACCOUNTS[0].acc_number) {
      await simulateSendSMS(
        account.acc_number,
        account.name,
        TEST_PHONE_NUMBER,
        `Dear ${account.name}, please note that your account will be suspended if payment is not received within 48 hours.`,
        'delivered' // This one has been delivered
      );
    }
  }
  
  // Display history for each account
  for (const account of TEST_ACCOUNTS) {
    displaySMSHistory(account.acc_number);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
runTest().catch(console.error);
