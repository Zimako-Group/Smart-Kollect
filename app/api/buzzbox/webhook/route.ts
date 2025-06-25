import { NextRequest, NextResponse } from "next/server";
import { buzzBoxService } from '@/lib/buzzBoxService';

/**
 * BuzzBox Webhook Handler
 * 
 * This endpoint receives events from BuzzBox such as:
 * - Incoming calls
 * - Call status updates
 * - Call termination events
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook data
    const data = await request.json();
    
    // Log the webhook event for debugging
    console.log('BuzzBox Webhook received:', JSON.stringify(data, null, 2));
    
    // Forward the event to the BuzzBox service for processing
    // The service will handle different event types appropriately
    buzzBoxService.handleBuzzBoxEvent(data);
    
    // Return a success response to BuzzBox
    return NextResponse.json({ success: true, message: 'Webhook received successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error processing BuzzBox webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing webhook', error: String(error) },
      { status: 500 }
    );
  }
}

// Also handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
