import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedOrFresh, CACHE_TTL } from '@/lib/redis';

// We're using the CACHE_TTL from the redis utility

export async function GET(request: NextRequest) {
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
    const cacheKey = `reports:metrics:${timeRange}`;
    
    // Use the getCachedOrFresh utility to handle caching
    const metricsData = await getCachedOrFresh(
      cacheKey,
      async () => {
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to monthly
    }
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Get total amount due for the period from the Debtors table
    // Using a different approach to avoid TypeScript errors with aggregate functions
    let totalDue = 0;
    
    try {
      // Try using RPC function first if it exists
      const { data, error } = await supabase
        .rpc('get_total_outstanding_balance')
        .single();
        
      if (error) {
        if (error.message.includes('does not exist')) {
          console.warn('RPC function get_total_outstanding_balance does not exist, using alternative approach');
          
          // Fetch all debtors and calculate the sum manually
          const { data: debtorsData, error: fetchError } = await supabase
            .from('Debtors')
            .select('outstanding_balance');
            
          if (fetchError) {
            throw new Error(`Error fetching debtors: ${fetchError.message}`);
          }
          
          // Calculate total manually
          totalDue = debtorsData?.reduce((sum, debtor) => sum + (debtor.outstanding_balance || 0), 0) || 0;
        } else {
          throw new Error(`Error fetching total due: ${error.message}`);
        }
      } else if (data) {
        // Handle the response from the RPC function
        // Use type assertion to tell TypeScript what properties might exist
        const typedData = data as Record<string, any>;
        totalDue = typeof typedData.total_due === 'number' ? typedData.total_due : 
                  typeof typedData === 'number' ? typedData : 0;
      }
    } catch (error: any) {
      console.error('Error calculating total due:', error);
      // Continue with default value
    }
    
    // Get total amount collected for the period from the payments table
    // Using a different approach to avoid TypeScript errors with aggregate functions
    let totalCollected = 0;
    
    try {
      // Try using RPC function first if it exists
      const { data, error } = await supabase
        .rpc('get_total_collected', { 
          start_date: startDateStr,
          end_date: endDateStr
        })
        .single();
        
      if (error) {
        if (error.message.includes('does not exist')) {
          console.warn('RPC function get_total_collected does not exist, using alternative approach');
          
          // Fetch all payments in the date range and calculate the sum manually
          const { data: paymentsData, error: fetchError } = await supabase
            .from('payments')
            .select('amount')
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr);
            
          if (fetchError) {
            throw new Error(`Error fetching payments: ${fetchError.message}`);
          }
          
          // Calculate total manually
          totalCollected = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        } else {
          throw new Error(`Error fetching total collected: ${error.message}`);
        }
      } else if (data) {
        // Handle the response from the RPC function
        // Use type assertion to tell TypeScript what properties might exist
        const typedData = data as Record<string, any>;
        totalCollected = typeof typedData.total_collected === 'number' ? typedData.total_collected : 
                       typeof typedData === 'number' ? typedData : 0;
      }
    } catch (error: any) {
      console.error('Error calculating total collected:', error);
      // Continue with default value
    }
    
    // Get active cases count
    const { count: activeCases, error: activeCasesError } = await supabase
      .from('Debtors')
      .select('*', { count: 'exact', head: true });
      
    if (activeCasesError) {
      throw new Error(`Error fetching active cases: ${activeCasesError.message}`);
    }
    
    // Get payment metrics from the payment_metrics table
    const { data: paymentMetricsData, error: paymentMetricsError } = await supabase
      .from('payment_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (paymentMetricsError && paymentMetricsError.code !== 'PGRST116') { // Not found is ok
      throw new Error(`Error fetching payment metrics: ${paymentMetricsError.message}`);
    }
    
    // Calculate collection rate
    const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;
    
    // Use payment metrics data if available
    const pendingValidations = paymentMetricsData?.pending_validations || 0;
    const failedUploads = paymentMetricsData?.failed_uploads || 0;
    
    // Get previous period data for trend calculation
    let prevStartDate = new Date(startDate);
    let prevEndDate = new Date(now);
    
    switch (timeRange) {
      case 'daily':
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'weekly':
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
        break;
      case 'monthly':
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      case 'quarterly':
        prevStartDate.setMonth(prevStartDate.getMonth() - 3);
        prevEndDate.setMonth(prevEndDate.getMonth() - 3);
        break;
      case 'yearly':
        prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
        prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
        break;
    }
    
    // Format previous period dates
    const prevStartDateStr = prevStartDate.toISOString();
    const prevEndDateStr = prevEndDate.toISOString();
    
    // Get previous period collection data
    let prevTotalCollected = 0;
    
    try {
      // Try using RPC function first
      const { data: prevCollectedData, error } = await supabase
        .rpc('get_total_collected', { 
          start_date: prevStartDateStr,
          end_date: prevEndDateStr
        })
        .single();
        
      if (error) {
        if (error.message.includes('does not exist')) {
          // Fetch all payments in the date range and calculate the sum manually
          const { data: prevPaymentsData } = await supabase
            .from('payments')
            .select('amount')
            .gte('created_at', prevStartDateStr)
            .lte('created_at', prevEndDateStr);
            
          // Calculate total manually
          prevTotalCollected = prevPaymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        }
      } else if (prevCollectedData) {
        // Use type assertion to tell TypeScript what properties might exist
        const typedData = prevCollectedData as Record<string, any>;
        prevTotalCollected = typeof typedData.total_collected === 'number' ? typedData.total_collected : 
                           typeof typedData === 'number' ? typedData : 0;
      }
    } catch (error) {
      console.warn('Error fetching previous period data:', error);
      // Continue with default value of 0
    }
    
    // Calculate collection change percentage
    const collectionChange = prevTotalCollected > 0 
      ? ((totalCollected - prevTotalCollected) / prevTotalCollected) * 100 
      : 0;
    
    // Prepare the response data
    const metricsData = [
      {
        title: "Collection Rate",
        value: `${collectionRate.toFixed(1)}%`,
        change: parseFloat(collectionChange.toFixed(1)),
        trend: collectionChange >= 0 ? 'up' : 'down',
        icon: "Percent",
        color: "text-blue-400"
      },
      {
        title: "Total Collected",
        value: `R${totalCollected.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: parseFloat(collectionChange.toFixed(1)),
        trend: collectionChange >= 0 ? 'up' : 'down',
        icon: "DollarSign",
        color: "text-green-400"
      },
      {
        title: "Active Cases",
        value: activeCases || 0,
        change: 0, // You would calculate this based on previous period
        trend: 'neutral',
        icon: "FileText",
        color: "text-purple-400"
      },
      {
        title: "Pending Validations",
        value: pendingValidations,
        change: 0, // You would calculate this based on previous period
        trend: 'neutral',
        icon: "Users",
        color: "text-amber-400"
      }
    ];
    
    return metricsData;
      },
      CACHE_TTL.MEDIUM
    );
    
    return NextResponse.json(metricsData);
  } catch (error: any) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
