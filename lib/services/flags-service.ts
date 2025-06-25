// lib/services/flags-service.ts
import { getSupabaseAdminClient } from '@/lib/supabaseClient';
import { Flag } from '@/lib/redux/features/flags/flagsSlice';
import { v4 as uuidv4 } from 'uuid';

// Define the database flag type
export interface DbFlag {
  id: string;
  customer_id: string;
  type: string;
  priority: string;
  notes: string;
  created_at: string;
  created_by: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

// Flags service for Supabase operations
export const flagsService = {
  /**
   * Get flags for a specific customer
   */
  async getCustomerFlags(customerId: string): Promise<Flag[]> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      
      // Fetch flags
      const { data: flagsData, error } = await adminClient
        .from('flags')
        .select(`
          id,
          customer_id,
          type,
          priority,
          notes,
          created_at,
          created_by,
          is_resolved,
          resolved_at,
          resolved_by
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching flags:', error);
        return [];
      }
      
      // Fetch profiles separately
      const userIds = flagsData.map((flag: any) => flag.created_by)
        .concat(flagsData.filter((flag: any) => flag.resolved_by).map((flag: any) => flag.resolved_by))
        .filter((id: string) => id !== null && id !== undefined);
      
      // Filter to unique IDs using a more TypeScript-friendly approach
      const uniqueUserIds = userIds.filter((id, index) => userIds.indexOf(id) === index);
      
      const { data: profilesData, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Create a map of profiles by id for easy lookup
      const profilesMap = (profilesData || []).reduce((map: any, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {});

      // Fetch customer info
      const { data: customerData, error: customerError } = await adminClient
        .from('Debtors')
        .select('id, name, acc_number')
        .eq('id', customerId)
        .single();
        
      if (customerError) {
        console.error('Error fetching customer:', customerError);
      }

      // Transform database flags to application flags
      return flagsData.map((item: any) => {
        const createdByProfile = profilesMap[item.created_by];
        const resolvedByProfile = item.resolved_by ? profilesMap[item.resolved_by] : null;
        
        return {
          id: item.id,
          accountId: item.customer_id,
          accountName: customerData?.name || 'Unknown Account',
          accountNumber: customerData?.acc_number || '',
          type: item.type,
          priority: item.priority,
          notes: item.notes,
          dateAdded: item.created_at,
          addedBy: createdByProfile ? createdByProfile.full_name : 'Unknown User',
          addedById: item.created_by,
          isResolved: item.is_resolved,
          dateResolved: item.resolved_at,
          resolvedBy: resolvedByProfile ? resolvedByProfile.full_name : undefined,
          resolvedById: item.resolved_by
        };
      });
    } catch (error) {
      console.error('Error in getCustomerFlags:', error);
      return [];
    }
  },

  /**
   * Add a new flag
   */
  async addFlag(flag: {
    accountId: string;
    accountName: string;
    accountNumber?: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    notes: string;
    addedById: string;
    addedBy: string;
  }): Promise<Flag | null> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      
      const newFlag = {
        id: uuidv4(),
        customer_id: flag.accountId,
        type: flag.type,
        priority: flag.priority,
        notes: flag.notes,
        created_at: new Date().toISOString(),
        created_by: flag.addedById,
        is_resolved: false
      };

      const { data, error } = await adminClient
        .from('flags')
        .insert(newFlag)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding flag:', error);
        return null;
      }
      
      return {
        id: data.id,
        accountId: data.customer_id,
        accountName: flag.accountName,
        accountNumber: flag.accountNumber || undefined,
        type: data.type,
        priority: data.priority,
        notes: data.notes,
        dateAdded: data.created_at,
        addedBy: flag.addedBy,
        addedById: data.created_by,
        isResolved: data.is_resolved
      };
    } catch (error) {
      console.error('Error in addFlag:', error);
      return null;
    }
  },

  /**
   * Resolve a flag
   */
  async resolveFlag(flagId: string, resolvedById: string, resolvedBy: string): Promise<boolean> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      
      const { error } = await adminClient
        .from('flags')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedById
        })
        .eq('id', flagId);

      if (error) {
        console.error('Error resolving flag:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resolveFlag:', error);
      return false;
    }
  },

  /**
   * Delete a flag
   */
  async deleteFlag(flagId: string): Promise<boolean> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      
      const { error } = await adminClient
        .from('flags')
        .delete()
        .eq('id', flagId);

      if (error) {
        console.error('Error deleting flag:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteFlag:', error);
      return false;
    }
  }
};
