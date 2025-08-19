import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  getAllApiKeys, 
  createApiKey, 
  revokeApiKey, 
  updateApiKeyStatus, 
  deleteApiKey 
} from '@/lib/api-keys-service';

export const dynamic = 'force-dynamic';

// GET /api/admin/api-keys - Get all API keys
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const apiKeys = await getAllApiKeys();
    return NextResponse.json({ success: true, data: apiKeys });
  } catch (error) {
    console.error('Error in GET /api/admin/api-keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, permissions, expires_at } = body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const result = await createApiKey(
      { name, permissions, expires_at },
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { key: result.key }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/api-keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/api-keys/[id] - Update API key status
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'API key ID is required' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'revoke') {
      result = await revokeApiKey(id);
    } else if (status) {
      result = await updateApiKeyStatus(id, status);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request: status or action required' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/api-keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/api-keys - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteApiKey(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/api-keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
