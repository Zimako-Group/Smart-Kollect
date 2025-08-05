import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Initialize Supabase client with service role key (only available on server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase admin client with service role key
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

/**
 * API endpoint for getting account activities
 * GET /api/account-activities?accountId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client using the cookies from the request
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get the account ID from the query params
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing required parameter: accountId' },
        { status: 400 }
      );
    }

    console.log(`[ACCOUNT ACTIVITIES API] Getting activities for account ${accountId}`);

    // Check if the table exists by trying to query it
    try {
      const { count, error: tableCheckError } = await supabase
        .from('account_activities')
        .select('*', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.log('[ACCOUNT ACTIVITIES API] Table does not exist, returning empty array');
        return NextResponse.json({ activities: [] });
      }
    } catch (error) {
      console.log('[ACCOUNT ACTIVITIES API] Table does not exist, returning empty array');
      return NextResponse.json({ activities: [] });
    }

    // Define the type for the join result
    type ActivityWithProfile = {
      id: string;
      account_id: string;
      activity_type: string;
      activity_subtype: string;
      description: string;
      amount: number | null;
      created_at: string;
      created_by: string;
      metadata: any;
      profiles: { full_name: string } | { full_name: string }[] | null;
    };

    // Get all activities for this account
    const { data: activities, error: activitiesError } = await supabase
      .from('account_activities')
      .select(`
        id,
        account_id,
        activity_type,
        activity_subtype,
        description,
        amount,
        created_at,
        created_by,
        metadata,
        profiles(full_name)
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false }) as { data: ActivityWithProfile[] | null, error: any };

    if (activitiesError) {
      console.error('[ACCOUNT ACTIVITIES API] Error getting activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to get activities' },
        { status: 500 }
      );
    }

    console.log(`[ACCOUNT ACTIVITIES API] Found ${activities?.length || 0} activities for account`);
    
    // Transform the data for the client
    const transformedActivities = activities?.map(item => {
      // Handle the profiles join result which comes as an array or object depending on the query
      const profileName = Array.isArray(item.profiles)
        ? item.profiles[0]?.full_name
        : item.profiles?.full_name;
        
      return {
        id: item.id,
        accountId: item.account_id,
        activityType: item.activity_type,
        activitySubtype: item.activity_subtype,
        description: item.description,
        amount: item.amount,
        createdAt: item.created_at,
        createdBy: item.created_by,
        createdByName: profileName || 'Unknown',
        metadata: item.metadata || {},
      };
    }) || [];

    return NextResponse.json({ activities: transformedActivities });
  } catch (error) {
    console.error('[ACCOUNT ACTIVITIES API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for creating account activities
 * POST /api/account-activities
 */
export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client using the cookies from the request
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { accountId, activityType, activitySubtype, description, amount, metadata } = body;

    // Validate required fields
    if (!accountId || !activityType) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId and activityType are required' },
        { status: 400 }
      );
    }

    console.log(`[ACCOUNT ACTIVITIES API] Creating activity for account ${accountId}`);

    // Define the type for the join result
    type ActivityWithProfile = {
      id: string;
      account_id: string;
      activity_type: string;
      activity_subtype: string;
      description: string;
      amount: number | null;
      created_at: string;
      created_by: string;
      metadata: any;
      profiles: { full_name: string } | { full_name: string }[] | null;
    };

    // Create the activity
    const { data: activity, error: insertError } = await supabase
      .from('account_activities')
      .insert({
        account_id: accountId,
        activity_type: activityType,
        activity_subtype: activitySubtype,
        description: description,
        amount: amount,
        created_by: user.id,
        metadata: metadata || {}
      })
      .select(`
        id,
        account_id,
        activity_type,
        activity_subtype,
        description,
        amount,
        created_at,
        created_by,
        metadata,
        profiles(full_name)
      `)
      .single() as { data: ActivityWithProfile | null, error: any };

    if (insertError) {
      console.error('[ACCOUNT ACTIVITIES API] Error creating activity:', insertError);
      
      // If the error is about the table not existing, we can't create it through the API
      if (insertError.message.includes('relation "account_activities" does not exist')) {
        console.log('[ACCOUNT ACTIVITIES API] Table does not exist');
        return NextResponse.json(
          { error: 'The account activities table does not exist. Please create it in the Supabase dashboard.' },
          { status: 500 }
        );
      }
      
      // For any other error
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    console.log('[ACCOUNT ACTIVITIES API] Successfully created activity:', activity);
    
    // Make sure activity is not null before proceeding
    if (!activity) {
      console.error('[ACCOUNT ACTIVITIES API] Activity data is null after successful creation');
      return NextResponse.json(
        { error: 'Failed to retrieve created activity data' },
        { status: 500 }
      );
    }
    
    // Transform the data for the client
    // Handle the profiles join result which comes as an array or object depending on the query
    const profileName = Array.isArray(activity.profiles)
      ? activity.profiles[0]?.full_name
      : activity.profiles?.full_name;
      
    const transformedActivity = {
      id: activity.id,
      accountId: activity.account_id,
      activityType: activity.activity_type,
      activitySubtype: activity.activity_subtype,
      description: activity.description,
      amount: activity.amount,
      createdAt: activity.created_at,
      createdBy: activity.created_by,
      createdByName: profileName || 'Unknown',
      metadata: activity.metadata || {},
    };

    return NextResponse.json({ success: true, activity: transformedActivity });
  } catch (error) {
    console.error('[ACCOUNT ACTIVITIES API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
