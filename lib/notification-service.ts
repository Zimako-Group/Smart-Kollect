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
 * Creates a notification in the system
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
  try {
    const { data, error } = await supabase
      .from('Notifications')
      .insert({
        ...notification,
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
 * Fetches notifications for a specific role
 */
export const getNotifications = async (role: 'admin' | 'agent', agentName?: string, limit = 10) => {
  try {
    let query = supabase
      .from('Notifications')
      .select('*')
      .or(`target_role.eq.${role},target_role.eq.all`)
      .order('created_at', { ascending: false })
      .limit(limit);

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
