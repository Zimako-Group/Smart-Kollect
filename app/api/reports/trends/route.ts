import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedOrFresh, CACHE_TTL } from '@/lib/redis';

export async function GET(
  request: NextRequest
) {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'monthly';
    
    // Create a cache key based on the time range
    const cacheKey = `reports:trends:${timeRange}`;
    
    // Use the getCachedOrFresh utility to handle caching
    const trendsData = await getCachedOrFresh(
      cacheKey,
      async () => {
    
    // Determine the time intervals based on timeRange
    const now = new Date();
    let startDate = new Date();
    let intervalType: 'day' | 'week' | 'month' = 'month';
    let intervalCount = 12; // Default to 12 months
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 30); // Last 30 days
        intervalType = 'day';
        intervalCount = 30;
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 12 * 7); // Last 12 weeks
        intervalType = 'week';
        intervalCount = 12;
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
        intervalType = 'month';
        intervalCount = 12;
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 4 * 3); // Last 4 quarters
        intervalType = 'month';
        intervalCount = 4;
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 5); // Last 5 years
        intervalType = 'month';
        intervalCount = 5;
        break;
      default:
        startDate.setMonth(now.getMonth() - 12); // Default to monthly
    }
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString();
    
    // Generate intervals for the chart
    const intervals = [];
    const labels = [];
    
    if (intervalType === 'day') {
      // Generate daily intervals
      for (let i = 0; i < intervalCount; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (intervalCount - 1 - i));
        
        // Format date as YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        intervals.push(formattedDate);
        
        // Format label as DD MMM
        const label = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
        labels.push(label);
      }
    } else if (intervalType === 'week') {
      // Generate weekly intervals
      for (let i = 0; i < intervalCount; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (intervalCount - 1 - i) * 7);
        
        // Format date as YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        intervals.push(formattedDate);
        
        // Format label as DD MMM
        const label = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
        labels.push(label);
      }
    } else if (intervalType === 'month') {
      // Generate monthly intervals
      for (let i = 0; i < intervalCount; i++) {
        const date = new Date(now);
        
        if (timeRange === 'quarterly') {
          // For quarterly, increment by 3 months
          date.setMonth(date.getMonth() - (intervalCount - 1 - i) * 3);
          
          // Format label as Q1 YYYY, Q2 YYYY, etc.
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          const label = `Q${quarter} ${date.getFullYear()}`;
          labels.push(label);
        } else if (timeRange === 'yearly') {
          // For yearly, increment by 12 months
          date.setFullYear(date.getFullYear() - (intervalCount - 1 - i));
          
          // Format label as YYYY
          const label = `${date.getFullYear()}`;
          labels.push(label);
        } else {
          // For monthly, increment by 1 month
          date.setMonth(date.getMonth() - (intervalCount - 1 - i));
          
          // Format label as MMM YYYY
          const label = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          labels.push(label);
        }
        
        // Format date as YYYY-MM-DD
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        intervals.push(formattedDate);
      }
    }
    
    // Get collection data for each interval
    const collectionData = [];
    const targetData = [];
    
    // Set a default target collection rate (this would ideally come from a settings table)
    const defaultTargetRate = 75; // 75%
    
    for (let i = 0; i < intervals.length; i++) {
      const intervalStart = intervals[i];
      let intervalEnd;
      
      if (i === intervals.length - 1) {
        // For the last interval, use current date as end
        intervalEnd = now.toISOString().split('T')[0];
      } else {
        // Otherwise use the next interval start as the end
        intervalEnd = intervals[i + 1];
      }
      
      // Get total amount due for the interval
      const { data: totalDueData, error: totalDueError } = await supabase
        .from('Debtors')
        .select('SUM(outstanding_balance) as total_due')
        .gte('created_at', intervalStart)
        .lt('created_at', intervalEnd)
        .single();
        
      if (totalDueError && totalDueError.code !== 'PGRST116') { // Not found is ok
        console.error(`Error fetching total due for interval ${intervalStart}:`, totalDueError);
      }
      
      // Get total amount collected for the interval
      const { data: totalCollectedData, error: totalCollectedError } = await supabase
        .from('payments')
        .select('SUM(amount) as total_collected')
        .gte('created_at', intervalStart)
        .lt('created_at', intervalEnd)
        .single();
        
      if (totalCollectedError && totalCollectedError.code !== 'PGRST116') { // Not found is ok
        console.error(`Error fetching total collected for interval ${intervalStart}:`, totalCollectedError);
      }
      
      // Calculate collection rate using type assertions to avoid TypeScript errors
      const typedDueData = totalDueData as Record<string, any>;
      const typedCollectedData = totalCollectedData as Record<string, any>;
      
      const totalDue = typedDueData?.total_due || 0;
      const totalCollected = typedCollectedData?.total_collected || 0;
      
      let collectionRate = 0;
      if (totalDue > 0) {
        collectionRate = (totalCollected / totalDue) * 100;
      } else if (totalCollected > 0) {
        // If there's no due amount but there are collections, set a default rate
        collectionRate = 100;
      }
      
      // Add to data arrays
      collectionData.push(parseFloat(collectionRate.toFixed(1)));
      targetData.push(defaultTargetRate);
    }
    
    // Prepare the response data
    const trendsData = {
      labels,
      datasets: [
        {
          label: 'Collection Rate',
          data: collectionData,
          borderColor: 'rgb(59, 130, 246)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Target Rate',
          data: targetData,
          borderColor: 'rgb(239, 68, 68)', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          tension: 0,
        }
      ]
    };
    
    return trendsData;
      },
      CACHE_TTL.LONG
    );
    
    return NextResponse.json(trendsData);
  } catch (error: any) {
    console.error('Error in trends API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
