import { NextRequest, NextResponse } from 'next/server';
import { mobileApiSMSService } from '@/lib/sms-service';

export async function GET() {
  try {
    console.log('Testing SMS service configuration...');
    
    // Test basic configuration
    const config = {
      baseUrl: process.env.MYMOBILEAPI_BASE_URL,
      clientId: process.env.MYMOBILEAPI_CLIENT_ID ? 'SET' : 'NOT SET',
      apiSecret: process.env.MYMOBILEAPI_API_SECRET ? 'SET' : 'NOT SET',
      sender: process.env.MYMOBILEAPI_SENDER,
      nodeEnv: process.env.NODE_ENV
    };

    console.log('Configuration:', config);

    // Test authentication
    const authTest = await mobileApiSMSService.testConnection();
    console.log('Auth test result:', authTest);

    return NextResponse.json({
      success: true,
      message: 'SMS service test completed',
      config,
      authTest,
      instructions: {
        nextSteps: [
          '1. Verify your MYMOBILEAPI_CLIENT_ID and MYMOBILEAPI_API_SECRET are correct',
          '2. Check if your MyMobileAPI account has SMS API enabled',
          '3. Verify the base URL is correct for your region/account',
          '4. Try a test SMS by calling POST /api/test-sms with phone number'
        ]
      }
    });

  } catch (error: any) {
    console.error('SMS service test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        config: {
          baseUrl: process.env.MYMOBILEAPI_BASE_URL,
          hasClientId: !!process.env.MYMOBILEAPI_CLIENT_ID,
          hasApiSecret: !!process.env.MYMOBILEAPI_API_SECRET,
          sender: process.env.MYMOBILEAPI_SENDER
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Test sending a simple SMS
    const testMessage = 'Test message from Smart-Kollect SMS service. If you receive this, the integration is working!';
    
    console.log('Attempting to send test SMS to:', phoneNumber);
    const result = await mobileApiSMSService.sendSMS(phoneNumber, testMessage);
    
    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      result
    });

  } catch (error: any) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: 'Check server logs for detailed error information'
      },
      { status: 500 }
    );
  }
}