// lib/callback-service.ts
import { supabase, supabaseAdmin } from './supabaseClient';

export type Callback = {
  id?: string;
  agent_id: string;
  agent_name?: string;
  debtor_id: string;
  debtor_name?: string;
  account_number?: string;
  phone_number: string;
  callback_date: Date | string;
  notes?: string;
  status: 'pending' | 'completed' | 'missed';
  created_at?: string;
  completed_at?: string | null;
};

export type CallbackResponse = {
  success: boolean;
  data?: Callback;
  error?: string;
};

/**
 * Callback Service
 * Handles creating, retrieving, and updating callback reminders
 */
export const callbackService = {
  /**
   * Create a new callback reminder
   * @param callback The callback data to record
   * @returns Promise with the result of the operation
   */
  createCallback: async (callback: Callback): Promise<CallbackResponse> => {
    try {
      // Validate required fields
      if (!callback.agent_id) {
        return { success: false, error: 'Agent ID is required' };
      }

      if (!callback.debtor_id) {
        return { success: false, error: 'Debtor ID is required' };
      }

      if (!callback.phone_number) {
        return { success: false, error: 'Phone number is required' };
      }

      if (!callback.callback_date) {
        return { success: false, error: 'Callback date is required' };
      }

      // Format dates for PostgreSQL
      const formattedCallback = {
        ...callback,
        callback_date: callback.callback_date instanceof Date 
          ? callback.callback_date.toISOString() 
          : callback.callback_date,
        status: callback.status || 'pending',
      };

      // Insert the callback record using supabaseAdmin to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('callbacks')
        .insert([formattedCallback])
        .select()
        .single();

      if (error) {
        console.error('Error creating callback reminder:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in createCallback:', error);
      return { success: false, error: error.message || 'Unknown error creating callback reminder' };
    }
  },

  /**
   * Get callbacks for a specific agent
   * @param agentId The ID of the agent
   * @param status Optional status filter ('pending', 'completed', 'missed')
   * @returns Promise with the result of the operation
   */
  getAgentCallbacks: async (
    agentId: string,
    status?: 'pending' | 'completed' | 'missed'
  ): Promise<{ success: boolean; data?: Callback[]; error?: string }> => {
    try {
      let query = supabaseAdmin
        .from('callbacks')
        .select(`
          *,
          Debtors!inner (
            id,
            name,
            surname_company_trust,
            acc_number
          )
        `)
        .eq('agent_id', agentId)
        .order('callback_date', { ascending: true });

      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting agent callbacks:', error);
        return { success: false, error: error.message };
      }

      // Format the data to include debtor name and account number
      const formattedData = data.map(callback => ({
        ...callback,
        debtor_name: `${callback.Debtors.name} ${callback.Debtors.surname_company_trust}`,
        account_number: callback.Debtors.acc_number,
      }));

      return { success: true, data: formattedData };
    } catch (error: any) {
      console.error('Error in getAgentCallbacks:', error);
      return { success: false, error: error.message || 'Unknown error getting agent callbacks' };
    }
  },

  /**
   * Get all pending callbacks for today
   * @returns Promise with the result of the operation
   */
  getTodayCallbacks: async (): Promise<{ success: boolean; data?: Callback[]; error?: string }> => {
    try {
      // Get today's date at start and end of day
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const { data, error } = await supabaseAdmin
        .from('callbacks')
        .select(`
          *,
          Debtors!inner (
            id,
            name,
            surname_company_trust,
            acc_number
          )
        `)
        .eq('status', 'pending')
        .gte('callback_date', startOfDay.toISOString())
        .lte('callback_date', endOfDay.toISOString())
        .order('callback_date', { ascending: true });

      if (error) {
        console.error('Error getting today callbacks:', error);
        return { success: false, error: error.message };
      }

      // Format the data to include debtor name and account number
      const formattedData = data.map(callback => ({
        ...callback,
        debtor_name: `${callback.Debtors.name} ${callback.Debtors.surname_company_trust}`,
        account_number: callback.Debtors.acc_number,
      }));

      return { success: true, data: formattedData };
    } catch (error: any) {
      console.error('Error in getTodayCallbacks:', error);
      return { success: false, error: error.message || 'Unknown error getting today callbacks' };
    }
  },

  /**
   * Update a callback status
   * @param callbackId The ID of the callback to update
   * @param status The new status ('pending', 'completed', 'missed')
   * @param completedAt Optional timestamp for when the callback was completed
   * @returns Promise with the result of the operation
   */
  updateCallbackStatus: async (
    callbackId: string,
    status: 'pending' | 'completed' | 'missed',
    completedAt?: Date
  ): Promise<CallbackResponse> => {
    try {
      const updateData: any = { status };
      
      // Add completed_at if provided or if status is 'completed'
      if (completedAt) {
        updateData.completed_at = completedAt.toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('callbacks')
        .update(updateData)
        .eq('id', callbackId)
        .select()
        .single();

      if (error) {
        console.error('Error updating callback status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in updateCallbackStatus:', error);
      return { success: false, error: error.message || 'Unknown error updating callback status' };
    }
  },

  /**
   * Delete a callback
   * @param callbackId The ID of the callback to delete
   * @returns Promise with the result of the operation
   */
  deleteCallback: async (callbackId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseAdmin
        .from('callbacks')
        .delete()
        .eq('id', callbackId);

      if (error) {
        console.error('Error deleting callback:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteCallback:', error);
      return { success: false, error: error.message || 'Unknown error deleting callback' };
    }
  }
};
