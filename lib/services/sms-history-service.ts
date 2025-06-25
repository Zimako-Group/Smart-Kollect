import { SMSHistory } from '../redux/features/sms/smsSlice';
import { supabase } from '../supabase';

/**
 * Service for managing SMS history in Supabase
 */
export const SmsHistoryService = {
  /**
   * Save an SMS message to history in Supabase
   * @param smsHistory SMS history entry to save
   */
  async saveSmsToHistory(smsHistory: SMSHistory): Promise<boolean> {
    try {
      console.log('Saving SMS to history:', JSON.stringify(smsHistory, null, 2));
      
      if (!smsHistory.accountNumber) {
        console.error('Cannot save SMS history: Missing account number');
        return false;
      }
      
      // Ensure we have the required fields
      if (!smsHistory.id || !smsHistory.message || !smsHistory.recipientPhone) {
        console.error('Cannot save SMS history: Missing required fields');
        return false;
      }
      
      // Format the data for Supabase - ensure all fields match the database schema
      // IMPORTANT: Use acc_number (not account_number) as per database schema
      const smsData = {
        message_id: smsHistory.id, // Store the application's message ID in message_id field
        acc_number: smsHistory.accountNumber, // Using acc_number as per database schema
        recipient_phone: smsHistory.recipientPhone,
        recipient_name: smsHistory.recipientName || '',
        message: smsHistory.message,
        status: smsHistory.status || 'sent',
        created_at: new Date(smsHistory.timestamp).toISOString()
      };
      
      console.log('Formatted SMS data for Supabase:', smsData);
      
      // Try to insert the SMS history record
      const { data, error } = await supabase
        .from('sms_history')
        .insert(smsData)
        .select(); // Add select() to return the inserted record with its UUID

      if (error) {
        console.error('Error saving SMS history to Supabase:', error);
        
        // If it's a permission error, log more details
        if (error.message.includes('permission denied')) {
          console.error('Permission denied. Check your RLS policies for the sms_history table');
        }
        
        return false;
      }

      console.log('SMS history saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error in saveSmsToHistory:', error);
      return false;
    }
  },

  /**
   * Load SMS history for a specific account from Supabase
   * @param accountNumber Account number to load SMS history for
   */
  async loadSmsHistoryForAccount(accountNumber: string): Promise<SMSHistory[]> {
    try {
      if (!accountNumber) return [];

      console.log(`Querying SMS history with acc_number = ${accountNumber}`);
      
      // IMPORTANT: Use acc_number (not account_number) as per database schema
      const { data, error } = await supabase
        .from('sms_history')
        .select('*')
        .eq('acc_number', accountNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading SMS history from Supabase:', error);
        
        // If it's a permission error, log more details
        if (error.message.includes('permission denied')) {
          console.error('Permission denied. Check your RLS policies for the sms_history table');
        }
        
        return [];
      }

      console.log('Raw SMS history data from Supabase:', data);
      
      if (!data || data.length === 0) {
        console.log('No SMS history found for account:', accountNumber);
        return [];
      }
      
      // Map the database records to the application's SMSHistory format
      const history = data.map(item => ({
        id: item.message_id, // Use message_id consistently as the ID in the application
        timestamp: new Date(item.created_at).getTime(),
        recipientPhone: item.recipient_phone,
        recipientName: item.recipient_name || '',
        message: item.message,
        status: item.status as 'sent' | 'delivered' | 'read' | 'failed',
        accountNumber: item.acc_number // Map back to accountNumber in the app
      }));
      
      console.log('Mapped SMS history:', history);
      return history;
    } catch (error) {
      console.error('Error in loadSmsHistoryForAccount:', error);
      return [];
    }
  },

  /**
   * Update the status of an SMS message
   * @param messageId ID of the message to update
   * @param status New status
   * @returns Success flag
   */
  async updateSmsStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('message_id', messageId);

      if (error) {
        console.error('Error updating SMS status in Supabase:', error);
        
        // If it's a permission error, log more details
        if (error.message.includes('permission denied')) {
          console.error('Permission denied. Check your RLS policies for the sms_history table');
        }
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSmsStatus:', error);
      return false;
    }
  },

  /**
   * Get all SMS history entries
   * @param limit Maximum number of entries to return
   * @returns Array of SMS history entries
   */
  async getAllSmsHistory(limit = 100): Promise<SMSHistory[]> {
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error loading all SMS history from Supabase:', error);
        
        // If it's a permission error, log more details
        if (error.message.includes('permission denied')) {
          console.error('Permission denied. Check your RLS policies for the sms_history table');
        }
        
        return [];
      }

      // Convert Supabase data to SMSHistory format
      return (data || []).map(item => ({
        id: item.message_id,
        timestamp: new Date(item.created_at).getTime(),
        recipientPhone: item.recipient_phone,
        recipientName: item.recipient_name,
        message: item.message,
        status: item.status as 'sent' | 'delivered' | 'read' | 'failed',
        accountNumber: item.acc_number
      }));
    } catch (error) {
      console.error('Error in getAllSmsHistory:', error);
      return [];
    }
  }
};
