"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  Phone, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Wallet,
  Building,
  Landmark,
  Receipt
} from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { useDialer } from "@/contexts/DialerContext";
import { useAuth } from "@/contexts/AuthContext";
import * as settlementService from "@/lib/settlement-service";
import { Settlement } from "@/lib/settlement-service";

// Define the PTP types
type PaymentMethod = "Debit Order" | "Cash" | "Credit Card" | "EasyPay" | "EFT" | "Other";

// Define the PTP interface
interface PaymentDue {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: "pending" | "paid" | "failed";
  accountNumber?: string;
}

// Props for the PaymentsDue component
interface PaymentsDueProps {
  onClose: () => void;
}

// Empty array for initial state
const emptyPaymentsDue: PaymentDue[] = [];

// Add CSS for animations
const animationStyles = `
@keyframes pulse-subtle {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s infinite ease-in-out;
}

@keyframes slide-in {
  0% { transform: translateX(-10px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
`;

const PaymentsDue: React.FC<PaymentsDueProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState<PaymentDue[]>(emptyPaymentsDue);
  const [filteredPayments, setFilteredPayments] = useState<PaymentDue[]>(emptyPaymentsDue);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "failed">("all");
  const [paidPayments, setPaidPayments] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { setIsDialerOpen, setCurrentCustomer } = useDialer();
  const { user } = useAuth();

  // Convert settlement to PaymentDue format
  const convertSettlementToPaymentDue = (settlement: Settlement): PaymentDue => {
    return {
      id: settlement.id,
      customerName: settlement.customer_name,
      customerPhone: "", // Settlements don't have phone numbers
      amount: settlement.settlement_amount,
      dueDate: new Date(settlement.expiry_date),
      paymentMethod: "EFT" as PaymentMethod, // Default payment method
      notes: settlement.description || `Settlement with ${settlement.discount_percentage}% discount`,
      status: settlement.status.toLowerCase() as "pending" | "paid" | "failed",
      accountNumber: settlement.account_number
    };
  };

  // Fetch settlements for the logged-in agent
  useEffect(() => {
    const fetchSettlements = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get the agent's full name from user metadata
        const agentName = user.user_metadata?.full_name;
        
        if (!agentName) {
          console.error('Agent name not found in user metadata');
          setIsLoading(false);
          return;
        }
        
        const settlementsData = await settlementService.getSettlementsByAgentName(agentName);
        
        // Convert settlements to PaymentDue format
        const paymentDueData = settlementsData.map(convertSettlementToPaymentDue);
        
        setPayments(paymentDueData);
        setFilteredPayments(paymentDueData);
        console.log('Fetched settlements:', paymentDueData);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        toast.error('Failed to load settlements');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettlements();
  }, [user]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format time to display
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Get payment status based on time
  const getPaymentStatus = useCallback((payment: PaymentDue) => {
    if (paidPayments.includes(payment.id)) return "paid";
    
    const diffMins = differenceInMinutes(payment.dueDate, currentTime);
    
    if (diffMins < -60) return "overdue";
    if (diffMins >= -60 && diffMins <= 60) return "due-now";
    return "upcoming";
  }, [currentTime, paidPayments]);

  // Get time proximity text
  const getTimeProximityText = useCallback((dueDate: Date) => {
    const diffMins = differenceInMinutes(dueDate, currentTime);
    
    if (diffMins < -60) {
      const hours = Math.abs(Math.floor(diffMins / 60));
      return `${hours} hour${hours !== 1 ? 's' : ''} overdue`;
    } else if (diffMins < 0) {
      return `${Math.abs(diffMins)} minutes overdue`;
    } else if (diffMins < 60) {
      return `due in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `due in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }, [currentTime]);

  // Count payments by status
  const countByStatus = useCallback((status: "overdue" | "due-now" | "upcoming") => {
    return filteredPayments.filter(payment => 
      !paidPayments.includes(payment.id) && 
      getPaymentStatus(payment) === status
    ).length;
  }, [filteredPayments, paidPayments, getPaymentStatus]);

  // Calculate total amount by status
  const totalAmountByStatus = useCallback((status: "overdue" | "due-now" | "upcoming" | "all") => {
    return filteredPayments
      .filter(payment => 
        status === "all" 
          ? !paidPayments.includes(payment.id)
          : !paidPayments.includes(payment.id) && getPaymentStatus(payment) === status
      )
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [filteredPayments, paidPayments, getPaymentStatus]);

  // Handle marking a payment as paid
  const handleMarkPaid = async (payment: PaymentDue) => {
    try {
      // Update the settlement status in the database
      await settlementService.updateSettlement(payment.id, { status: 'paid' });
      
      // Update local state
      setPaidPayments(prev => [...prev, payment.id]);
      
      // Update the payments list
      setPayments(prev => prev.map(p => 
        p.id === payment.id ? { ...p, status: 'paid' } : p
      ));
      
      toast.success(`Marked payment for ${payment.customerName} as paid`);
    } catch (error) {
      console.error('Error marking settlement as paid:', error);
      toast.error('Failed to update payment status');
    }
  };

  // Handle calling a customer
  const handleCallCustomer = (payment: PaymentDue) => {
    // Set the current customer in the dialer context
    setCurrentCustomer({
      id: payment.id,
      name: payment.customerName,
      phone: payment.customerPhone,
      balance: payment.amount,
      status: "ptp"
    });
    // Open the dialer
    setIsDialerOpen(true);
    // Close the PaymentsDue modal
    onClose();
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter payments based on search term and status filter
  useEffect(() => {
    let filtered = [...payments];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.customerName.toLowerCase().includes(search) ||
        payment.accountNumber?.toLowerCase().includes(search) ||
        payment.notes?.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  // Handle status filter change
  const handleStatusFilterChange = (status: "all" | "pending" | "paid" | "failed") => {
    setStatusFilter(status);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  // Get payment method badge color and icon
  const getPaymentMethodInfo = (method: PaymentMethod) => {
    switch (method) {
      case "Debit Order": 
        return {
          color: "bg-blue-600 hover:bg-blue-700",
          icon: <Building className="h-3 w-3 mr-1" />
        };
      case "Cash": 
        return {
          color: "bg-green-600 hover:bg-green-700",
          icon: <Wallet className="h-3 w-3 mr-1" />
        };
      case "Credit Card": 
        return {
          color: "bg-purple-600 hover:bg-purple-700",
          icon: <CreditCard className="h-3 w-3 mr-1" />
        };
      case "EasyPay": 
        return {
          color: "bg-orange-600 hover:bg-orange-700",
          icon: <Receipt className="h-3 w-3 mr-1" />
        };
      case "EFT": 
        return {
          color: "bg-cyan-600 hover:bg-cyan-700",
          icon: <Landmark className="h-3 w-3 mr-1" />
        };
      default: 
        return {
          color: "bg-gray-600 hover:bg-gray-700",
          icon: <Wallet className="h-3 w-3 mr-1" />
        };
    }
  };

  // Get status icon
  const getStatusIcon = (status: "overdue" | "due-now" | "upcoming" | "paid") => {
    switch (status) {
      case "overdue": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "due-now": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "upcoming": return <Clock className="h-4 w-4 text-blue-500" />;
      case "paid": return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="flex flex-col space-y-4 w-full max-w-4xl mx-auto">
          <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden w-full">
            <CardHeader className="border-b border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  My Settlements Due
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')} • Manage your personal settlement collections
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search by name, phone, account number or payment method..."
                    className="pl-9 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-500"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="rounded-full bg-slate-800/50 p-4 mb-4 animate-pulse-subtle">
                    <Receipt className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-300 mb-2">Loading settlements...</h3>
                  <p className="text-slate-400 max-w-md">
                    Please wait while we fetch your settlement data.
                  </p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="rounded-full bg-slate-800/50 p-4 mb-4">
                    <Receipt className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-300 mb-2">No settlements found</h3>
                  <p className="text-slate-400 max-w-md">
                    There are no settlements due for your accounts.
                  </p>
                </div>
              ) : (
                filteredPayments.map((payment, index) => {
                  const status = paidPayments.includes(payment.id) ? "paid" : getPaymentStatus(payment);
                  const { color, icon } = getPaymentMethodInfo(payment.paymentMethod);
                  
                  return (
                    <div 
                      key={payment.id}
                      className={`
                        relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border 
                        ${status === "paid" 
                          ? "bg-green-900/20 border-green-800/50" 
                          : status === "overdue" 
                            ? "bg-red-900/20 border-red-800/50" 
                            : status === "due-now" 
                              ? "bg-amber-900/20 border-amber-800/50" 
                              : "bg-blue-900/20 border-blue-800/50"
                        }
                        ${status === "due-now" && !paidPayments.includes(payment.id) ? "animate-pulse-subtle" : ""}
                        animate-slide-in
                      `}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Left border indicator */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                          ${status === "paid" 
                            ? "bg-green-500" 
                            : status === "overdue" 
                              ? "bg-red-500" 
                              : status === "due-now" 
                                ? "bg-amber-500" 
                                : "bg-blue-500"
                          }
                        `}
                      />
                      
                      {/* Customer initials */}
                      <div 
                        className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                          ${status === "paid" 
                            ? "bg-green-800/50 text-green-200" 
                            : status === "overdue" 
                              ? "bg-red-800/50 text-red-200" 
                              : status === "due-now" 
                                ? "bg-amber-800/50 text-amber-200" 
                                : "bg-blue-800/50 text-blue-200"
                          }
                        `}
                      >
                        {payment.customerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      {/* Customer info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                            {payment.customerName}
                            <span className="inline-flex items-center">
                              {getStatusIcon(status)}
                            </span>
                          </h4>
                          <div className="text-sm text-slate-400">{payment.customerPhone}</div>
                        </div>
                        <div className="mt-1 text-sm text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span>{payment.notes}</span>
                          {payment.accountNumber && (
                            <span className="text-slate-500 text-xs">
                              Account: {payment.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Payment details */}
                      <div className="flex flex-col items-end gap-1 mt-2 sm:mt-0">
                        <div className="text-xl font-bold">{formatCurrency(payment.amount)}</div>
                        <Badge className={`${color} text-white flex items-center`}>
                          {icon}
                          {payment.paymentMethod}
                        </Badge>
                      </div>
                      
                      {/* Time and actions */}
                      <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium">
                            {formatTime(payment.dueDate)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {getTimeProximityText(payment.dueDate)}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleCallCustomer(payment)}
                          >
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            Call
                          </Button>
                          {!paidPayments.includes(payment.id) && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-green-700 text-green-400 hover:bg-green-900/30"
                              onClick={() => handleMarkPaid(payment)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
            
            <CardFooter className="border-t border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400 flex justify-between items-center">
              <div>
                Showing {filteredPayments.length} of {payments.length} settlements
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last updated: {format(currentTime, 'h:mm a')}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentsDue;
