import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ActiveCall {
  id: string;
  agent_id: string;
  agent_name: string;
  customer_name: string;
  customer_phone: string;
  customer_id?: string;
  call_type: 'outbound' | 'inbound';
  status: 'dialing' | 'connected' | 'on_hold' | 'ended';
  start_time: string;
  end_time?: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface QueuedCall {
  id: string;
  phone_number: string;
  customer_name: string;
  customer_id?: string;
  priority: 'high' | 'medium' | 'low';
  wait_time: number;
  created_at: string;
}

class CallTrackingService {
  private channel: RealtimeChannel | null = null;

  // Initialize real-time subscription
  subscribeToCallUpdates(callback: (payload: any) => void) {
    this.channel = supabase
      .channel('call-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'active_calls' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'call_queue' }, 
        callback
      )
      .subscribe();

    return this.channel;
  }

  // Unsubscribe from real-time updates
  unsubscribeFromCallUpdates() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // Start a new call
  async startCall(callData: {
    agent_id: string;
    agent_name: string;
    customer_name: string;
    customer_phone: string;
    customer_id?: string;
    call_type: 'outbound' | 'inbound';
  }): Promise<ActiveCall | null> {
    try {
      const { data, error } = await supabase
        .from('active_calls')
        .insert({
          agent_id: callData.agent_id,
          agent_name: callData.agent_name,
          customer_name: callData.customer_name,
          customer_phone: callData.customer_phone,
          customer_id: callData.customer_id,
          call_type: callData.call_type,
          status: 'dialing',
          start_time: new Date().toISOString(),
          duration: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting call:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error starting call:', error);
      return null;
    }
  }

  // Update call status
  async updateCallStatus(callId: string, status: ActiveCall['status'], duration?: number): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (duration !== undefined) {
        updateData.duration = duration;
      }

      if (status === 'ended') {
        updateData.end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('active_calls')
        .update(updateData)
        .eq('id', callId);

      if (error) {
        console.error('Error updating call status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating call status:', error);
      return false;
    }
  }

  // End a call
  async endCall(callId: string, duration: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('active_calls')
        .update({
          status: 'ended',
          duration,
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', callId);

      if (error) {
        console.error('Error ending call:', error);
        return false;
      }

      // Move to call history after a short delay
      setTimeout(() => {
        this.moveToHistory(callId);
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  }

  // Move call to history and remove from active calls
  private async moveToHistory(callId: string): Promise<void> {
    try {
      // Get the call data
      const { data: callData, error: fetchError } = await supabase
        .from('active_calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (fetchError || !callData) {
        console.error('Error fetching call for history:', fetchError);
        return;
      }

      // Insert into call history
      const { error: historyError } = await supabase
        .from('call_history')
        .insert({
          ...callData,
          archived_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('Error inserting call history:', historyError);
        return;
      }

      // Remove from active calls
      const { error: deleteError } = await supabase
        .from('active_calls')
        .delete()
        .eq('id', callId);

      if (deleteError) {
        console.error('Error removing from active calls:', deleteError);
      }
    } catch (error) {
      console.error('Error moving call to history:', error);
    }
  }

  // Get all active calls
  async getActiveCalls(): Promise<ActiveCall[]> {
    try {
      const { data, error } = await supabase
        .from('active_calls')
        .select('*')
        .neq('status', 'ended')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active calls:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching active calls:', error);
      return [];
    }
  }

  // Get call queue
  async getCallQueue(): Promise<QueuedCall[]> {
    try {
      const { data, error } = await supabase
        .from('call_queue')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching call queue:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching call queue:', error);
      return [];
    }
  }

  // Add call to queue
  async addToQueue(queueData: {
    phone_number: string;
    customer_name: string;
    customer_id?: string;
    priority: 'high' | 'medium' | 'low';
  }): Promise<QueuedCall | null> {
    try {
      const { data, error } = await supabase
        .from('call_queue')
        .insert({
          ...queueData,
          wait_time: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to call queue:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error adding to call queue:', error);
      return null;
    }
  }

  // Remove from call queue
  async removeFromQueue(queueId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('call_queue')
        .delete()
        .eq('id', queueId);

      if (error) {
        console.error('Error removing from call queue:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing from call queue:', error);
      return false;
    }
  }

  // Update queue wait times
  async updateQueueWaitTimes(): Promise<void> {
    try {
      const { data: queuedCalls, error } = await supabase
        .from('call_queue')
        .select('*');

      if (error) {
        console.error('Error fetching queued calls:', error);
        return;
      }

      // Update wait times for each queued call
      for (const call of queuedCalls) {
        const waitTime = Math.floor((Date.now() - new Date(call.created_at).getTime()) / 1000);
        
        await supabase
          .from('call_queue')
          .update({ 
            wait_time: waitTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', call.id);
      }
    } catch (error) {
      console.error('Error updating queue wait times:', error);
    }
  }

  // Update call durations for active calls
  async updateCallDurations(): Promise<void> {
    try {
      const { data: activeCalls, error } = await supabase
        .from('active_calls')
        .select('*')
        .neq('status', 'ended');

      if (error) {
        console.error('Error fetching active calls:', error);
        return;
      }

      // Update durations for each active call
      for (const call of activeCalls) {
        const duration = Math.floor((Date.now() - new Date(call.start_time).getTime()) / 1000);
        
        await supabase
          .from('active_calls')
          .update({ 
            duration: duration,
            updated_at: new Date().toISOString()
          })
          .eq('id', call.id);
      }
    } catch (error) {
      console.error('Error updating call durations:', error);
    }
  }
}

export const callTrackingService = new CallTrackingService();
