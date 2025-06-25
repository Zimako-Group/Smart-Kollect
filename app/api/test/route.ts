import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: 'API is working!' });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Test API received data:', data);
    
    return NextResponse.json({ 
      message: 'Data received successfully', 
      receivedData: data 
    });
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
