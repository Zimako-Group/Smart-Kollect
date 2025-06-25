import { NextRequest, NextResponse } from "next/server";

// This is a server-side API route that acts as a proxy for BuzzBox API calls
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, method, headers, data } = body;

    // Validate required parameters
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    console.log(`BuzzBox Proxy: Forwarding request to ${endpoint}`);
    console.log(`Method: ${method || 'POST'}`);
    console.log(`Headers:`, headers);
    console.log(`Data:`, data);

    // Construct the full URL to the BuzzBox API
    // Using the correct domain from the documentation
    const url = `https://buzzboxcloud.co.za${endpoint}`;
    
    console.log(`Attempting to connect to: ${url}`);

    // Make the request to the BuzzBox API with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get the response data
      let responseData;
      try {
        // Clone the response before reading its body to avoid the "Body has already been read" error
        const responseClone = response.clone();
        try {
          responseData = await responseClone.json();
        } catch (e) {
          // If response is not JSON, get text instead
          responseData = { text: await response.text() };
        }
      } catch (e) {
        console.error('Error reading response:', e);
        responseData = { error: 'Failed to read response body' };
      }

      console.log(`BuzzBox API Response: Status ${response.status}`);
      console.log(`Response data:`, responseData);

      // Return the response
      return NextResponse.json({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('BuzzBox API request timed out');
        return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
      }
      throw fetchError; // Re-throw to be caught by the outer try-catch
    }
  } catch (error: any) {
    console.error('Error in BuzzBox proxy:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}

// Handle GET requests for testing the proxy
export async function GET() {
  return NextResponse.json({ message: 'BuzzBox proxy is working' });
}
