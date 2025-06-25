import { supabase } from './supabase';
import { AccountRecord } from './file-parsers';
import { supabaseAuth } from './supabaseClient';

export interface AccountBatch {
  id: string;
  name: string;
  description: string;
  file_name: string;
  file_size: number;
  record_count: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAccountRecord extends AccountRecord {
  id: string;
  status: string;
  agent_id: string | null;
  batch_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new batch of accounts
 */
export async function createAccountBatch(
  batchName: string,
  accounts: AccountRecord[]
): Promise<{ batchId: string | null; error: string | null }> {
  try {
    console.log(`Creating batch ${batchName} with ${accounts.length} accounts`);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { batchId: null, error: 'User not authenticated' };
    }
    
    // Create a new batch
    const { data: batch, error: batchError } = await supabase
      .from('account_batches')
      .insert({
        name: batchName,
        description: `Uploaded on ${new Date().toLocaleDateString()}`,
        file_name: `${batchName}.csv`,
        file_size: 0, // This would be the actual file size in bytes
        record_count: accounts.length,
        uploaded_by: user.id,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      return { batchId: null, error: batchError.message };
    }

    if (!batch) {
      return { batchId: null, error: 'Failed to create batch' };
    }

    const batchId = batch.id;
    console.log(`Created batch with ID: ${batchId}`);

    // Prepare accounts for insertion
    const accountsToInsert = accounts.map(account => ({
      batch_id: batchId,
      name: account.name || 'N/A',
      surname: account.surname || 'N/A',
      id_number: account.id_Number || 'N/A',
      email: account.email || 'N/A',
      cellphone: account.cellphone || 'N/A',
      home_tel: account.home_tel || 'N/A',
      work_tel: account.work_tel || 'N/A',
      fax_no: account.fax_no || 'N/A',
      next_of_kin_name: account.next_of_kin_name || 'N/A',
      next_of_kin_no: account.next_of_kin_no || 'N/A',
      postal_address: account.postal_addess || 'N/A',
      ro_ref: account.ro_ref || 'N/A',
      client_ref: account.client_ref || 'N/A',
      easypay_ref: account.easypay_ref || 'N/A',
      client: account.client || 'N/A',
      handover_date: account.handover_date || null,
      handover_amount: account.handover_amount || 0,
      employer: account.employer || 'N/A',
      occupation: account.occupation || 'N/A',
      income: account.income || 0,
      current_balance: account.current_balance || 0,
      original_amount: account.original_amount || 0,
      last_payment: account.last_payment || null,
      last_payment_amount: account.last_payment_amount || 0,
      days_since_last_payment: account.days_since_last_payment || 0,
      status: 'Unallocated',
      created_at: new Date().toISOString(),
    }));

    // Insert accounts in chunks to avoid request size limitations
    const chunkSize = 100;
    for (let i = 0; i < accountsToInsert.length; i += chunkSize) {
      const chunk = accountsToInsert.slice(i, i + chunkSize);
      
      console.log(`Inserting chunk ${i/chunkSize + 1} of ${Math.ceil(accountsToInsert.length/chunkSize)}, size: ${chunk.length}`);
      
      const { error: accountsError } = await supabase
        .from('accounts')
        .insert(chunk);

      if (accountsError) {
        console.error('Error inserting accounts:', accountsError);
        // Continue with the next chunk even if there's an error
        console.log(`Continuing with next chunk despite error: ${accountsError.message}`);
      }
    }

    return { batchId, error: null };
  } catch (error: any) {
    console.error('Error in createAccountBatch:', error);
    return { batchId: null, error: error.message };
  }
}

/**
 * Upload multiple account records to the database
 */
export async function uploadAccountRecords(
  records: AccountRecord[],
  batchId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Prepare records for insertion
    const recordsToInsert = records.map(record => ({
      name: record.name,
      id_number: record.id_Number,
      surname: record.surname,
      email: record.email,
      cellphone: record.cellphone,
      home_tel: record.home_tel,
      work_tel: record.work_tel,
      fax_no: record.fax_no,
      next_of_kin_name: record.next_of_kin_name,
      next_of_kin_no: record.next_of_kin_no,
      postal_address: record.postal_address, 
      ro_ref: record.ro_ref,
      client_ref: record.client_ref,
      easypay_ref: record.easypay_ref,
      client: record.client,
      handover_date: record.handover_date,
      handover_amount: record.handover_amount === 'N/A' ? null : record.handover_amount,
      employer: record.employer,
      occupation: record.occupation,
      income: record.income === 'N/A' ? null : record.income,
      current_balance: record.current_balance === 'N/A' ? null : record.current_balance,
      original_amount: record.original_amount === 'N/A' ? null : record.original_amount,
      last_payment: record.last_payment,
      last_payment_amount: record.last_payment_amount === 'N/A' ? null : record.last_payment_amount,
      days_since_last_payment: record.days_since_last_payment === 'N/A' ? null : record.days_since_last_payment,
      status: 'Unallocated',
      batch_id: batchId
    }));

    // Insert records in chunks to avoid request size limitations
    const chunkSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
      const chunk = recordsToInsert.slice(i, i + chunkSize);
      
      const { error, count } = await supabase
        .from('accounts')
        .insert(chunk)
        .select('count');

      if (error) {
        console.error('Error uploading accounts chunk:', error);
        return { 
          success: false, 
          count: insertedCount,
          error: error.message 
        };
      }

      insertedCount += chunk.length;
    }

    return { success: true, count: insertedCount };
  } catch (error: any) {
    console.error('Error in uploadAccountRecords:', error);
    return { 
      success: false, 
      count: 0,
      error: error.message 
    };
  }
}

/**
 * Get all account batches
 */
export async function getAccountBatches(): Promise<AccountBatch[]> {
  try {
    const { data, error } = await supabase
      .from('account_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching account batches:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAccountBatches:', error);
    return [];
  }
}

/**
 * Get accounts from a specific batch with filtering options
 */
export async function getAccountsByBatch(
  batchId: string,
  page = 1,
  pageSize = 50,
  priorityFilter: 'high-value' | 'overdue' | 'recent' | 'none' = 'none'
): Promise<{ accounts: DatabaseAccountRecord[]; total: number; error: string | null }> {
  try {
    console.log(`Fetching accounts for batch ${batchId} with filter ${priorityFilter}`);
    
    let query = supabase
      .from('accounts')
      .select('*', { count: 'exact' })
      .eq('batch_id', batchId);
    
    // Apply priority filtering
    switch (priorityFilter) {
      case 'high-value':
        // Order by balance descending (highest value first)
        query = query.order('current_balance', { ascending: false });
        break;
      case 'overdue':
        // Filter to only show overdue accounts
        // If days_since_last_payment is not available, include all accounts
        query = query.or('days_since_last_payment.gt.30,days_since_last_payment.is.null');
        break;
      case 'recent':
        // Show most recently added first
        query = query.order('created_at', { ascending: false });
        break;
      case 'none':
      default:
        // Default ordering by ID
        query = query.order('id', { ascending: true });
        break;
    }
    
    // Apply pagination
    query = query.range((page - 1) * pageSize, page * pageSize - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching accounts by batch:', error);
      return { accounts: [], total: 0, error: error.message };
    }
    
    console.log(`Found ${data?.length || 0} accounts out of ${count || 0} total`);
    
    return { 
      accounts: data as DatabaseAccountRecord[], 
      total: count || 0,
      error: null
    };
  } catch (error: any) {
    console.error('Error in getAccountsByBatch:', error);
    return { accounts: [], total: 0, error: error.message };
  }
}

/**
 * Get accounts by agent ID
 */
export async function getAccountsByAgent(
  agentId: string,
  page = 1,
  pageSize = 50
): Promise<{ accounts: DatabaseAccountRecord[]; total: number }> {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    if (countError) {
      console.error('Error counting accounts:', countError);
      throw countError;
    }

    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get paginated accounts
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('agent_id', agentId)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }

    return {
      accounts: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error in getAccountsByAgent:', error);
    return { accounts: [], total: 0 };
  }
}

/**
 * Allocate accounts to agents
 */
export async function allocateAccountsToAgents(
  batchId: string,
  agentIds: string[],
  allocationStrategy: string = 'balanced',
  priorityFilter: 'high-value' | 'overdue' | 'recent' | 'none' = 'none'
) {
  try {
    if (!batchId || agentIds.length === 0) {
      return { success: false, error: 'Missing batch ID or agent IDs' };
    }
    
    // Get accounts from the batch with the specified priority filter
    const { accounts } = await getAccountsByBatch(batchId, 1, 1000, priorityFilter);
    
    if (accounts.length === 0) {
      return { success: false, error: 'No accounts found in batch' };
    }
    
    // Distribute accounts based on allocation strategy
    let allocatedAccounts: { accountId: string, agentId: string }[] = [];
    
    switch (allocationStrategy) {
      case 'performance':
        // In a real implementation, we would get agent performance metrics
        // and allocate more accounts to higher performing agents
        allocatedAccounts = distributeAccountsByPerformance(accounts, agentIds);
        break;
      case 'value':
        // Distribute by account value - higher value accounts to better performing agents
        allocatedAccounts = distributeAccountsByValue(accounts, agentIds);
        break;
      case 'manual':
        // For manual allocation, we would return the accounts and let the user assign them
        // This is a placeholder for now
        return { 
          success: true, 
          message: 'Manual allocation selected. Please assign accounts manually.' 
        };
      case 'balanced':
      default:
        // Distribute accounts evenly among agents
        allocatedAccounts = distributeAccountsEvenly(accounts, agentIds);
        break;
    }
    
    // In a real implementation, we would update the database with the allocations
    // For now, we'll just return success
    
    // Create allocation records in the database
    const { error } = await supabase.from('account_allocations').insert(
      allocatedAccounts.map(allocation => ({
        account_id: allocation.accountId,
        agent_id: allocation.agentId,
        batch_id: batchId,
        allocation_date: new Date().toISOString()
      }))
    );
    
    if (error) {
      console.error('Error creating allocation records:', error);
      return { success: false, error: 'Failed to create allocation records' };
    }
    
    // Update the accounts with their assigned agent
    for (const allocation of allocatedAccounts) {
      const { error } = await supabase
        .from('accounts')
        .update({ agent_id: allocation.agentId })
        .eq('id', allocation.accountId);
      
      if (error) {
        console.error('Error updating account with agent:', error);
      }
    }
    
    return { 
      success: true, 
      message: `Successfully allocated ${allocatedAccounts.length} accounts to ${agentIds.length} agents` 
    };
  } catch (error) {
    console.error('Error in allocateAccountsToAgents:', error);
    return { success: false, error: 'An error occurred during allocation' };
  }
}

// Helper functions for different allocation strategies

function distributeAccountsEvenly(accounts: DatabaseAccountRecord[], agentIds: string[]) {
  const allocations: { accountId: string, agentId: string }[] = [];
  
  accounts.forEach((account, index) => {
    const agentIndex = index % agentIds.length;
    allocations.push({
      accountId: account.id,
      agentId: agentIds[agentIndex]
    });
  });
  
  return allocations;
}

function distributeAccountsByPerformance(accounts: DatabaseAccountRecord[], agentIds: string[]) {
  // In a real implementation, we would get agent performance metrics
  // For now, we'll just use a simple distribution that gives more accounts to the first agents
  const allocations: { accountId: string, agentId: string }[] = [];
  
  // Sort agents by "performance" (just using their position in the array for now)
  const sortedAgentIds = [...agentIds];
  
  // Calculate how many accounts each agent should get based on "performance"
  const totalAccounts = accounts.length;
  const accountsPerAgent: number[] = [];
  
  // Simple distribution - first agent gets more than second, etc.
  let remainingAccounts = totalAccounts;
  for (let i = 0; i < sortedAgentIds.length; i++) {
    const share = Math.max(1, Math.floor(remainingAccounts / (sortedAgentIds.length - i)));
    accountsPerAgent[i] = share;
    remainingAccounts -= share;
  }
  
  // Distribute accounts according to calculated shares
  let accountIndex = 0;
  for (let i = 0; i < sortedAgentIds.length; i++) {
    for (let j = 0; j < accountsPerAgent[i] && accountIndex < totalAccounts; j++) {
      allocations.push({
        accountId: accounts[accountIndex].id,
        agentId: sortedAgentIds[i]
      });
      accountIndex++;
    }
  }
  
  return allocations;
}

function distributeAccountsByValue(accounts: DatabaseAccountRecord[], agentIds: string[]) {
  // Sort accounts by current_balance in descending order
  const sortedAccounts = [...accounts].sort((a, b) => {
    const balanceA = typeof a.current_balance === 'number' ? a.current_balance : 
                     parseFloat(a.current_balance as string) || 0;
    const balanceB = typeof b.current_balance === 'number' ? b.current_balance : 
                     parseFloat(b.current_balance as string) || 0;
    return balanceB - balanceA;
  });
  
  // Initialize agent allocation tracking
  const agentAllocations: Record<string, number> = {};
  agentIds.forEach(id => { agentAllocations[id] = 0 });
  
  const result: { accountId: string, agentId: string }[] = [];
  
  // Distribute accounts to balance total value across agents
  sortedAccounts.forEach(account => {
    // Find agent with lowest total value allocated
    const agentId = agentIds.reduce((lowestAgent, currentAgent) => {
      return agentAllocations[currentAgent] < agentAllocations[lowestAgent] 
        ? currentAgent 
        : lowestAgent;
    }, agentIds[0]);
    
    // Allocate this account to the agent
    result.push({
      accountId: account.id,
      agentId: agentId
    });
    
    // Update the agent's total allocated value
    agentAllocations[agentId] += parseFloat(account.current_balance as string) || 0;
  });
  
  return result;
}

/**
 * Allocate accounts to agents based on the selected strategy
 */
export async function allocateAccounts(
  batchId: string,
  agentIds: string[],
  allocationStrategy: string = 'balanced',
  priorityFilter: 'high-value' | 'overdue' | 'recent' | 'none' = 'high-value'
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!batchId) {
      return { success: false, error: 'No batch selected' };
    }

    if (!agentIds || agentIds.length === 0) {
      return { success: false, error: 'No agents selected for allocation' };
    }

    console.log(`Allocating accounts from batch ${batchId} to ${agentIds.length} agents using ${allocationStrategy} strategy with ${priorityFilter} priority`);

    // Get accounts from the batch with the specified priority
    const { accounts, error: fetchError } = await getAccountsByBatch(batchId, 1, 1000, priorityFilter);
    
    if (fetchError) {
      console.error('Error fetching accounts for allocation:', fetchError);
      return { success: false, error: fetchError };
    }

    if (!accounts || accounts.length === 0) {
      return { success: false, error: 'No accounts available for allocation' };
    }

    console.log(`Found ${accounts.length} accounts to allocate`);

    // Filter out accounts that are already allocated
    const unallocatedAccounts = accounts.filter(account => account.status === 'Unallocated');
    
    if (unallocatedAccounts.length === 0) {
      return { success: false, error: 'All accounts in this batch are already allocated' };
    }

    console.log(`Found ${unallocatedAccounts.length} unallocated accounts`);

    // Prepare accounts for allocation based on strategy
    let accountsToUpdate: { id: string; agent_id: string; status: string }[] = [];

    if (allocationStrategy === 'balanced') {
      // Use the first implementation of distributeAccountsEvenly
      const distribution = distributeAccountsEvenly(unallocatedAccounts, agentIds);
      accountsToUpdate = distribution.map(item => ({
        id: item.accountId,
        agent_id: item.agentId,
        status: 'Allocated'
      }));
    } else if (allocationStrategy === 'performance') {
      // Performance-based allocation
      const distribution = distributeAccountsByPerformance(unallocatedAccounts, agentIds);
      accountsToUpdate = distribution.map(item => ({
        id: item.accountId,
        agent_id: item.agentId,
        status: 'Allocated'
      }));
    } else if (allocationStrategy === 'value') {
      // Value-based allocation
      const distribution = distributeAccountsByValue(unallocatedAccounts, agentIds);
      accountsToUpdate = distribution.map(item => ({
        id: item.accountId,
        agent_id: item.agentId,
        status: 'Allocated'
      }));
    } else {
      // Fallback to balanced allocation
      const distribution = distributeAccountsEvenly(unallocatedAccounts, agentIds);
      accountsToUpdate = distribution.map(item => ({
        id: item.accountId,
        agent_id: item.agentId,
        status: 'Allocated'
      }));
    }

    console.log(`Prepared ${accountsToUpdate.length} accounts for allocation`);

    // Update accounts in chunks to avoid request size limitations
    const chunkSize = 100;
    for (let i = 0; i < accountsToUpdate.length; i += chunkSize) {
      const chunk = accountsToUpdate.slice(i, i + chunkSize);
      
      console.log(`Updating chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(accountsToUpdate.length/chunkSize)}, size: ${chunk.length}`);
      
      // Update each account in the chunk
      for (const account of chunk) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ 
            agent_id: account.agent_id,
            status: 'Allocated',
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        if (updateError) {
          console.error(`Error updating account ${account.id}:`, updateError);
          // Continue with the next account even if there's an error
        }
      }
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in allocateAccounts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search accounts by various criteria
 */
export async function searchAccounts(
  searchTerm: string,
  page = 1,
  pageSize = 50
): Promise<{ accounts: DatabaseAccountRecord[]; total: number }> {
  try {
    // Determine if search term is an ID number, name, or reference
    const isIdNumber = /^\d+$/.test(searchTerm.replace(/\s/g, ''));
    
    // Build the query
    let query = supabase
      .from('accounts')
      .select('*', { count: 'exact' });
    
    if (isIdNumber) {
      // Search by ID number
      query = query.ilike('id_number', `%${searchTerm}%`);
    } else {
      // Search by name, surname, or references
      query = query.or(
        `name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,ro_ref.ilike.%${searchTerm}%,client_ref.ilike.%${searchTerm}%,easypay_ref.ilike.%${searchTerm}%`
      );
    }
    
    // Get total count
    const { count, error: countError } = await query.range(0, 0);

    if (countError) {
      console.error('Error counting search results:', countError);
      throw countError;
    }

    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get paginated results
    const { data, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching accounts:', error);
      throw error;
    }

    return {
      accounts: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error in searchAccounts:', error);
    return { accounts: [], total: 0 };
  }
}

/**
 * Get all agents from the database
 */
export async function getAgents() {
  try {
    const agents = await supabaseAuth.getAllUsers();
    // Filter to only include agents (not admins)
    return agents.filter(agent => agent.role === 'agent');
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}
