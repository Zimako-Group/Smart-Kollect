// lib/api-keys-service.ts
import { getSupabaseAdminClient } from './supabaseClient';

export interface ApiKey {
  id: string;
  name: string;
  key: string; // Only shown when first created
  key_prefix: string;
  permissions: string[];
  status: 'active' | 'expired' | 'revoked';
  created_by?: string;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expires_at?: string;
}

// Get all API keys for admin
export const getAllApiKeys = async (): Promise<ApiKey[]> => {
  try {
    const adminClient = getSupabaseAdminClient();
    const { data, error } = await adminClient
      .from('api_keys')
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        status,
        created_by,
        last_used_at,
        expires_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return data.map(key => ({
      ...key,
      key: `${key.key_prefix}${'*'.repeat(28)}`, // Mask the key
      last_used_at: key.last_used_at || null,
      expires_at: key.expires_at || null
    })) as ApiKey[];
  } catch (error) {
    console.error('Error in getAllApiKeys:', error);
    return [];
  }
};

// Create new API key
export const createApiKey = async (
  request: CreateApiKeyRequest,
  userId: string
): Promise<{ success: boolean; key?: string; error?: string }> => {
  try {
    const adminClient = getSupabaseAdminClient();

    // Generate new API key
    const { data: keyData, error: keyError } = await adminClient
      .rpc('generate_api_key');

    if (keyError || !keyData) {
      console.error('Error generating API key:', keyError);
      return { success: false, error: 'Failed to generate API key' };
    }

    const apiKey = keyData as string;
    const keyPrefix = apiKey.substring(0, 8) + '...';

    // Hash the key for storage
    const { data: hashedKey, error: hashError } = await adminClient
      .rpc('hash_api_key', { key_text: apiKey });

    if (hashError || !hashedKey) {
      console.error('Error hashing API key:', hashError);
      return { success: false, error: 'Failed to hash API key' };
    }

    // Insert the API key record
    const { error: insertError } = await adminClient
      .from('api_keys')
      .insert({
        name: request.name,
        key_hash: hashedKey,
        key_prefix: keyPrefix,
        permissions: request.permissions,
        created_by: userId,
        expires_at: request.expires_at || null
      });

    if (insertError) {
      console.error('Error inserting API key:', insertError);
      return { success: false, error: 'Failed to create API key' };
    }

    return { success: true, key: apiKey };
  } catch (error) {
    console.error('Error in createApiKey:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Revoke API key
export const revokeApiKey = async (keyId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from('api_keys')
      .update({ 
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (error) {
      console.error('Error revoking API key:', error);
      return { success: false, error: 'Failed to revoke API key' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in revokeApiKey:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Update API key status
export const updateApiKeyStatus = async (
  keyId: string, 
  status: 'active' | 'expired' | 'revoked'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from('api_keys')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (error) {
      console.error('Error updating API key status:', error);
      return { success: false, error: 'Failed to update API key status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateApiKeyStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Delete API key permanently
export const deleteApiKey = async (keyId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    if (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: 'Failed to delete API key' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteApiKey:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Verify API key (for API authentication)
export const verifyApiKey = async (apiKey: string): Promise<{ valid: boolean; keyData?: any }> => {
  try {
    const adminClient = getSupabaseAdminClient();
    
    // Hash the provided key
    const { data: hashedKey, error: hashError } = await adminClient
      .rpc('hash_api_key', { key_text: apiKey });

    if (hashError || !hashedKey) {
      return { valid: false };
    }

    // Find the key in database
    const { data, error } = await adminClient
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashedKey)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { valid: false };
    }

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Update status to expired
      await adminClient
        .from('api_keys')
        .update({ status: 'expired' })
        .eq('id', data.id);
      
      return { valid: false };
    }

    // Update last used timestamp
    await adminClient
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return { valid: true, keyData: data };
  } catch (error) {
    console.error('Error in verifyApiKey:', error);
    return { valid: false };
  }
};
