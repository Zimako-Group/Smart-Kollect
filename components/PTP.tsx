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
  ChevronDown
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
      .then(() => {
        toast.success("Promise To Pay arrangement created successfully");
        setSelectedDate(undefined);
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
      <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-slate-800">
          <div className="flex items-center">
            <div className="bg-green-600/20 rounded-full p-2 mr-3">
              <CalendarIcon className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-100">
                Promise To Pay
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer: {customer.name} {customer.accountNumber ? `(${customer.accountNumber})` : ""}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 border-b border-slate-800">
            <TabsList className="bg-slate-800/50 h-9 p-1">
              <TabsTrigger value="create" className="text-xs h-7 px-3 data-[state=active]:bg-green-600/20 data-[state=active]:text-green-100">
                Create PTP
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7 px-3 data-[state=active]:bg-green-600/20 data-[state=active]:text-green-100">
                PTP History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            {createStatus.success ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-100 mb-2">PTP Successfully Created</h3>
                <p className="text-center text-slate-300 mb-6">
                  A new Promise To Pay arrangement has been created for {customer.name}.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab("history");
                    }}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                  <Button 
                    onClick={handleClose}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="text-slate-300">
                      Amount (R)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => dispatch(setAmount(e.target.value))}
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-slate-300">
                      Payment Date
                    </Label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center border rounded-md border-slate-700 p-2 bg-slate-800/50">
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">
                          {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                        </span>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="border border-slate-700 rounded-md bg-slate-800"
                        classNames={{
                          day_selected: "bg-green-600 text-slate-50",
                          day_today: "bg-slate-700 text-slate-50",
                        }}
                        disabled={(date) => date < new Date()}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="payment-method" className="text-slate-300">
                      Payment Method
                    </Label>
                    {/* Custom dropdown implementation to avoid focus scope conflicts */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-600"
                      >
                        <span>
                          {formData.paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                          {formData.paymentMethod === 'cash' && 'Cash'}
                          {formData.paymentMethod === 'debit_order' && 'Debit Order'}
                          {formData.paymentMethod === 'credit_card' && 'Credit Card'}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>
                      
                      {isPaymentDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-700 bg-slate-800 shadow-lg">
                          <div className="py-1">
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700 text-slate-100"
                              onClick={() => {
                                dispatch(setPaymentMethod('bank_transfer'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              Bank Transfer
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700 text-slate-100"
                              onClick={() => {
                                dispatch(setPaymentMethod('cash'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              Cash
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700 text-slate-100"
                              onClick={() => {
                                dispatch(setPaymentMethod('debit_order'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              Debit Order
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700 text-slate-100"
                              onClick={() => {
                                dispatch(setPaymentMethod('credit_card'));
                                setIsPaymentDropdownOpen(false);
                              }}
                            >
                              Credit Card
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-slate-300">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => dispatch(setNotes(e.target.value))}
                      className="bg-slate-800/50 border-slate-700 text-slate-100 min-h-[80px]"
                      placeholder="Add any relevant details about this promise to pay..."
                    />
                  </div>
                </div>
              </ScrollArea>
            )}

            {!createStatus.success && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => dispatch(closePTPInterface())}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePTP}
                    disabled={!formData.amount || !formData.date || creating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" /> Create PTP
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