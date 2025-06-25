import { supabase } from './supabaseClient';
import { InteractionType } from './account-interaction-service';

/**
 * Interface for an allocated account
 */
export interface AllocatedAccount {
  id: string;
  customerName: string;
  accountNumber: string;
  phone: string;
  email: string;
  balance: number;
  status: 'overdue' | 'current';
  lastPaymentDate: string | null;
  lastInteractionDate: string | null;
  daysOverdue: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Allocate an account to an agent
 */
export async function allocateAccount(accountId: string, agentId: string) {
  try {
    console.log('[ALLOCATION SERVICE] Allocating account', accountId, 'to agent', agentId);
    
    const response = await fetch('/api/allocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        agentId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to allocate account');
    }
    
    const result = await response.json();
    console.log('[ALLOCATION SERVICE] Allocation successful:', result);
    
    return result;
  } catch (error) {
    console.error('[ALLOCATION SERVICE] Error allocating account:', error);
    throw error;
  }
}

/**
 * Get all accounts allocated to an agent
 * @param agentId The ID of the agent
 * @param sortByInteraction Whether to sort by last interaction date (default: true)
 */
export async function getAgentAllocatedAccounts(agentId: string, sortByInteraction: boolean = true): Promise<AllocatedAccount[]> {
  console.log(`[ALLOCATION SERVICE] Getting allocated accounts for agent ${agentId}, sortByInteraction=${sortByInteraction}`);
  try {
    console.log('[ALLOCATION SERVICE] Getting allocated accounts for agent', agentId);
    
    const response = await fetch(`/api/allocations?agentId=${agentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get allocated accounts');
    }
    
    const result = await response.json();
    console.log('[ALLOCATION SERVICE] Retrieved allocations:', result);
    
    if (!result.allocations || result.allocations.length === 0) {
      return [];
    }
    
    // Transform the data into our AllocatedAccount interface
    let allocatedAccounts = result.allocations.map((item: any) => {
      // Check if account exists before accessing its properties
      const account = item.account;
      
      // If account is undefined or null, return a default object
      if (!account) {
        console.warn('[ALLOCATION SERVICE] Warning: Found allocation without account data', item);
        return {
          id: item.id || 'unknown',
          customerName: 'Unknown Customer',
          accountNumber: 'N/A',
          phone: 'N/A',
          email: 'N/A',
          balance: 0,
          status: 'current' as const,
          lastPaymentDate: null,
          lastInteractionDate: null,
          daysOverdue: 0,
          priority: 'low' as const,
        };
      }
      
      const lastPaymentDate = account.last_payment_date ? new Date(account.last_payment_date) : null;
      const today = new Date();
      const daysOverdue = lastPaymentDate ? 
        Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isOverdue = daysOverdue > 30;
      
      // Get the last interaction date and ensure it's properly formatted
      const lastInteractionDate = item.allocation.last_interaction_date || null;
      
      // Log the interaction date for debugging
      if (lastInteractionDate) {
        console.log(`[ALLOCATION SERVICE] Account ${account.id} has lastInteractionDate: ${lastInteractionDate}`);
      }
      
      return {
        id: account.id,
        customerName: `${account.name || ''} ${account.surname_company_trust || ''}`.trim() || 'N/A',
        accountNumber: account.acc_number || 'N/A',
        phone: account.cell_number || 'N/A',
        email: account.email_addr_1 || 'N/A',
        balance: parseFloat(account.outstanding_balance) || 0,
        status: account.acc_status?.toLowerCase() === 'overdue' ? 'overdue' : 'current',
        lastPaymentDate: account.last_payment_date,
        lastInteractionDate: lastInteractionDate,
        daysOverdue: isOverdue ? daysOverdue : 0,
        priority: determinePriority(parseFloat(account.outstanding_balance) || 0),
      };
    });
    
    // Sort accounts by last interaction date if requested
    if (sortByInteraction) {
      allocatedAccounts = allocatedAccounts.sort((a: AllocatedAccount, b: AllocatedAccount) => {
        // Null last_interaction_date values should appear first (highest priority)
        if (!a.lastInteractionDate && !b.lastInteractionDate) return 0;
        if (!a.lastInteractionDate) return -1;
        if (!b.lastInteractionDate) return 1;
        
        // Otherwise sort by oldest interaction first
        return new Date(a.lastInteractionDate).getTime() - new Date(b.lastInteractionDate).getTime();
      });
      
      console.log('[ALLOCATION SERVICE] Accounts sorted by last interaction date');
    }
    
    return allocatedAccounts;
  } catch (error) {
    console.error('[ALLOCATION SERVICE] Error getting allocated accounts:', error);
    return [];
  }
}

/**
 * Get metrics for an agent's allocated accounts
 */
export async function getAgentAllocationMetrics(agentId: string) {
  try {
    console.log('[ALLOCATION SERVICE] Getting metrics for agent', agentId);
    
    const accounts = await getAgentAllocatedAccounts(agentId);
    
    if (accounts.length === 0) {
      return {
        totalAccounts: 0,
        totalValue: 0,
        overdueAccounts: 0,
        overdueValue: 0,
        contactRate: 0,
        highPriorityAccounts: 0,
      };
    }
    
    const totalAccounts = accounts.length;
    const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);
    const overdueAccounts = accounts.filter(account => account.status === 'overdue').length;
    const overdueValue = accounts
      .filter(account => account.status === 'overdue')
      .reduce((sum, account) => sum + account.balance, 0);
    const highPriorityAccounts = accounts.filter(account => account.priority === 'high').length;
    
    // Mock contact rate for now
    const contactRate = totalAccounts > 0 ? Math.round(Math.random() * 100) : 0;
    
    return {
      totalAccounts,
      totalValue,
      overdueAccounts,
      overdueValue,
      contactRate,
      highPriorityAccounts,
    };
  } catch (error) {
    console.error('[ALLOCATION SERVICE] Error getting allocation metrics:', error);
    return {
      totalAccounts: 0,
      totalValue: 0,
      overdueAccounts: 0,
      overdueValue: 0,
      contactRate: 0,
      highPriorityAccounts: 0,
    };
  }
}

/**
 * Helper function to determine priority based on balance
 */
function determinePriority(balance: number): 'high' | 'medium' | 'low' {
  if (balance >= 10000) return 'high';
  if (balance >= 5000) return 'medium';
  return 'low';
}

/**
 * Bulk allocate accounts to an agent
 */
export async function bulkAllocateAccounts(accountNumbers: string[], agentId: string) {
  try {
    console.log(`[ALLOCATION SERVICE] Bulk allocating ${accountNumbers.length} accounts to agent ${agentId}`);
    
    const response = await fetch('/api/allocations/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumbers,
        agentId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to bulk allocate accounts');
    }
    
    const result = await response.json();
    console.log('[ALLOCATION SERVICE] Bulk allocation successful:', result);
    
    return result;
  } catch (error) {
    console.error('[ALLOCATION SERVICE] Error bulk allocating accounts:', error);
    throw error;
  }
}

/**
 * Get the top overdue accounts allocated to an agent
 * @param agentId The ID of the agent
 * @param limit The maximum number of accounts to return (default: 5)
 * @returns Promise with the top overdue accounts
 */
/**
 * Record an interaction with an account
 * @param accountId The ID of the account
 * @param agentId The ID of the agent
 * @param interactionType The type of interaction
 * @returns Promise with the updated account
 */
/**
 * Record an interaction with an account
 * @param accountId The ID of the account
 * @param agentId The ID of the agent
 * @param interactionType The type of interaction
 * @returns Promise with success status
 */
export async function recordAccountInteraction(
  accountId: string, 
  agentId: string, 
  interactionType: InteractionType
): Promise<boolean> {
  try {
    console.log(`[ALLOCATION SERVICE] Recording ${interactionType} interaction for account ${accountId}`);
    
    const response = await fetch('/api/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        agentId,
        interactionType,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to record interaction');
    }
    
    const result = await response.json();
    console.log('[ALLOCATION SERVICE] Interaction recorded:', result);
    
    return true;
  } catch (error) {
    console.error('[ALLOCATION SERVICE] Error recording interaction:', error);
    return false;
  }
}

/**
 * Get the top overdue accounts allocated to an agent
 * @param agentId The ID of the agent
 * @param limit The maximum number of accounts to return (default: 5)
 * @returns Promise with the top overdue accounts
 */
export async function getAgentTopOverdueAccounts(agentId: string, limit: number = 5): Promise<AllocatedAccount[]> {
  try {
    console.log(`[ALLOCATION SERVICE] Getting top ${limit} overdue accounts for agent ${agentId}`);
    
    // Get all allocated accounts for this agent
    const accounts = await getAgentAllocatedAccounts(agentId);
    
    if (accounts.length === 0) {
      console.log('[ALLOCATION SERVICE] No accounts allocated to this agent');
      return [];
    }
    
    // Filter for overdue accounts
    const overdueAccounts = accounts.filter(account => 
      account.status === 'overdue' || account.daysOverdue > 30
    );
    
    if (overdueAccounts.length === 0) {
      console.log('[ALLOCATION SERVICE] No overdue accounts found for this agent');
      return [];
    }
    
    // Sort by balance (highest first)
    const sortedAccounts = overdueAccounts.sort((a, b) => b.balance - a.balance);
    
    // Return the top accounts based on the limit
    const topAccounts = sortedAccounts.slice(0, limit);
    console.log(`[ALLOCATION SERVICE] Retrieved ${topAccounts.length} top overdue accounts`);
    
    return topAccounts;
  } catch (error) {
    console.error('[ALLOCATION SERVICE] Error getting top overdue accounts:', error);
    return [];
  }
}
