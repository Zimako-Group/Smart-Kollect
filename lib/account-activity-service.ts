import { supabase, supabaseAdmin } from './supabaseClient';

/**
 * Types for account activities
 */
export interface AccountActivity {
  id: string;
  accountId: string;
  activityType: 'payment' | 'communication' | 'note' | 'status_change';
  activitySubtype: string;
  description: string;
  amount?: number;
  createdAt: string;
  createdBy?: string | null; // Make createdBy optional and allow null
  createdByName: string;
  metadata?: Record<string, any>;
}

/**
 * Get all account activities for an account
 */
export async function getAccountActivities(accountId: string): Promise<AccountActivity[]> {
  try {
    console.log('[ACCOUNT ACTIVITY] Fetching activities for account', accountId);
    
    // Get all activities for this account without joining with profiles
    // Use the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('account_activities')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ACCOUNT ACTIVITY] Error fetching account activities:', error);
      return [];
    }
    
    console.log('[ACCOUNT ACTIVITY] Found', data.length, 'activities');
    
    // Create a map of unique user IDs to fetch profile information
    const userIds = new Set<string>();
    data.forEach(item => {
      if (item.created_by && typeof item.created_by === 'string') {
        userIds.add(item.created_by);
      }
    });
    
    // Fetch profile information for all unique user IDs
    const profilesMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(userIds));
      
      if (!profilesError && profilesData) {
        profilesData.forEach(profile => {
          profilesMap[profile.id] = profile.full_name;
        });
      } else {
        console.error('[ACCOUNT ACTIVITY] Error fetching profiles:', profilesError);
      }
    }
    
    // Transform the data into our AccountActivity interface
    const formattedActivities = data.map(item => {
      // Get the profile name from our map, or use metadata.createdByName if available
      let profileName = 'Unknown';
      if (item.created_by && profilesMap[item.created_by]) {
        profileName = profilesMap[item.created_by];
      } else if (item.metadata && item.metadata.createdByName) {
        profileName = item.metadata.createdByName;
      }
      
      const formattedActivity = {
        id: item.id,
        accountId: item.account_id,
        activityType: item.activity_type,
        activitySubtype: item.activity_subtype,
        description: item.description,
        amount: item.amount,
        createdAt: item.created_at,
        createdBy: item.created_by,
        createdByName: profileName,
        metadata: item.metadata || {},
      };
      
      console.log('[ACCOUNT ACTIVITY] Formatted activity:', formattedActivity);
      return formattedActivity;
    });
    
    console.log('[ACCOUNT ACTIVITY] Returning formatted activities:', formattedActivities.length);
    return formattedActivities;
  } catch (error) {
    console.error('[ACCOUNT ACTIVITY] Error in getAccountActivities:', error);
    return [];
  }
}

/**
 * Create a new account activity
 */
export async function createAccountActivity(activity: Omit<AccountActivity, 'id' | 'createdAt'> & { createdByName?: string, createdBy?: string | null }): Promise<AccountActivity | null> {
  try {
    console.log('[ACCOUNT ACTIVITY] Creating new activity for account', activity.accountId);
    
    // Prepare metadata with createdByName if provided
    const metadata = {
      ...(activity.metadata || {}),
    };
    
    // If createdByName is provided, add it to metadata
    if (activity.createdByName) {
      metadata.createdByName = activity.createdByName;
    }
    
    // Check if createdBy is a valid UUID or use null if it's not
    // This handles cases where we use 'system' or other non-UUID values
    let createdBy = null;
    if (activity.createdBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activity.createdBy)) {
      createdBy = activity.createdBy;
    } else if (activity.createdBy) {
      // If createdBy is not a UUID but has a value, store it in metadata
      metadata.createdBySource = activity.createdBy;
    }
    
    // Insert the new activity
    // Use the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('account_activities')
      .insert({
        account_id: activity.accountId,
        activity_type: activity.activityType,
        activity_subtype: activity.activitySubtype,
        description: activity.description,
        amount: activity.amount,
        created_by: createdBy,
        metadata: metadata,
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('[ACCOUNT ACTIVITY] Error creating account activity:', error);
      return null;
    }
    
    console.log('[ACCOUNT ACTIVITY] Successfully created activity:', data);
    
    // Get profile name if we have a user ID and createdByName wasn't provided
    let profileName = 'Unknown';
    if (!activity.createdByName && data.created_by) {
      try {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', data.created_by)
          .single();
          
        if (!profileError && profileData && profileData.full_name) {
          profileName = profileData.full_name;
        }
      } catch (profileError) {
        console.error('[ACCOUNT ACTIVITY] Error fetching profile:', profileError);
      }
    }
    
    // Use the provided createdByName from metadata if available, otherwise use the profile name
    const createdByName = activity.createdByName || metadata.createdByName || profileName || 'Unknown';
    
    // Transform the data into our AccountActivity interface
    return {
      id: data.id,
      accountId: data.account_id,
      activityType: data.activity_type,
      activitySubtype: data.activity_subtype,
      description: data.description,
      amount: data.amount,
      createdAt: data.created_at,
      createdBy: data.created_by,
      createdByName,
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error('[ACCOUNT ACTIVITY] Error in createAccountActivity:', error);
    return null;
  }
}

/**
 * Format date for display
 */
export function formatActivityDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
