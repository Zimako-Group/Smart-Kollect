import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createActivityNotification } from '@/lib/notification-service';

// Define the Settlement type
export interface Settlement {
  id: string;
  customer_id: string;
  customer_name: string;
  account_number: string;
  original_amount: number;
  settlement_amount: number;
  discount_percentage: number;
  description: string;
  status: string;
  created_at: string;
  expiry_date: string;
  agent_name: string;
  created_by?: string; // User ID of the agent who created the settlement
}

// Create a new settlement
export async function createSettlement(settlementData: Omit<Settlement, 'created_at'>) {
  try {
    console.log('Settlement service - Creating settlement:', settlementData);
    
    // Validate the created_by field to ensure it's a valid UUID
    let created_by = settlementData.created_by;
    if (created_by) {
      // Check if it's a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(created_by)) {
        console.warn('Invalid UUID format for created_by:', created_by);
        created_by = undefined;
      }
    }
    
    // Add created_at timestamp if not provided
    const dataWithTimestamp = {
      ...settlementData,
      created_at: new Date().toISOString(),
      created_by: created_by // Ensure we use the validated created_by
    };
    
    console.log('Data being sent to Supabase:', dataWithTimestamp);
    
    const { data, error } = await supabase
      .from('Settlements')
      .insert(dataWithTimestamp)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Settlement created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating settlement:', error);
    throw error;
  }
}

// Get all settlements
export async function getSettlements() {
  try {
    console.log('Fetching settlements from Supabase');
    
    const { data, error } = await supabase
      .from('Settlements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Settlements fetched successfully:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return [];
  }
}

// Get a settlement by ID
export async function getSettlementById(id: string) {
  try {
    console.log(`Fetching settlement with ID ${id} from Supabase`);
    
    const { data, error } = await supabase
      .from('Settlements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Settlement fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching settlement:', error);
    return null;
  }
}

// Update a settlement
export async function updateSettlement(id: string, settlementData: Partial<Settlement>) {
  try {
    console.log(`Updating settlement with ID ${id} in Supabase:`, settlementData);
    
    // First get the current settlement to compare status changes
    const { data: currentSettlement, error: fetchError } = await supabase
      .from('Settlements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current settlement:', fetchError);
      throw fetchError;
    }
    
    // Update the settlement
    const { data, error } = await supabase
      .from('Settlements')
      .update(settlementData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Create notification if status has changed
    if (settlementData.status && currentSettlement && settlementData.status !== currentSettlement.status) {
      try {
        let action = '';
        let notificationType: 'info' | 'warning' | 'urgent' = 'info';
        
        // Determine the action and notification type based on the new status
        if (settlementData.status === 'accepted') {
          action = 'accepted a settlement offer';
          notificationType = 'info';
        } else if (settlementData.status === 'rejected') {
          action = 'rejected a settlement offer';
          notificationType = 'warning';
        } else if (settlementData.status === 'expired') {
          action = 'marked a settlement offer as expired';
          notificationType = 'warning';
        } else if (settlementData.status === 'completed') {
          action = 'completed a settlement';
          notificationType = 'info';
        }
        
        if (action) {
          await createActivityNotification(
            action,
            currentSettlement.customer_id,
            currentSettlement.customer_name,
            data.agent_name,
            'SETTLEMENT_STATUS_CHANGE',
            id,
            {
              previousStatus: currentSettlement.status,
              newStatus: settlementData.status,
              settlementAmount: currentSettlement.settlement_amount,
              discountPercentage: currentSettlement.discount_percentage,
              originalAmount: currentSettlement.original_amount
            },
            notificationType
          );
        }
      } catch (notificationError) {
        console.error('Error creating settlement status notification:', notificationError);
        // Don't throw here, as we still want to return the updated settlement
      }
    }
    
    console.log('Settlement updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating settlement:', error);
    throw error;
  }
}

// Delete a settlement
export async function deleteSettlement(id: string) {
  try {
    console.log(`Deleting settlement with ID ${id} from Supabase`);
    
    // First get the settlement details before deleting
    const { data: settlementToDelete, error: fetchError } = await supabase
      .from('Settlements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching settlement to delete:', fetchError);
      throw fetchError;
    }
    
    // Use the admin client to bypass RLS policies
    const { error } = await supabaseAdmin
      .from('Settlements')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Create notification for settlement deletion
    if (settlementToDelete) {
      try {
        const notificationType: 'info' | 'warning' | 'urgent' = 'warning';
        await createActivityNotification(
          'deleted a settlement offer',
          settlementToDelete.customer_id,
          settlementToDelete.customer_name,
          settlementToDelete.agent_name,
          'SETTLEMENT_DELETED',
          id,
          {
            status: settlementToDelete.status,
            settlementAmount: settlementToDelete.settlement_amount,
            discountPercentage: settlementToDelete.discount_percentage,
            originalAmount: settlementToDelete.original_amount
          },
          notificationType
        );
      } catch (notificationError) {
        console.error('Error creating settlement deletion notification:', notificationError);
        // Don't throw here, as we still want to return success
      }
    }
    
    console.log('Settlement deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting settlement:', error);
    throw error;
  }
}

// Get the count of pending settlements for a specific agent
export async function getPendingSettlementsCount(agentName: string) {
  try {
    console.log(`Fetching pending settlements count for agent: ${agentName}`);
    
    // Get all settlements for this agent first
    const { data: agentSettlements, error: agentError } = await supabase
      .from('Settlements')
      .select('*')
      .eq('agent_name', agentName);
    
    if (agentError) {
      console.error('Supabase error fetching agent settlements:', agentError);
      throw agentError;
    }
    
    // Manually filter for pending settlements with case insensitivity
    const pendingSettlements = agentSettlements?.filter(settlement => 
      settlement.status?.toLowerCase() === 'pending');
    
    const count = pendingSettlements?.length || 0;
    
    console.log(`Found ${count} pending settlements for agent ${agentName}`);
    console.log('Pending settlements:', pendingSettlements);
    
    return count;
  } catch (error) {
    console.error('Error fetching pending settlements count:', error);
    return 0;
  }
}

// Get settlements for a specific agent
export async function getSettlementsByAgentName(agentName: string) {
  try {
    console.log(`Fetching settlements for agent: ${agentName}`);
    
    const { data, error } = await supabase
      .from('Settlements')
      .select('*')
      .eq('agent_name', agentName)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching agent settlements:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} settlements for agent ${agentName}`);
    return data || [];
  } catch (error) {
    console.error('Error fetching settlements for agent:', error);
    return [];
  }
}

// Check for expired settlements and update their status
export async function checkForExpiredSettlements() {
  try {
    console.log('Checking for expired settlements...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    const todayFormatted = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Find all pending settlements with expiry dates in the past
    const { data: expiredSettlements, error } = await supabase
      .from('Settlements')
      .select('*')
      .eq('status', 'pending')
      .lt('expiry_date', todayFormatted);
    
    if (error) {
      console.error('Error fetching expired settlements:', error);
      throw error;
    }
    
    console.log(`Found ${expiredSettlements?.length || 0} expired settlements`);
    
    // Update each expired settlement and create notifications
    for (const settlement of expiredSettlements || []) {
      try {
        // Update the settlement status to expired
        await updateSettlement(settlement.id, { status: 'expired' });
        
        // Create notification for the expired settlement
        const notificationType: 'info' | 'warning' | 'urgent' = 'warning';
        await createActivityNotification(
          'had a settlement offer expire',
          settlement.customer_id,
          settlement.customer_name,
          settlement.agent_name,
          'SETTLEMENT_EXPIRED',
          settlement.id,
          {
            expiryDate: settlement.expiry_date,
            settlementAmount: settlement.settlement_amount,
            discountPercentage: settlement.discount_percentage,
            originalAmount: settlement.original_amount
          },
          notificationType
        );
        
        console.log(`Updated settlement ${settlement.id} to expired status`);
      } catch (updateError) {
        console.error(`Error updating expired settlement ${settlement.id}:`, updateError);
      }
    }
    
    return expiredSettlements?.length || 0;
  } catch (error) {
    console.error('Error checking for expired settlements:', error);
    return 0;
  }
}
