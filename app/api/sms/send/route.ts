import { NextRequest, NextResponse } from 'next/server';
import { mobileApiSMSService } from '@/lib/sms-service';
import { SmsHistoryService } from '@/lib/services/sms-history-service';

interface SendSMSRequest {
  recipientPhone: string;
  recipientName: string;
  message: string;
  accountNumber?: string;
}

interface SMSHistory {
  id: string;
  timestamp: number;
  recipientPhone: string;
  recipientName: string;
  message: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  accountNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendSMSRequest = await request.json();

    // Validate required fields
    const { recipientPhone, recipientName, message, accountNumber } = body;
    
    if (!recipientPhone || !message.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Recipient phone number and message are required' 
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!mobileApiSMSService.isValidPhoneNumber(recipientPhone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number format. Please provide a valid South African phone number.' 
        },
        { status: 400 }
      );
    }

    console.log('Sending SMS via server API:', {
      to: recipientPhone,
      message: message.substring(0, 50) + '...',
      accountNumber
    });

    // Send SMS using MyMobileAPI service
    const result = await mobileApiSMSService.sendSMS(recipientPhone, message);

    // Prepare SMS history entry
    const historyEntry: SMSHistory = {
      id: result.eventId?.toString() || Date.now().toString(),
      timestamp: Date.now(),
      recipientPhone,
      recipientName,
      message,
      status: 'sent',
      accountNumber: accountNumber || ''
    };

    // Save to SMS history if account number is provided
    if (accountNumber) {
      try {
        await SmsHistoryService.saveSmsToHistory(historyEntry);
        console.log('SMS history saved successfully');
      } catch (historyError) {
        console.error('Failed to save SMS history:', historyError);
        // Don't fail the request if history saving fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      result: {
        eventId: result.eventId,
        messages: result.messages,
        cost: result.cost,
        remainingBalance: result.remainingBalance,
        sample: result.sample
      },
      historyEntry
    });

  } catch (error: any) {
    console.error('SMS API error:', error);
    
    // Extract relevant error information
    let errorMessage = 'Failed to send SMS';
    let statusCode = 500;

    if (error.message?.includes('401')) {
      errorMessage = 'SMS service authentication failed. Please check API credentials.';
      statusCode = 401;
    } else if (error.message?.includes('400')) {
      errorMessage = 'Invalid SMS request. Please check phone number format and message content.';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.message
      },
      { status: statusCode }
    );
  }
}

// GET endpoint for API info
export async function GET() {
  return NextResponse.json({
    message: 'SMS API endpoint',
    endpoints: {
      POST: '/api/sms/send - Send SMS message'
    },
    requiredFields: {
      recipientPhone: 'string - Phone number in South African format',
      recipientName: 'string - Name of the recipient',
      message: 'string - SMS message content',
      accountNumber: 'string (optional) - Account number for history tracking'
    }
  });
}