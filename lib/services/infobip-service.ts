/**
 * Infobip SMS Service
 * Provides functionality to send SMS messages using the Infobip API
 */

// Infobip API configuration
const INFOBIP_API_BASE_URL = 'https://wpmnqd.api.infobip.com';
const INFOBIP_API_KEY = 'ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b';

import { store } from '../redux/store';
import { updateSmsStatus } from '../redux/features/sms/smsSlice';

// Maximum SMS length
const MAX_SMS_LENGTH = 160;

/**
 * Interface for SMS message request
 */
export interface SendSMSRequest {
  to: string;
  text: string;
  from?: string;
}

/**
 * Interface for SMS message response
 */
export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

/**
 * Send an SMS message using the Infobip API
 * @param request SMS message request containing recipient, message text, and optional sender ID
 * @returns Promise resolving to the SMS send response
 */
export async function sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
  try {
    // Format the phone number to ensure it has the country code
    const formattedPhoneNumber = formatPhoneNumber(request.to);
    
    // Try the simpler API endpoint first (more likely to work with basic accounts)
    try {
      const simpleResponse = await sendSMSViaSimpleAPI(formattedPhoneNumber, request.text, request.from);
      return simpleResponse;
    } catch (error) {
      console.warn('Simple API failed, falling back to advanced API:', error);
      // If the simple API fails, fall back to the advanced API
      return await sendSMSViaAdvancedAPI(formattedPhoneNumber, request.text, request.from);
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send SMS using the simple text API endpoint
 */
async function sendSMSViaSimpleAPI(
  phoneNumber: string, 
  text: string, 
  from?: string
): Promise<SendSMSResponse> {
  // Check message length and truncate if necessary
  let messageText = text;
  let truncated = false;
  
  if (text.length > MAX_SMS_LENGTH) {
    messageText = text.substring(0, MAX_SMS_LENGTH - 3) + '...';
    truncated = true;
    console.warn(`SMS message truncated from ${text.length} to ${messageText.length} characters`);
  }
  
  // Prepare the request payload for the simple text API
  const payload = {
    from: from || 'SmartColl', // Using a shorter sender ID (max 11 chars)
    to: phoneNumber,
    text: messageText
  };

  // Make the API request to the simple text endpoint
  const response = await fetch(`${INFOBIP_API_BASE_URL}/sms/2/text/single`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `App ${INFOBIP_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  // Parse the response
  const data = await response.json();
  
  // Check if the request was successful
  if (!response.ok) {
    console.error('Infobip simple API error:', data);
    return {
      success: false,
      error: data.requestError?.serviceException?.text || 'Failed to send SMS'
    };
  }

  // Extract the message ID and status from the response
  const messageId = data.messages?.[0]?.messageId;
  const status = data.messages?.[0]?.status?.name;

  return {
    success: true,
    messageId,
    status
  };
}

/**
 * Send SMS using the advanced API endpoint (fallback)
 */
async function sendSMSViaAdvancedAPI(
  phoneNumber: string, 
  text: string, 
  from?: string
): Promise<SendSMSResponse> {
  // Check message length and truncate if necessary
  let messageText = text;
  let truncated = false;
  
  if (text.length > MAX_SMS_LENGTH) {
    messageText = text.substring(0, MAX_SMS_LENGTH - 3) + '...';
    truncated = true;
    console.warn(`SMS message truncated from ${text.length} to ${messageText.length} characters`);
  }
  
  // Prepare the request payload according to Infobip API specifications
  const payload = {
    messages: [
      {
        destinations: [
          { to: phoneNumber }
        ],
        from: from || 'SmartColl',
        text: messageText
      }
    ]
  };

  // Make the API request to Infobip
  const response = await fetch(`${INFOBIP_API_BASE_URL}/sms/2/text/advanced`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `App ${INFOBIP_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  // Parse the response
  const data = await response.json();
  
  // Check if the request was successful
  if (!response.ok) {
    console.error('Infobip advanced API error:', data);
    return {
      success: false,
      error: data.requestError?.serviceException?.text || 'Failed to send SMS'
    };
  }

  // Extract the message ID and status from the response
  const messageId = data.messages?.[0]?.messageId;
  const status = data.messages?.[0]?.status?.name;

  return {
    success: true,
    messageId,
    status
  };
}

/**
 * Process delivery receipt from Infobip
 * @param deliveryReceipt The delivery receipt from Infobip
 */
export async function processDeliveryReceipt(deliveryReceipt: any) {
  try {
    // Extract message ID and status from the delivery receipt
    const { messageId, status, to } = deliveryReceipt;
    
    if (!messageId || !status) {
      console.error('Invalid delivery receipt format:', deliveryReceipt);
      return;
    }
    
    // Map Infobip status to our status format
    let smsStatus: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
    
    // Status mapping based on Infobip documentation
    // https://www.infobip.com/docs/api#channels/sms/receive-sent-sms-delivery-reports
    if (status.groupId === 1) {
      smsStatus = 'sent'; // PENDING
    } else if (status.groupId === 2) {
      smsStatus = 'delivered'; // DELIVERED
    } else if (status.groupId === 3) {
      smsStatus = 'delivered'; // DELIVERED_TO_HANDSET
    } else if (status.groupId === 4 || status.groupId === 5) {
      smsStatus = 'failed'; // UNDELIVERABLE or EXPIRED
    }
    
    // Find the SMS in our history to get the account number
    // This is a simplified approach - in a real app, you might store the messageId with the account number
    const state = store.getState();
    const allCustomerHistory = state.sms.customerSmsHistory;
    
    // Search through all customer histories to find the message
    let accountNumber = '';
    let smsId = '';
    
    Object.entries(allCustomerHistory).forEach(([accNumber, messages]) => {
      // Look for a message with matching phone number (since we don't store messageId)
      const matchingMessage = messages.find(msg => 
        msg.recipientPhone === to && 
        msg.status === 'sent' // Only update messages that are in 'sent' status
      );
      
      if (matchingMessage) {
        accountNumber = accNumber;
        smsId = matchingMessage.id;
      }
    });
    
    if (accountNumber && smsId) {
      // Update the SMS status in Redux
      store.dispatch(updateSmsStatus({
        id: smsId,
        status: smsStatus,
        accountNumber
      }));
      
      console.log(`Updated SMS status: ${smsId} to ${smsStatus}`);
    } else {
      console.warn('Could not find matching SMS for delivery receipt:', deliveryReceipt);
    }
  } catch (error) {
    console.error('Error processing delivery receipt:', error);
  }
}

/**
 * Format phone number to ensure it has the country code
 * @param phoneNumber Phone number to format
 * @returns Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If the number already starts with a plus sign, return it as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // If the number starts with a zero, replace it with the South Africa country code
  if (digitsOnly.startsWith('0')) {
    return '+27' + digitsOnly.substring(1);
  }
  
  // If the number doesn't have a country code, add the South Africa country code
  if (digitsOnly.length <= 10) {
    return '+27' + digitsOnly;
  }
  
  // Otherwise, add a plus sign at the beginning
  return '+' + digitsOnly;
}
