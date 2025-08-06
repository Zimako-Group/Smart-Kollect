import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // In Next.js 15, cookies() returns the cookies directly, not a Promise
  const cookieStore = cookies();
  
  // Create the Supabase client with the correct cookie store format
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error.message 
    }, { status: 500 });
  }
  
  if (!session) {
    return NextResponse.json({ 
      authenticated: false,
      message: 'No active session'
    }, { status: 401 });
  }
  
  // Get user profile with role information
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single();
    
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return NextResponse.json({ 
      authenticated: true,
      user: session.user,
      error: 'Failed to fetch user profile'
    });
  }
  
  return NextResponse.json({ 
    authenticated: true,
    user: {
      ...session.user,
      role: profile?.role || 'agent',
      name: profile?.full_name || session.user.email?.split('@')[0] || 'User'
    }
  });
}