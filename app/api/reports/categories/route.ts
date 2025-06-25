import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedOrFresh, CACHE_TTL } from '@/lib/redis';

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
    const timeRange = searchParams.get('timeRange') || 'all';
    const threshold = parseFloat(searchParams.get('threshold') || '5'); // Threshold percentage for "Other" category
    
    // Create a cache key based on parameters
    const cacheKey = `reports:categories:${timeRange}:${threshold}`;
    
    // Use the getCachedOrFresh utility to handle caching
    const categoriesResponse = await getCachedOrFresh(
      cacheKey,
      async () => {
    
    // Calculate date range based on timeRange
    let startDateStr = null;
    const now = new Date();
    
    if (timeRange !== 'all') {
      let startDate = new Date();
      
      switch (timeRange) {
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
          // Default to all time
          startDateStr = null;
      }
      
      if (startDate) {
        startDateStr = startDate.toISOString();
      }
    }
    
    // Fetch all debtors with their categories and outstanding balances
    let query = supabase
      .from('Debtors')
      .select('debt_category, outstanding_balance');
    
    // Add date filter if applicable
    if (startDateStr) {
      query = query.gte('created_at', startDateStr);
    }
    
    // Execute the query
    const { data: debtorsData, error: categoriesError } = await query;
    
    // Process the data to group by category
    // Create a map to hold category totals
    const categoryTotals: Record<string, number> = {};
    
    // Group and sum manually
    debtorsData?.forEach(debtor => {
      const category = debtor.debt_category || 'Uncategorized';
      const amount = debtor.outstanding_balance || 0;
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      
      categoryTotals[category] += amount;
    });
    
    // Convert to array and sort
    const categoriesData = Object.entries(categoryTotals).map(([category, total_amount]) => ({
      debt_category: category,
      total_amount
    })).sort((a, b) => b.total_amount - a.total_amount);
    
    if (categoriesError) {
      throw new Error(`Error fetching debt categories: ${categoriesError.message}`);
    }
    
    // Calculate total amount across all categories
    const totalAmount = categoriesData.reduce((sum, category) => sum + (category.total_amount || 0), 0);
    
    // Process categories and apply threshold
    let processedCategories = [];
    let otherAmount = 0;
    
    for (const category of categoriesData) {
      // Calculate percentage of total
      const percentage = totalAmount > 0 ? (category.total_amount / totalAmount) * 100 : 0;
      
      // If category is below threshold, add to "Other"
      if (percentage < threshold) {
        otherAmount += category.total_amount || 0;
      } else {
        // Format the category name to be title case
        let categoryName = category.debt_category || 'Uncategorized';
        if (typeof categoryName === 'string') {
          categoryName = categoryName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        processedCategories.push({
          name: categoryName,
          value: category.total_amount || 0,
          percentage: parseFloat(percentage.toFixed(1))
        });
      }
    }
    
    // Add "Other" category if there's any amount
    if (otherAmount > 0) {
      const otherPercentage = (otherAmount / totalAmount) * 100;
      
      processedCategories.push({
        name: 'Other',
        value: otherAmount,
        percentage: parseFloat(otherPercentage.toFixed(1))
      });
    }
    
    // Sort by percentage descending
    processedCategories.sort((a, b) => b.percentage - a.percentage);
    
    // Prepare colors for the chart
    const colors = [
      'rgb(59, 130, 246)',   // blue-500
      'rgb(16, 185, 129)',   // green-500
      'rgb(245, 158, 11)',   // amber-500
      'rgb(239, 68, 68)',    // red-500
      'rgb(139, 92, 246)',   // purple-500
      'rgb(236, 72, 153)',   // pink-500
      'rgb(14, 165, 233)',   // sky-500
      'rgb(168, 85, 247)',   // fuchsia-500
      'rgb(234, 88, 12)',    // orange-500
      'rgb(79, 70, 229)'     // indigo-500
    ];
    
    // Assign colors to categories
    processedCategories = processedCategories.map((category, index) => ({
      ...category,
      color: colors[index % colors.length]
    }));
    
    // Prepare the response data
    const categoriesResponse = {
      labels: processedCategories.map(cat => cat.name),
      datasets: [
        {
          data: processedCategories.map(cat => cat.percentage),
          backgroundColor: processedCategories.map(cat => cat.color),
          borderColor: processedCategories.map(cat => cat.color),
          borderWidth: 1
        }
      ],
      categories: processedCategories
    };
    
    return categoriesResponse;
      },
      CACHE_TTL.LONG
    );
    
    return NextResponse.json(categoriesResponse);
  } catch (error: any) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
