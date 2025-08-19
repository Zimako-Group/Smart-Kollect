import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  getAllWebhooks, 
  createWebhook, 
  updateWebhook, 
  deleteWebhook,
  testWebhook,
  CreateWebhookRequest,
  UpdateWebhookRequest 
} from '@/lib/webhooks-service';

async function getServerSupabase() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

async function checkAdminRole(supabase: any): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isAdmin: false, userId: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, userId: user.id };
    }

    return { isAdmin: profile.role === 'admin', userId: user.id };
  } catch (error) {
    console.error('Error checking admin role:', error);
    return { isAdmin: false, userId: null };
  }
}

// GET /api/admin/webhooks - Get all webhooks
export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { isAdmin } = await checkAdminRole(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { data, error } = await getAllWebhooks();

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhooks: data });
  } catch (error) {
    console.error('Error in GET /api/admin/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { isAdmin, userId } = await checkAdminRole(supabase);

    if (!isAdmin || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body: CreateWebhookRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const { data, error } = await createWebhook(body, userId);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhook: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/webhooks - Update webhook
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { isAdmin } = await checkAdminRole(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body: UpdateWebhookRequest & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Validate URL format if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    const { id, ...updates } = body;
    const { data, error } = await updateWebhook(id, updates);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhook: data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/webhooks - Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { isAdmin } = await checkAdminRole(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const { error } = await deleteWebhook(webhookId);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
