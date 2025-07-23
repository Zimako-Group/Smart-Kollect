import { NextRequest, NextResponse } from 'next/server';
import { infobipSMSService, type PTPSMSData } from '@/lib/sms-service';

interface SendPTPSMSRequest {
  customerName: string;
  phoneNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendPTPSMSRequest = await request.json();

    // Validate required fields
    const { customerName, phoneNumber, amount, paymentDate, paymentMethod } = body;
    
    if (!customerName || !phoneNumber || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: customerName, phoneNumber, amount, paymentDate, paymentMethod' 
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!infobipSMSService.isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number format. Please provide a valid South African phone number.' 
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    // Prepare SMS data
    const smsData: PTPSMSData = {
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      amount,
      paymentDate,
      paymentMethod,
      notes: body.notes?.trim()
    };

    // Send SMS
    const result = await infobipSMSService.sendPTPConfirmationSMS(smsData);

    // Check if SMS was sent successfully
    const message = result.messages[0];
    const isSuccess = message.status.groupId === 1; // Group ID 1 means PENDING/DELIVERED

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: 'PTP confirmation SMS sent successfully',
        messageId: message.messageId,
        to: message.to,
        status: message.status
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `SMS failed to send: ${message.status.description}`,
          status: message.status
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error in send-ptp-sms API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send PTP confirmation SMS',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'PTP SMS API endpoint is active',
    endpoints: {
      POST: '/api/send-ptp-sms - Send PTP confirmation SMS'
    }
  });
}
