import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  created_at: string;
  read: boolean;
  agent_name?: string;
  customer_id?: string;
  customer_name?: string;
  action_type?: string;
  action_id?: string;
  details?: any;
  target_role: 'admin' | 'agent' | 'all';
}

/**
 * Creates a notification in the system with tenant context
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'> & { tenant_id?: string }) => {
  try {
    // Get current user's tenant if not provided
    let tenantId = notification.tenant_id;
    if (!tenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        tenantId = profile?.tenant_id;
      }
    }

    const { data, error } = await supabase
      .from('Notifications')
      .insert({
        ...notification,
        tenant_id: tenantId,
        read: false,
      })
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Creates a notification for an account activity
 */
export const createActivityNotification = async (
  action: string,
  customerId: string,
  customerName: string,
  agentName: string,
  actionType: string,
  actionId?: string,
  details?: any,
  notificationType: 'info' | 'warning' | 'urgent' = 'info'
) => {
  try {
    // Create a notification for admins
    await createNotification({
      message: `${agentName} ${action} for ${customerName}`,
      type: notificationType,
      agent_name: agentName,
      customer_id: customerId,
      customer_name: customerName,
      action_type: actionType,
      action_id: actionId,
      details: details,
      target_role: 'admin'
    });

    // Create a notification for the agent who performed the action
    await createNotification({
      message: `You ${action} for ${customerName}`,
      type: notificationType,
      agent_name: agentName,
      customer_id: customerId,
      customer_name: customerName,
      action_type: actionType,
      action_id: actionId,
      details: details,
      target_role: 'agent'
    });

    return true;
  } catch (error) {
    console.error('Error creating activity notification:', error);
    return false;
  }
};

/**
 * Fetches notifications for a specific role with tenant filtering
 */
export const getNotifications = async (role: 'admin' | 'agent', tenantIdOrAgentName?: string, limit = 10) => {
  try {
    // Get current user's tenant context
    const { data: { user } } = await supabase.auth.getUser();
    let userTenantId = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      userTenantId = profile?.tenant_id;
    }

    let query = supabase
      .from('Notifications')
      .select('*')
      .or(`target_role.eq.${role},target_role.eq.all`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by tenant if user has tenant context
    if (userTenantId) {
      query = query.eq('tenant_id', userTenantId);
    }

    // If agent role, also filter by agent name (backward compatibility)
    if (role === 'agent' && tenantIdOrAgentName) {
      query = query.eq('agent_name', tenantIdOrAgentName);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Fetches all notifications for a specific role
 */
export const getAllNotifications = async (role: 'admin' | 'agent', agentName?: string) => {
  try {
    let query = supabase
      .from('Notifications')
      .select('*')
      .or(`target_role.eq.${role},target_role.eq.all`)
      .order('created_at', { ascending: false });

    // If agent role, filter by agent name
    if (role === 'agent' && agentName) {
      query = query.eq('agent_name', agentName);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }
};

/**
 * Marks a notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { data, error } = await supabase
      .from('Notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
};

/**
 * Marks all notifications as read for a specific role
 */
export const markAllNotificationsAsRead = async (role: 'admin' | 'agent', agentName?: string) => {
  try {
    let query = supabase
      .from('Notifications')
      .update({ read: true })
      .or(`target_role.eq.${role},target_role.eq.all`);

    // If agent role, filter by agent name
    if (role === 'agent' && agentName) {
      query = query.eq('agent_name', agentName);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Deletes a notification
 */
export const deleteNotification = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('Notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};
