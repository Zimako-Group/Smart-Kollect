// lib/permissions.ts
import { supabase } from './supabase';
import { UserRole } from '@/contexts/AuthContext';

// Define permission types
export type Permission = 
  | 'view_dashboard'
  | 'manage_debtors'
  | 'make_calls'
  | 'view_reports'
  | 'manage_users'
  | 'manage_settings';

// Role-permission mapping (fallback if database check fails)
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'manage_debtors',
    'make_calls',
    'view_reports',
    'manage_users',
    'manage_settings'
  ],
  agent: [
    'view_dashboard',
    'manage_debtors',
    'make_calls'
  ],
  manager: [
    'view_dashboard',
    'manage_debtors',
    'make_calls',
    'view_reports'
  ],
  supervisor: [
    'view_dashboard',
    'manage_debtors',
    'make_calls',
    'view_reports',
    'manage_users'
  ],
  'indigent clerk': [
    'view_dashboard',
    'manage_debtors',
    'view_reports'
  ],
  'system': [
    'view_dashboard',
    'view_reports'
  ]
};

/**
 * Check if a user has a specific permission
 * @param userId User ID to check
 * @param permission Permission to check
 * @returns Promise resolving to boolean indicating if user has permission
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // First get the user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching user role:', profileError);
      return false;
    }
    
    const role = profile.role as UserRole;
    
    // Check permission in database
    const { data: permissions, error: permissionError } = await supabase
      .from('role_permissions')
      .select('permissions(name)')
      .eq('role', role)
      .eq('permissions.name', permission);
    
    if (permissionError) {
      console.error('Error fetching permissions:', permissionError);
      // Fall back to hardcoded permissions if database check fails
      return rolePermissions[role]?.includes(permission) || false;
    }
    
    return permissions && permissions.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * @param userId User ID to check
 * @param permissions Array of permissions to check
 * @returns Promise resolving to boolean indicating if user has any permission
 */
export async function hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
  if (!userId || !permissions.length) return false;
  
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user has all of the specified permissions
 * @param userId User ID to check
 * @param permissions Array of permissions to check
 * @returns Promise resolving to boolean indicating if user has all permissions
 */
export async function hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
  if (!userId || !permissions.length) return false;
  
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission))) {
      return false;
    }
  }
  
  return true;
}
