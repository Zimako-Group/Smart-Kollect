import { NextRequest, NextResponse } from 'next/server';
import { mobileApiSMSService, type PTPSMSData } from '@/lib/sms-service';

interface SendPTPSMSRequest {
  customerName: string;
  phoneNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export async function POST(
  request: NextRequest
) {
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
    if (!mobileApiSMSService.isValidPhoneNumber(phoneNumber)) {
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
    const result = await mobileApiSMSService.sendPTPConfirmationSMS(smsData);

    // Check if SMS was sent successfully (MyMobileAPI returns eventId and messages count)
    const isSuccess = result.eventId && result.messages > 0;

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: 'PTP confirmation SMS sent successfully',
        eventId: result.eventId,
        messages: result.messages,
        cost: result.cost,
        remainingBalance: result.remainingBalance,
        sample: result.sample
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `SMS failed to send`,
          errorReport: result.errorReport
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
