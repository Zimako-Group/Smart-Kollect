import { NextRequest, NextResponse } from "next/server";
import { checkForExpiredSettlements } from '@/lib/settlement-service';

// This API route will be called by a cron job to check for expired settlements
export async function GET() {
  try {
    console.log('Running scheduled check for expired settlements');
    
    // Check for expired settlements and update their status
    const expiredCount = await checkForExpiredSettlements();
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully checked for expired settlements. Found and updated ${expiredCount} expired settlements.` 
    });
  } catch (error) {
    console.error('Error in expired settlements cron job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check for expired settlements', error: String(error) },
      { status: 500 }
    );
  }
}
