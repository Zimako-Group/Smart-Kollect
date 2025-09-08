interface MyMobileApiSMSRequest {
  Messages: Array<{
    Content: string;
    Destination: string;
  }>;
}

interface MyMobileApiSMSResponse {
  cost: number;
  remainingBalance: number;
  eventId: number;
  sample: string;
  messages: number;
  parts: number;
  costBreakdown: Array<{
    quantity: number;
    cost: number;
    network: string;
  }>;
  errorReport: {
    noNetwork: number;
    noContents: number;
    contentToLong: number;
    duplicates: number;
    optedOuts: number;
    faults: any[];
  };
}

interface PTPSMSData {
  customerName: string;
  phoneNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

class MyMobileApiSMSService {
  private baseUrl: string;
  private clientId: string;
  private apiSecret: string;
  private sender: string;
  private testMode: boolean;

  constructor() {
    this.baseUrl = process.env.MYMOBILEAPI_BASE_URL || 'https://rest.mymobileapi.com/v1';
    this.clientId = process.env.MYMOBILEAPI_CLIENT_ID || '';
    this.apiSecret = process.env.MYMOBILEAPI_API_SECRET || '';
    this.sender = process.env.MYMOBILEAPI_SENDER || 'SmartKollect';
    this.testMode = process.env.NODE_ENV !== 'production'; // Test mode in development
  }

  /**
   * Generate Basic Authentication header using ClientID:APISecret
   */
  private getAuthHeader(): string {
    const credentials = `${this.clientId}:${this.apiSecret}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Send SMS using MyMobileAPI with Basic Authentication
   */
  async sendSMS(phoneNumber: string, message: string): Promise<MyMobileApiSMSResponse> {
    // Use the discovered working endpoint
    const endpoint = '/bulkmessages';
    
    // Clean and format phone number for MyMobileAPI (remove + prefix)
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    const requestBody: MyMobileApiSMSRequest = {
      Messages: [
        {
          Content: message,
          Destination: formattedNumber
        }
      ]
    };

    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Log the request for debugging
      console.log('MyMobileAPI Request:', {
        url,
        method: 'POST',
        body: requestBody,
        testMode: this.testMode
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result: MyMobileApiSMSResponse = await response.json();
        console.log('MyMobileAPI Success - SMS sent successfully');
        console.log('Event ID:', result.eventId);
        console.log('Messages sent:', result.messages);
        console.log('Cost:', result.cost);
        console.log('Remaining balance:', result.remainingBalance);
        return result;
      } else {
        const errorText = await response.text();
        console.error(`MyMobileAPI Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url
        });
        
        throw new Error(`MyMobileAPI error: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`Error sending SMS:`, error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Format phone number for MyMobileAPI (remove + prefix, keep country code)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Clean phone number - remove any non-numeric characters except +
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure South African numbers have correct format for MyMobileAPI
    let formattedNumber = cleanedNumber;
    if (cleanedNumber.startsWith('0')) {
      formattedNumber = '27' + cleanedNumber.substring(1);
    } else if (cleanedNumber.startsWith('+27')) {
      formattedNumber = cleanedNumber.substring(1); // Remove the + prefix
    } else if (cleanedNumber.startsWith('27')) {
      formattedNumber = cleanedNumber; // Already in correct format
    } else if (cleanedNumber.startsWith('+')) {
      formattedNumber = cleanedNumber.substring(1); // Remove + from other international numbers
    } else {
      // Assume it's a South African number without country code
      formattedNumber = '27' + cleanedNumber;
    }

    return formattedNumber;
  }

  /**
   * Generate PTP confirmation SMS message
   */
  generatePTPMessage(data: PTPSMSData): string {
    const formattedAmount = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(data.amount);

    const paymentMethodText = this.getPaymentMethodText(data.paymentMethod);

    let message = `Hi ${data.customerName},\n\n`;
    message += `Your Promise to Pay has been confirmed:\n\n`;
    message += `💰 Amount: ${formattedAmount}\n`;
    message += `📅 Payment Date: ${data.paymentDate}\n`;
    message += `💳 Method: ${paymentMethodText}\n\n`;
    message += `Please ensure payment is made on the agreed date. Thank you!\n\n`;
    message += `- Mahikeng Municipality`;

    return message;
  }

  /**
   * Convert payment method code to readable text
   */
  private getPaymentMethodText(method: string): string {
    const methodMap: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash Payment',
      'debit_order': 'Debit Order',
      'credit_card': 'Credit Card'
    };
    return methodMap[method] || method;
  }

  /**
   * Send PTP confirmation SMS
   */
  async sendPTPConfirmationSMS(data: PTPSMSData): Promise<MyMobileApiSMSResponse> {
    const message = this.generatePTPMessage(data);
    return await this.sendSMS(data.phoneNumber, message);
  }

  /**
   * Test the API connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string; endpoint?: string }> {
    try {
      // Try different endpoints to test connectivity
      const testEndpoints = ['/account', '/profile', '/user', '/me', '/status'];
      
      for (const endpoint of testEndpoints) {
        try {
          const url = `${this.baseUrl}${endpoint}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${this.getAuthHeader()}`,
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            return {
              success: true,
              message: `Authentication successful with endpoint: ${endpoint}`,
              endpoint
            };
          }
        } catch (error) {
          console.log(`Test endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      return {
        success: false,
        message: 'No valid endpoints found for authentication test'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Authentication test failed: ${error.message}`
      };
    }
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-numeric characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it's a valid South African number (supports multiple formats)
    const saNumberRegex = /^(\+27|27|0)[0-9]{9}$/;
    return saNumberRegex.test(cleaned);
  }
}

// Export singleton instance
export const mobileApiSMSService = new MyMobileApiSMSService();

// Export types for use in other files
export type { PTPSMSData, MyMobileApiSMSResponse };
