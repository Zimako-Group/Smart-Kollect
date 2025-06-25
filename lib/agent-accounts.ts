// Agent allocated accounts utilities
import { supabase } from './supabaseClient';

// Types for allocated accounts and database responses
export interface Account {
  id: string;
  customerName: string;
  phone: string;
  balance: number;
  status: 'overdue' | 'current';
  lastContact: string;
  daysOverdue: number;
  priority: 'high' | 'medium' | 'low';
  agentId: string;
}

// Fetch agent's allocated accounts
export async function fetchAgentAllocatedAccounts(agentId: string): Promise<Account[]> {
  try {
    console.log("[AGENT ACCOUNTS] Using manual fetch approach for agent ID:", agentId);
    
    // Step 1: Fetch account allocations for this agent
    console.log(`[AGENT ACCOUNTS] Querying AccountAllocations table for agent_id=${agentId}`);
    
    // First, check if the agent exists in the profiles table
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', agentId)
      .maybeSingle();
      
    if (agentError) {
      console.error('[AGENT ACCOUNTS] Error checking agent profile:', agentError);
    } else {
      console.log('[AGENT ACCOUNTS] Agent profile:', agentProfile ? JSON.stringify(agentProfile) : 'Not found');
    }
    
    // Now fetch the allocations
    const { data: allocations, error: allocationsError } = await supabase
      .from('AccountAllocations')
      .select('*');
      
    // Log all allocations in the system for debugging
    console.log('[AGENT ACCOUNTS] All allocations in system:', allocations ? JSON.stringify(allocations) : 'No allocations found');
    
    // Now get the ones for this specific agent
    const { data: agentAllocations, error: agentAllocationsError } = await supabase
      .from('AccountAllocations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active');
      
    if (agentAllocationsError) {
      console.error("[AGENT ACCOUNTS] Error fetching agent allocations:", agentAllocationsError);
      return [];
    }
    
    // If no allocations found, return empty array
    if (!agentAllocations || agentAllocations.length === 0) {
      console.log("[AGENT ACCOUNTS] No account allocations found for agent:", agentId);
      return [];
    }
    
    console.log("[AGENT ACCOUNTS] Found", agentAllocations.length, "account allocations for this agent:", JSON.stringify(agentAllocations));
    
    // Step 2: Get the account IDs from the allocations
    const accountIds = agentAllocations.map(allocation => allocation.account_id);
    console.log("[AGENT ACCOUNTS] Account IDs to look for:", accountIds);
    
    // Step 3: Fetch the debtor details for these accounts
    const { data: debtors, error: debtorsError } = await supabase
      .from('debtors')
      .select('*')
      .in('id', accountIds);
    
    if (debtorsError) {
      console.error("[AGENT ACCOUNTS] Error fetching debtor details:", debtorsError);
      return [];
    }
    
    // If no debtors found, return empty array
    if (!debtors || debtors.length === 0) {
      console.log("[AGENT ACCOUNTS] No debtor details found for account IDs:", accountIds);
      return [];
    }
    
    console.log("[AGENT ACCOUNTS] Found", debtors.length, "debtor records");
    
    // Step 4: Map the debtors to our Account interface
    const accounts = debtors.map(debtor => {
      // Calculate days overdue based on last payment date
      const lastPaymentDate = debtor.last_payment_date ? new Date(debtor.last_payment_date) : null;
      const today = new Date();
      const daysOverdue = lastPaymentDate ? 
        Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isOverdue = daysOverdue > 30;
      
      return {
        id: debtor.acc_number || debtor.id,
        customerName: `${debtor.name || ''} ${debtor.surname_company_trust || ''}`.trim() || 'N/A',
        phone: debtor.cell_number || 'N/A',
        balance: parseFloat(debtor.outstanding_balance) || 0,
        status: isOverdue ? 'overdue' as const : 'current' as const,
        lastContact: debtor.last_payment_date || today.toISOString().split('T')[0],
        daysOverdue: isOverdue ? daysOverdue : 0,
        priority: determinePriority(parseFloat(debtor.outstanding_balance) || 0),
        agentId
      };
    });
    
    console.log("[AGENT ACCOUNTS] Transformed", accounts.length, "accounts for agent");
    return accounts;
  } catch (error) {
    console.error("[AGENT ACCOUNTS] Error in fetchAgentAllocatedAccountsManual:", error);
    return [];
  }
}

// Helper function to determine priority based on balance
function determinePriority(balance: number): 'high' | 'medium' | 'low' {
  if (balance >= 10000) return 'high';
  if (balance >= 5000) return 'medium';
  return 'low';
}

// Get account metrics for an agent
export async function getAgentAccountMetrics(agentId: string) {
  try {
    console.log("Getting account metrics for agent ID:", agentId);
    
    // First, try to get the actual count directly from the database for better performance
    // We'll get all active allocations for this agent
    const { count: totalAllocationsCount, error: countError } = await supabase
      .from('AccountAllocations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'active');
      
    console.log(`[AGENT ACCOUNTS] Total allocations count: ${totalAllocationsCount}, error: ${countError ? JSON.stringify(countError) : 'none'}`);
    
    // Now, we need to get the count of accounts that have been worked on
    // An account is considered "worked" if it has any interaction recorded
    const { data: workedAccounts, error: workedError } = await supabase
      .from('account_interactions')
      .select('account_id')
      .eq('agent_id', agentId)
      .is('worked', true); // Assuming there's a 'worked' flag in the interactions table
    
    // If the 'worked' field doesn't exist, we can use a different approach
    // For example, we can consider any account with an interaction as "worked"
    const { data: interactedAccounts, error: interactionError } = await supabase
      .from('account_interactions')
      .select('account_id')
      .eq('agent_id', agentId)
      .not('interaction_type', 'eq', 'viewed'); // Exclude just viewing the account
    
    // Get unique account IDs that have been worked on
    const workedAccountIds = new Set();
    
    // If we have worked accounts data, use it
    if (workedAccounts && !workedError) {
      workedAccounts.forEach(item => workedAccountIds.add(item.account_id));
    }
    
    // If we have interaction data, use it as a fallback
    if (interactedAccounts && !interactionError) {
      interactedAccounts.forEach(item => workedAccountIds.add(item.account_id));
    }
    
    console.log(`[AGENT ACCOUNTS] Found ${workedAccountIds.size} worked accounts`);
    
    // Calculate the number of unworked accounts
    const unworkedAccountsCount = totalAllocationsCount ? totalAllocationsCount - workedAccountIds.size : 0;
    console.log(`[AGENT ACCOUNTS] Unworked accounts count: ${unworkedAccountsCount}`);
    
    // If we got a valid count directly from the database, use it
    if (totalAllocationsCount !== null && !countError) {
      console.log(`[AGENT ACCOUNTS] Using direct count from database: ${totalAllocationsCount}`);
      
      // Fetch a sample of accounts to calculate other metrics
      const accounts = await fetchAgentAllocatedAccounts(agentId);
      
      // Calculate value metrics from the sample
      const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);
      const avgAccountValue = accounts.length > 0 ? totalValue / accounts.length : 0;
      
      // Estimate total value based on average account value and total count
      const estimatedTotalValue = avgAccountValue * totalAllocationsCount;
      
      // Calculate other metrics from the sample
      const overdueAccounts = accounts.filter(account => account.status === "overdue").length;
      const overdueRatio = accounts.length > 0 ? overdueAccounts / accounts.length : 0;
      const estimatedOverdueAccounts = Math.round(overdueRatio * totalAllocationsCount);
      
      // Calculate contact rate (for demo purposes)
      const contactedAccounts = accounts.filter(account => 
        new Date(account.lastContact) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      const contactRate = accounts.length > 0 ? Math.round((contactedAccounts / accounts.length) * 100) : 0;
      
      const metrics = {
        totalAccounts: totalAllocationsCount, // Total allocated accounts
        totalValue: estimatedTotalValue,
        overdueAccounts: estimatedOverdueAccounts,
        overdueValue: estimatedTotalValue * (overdueRatio),
        contactRate,
        changeVsLastMonth: totalAllocationsCount > 0 ? 8.3 : 0, // Mock data for now
        highPriorityAccounts: Math.round(accounts.filter(account => account.priority === "high").length / accounts.length * totalAllocationsCount),
        unworkedAccountsCount: unworkedAccountsCount // Count of accounts not yet worked on
      };
      
      console.log("Calculated metrics using direct count:", metrics);
      // Return the metrics object with the correct structure expected by the dashboard
      return {
        totalAccounts: metrics.totalAccounts,
        totalValue: metrics.totalValue,
        overdueAccounts: metrics.overdueAccounts,
        overdueValue: metrics.overdueValue,
        contactRate: metrics.contactRate,
        changeVsLastMonth: metrics.changeVsLastMonth,
        highPriorityAccounts: metrics.highPriorityAccounts,
        remaining: metrics.unworkedAccountsCount // Add the remaining unworked accounts count
      };
    }
    
    // Fallback to the original method if direct count failed
    console.log("[AGENT ACCOUNTS] Falling back to account fetching method");
    const accounts = await fetchAgentAllocatedAccounts(agentId);
    console.log("Found", accounts.length, "accounts for metrics calculation");
    
    // Calculate metrics
    const totalAccounts = accounts.length;
    const totalValue = accounts.reduce((sum, account) => sum + account.balance, 0);
    const overdueAccounts = accounts.filter(account => account.status === "overdue").length;
    const overdueValue = accounts
      .filter(account => account.status === "overdue")
      .reduce((sum, account) => sum + account.balance, 0);
    
    // Calculate contact rate (for demo purposes)
    const contactedAccounts = accounts.filter(account => 
      new Date(account.lastContact) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    const contactRate = totalAccounts > 0 ? Math.round((contactedAccounts / totalAccounts) * 100) : 0;
    
    const metrics = {
      totalAccounts,
      totalValue,
      overdueAccounts,
      overdueValue,
      contactRate,
      changeVsLastMonth: totalAccounts > 0 ? 8.3 : 0, // Mock data for now
      highPriorityAccounts: accounts.filter(account => account.priority === "high").length
    };
    
    console.log("Calculated metrics:", metrics);
    return metrics;
  } catch (error) {
    console.error("Error in getAgentAccountMetrics:", error);
    return {
      totalAccounts: 0,
      totalValue: 0,
      overdueAccounts: 0,
      overdueValue: 0,
      contactRate: 0,
      changeVsLastMonth: 0,
      highPriorityAccounts: 0
    };
  }
}

// Sample data for allocated accounts (used when no database data is available)
const sampleAccounts = [
  {
    id: "ACC-1001",
    customerName: "John Smith",
    phone: "+27 61 234 5678",
    balance: 12500,
    status: "overdue" as const,
    lastContact: "2025-03-10",
    daysOverdue: 8,
    priority: "high" as const,
  },
  {
    id: "ACC-1002",
    customerName: "Sarah Johnson",
    phone: "+27 62 345 6789",
    balance: 8750,
    status: "current" as const,
    lastContact: "2025-03-15",
    daysOverdue: 0,
    priority: "low" as const,
  },
  {
    id: "ACC-1003",
    customerName: "Michael Ndlovu",
    phone: "+27 63 456 7890",
    balance: 15000,
    status: "overdue" as const,
    lastContact: "2025-03-12",
    daysOverdue: 6,
    priority: "medium" as const,
  },
  {
    id: "ACC-1004",
    customerName: "Elizabeth Naidoo",
    phone: "+27 64 567 8901",
    balance: 5200,
    status: "current" as const,
    lastContact: "2025-03-17",
    daysOverdue: 0,
    priority: "low" as const,
  },
  {
    id: "ACC-1005",
    customerName: "David van der Merwe",
    phone: "+27 65 678 9012",
    balance: 9800,
    status: "overdue" as const,
    lastContact: "2025-03-11",
    daysOverdue: 7,
    priority: "high" as const,
  },
  {
    id: "ACC-1006",
    customerName: "Thabo Mbeki",
    phone: "+27 66 789 0123",
    balance: 7500,
    status: "overdue" as const,
    lastContact: "2025-03-14",
    daysOverdue: 4,
    priority: "medium" as const,
  },
  {
    id: "ACC-1007",
    customerName: "Nomsa Dlamini",
    phone: "+27 67 890 1234",
    balance: 11200,
    status: "current" as const,
    lastContact: "2025-03-16",
    daysOverdue: 0,
    priority: "low" as const,
  },
  {
    id: "ACC-1008",
    customerName: "Sipho Nkosi",
    phone: "+27 68 901 2345",
    balance: 18500,
    status: "overdue" as const,
    lastContact: "2025-03-09",
    daysOverdue: 9,
    priority: "high" as const,
  },
];
