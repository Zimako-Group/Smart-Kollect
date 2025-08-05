import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAuth } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
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
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const callType = searchParams.get('type') || 'all'; // 'all', 'inbound', 'outbound'
    const status = searchParams.get('status') || 'all'; // 'all', 'active', 'queued', 'completed'
    
    // Fetch active calls
    const activeCalls = await getActiveCalls(callType);
    
    // Fetch queued calls
    const queuedCalls = await getQueuedCalls();
    
    // Fetch call statistics
    const callStats = await getCallStatistics();
    
    return NextResponse.json({
      success: true,
      data: {
        activeCalls: status === 'all' || status === 'active' ? activeCalls : [],
        queuedCalls: status === 'all' || status === 'queued' ? queuedCalls : [],
        callStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching call data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call data', message: error.message },
      { status: 500 }
    );
  }
}

async function getActiveCalls(callType: string) {
  // Build query for active calls
  let query = supabase
    .from('Calls')
    .select(`
      id,
      type,
      status,
      start_time,
      duration,
      agent_id,
      Users (name, avatar_url),
      customer_name,
      customer_phone,
      Debtors (id, acc_number, name, surname_company_trust)
    `)
    .eq('status', 'active');
    
  // Filter by call type if specified
  if (callType !== 'all') {
    query = query.eq('type', callType);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching active calls:', error);
    throw new Error('Failed to fetch active calls');
  }
  
  // Format the response
  return data.map(call => {
    // Calculate current duration in seconds
    const startTime = new Date(call.start_time);
    const currentDuration = Math.floor((Date.now() - startTime.getTime()) / 1000);
    
    // Handle Debtors as an array (Supabase returns joined tables as arrays)
    const debtorData = Array.isArray(call.Debtors) && call.Debtors.length > 0 
      ? call.Debtors[0] 
      : null;
    
    // Get customer name from Debtors if available, otherwise use customer_name
    const customerName = debtorData 
      ? `${debtorData.name || ''} ${debtorData.surname_company_trust || ''}`.trim()
      : call.customer_name || 'Unknown Customer';
      
    // Get account number if available - using acc_number as per database schema
    const accountNumber = debtorData?.acc_number || null;
    
    return {
      id: call.id,
      type: call.type,
      startTime: call.start_time,
      duration: currentDuration,
      agent: {
        id: call.agent_id,
        name: Array.isArray(call.Users) && call.Users.length > 0 ? call.Users[0].name : 'Unknown Agent',
        avatarUrl: Array.isArray(call.Users) && call.Users.length > 0 ? call.Users[0].avatar_url : undefined
      },
      customer: {
        name: customerName,
        phone: call.customer_phone,
        accountNumber
      }
    };
  });
}

async function getQueuedCalls() {
  const { data, error } = await supabase
    .from('CallQueue')
    .select(`
      id,
      customer_name,
      customer_phone,
      wait_time,
      priority,
      entered_queue_at,
      Debtors (id, acc_number, name, surname_company_trust)
    `)
    .order('priority', { ascending: false })
    .order('entered_queue_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching queued calls:', error);
    throw new Error('Failed to fetch queued calls');
  }
  
  // Format the response
  return data.map(call => {
    // Calculate current wait time in seconds
    const enteredQueueAt = new Date(call.entered_queue_at);
    const waitTime = Math.floor((Date.now() - enteredQueueAt.getTime()) / 1000);
    
    // Handle Debtors as an array (Supabase returns joined tables as arrays)
    const debtorData = Array.isArray(call.Debtors) && call.Debtors.length > 0 
      ? call.Debtors[0] 
      : null;
    
    // Get customer name from Debtors if available, otherwise use customer_name
    const customerName = debtorData 
      ? `${debtorData.name || ''} ${debtorData.surname_company_trust || ''}`.trim()
      : call.customer_name || 'Unknown Customer';
      
    // Get account number if available - using acc_number as per database schema
    const accountNumber = debtorData?.acc_number || null;
    
    return {
      id: call.id,
      customer: {
        name: customerName,
        phone: call.customer_phone,
        accountNumber
      },
      waitTime,
      priority: call.priority,
      enteredQueueAt: call.entered_queue_at
    };
  });
}

async function getCallStatistics() {
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  
  // Fetch today's calls
  const { data: todayCalls, error: todayError } = await supabase
    .from('Calls')
    .select('id, type, status, duration')
    .gte('start_time', todayStr);
    
  if (todayError) {
    console.error('Error fetching today\'s calls:', todayError);
    throw new Error('Failed to fetch call statistics');
  }
  
  // Calculate statistics
  const totalCalls = todayCalls?.length || 0;
  const inboundCalls = todayCalls?.filter(call => call.type === 'inbound').length || 0;
  const outboundCalls = todayCalls?.filter(call => call.type === 'outbound').length || 0;
  const answeredCalls = todayCalls?.filter(call => call.status === 'completed').length || 0;
  const missedCalls = todayCalls?.filter(call => call.status === 'missed').length || 0;
  const abandonedCalls = todayCalls?.filter(call => call.status === 'abandoned').length || 0;
  
  // Calculate average call duration for completed calls
  const completedCalls = todayCalls?.filter(call => call.status === 'completed') || [];
  const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgCallDuration = completedCalls.length > 0 
    ? Math.round(totalDuration / completedCalls.length) 
    : 0;
  
  // Calculate service level (percentage of calls answered within SLA)
  // For this example, we'll consider a call answered within SLA if it was completed
  const serviceLevel = totalCalls > 0 
    ? Math.round((answeredCalls / totalCalls) * 100) 
    : 0;
  
  return {
    totalCalls,
    inboundCalls,
    outboundCalls,
    answeredCalls,
    missedCalls,
    abandonedCalls,
    avgCallDuration,
    serviceLevel,
    activeCalls: todayCalls?.filter(call => call.status === 'active').length || 0,
    queuedCalls: await getQueuedCallCount()
  };
}

async function getQueuedCallCount() {
  const { count, error } = await supabase
    .from('CallQueue')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error fetching queued call count:', error);
    return 0;
  }
  
  return count || 0;
}
