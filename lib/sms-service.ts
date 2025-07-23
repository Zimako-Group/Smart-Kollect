interface InfobipSMSRequest {
  messages: {
    destinations: {
      to: string;
    }[];
    from: string;
    text: string;
  }[];
}

interface InfobipSMSResponse {
  messages: {
    to: string;
    status: {
      groupId: number;
      groupName: string;
      id: number;
      name: string;
      description: string;
    };
    messageId: string;
  }[];
}

interface PTPSMSData {
  customerName: string;
  phoneNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

class InfobipSMSService {
  private baseUrl: string;
  private apiKey: string;
  private sender: string;

  constructor() {
    this.baseUrl = process.env.INFOBIP_BASE_URL || 'http://wpmnqd.api.infobip.com';
    this.apiKey = process.env.INFOBIP_API_KEY || 'ba81d7b2e0df52df953f83271532fd3b-0ea4a502-4fbb-447b-b3d5-8b5b9e3ee26b';
    this.sender = process.env.INFOBIP_SENDER || 'SmartKollect';
  }

  /**
   * Send SMS using Infobip API
   */
  async sendSMS(phoneNumber: string, message: string): Promise<InfobipSMSResponse> {
    try {
      // Clean phone number - remove any non-numeric characters except +
      const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      // Ensure South African numbers have correct format
      let formattedNumber = cleanedNumber;
      if (cleanedNumber.startsWith('0')) {
        formattedNumber = '+27' + cleanedNumber.substring(1);
      } else if (cleanedNumber.startsWith('27')) {
        formattedNumber = '+' + cleanedNumber;
      } else if (!cleanedNumber.startsWith('+')) {
        formattedNumber = '+27' + cleanedNumber;
      }

      const requestBody: InfobipSMSRequest = {
        messages: [
          {
            destinations: [
              {
                to: formattedNumber
              }
            ],
            from: this.sender,
            text: message
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/sms/2/text/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `App ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Infobip API error: ${response.status} - ${errorText}`);
      }

      const result: InfobipSMSResponse = await response.json();
      return result;
    } catch (error: any) {
      console.error('Error sending SMS via Infobip:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
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
  async sendPTPConfirmationSMS(data: PTPSMSData): Promise<InfobipSMSResponse> {
    const message = this.generatePTPMessage(data);
    return await this.sendSMS(data.phoneNumber, message);
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-numeric characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it's a valid South African number
    const saNumberRegex = /^(\+27|27|0)[0-9]{9}$/;
    return saNumberRegex.test(cleaned);
  }
}

// Export singleton instance
export const infobipSMSService = new InfobipSMSService();

// Export types for use in other files
export type { PTPSMSData, InfobipSMSResponse };
