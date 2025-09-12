import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 [CustomerRoute] API route hit for customer ID:', request.nextUrl.pathname);
  
  const customerId = request.nextUrl.pathname.split('/').pop();
  
  return NextResponse.json({
    message: 'Customer API route is working',
    customerId: customerId,
    pathname: request.nextUrl.pathname,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🔍 [CustomerRoute] POST API route hit for customer ID:', request.nextUrl.pathname);
  
  const customerId = request.nextUrl.pathname.split('/').pop();
  
  return NextResponse.json({
    message: 'Customer POST API route is working',
    customerId: customerId,
    pathname: request.nextUrl.pathname,
    timestamp: new Date().toISOString()
  });
}
