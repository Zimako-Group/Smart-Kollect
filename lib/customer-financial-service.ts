import { supabase } from './supabaseClient';

/**
 * Update a customer's financial summary after processing a payment
 * @param accountNumber The customer account number
 * @param paymentAmount The amount paid
 * @returns Object with success status and message
 */
export async function updateCustomerFinancialSummary(accountNumber: string, paymentAmount: number) {
  try {
    // First, get the current customer data
    const { data: customer, error: fetchError } = await supabase
      .from('accounts')
      .select('id, current_balance, original_amount')
      .eq('client_ref', accountNumber) // Using client_ref as the account number field
      .single();
      
    console.log('Fetching account data for:', accountNumber, customer);
    
    if (fetchError || !customer) {
      console.error('Error fetching customer data:', fetchError);
      return { success: false, message: 'Customer not found' };
    }
    
    // Calculate new financial values
    const newOutstandingBalance = Math.max(0, customer.current_balance - paymentAmount);
    
    // IMPORTANT: Do NOT update the original amount - keep the existing value
    // Use the existing original amount for payment progress calculation
    const originalAmount = customer.original_amount || customer.current_balance;
    
    // Calculate payment progress based on original amount and new balance
    const paymentProgress = originalAmount > 0 
      ? Math.min(100, Math.round(((originalAmount - newOutstandingBalance) / originalAmount) * 100)) 
      : 100;
    
    console.log(`Financial calculation: Original: ${originalAmount}, New Balance: ${newOutstandingBalance}, Progress: ${paymentProgress}%`);
    
    // Get the current date for last payment date
    const lastPaymentDate = new Date().toISOString();
    
    // Update the customer record - IMPORTANT: Do NOT update original_amount
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        current_balance: newOutstandingBalance,
        // original_amount is intentionally removed from this update
        // Using days_since_last_payment to store payment progress percentage
        days_since_last_payment: paymentProgress,
        last_payment_amount: paymentAmount,
        last_payment: lastPaymentDate.split('T')[0] // Format as YYYY-MM-DD
      })
      .eq('id', customer.id);
      
    console.log(`Updating account financial data for ID ${customer.id} - preserving original amount. New balance: ${newOutstandingBalance}`);
    
    if (updateError) {
      console.error('Error updating customer financial data:', updateError);
      return { success: false, message: 'Failed to update financial data' };
    }
    
    // Add payment to payment history (using Payments table)
    const { error: paymentHistoryError } = await supabase
      .from('Payments')
      .insert({
        debtor_id: customer.id,
        amount: paymentAmount,
        payment_date: lastPaymentDate.split('T')[0], // Format as YYYY-MM-DD
        payment_method: 'File Upload',
        reference_number: `PAYMENT-${Date.now()}`,
        description: 'Payment from file upload',
        recorded_by: '00000000-0000-0000-0000-000000000000' // System user
      });
    
    if (paymentHistoryError) {
      console.error('Error adding payment history:', paymentHistoryError);
      // We still consider this a success since the financial data was updated
    }
    
    return { 
      success: true, 
      message: 'Financial summary updated successfully',
      data: {
        newBalance: newOutstandingBalance,
        paymentProgress
      }
    };
  } catch (error) {
    console.error('Unexpected error updating financial summary:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}
