import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret?: string;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
  created_by: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  status?: 'active' | 'inactive';
  secret?: string;
}

/**
 * Get all webhooks (admin only)
 */
export async function getAllWebhooks(): Promise<{ data: Webhook[] | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getAllWebhooks:', error);
    return { data: null, error: 'Failed to fetch webhooks' };
  }
}

/**
 * Create a new webhook (admin only)
 */
export async function createWebhook(
  webhookData: CreateWebhookRequest,
  userId: string
): Promise<{ data: Webhook | null; error: string | null }> {
  try {
    // Generate a secret if not provided
    const secret = webhookData.secret || generateWebhookSecret();

    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .insert([
        {
          name: webhookData.name,
          url: webhookData.url,
          events: webhookData.events,
          secret: secret,
          status: 'active',
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createWebhook:', error);
    return { data: null, error: 'Failed to create webhook' };
  }
}

/**
 * Update a webhook (admin only)
 */
export async function updateWebhook(
  webhookId: string,
  updates: UpdateWebhookRequest
): Promise<{ data: Webhook | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhookId)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateWebhook:', error);
    return { data: null, error: 'Failed to update webhook' };
  }
}

/**
 * Delete a webhook (admin only)
 */
export async function deleteWebhook(webhookId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin
      .from('webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteWebhook:', error);
    return { error: 'Failed to delete webhook' };
  }
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(webhookId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get webhook details
    const { data: webhook, error: fetchError } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (fetchError || !webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from SmartKollect',
        webhook_id: webhookId,
        webhook_name: webhook.name,
      },
    };

    // Send test request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret || '',
        'User-Agent': 'SmartKollect-Webhook/1.0',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }

    // Update last triggered timestamp
    await supabaseAdmin
      .from('webhooks')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', webhookId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error testing webhook:', error);
    return { success: false, error: 'Failed to test webhook' };
  }
}

/**
 * Generate a secure webhook secret
 */
function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get server-side Supabase client with user context
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Trigger webhook for specific events
 */
export async function triggerWebhook(event: string, data: any): Promise<void> {
  try {
    // Get all active webhooks that listen to this event
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('status', 'active')
      .contains('events', [event]);

    if (error || !webhooks?.length) {
      return;
    }

    // Send webhook to each registered URL
    const promises = webhooks.map(async (webhook) => {
      try {
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          data,
        };

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret || '',
            'User-Agent': 'SmartKollect-Webhook/1.0',
          },
          body: JSON.stringify(payload),
        });

        // Update last triggered timestamp on success
        if (response.ok) {
          await supabaseAdmin
            .from('webhooks')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', webhook.id);
        }
      } catch (error) {
        console.error(`Failed to trigger webhook ${webhook.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error in triggerWebhook:', error);
  }
}
