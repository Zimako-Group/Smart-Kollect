import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedOrFresh, invalidateCache, CACHE_TTL } from '@/lib/redis';

// GET endpoint to list saved reports
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

    const userId = session.user.id;
    
    // Create a cache key based on user ID
    const cacheKey = `reports:saved:${userId}`;
    
    // Use the getCachedOrFresh utility to handle caching
    const reports = await getCachedOrFresh(
      cacheKey,
      async () => {
    
    // Check if the reports table exists
    const { data: tableExists } = await supabase
      .rpc('check_table_exists', { table_name: 'reports' });
    
    // If the table doesn't exist, return an empty array
    if (!tableExists) {
      return NextResponse.json([]);
    }
    
    // Fetch saved reports for the user
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    if (reportsError) {
      throw new Error(`Error fetching saved reports: ${reportsError.message}`);
    }
    
    return reports || [];
      },
      CACHE_TTL.MEDIUM
    );
    
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error in saved reports API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new saved report
export async function POST(
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

    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.format) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, format' },
        { status: 400 }
      );
    }
    
    // Check if the reports table exists
    const { data: tableExists } = await supabase
      .rpc('check_table_exists', { table_name: 'reports' });
    
    // If the table doesn't exist, create it
    if (!tableExists) {
      // Create the reports table
      const { error: createTableError } = await supabase.rpc('create_reports_table');
      
      if (createTableError) {
        throw new Error(`Error creating reports table: ${createTableError.message}`);
      }
    }
    
    // Create the new report
    const { data: report, error: createError } = await supabase
      .from('reports')
      .insert({
        name: body.name,
        type: body.type,
        parameters: body.parameters || {},
        created_by: userId,
        format: body.format,
        frequency: body.frequency || null
      })
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Error creating report: ${createError.message}`);
    }
    
    // Invalidate cache
    await invalidateCache(`reports:saved:${userId}`);
    
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error in create saved report API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a saved report
export async function DELETE(
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

    const userId = session.user.id;
    
    // Get report ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('id');
    
    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing report ID' },
        { status: 400 }
      );
    }
    
    // Check if the user owns the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('created_by')
      .eq('id', reportId)
      .single();
    
    if (reportError) {
      throw new Error(`Error fetching report: ${reportError.message}`);
    }
    
    if (!report || report.created_by !== userId) {
      return NextResponse.json(
        { error: 'Report not found or not owned by user' },
        { status: 404 }
      );
    }
    
    // Delete the report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    
    if (deleteError) {
      throw new Error(`Error deleting report: ${deleteError.message}`);
    }
    
    // Invalidate cache
    await invalidateCache(`reports:saved:${userId}`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete saved report API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
