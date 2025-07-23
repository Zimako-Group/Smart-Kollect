// components/ManualPTP.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CalendarIcon, 
  CheckCircle, 
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useRedux } from "@/hooks/useRedux";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { 
  setAmount, 
  setDate, 
  setPaymentMethod, 
  setNotes
} from "@/lib/redux/features/ptp/ptpSlice";
import { createManualPTP } from "@/lib/manual-ptp-service";
import { toast } from "sonner";

interface ManualPTPProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  accountNumber: string;
  onPTPCreated?: (ptpData: any) => void; // Callback for when PTP is created
}

export default function ManualPTP({ 
  isOpen, 
  onClose, 
  customerId, 
  customerName, 
  accountNumber,
  onPTPCreated
}: ManualPTPProps) {
  const { dispatch, ptp } = useRedux();
  const { user } = useAuth();
  
  // Use the selectors to get the PTP state
  const formData = ptp.formData();
  const creating = ptp.creating();
  const createStatus = ptp.createStatus();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(formData.date ? new Date(formData.date) : undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // State to store the current user's ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset amount and notes
      dispatch(setAmount(''));
      dispatch(setNotes(''));
      
      // Reset date
      setSelectedDate(undefined);
      dispatch(setDate(null));
      
      // Set default payment method
      dispatch(setPaymentMethod('cash'));
    }
  }, [isOpen, dispatch]);

  // Get the current user's ID when the component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // First try to get user from localStorage where it's stored by AuthContext
        const storedUser = localStorage.getItem('zimako_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log('Found user ID in localStorage:', parsedUser.id);
            setCurrentUserId(parsedUser.id);
            return;
          }
        }
        
        // Fallback to session if localStorage doesn't have the user
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id || null;
        console.log('Current user ID from session:', userId);
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Handle creating Manual PTP
  const handleCreatePTP = async () => {
    try {
      if (!formData.amount) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      if (!formData.date) {
        toast.error('Please select a payment date');
        return;
      }
      
      // Create a loading state
      toast.loading('Creating manual PTP arrangement...');
      
      // Call the manual PTP service directly
      const ptpData = await createManualPTP({
        debtor_id: customerId,
        amount: parseFloat(formData.amount),
        date: formData.date,
        payment_method: formData.paymentMethod,
        notes: formData.notes || undefined,
        created_by: currentUserId
      });
      
      // Dismiss loading toast and show success
      toast.dismiss();
      toast.success('Manual PTP arrangement created successfully!');
      
      // Send SMS notification after successful PTP creation
      // Note: SMS functionality requires phone number from customer data
      // For ManualPTP, we'll need to fetch customer data to get phone number
      try {
        // Fetch customer data to get phone number
        const { data: customerData, error: customerError } = await supabase
          .from('Debtors')
          .select('cell_number')
          .eq('id', customerId)
          .single();
        
        const phoneNumber = customerData?.cell_number;
        
        if (phoneNumber) {
          const response = await fetch('/api/send-ptp-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerName: customerName,
              phoneNumber: phoneNumber,
              amount: parseFloat(formData.amount),
              paymentDate: format(new Date(formData.date), 'PPP'),
              paymentMethod: formData.paymentMethod,
              notes: formData.notes
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            toast.success('SMS confirmation sent to customer', {
              description: `Message sent to ${phoneNumber}`
            });
          } else {
            console.warn('SMS sending failed:', result.error);
            toast.warning('PTP created but SMS notification failed', {
              description: result.error || 'Unable to send SMS'
            });
          }
        } else {
          console.log('SMS notification skipped - no phone number available for customer');
          toast.info('Manual PTP created successfully', {
            description: 'SMS notification skipped - no phone number available'
          });
        }
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        toast.warning('PTP created but SMS notification failed', {
          description: 'Network error while sending SMS'
        });
      }
      
      // Notify parent component about the created PTP
      if (onPTPCreated && ptpData) {
        onPTPCreated(ptpData);
      }
      
      // Close the dialog
      onClose();
    } catch (error: any) {
      console.error('Error creating manual PTP:', error);
      toast.dismiss();
      toast.error(`Failed to create manual PTP: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-100">
            Create Manual PTP
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50 mb-4">
            <p className="text-sm text-slate-400 mb-1">Customer</p>
            <p className="text-base font-medium text-slate-100">{customerName}</p>
            <p className="text-xs text-slate-500">Account: {accountNumber}</p>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="amount" className="text-slate-300">Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => dispatch(setAmount(e.target.value))}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="date" className="text-slate-300">Payment Date</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-slate-200 ${!formData.date ? 'text-slate-500' : ''}`}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(new Date(formData.date), 'PPP') : 'Select date'}
                </Button>
                {isCalendarOpen && (
                  <div className="absolute z-10 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          dispatch(setDate(date.toISOString().split('T')[0]));
                        } else {
                          dispatch(setDate(null));
                        }
                        setIsCalendarOpen(false);
                      }}
                      className="bg-slate-900 text-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="paymentMethod" className="text-slate-300">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => dispatch(setPaymentMethod(value))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="easypay">EasyPay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-slate-300">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes here..."
                value={formData.notes}
                onChange={(e) => dispatch(setNotes(e.target.value))}
                className="bg-slate-800 border-slate-700 text-slate-200 min-h-[80px]"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePTP}
            disabled={creating || !formData.amount || !formData.date}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create PTP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}