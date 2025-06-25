// lib/call-wrap-up-service.ts
import { supabase } from './supabaseClient';

export type CallWrapUp = {
  id?: string;
  agent_id: string;
  debtor_id?: string;
  phone_number: string;
  call_start_time: Date;
  call_end_time: Date;
  call_duration: number; // Duration in seconds
  wrap_up_code: string;
  notes?: string;
  callback_date?: Date;
  account_number?: string;
  call_direction: 'outbound' | 'inbound';
  call_status: 'completed' | 'missed' | 'failed';
  call_recording_url?: string;
};

export type CallWrapUpResponse = {
  success: boolean;
  data?: CallWrapUp;
  error?: string;
};

export type CallPerformanceReport = {
  total_calls: number;
  ptp_count: number;
  ptp_callback_count: number;
  no_answer_count: number;
  answering_machine_count: number;
  wrong_number_count: number;
  do_not_call_count: number;
  callback_count: number;
  refuse_to_pay_count: number;
  account_settled_count: number;
  avg_call_duration: number;
  total_call_duration: number;
};

export type AgentCallPerformance = CallPerformanceReport & {
  agent_id: string;
  call_date: string;
};

export type WeeklyCallPerformance = {
  agent_id: string;
  week_start: string;
  total_calls: number;
  ptp_count: number;
  ptp_callback_count: number;
  active_days: number;
  avg_call_duration: number;
  total_call_duration: number;
};

export type MonthlyCallPerformance = WeeklyCallPerformance & {
  month_start: string;
  unique_debtors_contacted: number;
};

/**
 * Call Wrap-up Service
 * Handles recording and retrieving call wrap-up data in Supabase
 */
export const callWrapUpService = {
  /**
   * Record a new call wrap-up
   * @param wrapUp The call wrap-up data to record
   * @returns Promise with the result of the operation
   */
  recordCallWrapUp: async (wrapUp: CallWrapUp): Promise<CallWrapUpResponse> => {
    try {
      // Validate required fields
      if (!wrapUp.agent_id) {
        return { success: false, error: 'Agent ID is required' };
      }

      if (!wrapUp.phone_number) {
        return { success: false, error: 'Phone number is required' };
      }

      if (!wrapUp.wrap_up_code) {
        return { success: false, error: 'Wrap-up code is required' };
      }

      // Format dates for PostgreSQL
      const formattedWrapUp = {
        ...wrapUp,
        call_start_time: wrapUp.call_start_time.toISOString(),
        call_end_time: wrapUp.call_end_time.toISOString(),
        callback_date: wrapUp.callback_date ? wrapUp.callback_date.toISOString() : null
      };

      // Insert the wrap-up record
      const { data, error } = await supabase
        .from('call_wrap_ups')
        .insert([formattedWrapUp])
        .select()
        .single();

      if (error) {
        console.error('Error recording call wrap-up:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in recordCallWrapUp:', error);
      return { success: false, error: error.message || 'Unknown error recording call wrap-up' };
    }
  },

  /**
   * Get call wrap-ups for a specific agent
   * @param agentId The ID of the agent
   * @param limit Optional limit of records to return
   * @param offset Optional offset for pagination
   * @returns Promise with the result of the operation
   */
  getAgentCallWrapUps: async (
    agentId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ success: boolean; data?: CallWrapUp[]; error?: string; count?: number }> => {
    try {
      // Get the count first
      const { count, error: countError } = await supabase
        .from('call_wrap_ups')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      if (countError) {
        console.error('Error getting call wrap-up count:', countError);
        return { success: false, error: countError.message };
      }

      // Get the actual data
      const { data, error } = await supabase
        .from('call_wrap_ups')
        .select('*')
        .eq('agent_id', agentId)
        .order('call_start_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting agent call wrap-ups:', error);
        return { success: false, error: error.message };
      }

      // Convert date strings back to Date objects
      const formattedData = data.map(item => ({
        ...item,
        call_start_time: new Date(item.call_start_time),
        call_end_time: new Date(item.call_end_time),
        callback_date: item.callback_date ? new Date(item.callback_date) : undefined
      }));

      return { success: true, data: formattedData, count: count ?? undefined };
    } catch (error: any) {
      console.error('Error in getAgentCallWrapUps:', error);
      return { success: false, error: error.message || 'Unknown error getting call wrap-ups' };
    }
  },

  /**
   * Get call wrap-ups for a specific debtor
   * @param debtorId The ID of the debtor
   * @returns Promise with the result of the operation
   */
  getDebtorCallWrapUps: async (debtorId: string): Promise<{ success: boolean; data?: CallWrapUp[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('call_wrap_ups')
        .select('*')
        .eq('debtor_id', debtorId)
        .order('call_start_time', { ascending: false });

      if (error) {
        console.error('Error getting debtor call wrap-ups:', error);
        return { success: false, error: error.message };
      }

      // Convert date strings back to Date objects
      const formattedData = data.map(item => ({
        ...item,
        call_start_time: new Date(item.call_start_time),
        call_end_time: new Date(item.call_end_time),
        callback_date: item.callback_date ? new Date(item.callback_date) : undefined
      }));

      return { success: true, data: formattedData };
    } catch (error: any) {
      console.error('Error in getDebtorCallWrapUps:', error);
      return { success: false, error: error.message || 'Unknown error getting call wrap-ups' };
    }
  },

  /**
   * Get call wrap-ups by phone number
   * @param phoneNumber The phone number to search for
   * @returns Promise with the result of the operation
   */
  getCallWrapUpsByPhone: async (phoneNumber: string): Promise<{ success: boolean; data?: CallWrapUp[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('call_wrap_ups')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('call_start_time', { ascending: false });

      if (error) {
        console.error('Error getting call wrap-ups by phone:', error);
        return { success: false, error: error.message };
      }

      // Convert date strings back to Date objects
      const formattedData = data.map(item => ({
        ...item,
        call_start_time: new Date(item.call_start_time),
        call_end_time: new Date(item.call_end_time),
        callback_date: item.callback_date ? new Date(item.callback_date) : undefined
      }));

      return { success: true, data: formattedData };
    } catch (error: any) {
      console.error('Error in getCallWrapUpsByPhone:', error);
      return { success: false, error: error.message || 'Unknown error getting call wrap-ups' };
    }
  },

  /**
   * Get call wrap-ups by account number
   * @param accountNumber The account number to search for
   * @returns Promise with the result of the operation
   */
  getCallWrapUpsByAccount: async (accountNumber: string): Promise<{ success: boolean; data?: CallWrapUp[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('call_wrap_ups')
        .select('*')
        .eq('account_number', accountNumber)
        .order('call_start_time', { ascending: false });

      if (error) {
        console.error('Error getting call wrap-ups by account:', error);
        return { success: false, error: error.message };
      }

      // Convert date strings back to Date objects
      const formattedData = data.map(item => ({
        ...item,
        call_start_time: new Date(item.call_start_time),
        call_end_time: new Date(item.call_end_time),
        callback_date: item.callback_date ? new Date(item.callback_date) : undefined
      }));

      return { success: true, data: formattedData };
    } catch (error: any) {
      console.error('Error in getCallWrapUpsByAccount:', error);
      return { success: false, error: error.message || 'Unknown error getting call wrap-ups' };
    }
  },

  /**
   * Get daily performance report for an agent
   * @param agentId The ID of the agent
   * @param date The date to get the report for (defaults to today)
   * @returns Promise with the result of the operation
   */
  getDailyPerformance: async (
    agentId: string,
    date: Date = new Date()
  ): Promise<{ success: boolean; data?: AgentCallPerformance; error?: string }> => {
    try {
      // Format date to YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('agent_call_performance')
        .select('*')
        .eq('agent_id', agentId)
        .eq('call_date', formattedDate)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
        console.error('Error getting daily performance:', error);
        return { success: false, error: error.message };
      }

      // If no data, return empty report
      if (!data) {
        return {
          success: true,
          data: {
            agent_id: agentId,
            call_date: formattedDate,
            total_calls: 0,
            ptp_count: 0,
            ptp_callback_count: 0,
            no_answer_count: 0,
            answering_machine_count: 0,
            wrong_number_count: 0,
            do_not_call_count: 0,
            callback_count: 0,
            refuse_to_pay_count: 0,
            account_settled_count: 0,
            avg_call_duration: 0,
            total_call_duration: 0
          }
        };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in getDailyPerformance:', error);
      return { success: false, error: error.message || 'Unknown error getting daily performance' };
    }
  },

  /**
   * Get weekly performance report for an agent
   * @param agentId The ID of the agent
   * @param date A date within the week to get the report for (defaults to today)
   * @returns Promise with the result of the operation
   */
  getWeeklyPerformance: async (
    agentId: string,
    date: Date = new Date()
  ): Promise<{ success: boolean; data?: WeeklyCallPerformance; error?: string }> => {
    try {
      // Get the start of the week (Monday)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const formattedDate = startOfWeek.toISOString();

      const { data, error } = await supabase
        .from('weekly_call_performance')
        .select('*')
        .eq('agent_id', agentId)
        .eq('week_start', formattedDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting weekly performance:', error);
        return { success: false, error: error.message };
      }

      // If no data, return empty report
      if (!data) {
        return {
          success: true,
          data: {
            agent_id: agentId,
            week_start: formattedDate,
            total_calls: 0,
            ptp_count: 0,
            ptp_callback_count: 0,
            active_days: 0,
            avg_call_duration: 0,
            total_call_duration: 0
          }
        };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in getWeeklyPerformance:', error);
      return { success: false, error: error.message || 'Unknown error getting weekly performance' };
    }
  },

  /**
   * Get monthly performance report for an agent
   * @param agentId The ID of the agent
   * @param date A date within the month to get the report for (defaults to today)
   * @returns Promise with the result of the operation
   */
  getMonthlyPerformance: async (
    agentId: string,
    date: Date = new Date()
  ): Promise<{ success: boolean; data?: MonthlyCallPerformance; error?: string }> => {
    try {
      // Get the start of the month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const formattedDate = startOfMonth.toISOString();

      const { data, error } = await supabase
        .from('monthly_call_performance')
        .select('*')
        .eq('agent_id', agentId)
        .eq('month_start', formattedDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting monthly performance:', error);
        return { success: false, error: error.message };
      }

      // If no data, return empty report
      if (!data) {
        return {
          success: true,
          data: {
            agent_id: agentId,
            month_start: formattedDate,
            week_start: formattedDate, // Include for type compatibility
            total_calls: 0,
            ptp_count: 0,
            ptp_callback_count: 0,
            active_days: 0,
            avg_call_duration: 0,
            total_call_duration: 0,
            unique_debtors_contacted: 0
          }
        };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in getMonthlyPerformance:', error);
      return { success: false, error: error.message || 'Unknown error getting monthly performance' };
    }
  }
};
