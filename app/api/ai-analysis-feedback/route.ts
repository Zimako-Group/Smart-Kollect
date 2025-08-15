import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      agentId, 
      customerId, 
      analysisSessionId, 
      feedbackType, 
      suggestion 
    } = body;

    // Validate required fields
    if (!tenantId || !agentId || !customerId || !analysisSessionId || !feedbackType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate feedback type
    if (!['upvote', 'downvote'].includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type. Must be "upvote" or "downvote"' },
        { status: 400 }
      );
    }

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      parameter: 'app.current_tenant',
      value: tenantId
    });

    // Check if feedback already exists for this session and agent
    const { data: existingFeedback, error: checkError } = await supabase
      .from('ai_analysis_feedback')
      .select('id, feedback_type')
      .eq('analysis_session_id', analysisSessionId)
      .eq('agent_id', agentId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing feedback:', checkError);
      return NextResponse.json(
        { error: 'Database error while checking existing feedback' },
        { status: 500 }
      );
    }

    let result;

    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('ai_analysis_feedback')
        .update({
          feedback_type: feedbackType,
          suggestion: suggestion || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating feedback:', error);
        return NextResponse.json(
          { error: 'Failed to update feedback' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new feedback
      const { data, error } = await supabase
        .from('ai_analysis_feedback')
        .insert({
          tenant_id: tenantId,
          agent_id: agentId,
          customer_id: customerId,
          analysis_session_id: analysisSessionId,
          feedback_type: feedbackType,
          suggestion: suggestion || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting feedback:', error);
        return NextResponse.json(
          { error: 'Failed to save feedback' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      message: feedbackType === 'upvote' 
        ? 'Thank you for your positive feedback!' 
        : 'Thank you for your feedback. We\'ll use it to improve our AI analysis.',
      feedback: result
    });

  } catch (error) {
    console.error('Error in AI analysis feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const agentId = searchParams.get('agentId');
    const customerId = searchParams.get('customerId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      parameter: 'app.current_tenant',
      value: tenantId
    });

    let query = supabase
      .from('ai_analysis_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: data
    });

  } catch (error) {
    console.error('Error in AI analysis feedback GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
