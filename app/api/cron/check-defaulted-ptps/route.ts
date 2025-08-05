import { NextRequest, NextResponse } from "next/server";
import { checkForDefaultedManualPTPs } from '@/lib/manual-ptp-service';
import { createActivityNotification } from '@/lib/notification-service';

// This API route will be called by a cron job to check for defaulted PTPs
export async function GET() {
  try {
    console.log('Running scheduled check for defaulted PTPs');
    
    // Check for defaulted PTPs and update their status
    await checkForDefaultedManualPTPs();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully checked for defaulted PTPs and updated their status.' 
    });
  } catch (error) {
    console.error('Error in defaulted PTPs cron job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check for defaulted PTPs', error: String(error) },
      { status: 500 }
    );
  }
}
