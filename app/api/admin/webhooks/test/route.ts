import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { testWebhook } from '@/lib/webhooks-service';

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

// POST /api/admin/webhooks/test - Test a webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { isAdmin } = await checkAdminRole(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { webhookId } = await request.json();

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const { success, error } = await testWebhook(webhookId);

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to test webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Webhook test successful',
      success: true 
    });
  } catch (error) {
    console.error('Error in POST /api/admin/webhooks/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
