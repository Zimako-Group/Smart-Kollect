import { supabase, supabaseAdmin } from './supabaseClient';
import { formatDate } from './customer-service';
import { createAccountActivity } from './account-activity-service';

export interface PTP {
  id: string;
  debtor_id: string;
  amount: number;
  date: string;
  payment_method: string;
  notes: string;
  status: 'pending' | 'paid' | 'defaulted';
  created_by: string;
  created_at: string;
  updated_at: string;
  source?: 'PTP' | 'ManualPTP'; // Optional field to distinguish table source
}

export interface CreatePTPParams {
  debtor_id: string;
  amount: number;
  date: string;
  payment_method: string;
  notes?: string;
  created_by: string | null;
}

/**
 * Get PTP history for a specific debtor
 * @param debtorId Debtor ID
 * @returns Promise with PTP history data
 */
export const getPTPHistory = async (debtorId: string): Promise<PTP[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('PTP')
      .select('*')
      .eq('debtor_id', debtorId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching PTP history:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getPTPHistory:', error);
    throw new Error(`Failed to fetch PTP history: ${error.message}`);
  }
};

/**
 * Create a new PTP arrangement
 * @param ptp PTP data
 * @returns Promise with the created PTP
 */
export const createPTP = async (ptp: CreatePTPParams): Promise<PTP> => {
  try {
    // Ensure numeric fields are properly formatted
    const formattedPTP = {
      ...ptp,
      amount: Number(ptp.amount),
    };

    // Check if we have a valid UUID for created_by
    const isValidUUID = (id: string) => {
      // Basic UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };
    
    // Only make created_by null if it's invalid, the system user ID, empty string, or undefined
    if (!formattedPTP.created_by || 
        formattedPTP.created_by === '00000000-0000-0000-0000-000000000000' || 
        formattedPTP.created_by === '' ||
        !isValidUUID(formattedPTP.created_by)) {
      formattedPTP.created_by = null;
      console.log('Setting created_by to null because it was empty, system ID, or invalid UUID');
    } else {
      console.log('Using agent UUID for created_by:', formattedPTP.created_by);
    }
    
    console.log('Creating PTP with created_by:', formattedPTP.created_by);

    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('PTP')
      .insert(formattedPTP)
      .select()
      .single();

    if (error) {
      console.error('Error creating PTP:', error);
      throw new Error(`Failed to create PTP: ${error.message}`);
    }

    // Create an account activity for this PTP arrangement
    try {
      const paymentDate = new Date(formattedPTP.date);
      const formattedDate = paymentDate.toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Get user information for the activity
      let createdByName = 'System';
      if (formattedPTP.created_by) {
        const { data: userData } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', formattedPTP.created_by)
          .single();
        
        if (userData) {
          createdByName = userData.full_name;
        }
      }

      // Create the activity
      await createAccountActivity({
        accountId: formattedPTP.debtor_id,
        activityType: 'status_change',
        activitySubtype: 'ptp_created',
        description: `Promise to Pay arrangement created for ${formattedDate}`,
        amount: formattedPTP.amount,
        createdBy: formattedPTP.created_by || null, // Use null instead of 'system' for UUID field
        createdByName: createdByName || 'System', // Always provide a display name
        metadata: {
          ptpId: data.id,
          paymentMethod: formattedPTP.payment_method,
          paymentDate: formattedPTP.date,
          fromStatus: 'overdue',
          toStatus: 'PTP',
          notes: formattedPTP.notes,
          systemCreated: formattedPTP.created_by ? false : true // Flag if system created
        }
      });

      console.log('Created account activity for PTP arrangement');
    } catch (activityError) {
      // Log the error but don't fail the PTP creation
      console.error('Error creating account activity for PTP:', activityError);
    }

    return data;
  } catch (error: any) {
    console.error('Error in createPTP:', error);
    throw new Error(`Failed to create PTP: ${error.message}`);
  }
};

/**
 * Update PTP status
 * @param ptpId PTP ID
 * @param status New status
 * @returns Promise with the updated PTP
 */
export const updatePTPStatus = async (
  ptpId: string,
  status: 'pending' | 'paid' | 'defaulted'
): Promise<PTP> => {
  try {
    const { data, error } = await supabase
      .from('PTP')
      .update({ status })
      .eq('id', ptpId)
      .select()
      .single();

    if (error) {
      console.error('Error updating PTP status:', error);
      throw new Error(`Failed to update PTP status: ${error.message}`);
    }

    // Create an account activity for this PTP status update
    try {
      // Get user information
      const { data: { user } } = await supabase.auth.getUser();
      let createdBy = 'system';
      let createdByName = 'System';
      
      if (user) {
        createdBy = user.id;
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          createdByName = userData.full_name;
        }
      }

      // Create the activity
      await createAccountActivity({
        accountId: data.debtor_id,
        activityType: 'status_change',
        activitySubtype: `ptp_${status}`,
        description: `Promise to Pay marked as ${status}`,
        amount: data.amount,
        createdBy: createdBy || null, // Use null if not a valid UUID
        createdByName: createdByName || 'System', // Always provide a display name
        metadata: {
          ptpId: data.id,
          previousStatus: 'pending',
          newStatus: status,
          paymentMethod: data.payment_method,
          paymentDate: data.date,
          systemUpdated: createdBy ? false : true // Flag if system updated
        }
      });

      console.log(`Created account activity for PTP status update to ${status}`);
    } catch (activityError) {
      // Log the error but don't fail the status update
      console.error('Error creating account activity for PTP status update:', activityError);
    }

    return data;
  } catch (error: any) {
    console.error('Error in updatePTPStatus:', error);
    throw new Error(`Failed to update PTP status: ${error.message}`);
  }
};

/**
 * Format PTP data for display
 * @param ptp PTP object
 * @returns Formatted PTP data
 */
export const formatPTP = (ptp: PTP) => {
  return {
    id: ptp.id,
    debtorId: ptp.debtor_id,
    amount: ptp.amount,
    formattedAmount: `R ${ptp.amount.toFixed(2)}`,
    date: ptp.date,
    formattedDate: formatDate(ptp.date),
    paymentMethod: ptp.payment_method,
    notes: ptp.notes,
    status: ptp.status,
    createdBy: ptp.created_by,
    createdAt: ptp.created_at,
    updatedAt: ptp.updated_at,
  };
};

/**
 * Check for defaulted PTPs and update their status
 * This function finds all pending PTPs with dates in the past and marks them as defaulted
 * @returns Promise that resolves when the operation is complete
 */
export const checkForDefaultedPTPs = async (): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    // Format today's date in ISO format for Supabase query
    const todayFormatted = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // First, get all pending PTPs with dates in the past
    const { data: defaultedPTPs, error: fetchError } = await supabaseAdmin
      .from('PTP')
      .select('*') // Get all fields so we can create activities
      .eq('status', 'pending')
      .lt('date', todayFormatted);
    
    if (fetchError) {
      console.error('Error fetching defaulted PTPs:', fetchError);
      throw new Error(fetchError.message);
    }
    
    if (!defaultedPTPs || defaultedPTPs.length === 0) {
      // No defaulted PTPs found
      return;
    }
    
    // Extract the IDs of defaulted PTPs
    const defaultedPTPIds = defaultedPTPs.map(ptp => ptp.id);
    
    // Update all defaulted PTPs to have status 'defaulted'
    const { error: updateError } = await supabaseAdmin
      .from('PTP')
      .update({ status: 'defaulted' })
      .in('id', defaultedPTPIds);
    
    if (updateError) {
      console.error('Error updating defaulted PTPs:', updateError);
      throw new Error(updateError.message);
    }
    
    console.log(`Updated ${defaultedPTPIds.length} PTPs to defaulted status`);
    
    // Create account activities for each defaulted PTP
    for (const ptp of defaultedPTPs) {
      try {
        await createAccountActivity({
          accountId: ptp.debtor_id,
          activityType: 'status_change',
          activitySubtype: 'ptp_defaulted',
          description: 'Promise to Pay arrangement defaulted',
          amount: ptp.amount,
          createdBy: null, // Use null instead of 'system' for UUID field
          createdByName: 'System', // Always provide a display name
          metadata: {
            ptpId: ptp.id,
            previousStatus: 'pending',
            newStatus: 'defaulted',
            paymentMethod: ptp.payment_method,
            paymentDate: ptp.date,
            defaultedAt: new Date().toISOString(),
            systemDefaulted: true // Flag that system defaulted this PTP
          }
        });
      } catch (activityError) {
        console.error(`Error creating account activity for defaulted PTP ${ptp.id}:`, activityError);
      }
    }
  } catch (error: any) {
    console.error('Error in checkForDefaultedPTPs:', error);
    // Don't throw the error here to prevent it from breaking the application flow
    // Just log it so we can see it in the console
  }
};

/**
 * Get the count of PTPs created by a specific agent
 * @param agentId UUID of the agent
 * @returns Promise with the count of PTPs created by the agent
 */
export const getAgentPTPCount = async (agentId: string): Promise<number> => {
  try {
    if (!agentId) {
      console.error('Agent ID is required to get PTP count');
      return 0;
    }
    
    console.log(`Getting PTP count for agent ${agentId}`);
    
    const { data, error, count } = await supabaseAdmin
      .from('PTP')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', agentId);
    
    if (error) {
      console.error('Error fetching agent PTP count:', error);
      return 0;
    }
    
    console.log(`Found ${count} PTPs for agent ${agentId}`);
    return count || 0;
  } catch (error: any) {
    console.error('Error in getAgentPTPCount:', error);
    return 0;
  }
};

/**
 * Get defaulted PTPs grouped by agent from both PTP and ManualPTP tables
 * @returns Promise with defaulted PTPs grouped by agent
 */
export const getDefaultedPTPsByAgent = async (): Promise<{[agentId: string]: {agent: any, ptps: (PTP & {debtor_name?: string, debtor_phone?: string, source?: string})[]}}> => {
  try {
    console.log('Fetching defaulted PTPs by agent from both PTP and ManualPTP tables...');
    
    // Fetch defaulted PTPs from both tables in parallel
    const [ptpResult, manualPtpResult] = await Promise.all([
      // Fetch from PTP table
      supabaseAdmin
        .from('PTP')
        .select('*')
        .eq('status', 'defaulted')
        .order('date', { ascending: false }),
      
      // Fetch from ManualPTP table
      supabaseAdmin
        .from('ManualPTP')
        .select('*')
        .eq('status', 'defaulted')
        .order('date', { ascending: false })
    ]);

    if (ptpResult.error) {
      console.error('Error fetching defaulted PTPs from PTP table:', ptpResult.error);
      throw new Error(ptpResult.error.message);
    }

    if (manualPtpResult.error) {
      console.error('Error fetching defaulted PTPs from ManualPTP table:', manualPtpResult.error);
      throw new Error(manualPtpResult.error.message);
    }

    // Combine PTPs from both tables
    const ptpTableData = ptpResult.data || [];
    const manualPtpTableData = manualPtpResult.data || [];
    
    // Add a source field to distinguish between tables and ensure consistent structure
    const allDefaultedPTPs = [
      ...ptpTableData.map(ptp => ({ ...ptp, source: 'PTP' as const })),
      ...manualPtpTableData.map(ptp => ({ 
        ...ptp, 
        source: 'ManualPTP' as const,
        // Ensure ManualPTP has the same structure as PTP
        payment_method: ptp.payment_method || 'Cash',
        notes: ptp.notes || ''
      }))
    ];

    if (allDefaultedPTPs.length === 0) {
      console.log('No defaulted PTPs found in either table');
      return {};
    }

    console.log(`Found ${ptpTableData.length} defaulted PTPs from PTP table and ${manualPtpTableData.length} from ManualPTP table`);
    console.log(`Total: ${allDefaultedPTPs.length} defaulted PTPs`);

    // Get unique debtor IDs to fetch debtor information
    const debtorIds = [...new Set(allDefaultedPTPs.map(ptp => ptp.debtor_id))];
    console.log(`Fetching debtor information for ${debtorIds.length} unique debtors`);

    // Fetch debtor information in batches to avoid query limits
    const batchSize = 100;
    const debtorInfo: {[debtorId: string]: {name: string, phone: string}} = {};
    
    for (let i = 0; i < debtorIds.length; i += batchSize) {
      const batch = debtorIds.slice(i, i + batchSize);
      
      const { data: debtors, error: debtorError } = await supabaseAdmin
        .from('Debtors')
        .select('id, name, surname_company_trust, cellphone_1, cellphone_2')
        .in('id', batch);

      if (debtorError) {
        console.error('Error fetching debtor details batch:', debtorError);
        // Continue with the data we have rather than failing completely
      } else if (debtors) {
        console.log(`Retrieved ${debtors.length} debtors for batch ${Math.floor(i/batchSize) + 1}`);
        
        for (const debtor of debtors) {
          const fullName = debtor.surname_company_trust 
            ? `${debtor.name || ''} ${debtor.surname_company_trust}`.trim()
            : debtor.name || 'Unknown Customer';
          
          const phone = debtor.cellphone_1 || debtor.cellphone_2 || 'No Phone';
          
          debtorInfo[debtor.id] = {
            name: fullName,
            phone: phone
          };
        }
      }
    }

    // Get unique agent IDs to fetch agent information
    const agentIds = [...new Set(allDefaultedPTPs.map(ptp => ptp.created_by).filter(Boolean))];
    console.log(`Fetching agent information for ${agentIds.length} unique agents`);

    const ptpsByAgent: {[agentId: string]: {agent: any, ptps: (PTP & {debtor_name?: string, debtor_phone?: string, source?: string})[]}} = {};
    
    // Fetch agent information in batches
    for (let i = 0; i < agentIds.length; i += batchSize) {
      const batchIds = agentIds.slice(i, i + batchSize);
        
      const { data: agents, error: agentsError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', batchIds);

      if (agentsError) {
        console.error('Error fetching agent details batch:', agentsError);
        // Continue with the data we have rather than failing completely
      } else if (agents) {
        console.log(`Retrieved ${agents.length} agents for batch ${Math.floor(i/batchSize) + 1}`);
        
        // Group PTPs by agent
        for (const agent of agents) {
          const agentPTPs = allDefaultedPTPs.filter(ptp => ptp.created_by === agent.id);
          if (agentPTPs.length > 0) {
            console.log(`Agent ${agent.full_name} has ${agentPTPs.length} defaulted PTPs (${agentPTPs.filter(p => p.source === 'PTP').length} from PTP, ${agentPTPs.filter(p => p.source === 'ManualPTP').length} from ManualPTP)`);
            
            // Add debtor information to each PTP
            const ptpsWithDebtorInfo = agentPTPs.map(ptp => ({
              ...ptp,
              debtor_name: debtorInfo[ptp.debtor_id]?.name || 'Unknown Customer',
              debtor_phone: debtorInfo[ptp.debtor_id]?.phone || 'No Phone'
            }));
            
            // Check if we already have PTPs for this agent and append instead of overwriting
            if (ptpsByAgent[agent.id]) {
              ptpsByAgent[agent.id] = {
                agent,
                ptps: [...ptpsByAgent[agent.id].ptps, ...ptpsWithDebtorInfo]
              };
            } else {
              ptpsByAgent[agent.id] = {
                agent,
                ptps: ptpsWithDebtorInfo
              };
            }
          }
        }
      }
    }
    
    console.log(`Returning data for ${Object.keys(ptpsByAgent).length} agents with defaulted PTPs`);
    return ptpsByAgent;
  } catch (error: any) {
    console.error('Error in getDefaultedPTPsByAgent:', error);
    throw new Error(`Failed to fetch defaulted PTPs by agent: ${error.message}`);
  }
};

export const deletePTP = async (ptpId: string, ptpType: string = 'default'): Promise<void> => {
  try {
    // Determine which table to delete from based on PTP type
    const table = ptpType === 'manual' ? 'ManualPTP' : 'PTP';
    
    // Get the PTP details before deletion for activity logging
    const { data: ptpData, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', ptpId)
      .single();
    
    if (fetchError) {
      console.error(`Error fetching PTP details before deletion:`, fetchError);
      throw new Error(fetchError.message);
    }
    
    // Delete the PTP
    const { error: deleteError } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', ptpId);
    
    if (deleteError) {
      console.error(`Error deleting PTP:`, deleteError);
      throw new Error(deleteError.message);
    }
    
    // Log an account activity for the deletion
    if (ptpData) {
      try {
        await createAccountActivity({
          accountId: ptpData.debtor_id,
          activityType: 'status_change',
          activitySubtype: 'ptp_deleted',
          description: 'Promise to Pay arrangement deleted',
          amount: ptpData.amount,
          createdBy: null,
          createdByName: 'System',
          metadata: {
            ptpId: ptpData.id,
            previousStatus: ptpData.status,
            deletedAt: new Date().toISOString(),
            paymentMethod: ptpData.payment_method,
            paymentDate: ptpData.date,
            ptpType: ptpType
          }
        });
      } catch (activityError) {
        console.error(`Error creating account activity for deleted PTP ${ptpId}:`, activityError);
        // Don't throw here to ensure the deletion still succeeds
      }
    }
    
    console.log(`Successfully deleted PTP ${ptpId} from ${table}`);
  } catch (error: any) {
    console.error('Error in deletePTP:', error);
    throw new Error(`Failed to delete PTP: ${error.message}`);
  }
};
