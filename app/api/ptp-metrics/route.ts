import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyPTPStats, getMonthlyFulfilledPTPRevenue } from '@/lib/ptp-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching PTP metrics...');
    
    // Get monthly PTP statistics and revenue in parallel
    const [ptpStats, fulfilledRevenue] = await Promise.all([
      getMonthlyPTPStats(),
      getMonthlyFulfilledPTPRevenue()
    ]);
    
    console.log('PTP metrics fetched successfully:', { ...ptpStats, fulfilledRevenue });
    
    return NextResponse.json({
      success: true,
      data: {
        ptpMetrics: {
          totalPTPs: ptpStats.totalPTPs,
          fulfilledPTPs: ptpStats.fulfilledPTPs,
          pendingPTPs: ptpStats.pendingPTPs,
          defaultedPTPs: ptpStats.defaultedPTPs,
          fulfilledPercentage: ptpStats.fulfilledPercentage,
          pendingPercentage: ptpStats.pendingPercentage,
          defaultedPercentage: ptpStats.defaultedPercentage,
          fulfilledRevenue: fulfilledRevenue
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching PTP metrics:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch PTP metrics',
      data: {
        ptpMetrics: {
          totalPTPs: 0,
          fulfilledPTPs: 0,
          pendingPTPs: 0,
          defaultedPTPs: 0,
          fulfilledPercentage: 0,
          pendingPercentage: 0,
          defaultedPercentage: 0,
          fulfilledRevenue: 0
        }
      }
    }, { status: 500 });
  }
}
