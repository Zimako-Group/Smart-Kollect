import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

// Helper function to check if user has access to metrics
async function hasMetricsAccess(userId: string) {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }
    
    return ['admin', 'supervisor', 'system'].includes(data?.role);
  } catch (err) {
    console.error('Error checking metrics access:', err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const bypassAuth = searchParams.get('bypassAuth') === 'true';
    const timeRange = searchParams.get('timeRange') || 'today';
    
    // Skip authentication for wallboard display when bypassAuth is true
    if (!bypassAuth) {
      // Check authentication using Supabase
      const cookieStore = await cookies();
      const supabaseClient = supabase;
      
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Check if user has access to metrics
      const hasAccess = await hasMetricsAccess(session.user.id);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        );
      }
    }
    
    // Fetch PTP metrics from the database
    const ptpMetrics = await getPTPMetrics(timeRange);
    
    return NextResponse.json({
      success: true,
      data: {
        ptpMetrics,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching PTP metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PTP metrics', message: error.message },
      { status: 500 }
    );
  }
}

async function getPTPMetrics(timeRange: string) {
  try {
    // Define the date range based on the timeRange parameter
    let startDate: Date;
    const now = new Date();
    const endDate = now;
    
    switch (timeRange) {
      case 'week':
        // Start date is 7 days ago
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        // Start date is 30 days ago
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      default: // today
        // Start date is beginning of today
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Use our database function to efficiently count PTPs by status
    const { data: ptpCounts, error: ptpCountsError } = await supabase
      .rpc('count_ptps_by_status', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
    if (ptpCountsError) {
      console.error('Error counting PTPs by status:', ptpCountsError);
      
      // Fall back to manual counting if the function call fails
      const { data: ptps, error: ptpsError } = await supabase
        .from('PTP')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (ptpsError) {
        console.error('Error fetching PTPs:', ptpsError);
        throw ptpsError;
      }
      
      // Calculate metrics from the fetched data
      const totalPTPs = ptps ? ptps.length : 0;
      const fulfilledPTPs = ptps ? ptps.filter(ptp => ptp.status === 'paid').length : 0;
      const pendingPTPs = ptps ? ptps.filter(ptp => ptp.status === 'pending').length : 0;
      const defaultedPTPs = ptps ? ptps.filter(ptp => ptp.status === 'defaulted').length : 0;
      
      return {
        totalPTPs,
        fulfilledPTPs,
        pendingPTPs,
        defaultedPTPs,
        fulfilledPercentage: totalPTPs > 0 ? Math.round((fulfilledPTPs / totalPTPs) * 100) : 0
      };
    }
    
    // Extract metrics from the database function result
    const totalPTPs = ptpCounts.total_ptps || 0;
    const fulfilledPTPs = ptpCounts.fulfilled_ptps || 0;
    const pendingPTPs = ptpCounts.pending_ptps || 0;
    const defaultedPTPs = ptpCounts.defaulted_ptps || 0;
    
    // Calculate fulfillment percentage
    const fulfilledPercentage = totalPTPs > 0 
      ? Math.round((fulfilledPTPs / totalPTPs) * 100) 
      : 0;
    
    return {
      totalPTPs,
      fulfilledPTPs,
      pendingPTPs,
      defaultedPTPs,
      fulfilledPercentage
    };
  } catch (error) {
    console.error('Error in getPTPMetrics:', error);
    // Return default values in case of error
    return {
      totalPTPs: 0,
      fulfilledPTPs: 0,
      pendingPTPs: 0,
      defaultedPTPs: 0,
      fulfilledPercentage: 0
    };
  }
}
