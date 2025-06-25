import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic to avoid static rendering issues
export const dynamic = 'force-dynamic';

// GET /api/env-test - Check environment variables
export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are defined (server-side)
    // We only check if they exist, not their actual values for security
    const envStatus = {
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    return NextResponse.json(envStatus);
  } catch (error: any) {
    console.error('Error in env-test API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
