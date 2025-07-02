import { Reminder } from './redux/features/reminders/remindersSlice';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdmin';

// Define the Callback type to match your Supabase table structure
export interface Callback {
  id: string;
  agent_id: string;
  agent_name: string;
  debtor_id: string;
  phone_number: string;
  callback_date: string;
  notes: string;
  status: 'pending' | 'completed' | 'missed';
  created_at?: string;
}

// Define the options for the ReminderService
export interface ReminderServiceOptions {
  useAdmin?: boolean;
}

class ReminderService {
  // Convert a callback to a reminder format
  private convertCallbackToReminder(callback: any): Reminder {
    return {
      id: callback.id,
      title: `Call ${callback.phone_number}`,
      details: callback.notes || 'No additional notes',
      accountNumber: callback.debtor_id !== '00000000-0000-0000-0000-000000000000' ? callback.debtor_id : undefined,
      type: 'callback',
      priority: 'medium', // Default priority
      dueDate: new Date(callback.callback_date).toISOString().split('T')[0],
      dueTime: new Date(callback.callback_date).toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      isCompleted: callback.status === 'completed',
      createdBy: callback.agent_name || callback.agent_id,
      createdAt: callback.created_at || new Date().toISOString()
    };
  }

  // Get all callbacks directly from the database
  async getCallbacks(options: ReminderServiceOptions = {}): Promise<Callback[]> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      console.log('Directly fetching callbacks from Supabase...');
      
      // Fetch callbacks
      const { data: callbacks, error } = await client
        .from('callbacks')
        .select('*')
        .order('callback_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching callbacks:', error);
        throw error;
      }
      
      console.log('Callbacks fetched successfully:', callbacks);
      return callbacks || [];
    } catch (error) {
      console.error('Error in getCallbacks:', error);
      throw error;
    }
  }
  
  // Get callbacks for a specific agent
  async getCallbacksByAgentId(agentId: string, options: ReminderServiceOptions = {}): Promise<Callback[]> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      console.log(`Fetching callbacks for agent ${agentId}...`);
      
      // Fetch callbacks for the specific agent
      const { data: callbacks, error } = await client
        .from('callbacks')
        .select('*')
        .eq('agent_id', agentId)
        .order('callback_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching agent callbacks:', error);
        throw error;
      }
      
      console.log(`Found ${callbacks?.length || 0} callbacks for agent ${agentId}`);
      return callbacks || [];
    } catch (error) {
      console.error('Error in getCallbacksByAgentId:', error);
      throw error;
    }
  }
  
  // Get the count of pending callbacks for a specific agent
  async getPendingCallbacksCount(agentId: string, options: ReminderServiceOptions = {}): Promise<number> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      console.log(`Fetching pending callbacks count for agent ${agentId}...`);
      
      // Fetch count of pending callbacks for the specific agent
      const { count, error } = await client
        .from('callbacks')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching pending callbacks count:', error);
        throw error;
      }
      
      console.log(`Found ${count || 0} pending callbacks for agent ${agentId}`);
      return count || 0;
    } catch (error) {
      console.error('Error in getPendingCallbacksCount:', error);
      return 0; // Return 0 on error to avoid breaking the dashboard
    }
  }

  // Get the count of pending and missed callbacks for a specific agent (all dates)
  async getPendingMissedCallbacksCount(agentId: string, options: ReminderServiceOptions = {}): Promise<number> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      // Get count of pending and missed callbacks for the agent (all dates)
      const { count, error } = await client
        .from('callbacks')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .in('status', ['pending', 'missed']);
      
      if (error) {
        console.error(`[REMINDER_SERVICE] Error querying pending/missed callbacks:`, error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getPendingMissedCallbacksCount:', error);
      return 0; // Return 0 on error to avoid breaking the dashboard
    }
  }

  // Get all reminders (currently only fetches callbacks)
  async getReminders(options: ReminderServiceOptions = {}): Promise<Reminder[]> {
    try {
      // Get callbacks directly
      const callbacks = await this.getCallbacks(options);
      
      if (callbacks.length === 0) {
        console.log('No callbacks found in the database');
        return [];
      }
      
      // Convert callbacks to reminders format
      const reminders = callbacks.map(callback => {
        const reminder = this.convertCallbackToReminder(callback);
        return reminder;
      });
      
      console.log(`Returning ${reminders.length} reminders`);
      return reminders;
    } catch (error) {
      console.error('Error in getReminders:', error);
      throw error;
    }
  }

  // Mark a reminder as completed
  async markReminderComplete(id: string, options: ReminderServiceOptions = {}): Promise<void> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      // Update the callback status
      const { error } = await client
        .from('callbacks')
        .update({ status: 'completed' })
        .eq('id', id);
      
      if (error) {
        console.error('Error marking callback as completed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markReminderComplete:', error);
      throw error;
    }
  }

  // Create a new reminder (currently only supports callbacks)
  async createReminder(reminder: Omit<Reminder, 'id'>, options: ReminderServiceOptions = {}): Promise<Reminder> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      if (reminder.type === 'callback') {
        // Convert reminder to callback format
        const callbackDate = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
        
        const callback = {
          id: uuidv4(),
          agent_id: reminder.createdBy,
          agent_name: reminder.createdBy,
          debtor_id: reminder.accountNumber || '00000000-0000-0000-0000-000000000000',
          phone_number: reminder.title.replace('Call ', ''),
          callback_date: callbackDate.toISOString(),
          notes: reminder.details,
          status: reminder.isCompleted ? 'completed' : 'pending'
        };
        
        // Insert the callback
        const { data, error } = await client
          .from('callbacks')
          .insert(callback)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating callback:', error);
          throw error;
        }
        
        return this.convertCallbackToReminder(data);
      } else {
        throw new Error('Only callback reminders are currently supported');
      }
    } catch (error) {
      console.error('Error in createReminder:', error);
      throw error;
    }
  }

  // Delete a reminder
  async deleteReminder(id: string, options: ReminderServiceOptions = {}): Promise<void> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      // Delete the callback
      const { error } = await client
        .from('callbacks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting callback:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteReminder:', error);
      throw error;
    }
  }

  /**
   * Get count of broken PTPs (defaulted status) for a specific agent
   * @param agentId - The agent's ID
   * @param options - Service options
   * @returns Promise<number> - Count of broken PTPs from both PTP and ManualPTP tables
   */
  async getBrokenPTPsCount(agentId: string, options: ReminderServiceOptions = {}): Promise<number> {
    try {
      const client = options.useAdmin ? supabaseAdmin : supabase;
      
      // Count defaulted PTPs from PTP table
      const { count: ptpCount, error: ptpError } = await client
        .from('PTP')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', agentId)
        .eq('status', 'defaulted');

      if (ptpError) {
        console.error('Error fetching PTP count:', ptpError);
        throw ptpError;
      }

      // Count defaulted PTPs from ManualPTP table
      const { count: manualPtpCount, error: manualPtpError } = await client
        .from('ManualPTP')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', agentId)
        .eq('status', 'defaulted');

      if (manualPtpError) {
        console.error('Error fetching ManualPTP count:', manualPtpError);
        throw manualPtpError;
      }

      const totalCount = (ptpCount || 0) + (manualPtpCount || 0);
      console.log(`Broken PTPs count for agent ${agentId}: PTP=${ptpCount}, ManualPTP=${manualPtpCount}, Total=${totalCount}`);
      
      return totalCount;
    } catch (error) {
      console.error('Error in getBrokenPTPsCount:', error);
      return 0;
    }
  }
}

export const reminderService = new ReminderService();
