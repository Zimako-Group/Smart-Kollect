// components/PTP.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Clock, 
  AlertCircle,
  Banknote,
  CreditCard,
  Calendar as CalendarIcon2,
  FileText,
  History,
  Filter,
  ArrowUpDown,
  Loader2,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRedux } from "@/hooks/useRedux";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { 
  closePTPInterface, 
  setAmount, 
  setDate, 
  setPaymentMethod, 
  setNotes, 
  createPTP,
  fetchPTPHistory,
  PTPArrangement
} from "@/lib/redux/features/ptp/ptpSlice";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/customer-service";
import { checkForDefaultedPTPs } from "@/lib/ptp-service";

interface PTPProps {
  onClose?: () => void;
}

export default function PTP({ onClose }: PTPProps) {
  const { dispatch, ptp } = useRedux();
  const { user } = useAuth(); // Get the authenticated user from AuthContext
  
  // Use the selectors to get the PTP state
  const isOpen = ptp.isOpen();
  const customer = ptp.customer();
  const formData = ptp.formData();
  const creating = ptp.creating();
  const createStatus = ptp.createStatus();
  const ptpHistory = ptp.history();
  const loadingHistory = ptp.loadingHistory();
  
  const [activeTab, setActiveTab] = useState("create");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(formData.date ? new Date(formData.date) : undefined);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPaymentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle closing the PTP dialog
  const handleClose = () => {
    dispatch(closePTPInterface());
    if (onClose) {
      onClose();
    }
  };
  
  // State to store the current user's ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  // Reset form state when dialog opens and fetch PTP history
  useEffect(() => {
    if (isOpen && customer.id) {
      setActiveTab("create");
      setSelectedDate(undefined);
      
      // Fetch PTP history when the dialog opens
      dispatch(fetchPTPHistory(customer.id));
      
      // Check for defaulted PTPs
      checkForDefaultedPTPs().catch(error => {
        console.error("Error checking for defaulted PTPs:", error);
      });
    }
  }, [isOpen, customer.id, dispatch]);
  
  // Update the Redux state when the date changes
  useEffect(() => {
    if (selectedDate) {
      dispatch(setDate(selectedDate.toISOString()));
    } else {
      dispatch(setDate(null));
    }
  }, [selectedDate, dispatch]);
  
  // Handle creating PTP
  const handleCreatePTP = () => {
    if (!formData.amount || !formData.date) {
      toast.error("Amount and date are required");
      return;
    }
    
    // Get the user ID from the authenticated user in AuthContext
    const authUserId = user?.id;
    
    // Use the user ID from AuthContext if available, otherwise fall back to currentUserId
    const userIdToUse = authUserId || currentUserId;
    
    // Log the user ID before creating PTP
    console.log('Creating PTP with user ID from AuthContext:', authUserId);
    console.log('Creating PTP with user ID from currentUserId:', currentUserId);
    console.log('Using user ID for PTP creation:', userIdToUse);
    
    // Pass the user ID explicitly
    dispatch(createPTP(userIdToUse))
      .unwrap()
      .then(async () => {
        toast.success("Promise To Pay arrangement created successfully");
        setSelectedDate(undefined);
        
        // Send SMS notification after successful PTP creation
        // Fetch customer data to get phone number from database
        if (formData.date) {
          try {
            // Fetch customer data to get cell_number
            const { data: customerData, error: customerError } = await supabase
              .from('Debtors')
              .select('cell_number')
              .eq('id', customer.id)
              .single();
            
            const phoneNumber = customerData?.cell_number;
            
            if (phoneNumber) {
              const response = await fetch('/api/send-ptp-sms', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customerName: customer.name,
                  phoneNumber: phoneNumber,
                  amount: parseFloat(formData.amount),
                  paymentDate: format(new Date(formData.date), 'PPP'),
                  paymentMethod: formData.paymentMethod,
                  notes: formData.notes
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                toast.success("SMS confirmation sent to customer", {
                  description: `Message sent to ${phoneNumber}`
                });
              } else {
                console.warn('SMS sending failed:', result.error);
                toast.warning("PTP created but SMS notification failed", {
                  description: result.error || 'Unable to send SMS'
                });
              }
            } else {
              console.log('SMS notification skipped - no phone number available for customer');
              toast.info("PTP created successfully", {
                description: "SMS notification skipped - no phone number available"
              });
            }
          } catch (smsError) {
            console.error('Error sending SMS:', smsError);
            toast.warning("PTP created but SMS notification failed", {
              description: 'Network error while sending SMS'
            });
          }
        } else {
          console.log('SMS notification skipped - no payment date available');
        }
      })
      .catch((error: string) => {
        toast.error(`Failed to create PTP: ${error}`);
      });
  };
  
  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "PPP");
    } catch (error) {
      return timestamp;
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-600/20 text-amber-400";
      case "paid":
        return "bg-green-600/20 text-green-400";
      case "defaulted":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };
  
  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Banknote className="h-4 w-4 mr-2" />;
      case "cash":
        return <Banknote className="h-4 w-4 mr-2" />;
      case "debit_order":
        return <CreditCard className="h-4 w-4 mr-2" />;
      case "credit_card":
        return <CreditCard className="h-4 w-4 mr-2" />;
      default:
        return <Banknote className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-700/50 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <DialogHeader className="relative px-6 pt-6 pb-4 border-b border-slate-700/50">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-green-600/5 to-emerald-600/10 rounded-t-lg"></div>
          <div className="relative flex items-center">
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-3 mr-4 border border-emerald-500/20 shadow-lg">
              <CalendarIcon className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-100 mb-1">
                Promise To Pay
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <div className="h-1 w-1 bg-emerald-400 rounded-full"></div>
                <p className="text-sm text-slate-300 font-medium">
                  {customer.name}
                </p>
                {customer.accountNumber && (
                  <>
                    <div className="h-1 w-1 bg-slate-500 rounded-full"></div>
                    <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                      {customer.accountNumber}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-800/30 to-slate-700/30 border-b border-slate-700/50">
            <TabsList className="bg-slate-800/60 h-11 p-1.5 rounded-xl border border-slate-700/50 shadow-inner">
              <TabsTrigger 
                value="create" 
                className="text-sm h-8 px-4 font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-600/20 data-[state=active]:text-emerald-100 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-emerald-500/30 rounded-lg"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Create PTP
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="text-sm h-8 px-4 font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-600/20 data-[state=active]:text-emerald-100 data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-emerald-500/30 rounded-lg"
              >
                <History className="h-4 w-4 mr-2" />
                PTP History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            {createStatus.success ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-emerald-50/5 to-green-50/5">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full p-4 border border-emerald-500/30 shadow-2xl">
                    <CheckCircle className="h-16 w-16 text-emerald-400 animate-bounce" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-3">
                  PTP Successfully Created!
                </h3>
                <p className="text-center text-slate-300 mb-8 max-w-md leading-relaxed">
                  A new Promise To Pay arrangement has been successfully created for{' '}
                  <span className="font-semibold text-emerald-400">{customer.name}</span>.
                </p>
                <div className="flex gap-4 w-full max-w-sm">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab("history");
                    }}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:border-emerald-500/50 transition-all duration-200"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                  <Button 
                    onClick={handleClose}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-slate-200 font-semibold flex items-center">
                      <div className="bg-emerald-500/20 rounded-lg p-1.5 mr-3 border border-emerald-500/30">
                        <Banknote className="h-4 w-4 text-emerald-400" />
                      </div>
                      Payment Amount
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">
                        R
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => dispatch(setAmount(e.target.value))}
                        className="pl-8 bg-slate-800/60 border-slate-600 text-slate-100 h-12 text-lg font-medium focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 shadow-inner"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="date" className="text-slate-200 font-semibold flex items-center">
                      <div className="bg-emerald-500/20 rounded-lg p-1.5 mr-3 border border-emerald-500/30">
                        <CalendarIcon className="h-4 w-4 text-emerald-400" />
                      </div>
                      Payment Date
                    </Label>
                    <div className="space-y-4">
                      <div className="flex items-center border rounded-xl border-slate-600 p-4 bg-slate-800/60 hover:bg-slate-800/80 transition-all duration-200 shadow-inner">
                        <div className="bg-emerald-500/20 rounded-lg p-2 mr-3 border border-emerald-500/30">
                          <CalendarIcon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-1">Selected Date</div>
                          <span className="text-slate-100 font-medium">
                            {selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : "Click calendar to select a date"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="w-full"
                          classNames={{
                            day_selected: "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:bg-gradient-to-r hover:from-emerald-600 hover:to-green-600 focus:bg-gradient-to-r focus:from-emerald-500 focus:to-green-500 font-semibold shadow-lg",
                            day_today: "bg-slate-700 text-slate-50 font-medium",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-700/50 transition-colors duration-150",
                            head_cell: "text-slate-400 rounded-md w-9 font-medium text-[0.8rem]",
                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-700/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            button: "h-9 w-9 p-0 font-normal",
                            nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-slate-700/50",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse",
                            head_row: "flex",
                            row: "flex w-full mt-2",
                            day_outside: "text-slate-500 opacity-50",
                            day_disabled: "text-slate-500 opacity-50",
                            day_range_middle: "aria-selected:bg-slate-700/50 aria-selected:text-slate-100",
                            day_hidden: "invisible",
                          }}
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="payment-method" className="text-slate-200 font-semibold flex items-center">
                      <div className="bg-emerald-500/20 rounded-lg p-1.5 mr-3 border border-emerald-500/30">
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                      </div>
                      Payment Method
                    </Label>
                    {/* Custom dropdown implementation to avoid focus scope conflicts */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-4 text-sm text-slate-100 shadow-inner hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <div className="bg-emerald-500/20 rounded-lg p-1.5 mr-3 border border-emerald-500/30">
                            {getPaymentMethodIcon(formData.paymentMethod)}
                          </div>
                          <div className="text-left">
                            <div className="text-xs text-slate-400 mb-1">Selected Method</div>
                            <span className="font-medium">
                              {formData.paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                              {formData.paymentMethod === 'cash' && 'Cash Payment'}
                              {formData.paymentMethod === 'debit_order' && 'Debit Order'}
                              {formData.paymentMethod === 'credit_card' && 'Credit Card'}
                              {!formData.paymentMethod && 'Select payment method'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isPaymentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isPaymentDropdownOpen && (
                        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/95 backdrop-blur-sm shadow-2xl">
                          <div className="p-2">
                            <button
                              type="button"
                              className="w-full flex items-center px-4 py-3 text-left text-sm hover:bg-slate-700/60 text-slate-100 rounded-lg transition-all duration-150 group"
                              onClick={() => {
                                dispatch(setPaymentMethod('bank_transfer'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              <div className="bg-blue-500/20 rounded-lg p-2 mr-3 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                                <Banknote className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium">Bank Transfer</div>
                                <div className="text-xs text-slate-400">Electronic bank payment</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="w-full flex items-center px-4 py-3 text-left text-sm hover:bg-slate-700/60 text-slate-100 rounded-lg transition-all duration-150 group"
                              onClick={() => {
                                dispatch(setPaymentMethod('cash'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              <div className="bg-green-500/20 rounded-lg p-2 mr-3 border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                                <Banknote className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium">Cash Payment</div>
                                <div className="text-xs text-slate-400">Physical cash payment</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="w-full flex items-center px-4 py-3 text-left text-sm hover:bg-slate-700/60 text-slate-100 rounded-lg transition-all duration-150 group"
                              onClick={() => {
                                dispatch(setPaymentMethod('debit_order'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              <div className="bg-purple-500/20 rounded-lg p-2 mr-3 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                                <CreditCard className="h-4 w-4 text-purple-400" />
                              </div>
                              <div>
                                <div className="font-medium">Debit Order</div>
                                <div className="text-xs text-slate-400">Automatic bank deduction</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="w-full flex items-center px-4 py-3 text-left text-sm hover:bg-slate-700/60 text-slate-100 rounded-lg transition-all duration-150 group"
                              onClick={() => {
                                dispatch(setPaymentMethod('credit_card'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              <div className="bg-orange-500/20 rounded-lg p-2 mr-3 border border-orange-500/30 group-hover:bg-orange-500/30 transition-colors">
                                <CreditCard className="h-4 w-4 text-orange-400" />
                              </div>
                              <div>
                                <div className="font-medium">Credit Card</div>
                                <div className="text-xs text-slate-400">Credit card payment</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-slate-200 font-semibold flex items-center">
                      <div className="bg-emerald-500/20 rounded-lg p-1.5 mr-3 border border-emerald-500/30">
                        <FileText className="h-4 w-4 text-emerald-400" />
                      </div>
                      Additional Notes
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => dispatch(setNotes(e.target.value))}
                        className="bg-slate-800/60 border-slate-600 text-slate-100 min-h-[100px] p-4 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 shadow-inner resize-none"
                        placeholder="Add any relevant details about this promise to pay arrangement..."
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                        {formData.notes.length}/500
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}

            {!createStatus.success && (
              <div className="p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm">
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => dispatch(closePTPInterface())}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:border-slate-500 transition-all duration-200 px-6"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePTP}
                    disabled={creating || !formData.amount || !selectedDate || !formData.paymentMethod}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 px-6"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating PTP...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create PTP
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
              {ptp.loadingHistory() ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-4" />
                  <p className="text-sm text-slate-400">Loading PTP history...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ptpHistory && ptpHistory.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-300">PTP History</h3>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Filter className="h-3 w-3 mr-1" /> Filter
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <ArrowUpDown className="h-3 w-3 mr-1" /> Sort
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {ptpHistory.map((item: PTPArrangement) => (
                          <div key={item.id} className="bg-slate-800/30 rounded-md p-3 border border-slate-800/80">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-slate-200">
                                    {formatCurrency(item.amount)}
                                  </h4>
                                  <Badge className={`ml-2 ${getStatusColor(item.status)} px-1.5 py-0 h-5 text-[10px]`}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-slate-400 mt-1">
                                  <CalendarIcon2 className="h-3 w-3 mr-1" /> 
                                  Due: {formatTimestamp(item.date)}
                                </div>
                              </div>
                              <div className="flex items-center text-xs text-slate-500">
                                <Clock className="h-3 w-3 mr-1" /> 
                                Created: {formatTimestamp(item.createdAt)}
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs text-slate-400 mt-2">
                              {getPaymentMethodIcon(item.paymentMethod)}
                              <span className="capitalize">{item.paymentMethod.replace('_', ' ')}</span>
                            </div>
                            
                            {item.notes && (
                              <div className="mt-2 pt-2 border-t border-slate-700/50">
                                <div className="flex items-start text-xs">
                                  <FileText className="h-3 w-3 mr-1 mt-0.5 text-slate-500" />
                                  <p className="text-slate-400">{item.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="bg-slate-800/50 rounded-full p-3 mb-3">
                        <History className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-300 mb-1">No PTP History</h3>
                      <p className="text-xs text-slate-500 text-center max-w-xs">
                        There are no Promise To Pay arrangements for this customer yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("create")}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                >
                  Create New PTP
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}