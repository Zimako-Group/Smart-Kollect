import { supabase, supabaseAdmin } from './supabaseClient';
import { formatDate } from './customer-service';
import { createAccountActivity } from './account-activity-service';
import { createActivityNotification } from './notification-service';
import { sendSMS } from './services/infobip-service';

export interface ManualPTP {
  id: string;
  debtor_id: string;
  amount: number;
  date: string;
  payment_method: string; // Limited to 'cash' or 'eft'
  notes: string;
  status: 'pending' | 'paid' | 'defaulted';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateManualPTPParams {
  debtor_id: string;
  amount: number;
  date: string;
  payment_method: string; // Limited to 'cash' or 'eft'
  notes?: string;
  created_by: string | null;
}

/**
 * Get manual PTP history for a specific debtor
 * @param debtorId Debtor ID
 * @returns Promise with manual PTP history data
 */
export const getManualPTPHistory = async (debtorId: string): Promise<ManualPTP[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ManualPTP')
      .select('*')
      .eq('debtor_id', debtorId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching manual PTP history:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getManualPTPHistory:', error);
    throw new Error(`Failed to fetch manual PTP history: ${error.message}`);
  }
};

/**
 * Create a new manual PTP arrangement
 * @param ptp Manual PTP data
 * @returns Promise with the created manual PTP
 */
export const createManualPTP = async (ptp: CreateManualPTPParams): Promise<ManualPTP> => {
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
    
    console.log('Creating manual PTP with created_by:', formattedPTP.created_by);

    // Validate payment method is one of the allowed values
    const validPaymentMethods = ['cash', 'eft', 'easypay'];
    if (!validPaymentMethods.includes(formattedPTP.payment_method)) {
      throw new Error(`Payment method must be one of: ${validPaymentMethods.join(', ')}`);
    }

    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('ManualPTP')
      .insert(formattedPTP)
      .select()
      .single();

    if (error) {
      console.error('Error creating manual PTP:', error);
      throw new Error(`Failed to create manual PTP: ${error.message}`);
    }

    // Create an account activity for this manual PTP arrangement
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
      
      // Get debtor information for SMS notification
      const { data: debtorData, error: debtorError } = await supabaseAdmin
        .from('Debtors')
        .select('acc_number, acc_holder, surname_company_trust, name, cellphone_1, cellphone_2')
        .eq('id', formattedPTP.debtor_id)
        .single();

      if (debtorError) {
        console.error('Error fetching debtor information for SMS:', debtorError);
      } else if (debtorData) {
        // Log debtor data for debugging
        console.log('Debtor data for SMS notification:', {
          id: formattedPTP.debtor_id,
          acc_number: debtorData.acc_number,
          name: debtorData.name,
          surname: debtorData.surname_company_trust,
          cellphone_1: debtorData.cellphone_1,
          cellphone_2: debtorData.cellphone_2
        });
        
        // Try all possible phone number fields in order of preference
        const phoneNumber = debtorData.cellphone_1 || debtorData.cellphone_2;
        const debtorName = debtorData.name || debtorData.acc_holder || '';
        const accountNumber = debtorData.acc_number || '';
        
        // Always send SMS confirmation for manual PTP arrangements
        if (phoneNumber) {
          try {
            // Format the PTP date for the SMS
            const ptpDate = new Date(formattedPTP.date);
            const formattedPtpDate = ptpDate.toLocaleDateString('en-ZA', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            
            // Format the PTP amount for the SMS
            const formattedAmount = new Intl.NumberFormat('en-ZA', {
              style: 'currency',
              currency: 'ZAR'
            }).format(formattedPTP.amount);
            
            // Get payment method in readable format
            const paymentMethodText = {
              'cash': 'Cash',
              'eft': 'EFT',
              'easypay': 'EasyPay'
            }[formattedPTP.payment_method] || formattedPTP.payment_method;
            
            // Prepare the SMS message using the template - keep it under 160 characters
            const smsMessage = `Mahikeng Municipality: Your payment arrangement of ${formattedAmount} via ${paymentMethodText} is confirmed for ${formattedPtpDate}. Ref: ${accountNumber}. Thank you.`;
            
            // Log the SMS details for debugging
            console.log('Sending PTP confirmation SMS:', {
              to: phoneNumber,
              message: smsMessage,
              debtorName,
              accountNumber
            });
            
            // Send the SMS using Infobip
            const smsResponse = await sendSMS({
              to: phoneNumber,
              text: smsMessage,
              from: 'MahikengM' // 10 characters max for alphanumeric sender ID
            });
            
            console.log('SMS notification response:', smsResponse);
            
            // Add SMS details to the PTP metadata
            if (smsResponse.success) {
              console.log('SMS sent successfully with message ID:', smsResponse.messageId);
            } else {
              console.warn('SMS sending failed:', smsResponse.error);
            }
          } catch (smsError) {
            console.error('Error sending PTP confirmation SMS:', smsError);
            // Don't throw here - we don't want to fail the PTP creation if SMS fails
          }
        } else {
          console.warn('No phone number available for SMS notification for debtor:', formattedPTP.debtor_id);
        }
      }
      
      // Create the activity
      await createAccountActivity({
        accountId: formattedPTP.debtor_id,
        activityType: 'status_change',
        activitySubtype: 'manual_ptp_created',
        description: `Manual Promise to Pay arrangement created for R${formattedPTP.amount.toFixed(2)} on ${formattedDate}`,
        amount: formattedPTP.amount,
        createdBy: formattedPTP.created_by,
        createdByName,
        metadata: {
          ptpId: data.id,
          paymentMethod: formattedPTP.payment_method,
          paymentDate: formattedPTP.date,
          notes: formattedPTP.notes || '',
          isManual: true
        }
      });
      
      // Get customer name for the notification
      const { data: customerData, error: customerError } = await supabaseAdmin
        .from('Debtors')
        .select('name, surname_company_trust')
        .eq('id', formattedPTP.debtor_id)
        .single();
      
      if (customerError) {
        console.error('Error fetching customer data for notification:', customerError);
      } else {
        // Create notification for admin
        try {
          const notificationType: 'info' | 'warning' | 'urgent' = 'info';
          const customerFullName = `${customerData.name || ''} ${customerData.surname_company_trust || ''}`.trim();
          await createActivityNotification(
            'created a PTP arrangement',
            formattedPTP.debtor_id,
            customerFullName,
            createdByName,
            'PTP_CREATED',
            data.id,
            {
              amount: formattedPTP.amount,
              paymentDate: formattedPTP.date,
              paymentMethod: formattedPTP.payment_method,
              notes: formattedPTP.notes || ''
            },
            notificationType
          );
        } catch (notificationError) {
          console.error('Error creating PTP notification:', notificationError);
        }
      }
      
      console.log('Created account activity for manual PTP');
    } catch (activityError) {
      console.error('Error creating account activity for manual PTP:', activityError);
      // Don't throw here, we still want to return the created PTP
    }

    return data;
  } catch (error: any) {
    console.error('Error in createManualPTP:', error);
    throw new Error(`Failed to create manual PTP: ${error.message}`);
  }
};

/**
 * Update manual PTP status
 * @param ptpId Manual PTP ID
 * @param status New status
 * @returns Promise with the updated manual PTP
 */
export const updateManualPTPStatus = async (
  ptpId: string,
  status: 'pending' | 'paid' | 'defaulted'
): Promise<ManualPTP> => {
  try {
    // First get the current PTP to create a proper activity
    const { data: currentPTP, error: fetchError } = await supabaseAdmin
      .from('ManualPTP')
      .select('*')
      .eq('id', ptpId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching manual PTP for status update:', fetchError);
      throw new Error(`Failed to fetch manual PTP: ${fetchError.message}`);
    }
    
    // Update the PTP status
    const { data, error } = await supabaseAdmin
      .from('ManualPTP')
      .update({ status })
      .eq('id', ptpId)
      .select()
      .single();

    if (error) {
      console.error('Error updating manual PTP status:', error);
      throw new Error(`Failed to update manual PTP status: ${error.message}`);
    }

    // Create an account activity for this status change
    try {
      let activitySubtype = '';
      let description = '';
      
      switch (status) {
        case 'paid':
          activitySubtype = 'manual_ptp_paid';
          description = 'Manual Promise to Pay arrangement marked as paid';
          break;
        case 'defaulted':
          activitySubtype = 'manual_ptp_defaulted';
          description = 'Manual Promise to Pay arrangement marked as defaulted';
          break;
        default:
          activitySubtype = 'manual_ptp_status_change';
          description = `Manual Promise to Pay arrangement status changed to ${status}`;
      }
      
      await createAccountActivity({
        accountId: currentPTP.debtor_id,
        activityType: 'status_change',
        activitySubtype,
        description,
        amount: currentPTP.amount,
        createdBy: null, // System action
        createdByName: 'System',
        metadata: {
          ptpId,
          previousStatus: currentPTP.status,
          newStatus: status,
          paymentMethod: currentPTP.payment_method,
          paymentDate: currentPTP.date,
          isManual: true
        }
      });
      
      console.log(`Created account activity for manual PTP status change to ${status}`);
    } catch (activityError) {
      console.error('Error creating account activity for manual PTP status change:', activityError);
      // Don't throw here, we still want to return the updated PTP
    }

    return data;
  } catch (error: any) {
    console.error('Error in updateManualPTPStatus:', error);
    throw new Error(`Failed to update manual PTP status: ${error.message}`);
  }
};

/**
 * Format manual PTP data for display
 * @param ptp Manual PTP object
 * @returns Formatted manual PTP data
 */
export const formatManualPTP = (ptp: ManualPTP) => {
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
    isManual: true
  };
};

/**
 * Check for defaulted manual PTPs and update their status
 * This function finds all pending manual PTPs with dates in the past and marks them as defaulted
 * @returns Promise that resolves when the operation is complete
 */
export const checkForDefaultedManualPTPs = async (): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    // Format today's date in ISO format for Supabase query
    const todayFormatted = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // First, get all pending manual PTPs with dates in the past
    const { data: defaultedPTPs, error: fetchError } = await supabaseAdmin
      .from('ManualPTP')
      .select('*') // Get all fields so we can create activities
      .eq('status', 'pending')
      .lt('date', todayFormatted);
    
    if (fetchError) {
      console.error('Error fetching defaulted manual PTPs:', fetchError);
      throw new Error(fetchError.message);
    }
    
    if (!defaultedPTPs || defaultedPTPs.length === 0) {
      // No defaulted manual PTPs found
      return;
    }
    
    // Extract the IDs of defaulted manual PTPs
    const defaultedPTPIds = defaultedPTPs.map(ptp => ptp.id);
    
    // Update all defaulted manual PTPs to have status 'defaulted'
    const { error: updateError } = await supabaseAdmin
      .from('ManualPTP')
      .update({ status: 'defaulted' })
      .in('id', defaultedPTPIds);
    
    if (updateError) {
      console.error('Error updating defaulted manual PTPs:', updateError);
      throw new Error(updateError.message);
    }
    
    console.log(`Updated ${defaultedPTPIds.length} manual PTPs to defaulted status`);
    
    // Create account activities for each defaulted manual PTP
    for (const ptp of defaultedPTPs) {
      try {
        await createAccountActivity({
          accountId: ptp.debtor_id,
          activityType: 'status_change',
          activitySubtype: 'manual_ptp_defaulted',
          description: 'Manual Promise to Pay arrangement defaulted',
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
            systemDefaulted: true, // Flag that system defaulted this PTP
            isManual: true
          }
        });
      } catch (activityError) {
        console.error(`Error creating account activity for defaulted manual PTP ${ptp.id}:`, activityError);
      }
    }
  } catch (error: any) {
    console.error('Error in checkForDefaultedManualPTPs:', error);
    // Don't throw the error here to prevent it from breaking the application flow
    // Just log it so we can see it in the console
  }
};

/**
 * Get the count of manual PTPs created by a specific agent
 * @param agentId UUID of the agent
 * @returns Promise with the count of manual PTPs created by the agent
 */
export const getAgentManualPTPCount = async (agentId: string): Promise<number> => {
  try {
    if (!agentId) {
      console.error('Agent ID is required to get manual PTP count');
      return 0;
    }
    
    console.log(`Getting manual PTP count for agent ${agentId}`);
    
    const { data, error, count } = await supabaseAdmin
      .from('ManualPTP')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', agentId);
    
    if (error) {
      console.error('Error fetching agent manual PTP count:', error);
      return 0;
    }
    
    console.log(`Found ${count} manual PTPs for agent ${agentId}`);
    return count || 0;
  } catch (error: any) {
    console.error('Error in getAgentManualPTPCount:', error);
    return 0;
  }
};