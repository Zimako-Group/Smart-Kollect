"use client";

import React, { useState, useEffect } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  X, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Wallet,
  Building,
  Landmark,
  Receipt,
  Info,
  Check,
  Loader,
  Banknote,
  Smartphone
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { useDialer } from "@/contexts/DialerContext";
import { useAuth } from "@/contexts/AuthContext";
import * as settlementService from "@/lib/settlement-service";
import { Settlement } from "@/lib/settlement-service";
import { cn } from "@/lib/utils";

// Define payment method types
type PaymentMethod = "Debit Order" | "Cash" | "Credit Card" | "EasyPay" | "EFT" | "Other";

// Define the payment interface
interface PaymentDue {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: "paid" | "overdue" | "due-now" | "upcoming";
  accountNumber?: string;
}

// Props for the PaymentsDue component
interface PaymentsDueProps {
  onClose: () => void;
}

// CSS animations
const animationStyles = `
  @keyframes pulse-subtle {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
  
  @keyframes slide-in {
    0% { transform: translateX(-10px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
  
  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
  
  @keyframes scale-in {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
  
  @keyframes glow {
    0% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
    50% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
    100% { box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
  }
  .animate-glow { animation: glow 2s infinite ease-in-out; }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
  }
  
  .glass-effect {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .hover-scale {
    transition: transform 0.2s ease;
  }
  .hover-scale:hover {
    transform: scale(1.02);
  }
`;

const PaymentsDue: React.FC<PaymentsDueProps> = ({ onClose }) => {
  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState<PaymentDue[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentDue[]>([]);
  const [paidPayments, setPaidPayments] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  // Contexts
  const { setIsDialerOpen, setCurrentCustomer } = useDialer();
  const { user } = useAuth();

  // Convert a settlement to a payment due object
  const convertSettlementToPaymentDue = (settlement: Settlement): PaymentDue => {
    // Map settlement status to PaymentDue status
    let paymentStatus: "overdue" | "due-now" | "upcoming" | "paid";
    
    switch(settlement.status.toLowerCase()) {
      case "paid":
        paymentStatus = "paid";
        break;
      case "pending":
        // Determine if pending is overdue, due-now, or upcoming based on date
        const today = new Date();
        const expiryDate = new Date(settlement.expiry_date);
        const daysDiff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) {
          paymentStatus = "overdue";
        } else if (daysDiff <= 3) {
          paymentStatus = "due-now";
        } else {
          paymentStatus = "upcoming";
        }
        break;
      case "failed":
        paymentStatus = "overdue"; // Treat failed as overdue
        break;
      default:
        paymentStatus = "upcoming"; // Default fallback
    }
    
    return {
      id: settlement.id,
      customerName: settlement.customer_name,
      customerPhone: "", // Settlements don't have phone numbers
      amount: settlement.settlement_amount,
      dueDate: new Date(settlement.expiry_date),
      paymentMethod: "EFT" as PaymentMethod, // Default payment method
      notes: settlement.description || `Settlement with ${settlement.discount_percentage}% discount`,
      status: paymentStatus,
      accountNumber: settlement.account_number
    };
  };

  // Fetch settlements for the logged-in agent
  useEffect(() => {
    const fetchSettlements = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Try multiple sources to get the agent name
        let agentName = user.user_metadata?.full_name;
        
        // If full_name is not available, try other potential sources
        if (!agentName) {
          // Try name from user metadata
          agentName = user.user_metadata?.name;
          
          // Try email as fallback (remove @domain.com)
          if (!agentName && user.email) {
            agentName = user.email.split('@')[0];
            // Convert email format (e.g., john.doe) to name format (John Doe)
            agentName = agentName
              .split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          }
          
          // If we still don't have a name, use the user ID as last resort
          if (!agentName) {
            agentName = user.id;
            console.warn('Using user ID as agent name fallback');
          }
        }
        
        const settlementsData = await settlementService.getSettlementsByAgentName(agentName);
        
        // Convert settlements to PaymentDue format
        const paymentDueData = settlementsData.map(convertSettlementToPaymentDue);
        
        setPayments(paymentDueData);
        setFilteredPayments(paymentDueData);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        toast.error('Failed to load settlements');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettlements();
    
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, [user]);
  
  // Filter payments based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPayments(payments);
      return;
    }
    
    const search = searchTerm.toLowerCase();
    const filtered = payments.filter(payment => 
      payment.customerName.toLowerCase().includes(search) ||
      payment.accountNumber?.toLowerCase().includes(search) ||
      payment.notes?.toLowerCase().includes(search)
    );
    
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);
  
  // Format time to display
  const formatTime = (date: Date) => {
    return format(date, 'MMM d, h:mm a');
  };
  
  // Get payment status based on due date
  const getPaymentStatus = (payment: PaymentDue): "overdue" | "due-now" | "upcoming" | "paid" => {
    // If payment is already marked as paid in state, return paid
    if (paidPayments.includes(payment.id) || payment.status === "paid") return "paid";
    
    const now = new Date();
    const dueDate = new Date(payment.dueDate);
    
    // Check if payment is overdue
    if (dueDate < now) return "overdue";
    
    // Check if payment is due within the next 24 hours
    const diffMinutes = differenceInMinutes(dueDate, now);
    if (diffMinutes <= 24 * 60) return "due-now";
    
    // Otherwise, payment is upcoming
    return "upcoming";
  };
  
  // Handle marking a payment as paid
  const handleMarkPaid = async (payment: PaymentDue) => {
    try {
      toast.loading('Marking settlement as paid...');
      
      // Update the settlement status in the database
      await settlementService.updateSettlement(payment.id, { status: 'paid' });
      
      // Update local state
      setPaidPayments(prev => [...prev, payment.id]);
      
      toast.success(`Payment for ${payment.customerName} marked as paid`);
    } catch (error) {
      console.error('Error marking settlement as paid:', error);
      toast.error('Failed to update payment status');
    }
  };
  
  // Handle calling a customer
  const handleCallCustomer = (payment: PaymentDue) => {
    // Set the current customer in the dialer context
    setCurrentCustomer({
      id: payment.id, // Add required id property
      name: payment.customerName,
      phone: payment.customerPhone || "",
      acc_number: payment.accountNumber || "",
    });
    
    // Open the dialer
    setIsDialerOpen(true);
    
    // Close the PaymentsDue modal
    onClose();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;  
  };
  
  // Get payment method badge color and icon
  const getPaymentMethodInfo = (method: PaymentMethod) => {
    switch (method) {
      case "Debit Order":
        return {
          color: "bg-blue-600",
          icon: <CreditCard className="h-3 w-3 mr-1" />
        };
      case "Cash":
        return {
          color: "bg-green-600",
          icon: <Wallet className="h-3 w-3 mr-1" />
        };
      case "Credit Card":
        return {
          color: "bg-purple-600",
          icon: <CreditCard className="h-3 w-3 mr-1" />
        };
      case "EasyPay":
        return {
          color: "bg-amber-600",
          icon: <Building className="h-3 w-3 mr-1" />
        };
      case "EFT":
        return {
          color: "bg-cyan-600",
          icon: <Landmark className="h-3 w-3 mr-1" />
        };
      default: 
        return {
          color: "bg-gray-600",
          icon: <Wallet className="h-3 w-3 mr-1" />
        };
    }
  };

  // Get status icon
  const getStatusIcon = (status: "overdue" | "due-now" | "upcoming" | "paid") => {
    switch (status) {
      case "overdue": return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "due-now": return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      case "upcoming": return <Clock className="h-3 w-3 text-blue-500" />;
      case "paid": return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 backdrop-blur-md animate-fade-in">
        <div className="flex flex-col w-full max-w-3xl mx-auto max-h-[90vh] animate-scale-in">
          <Card className="glass-effect border-slate-700/50 shadow-xl overflow-hidden w-full flex flex-col max-h-[90vh] rounded-xl">
            {/* Header */}
            <CardHeader className="border-b border-slate-700/50 bg-gradient-to-r from-slate-900/90 to-slate-800/90 p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="bg-blue-600/20 p-1.5 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    My Settlements Due
                  </span>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-row gap-3 items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse-subtle"></div>
                  <p className="text-xs text-blue-200/80 font-medium">
                    {format(new Date(), 'MMM d, yyyy')} • <span className="text-white">{filteredPayments.length}</span> settlements
                  </p>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-md blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-blue-400/80 group-hover:text-blue-300 transition-colors duration-200" />
                      <Input
                        type="text"
                        placeholder="Search settlements..."
                        className="h-7 text-xs pl-8 pr-7 py-1 bg-slate-800/70 border-slate-700/50 text-slate-200 placeholder:text-slate-400 rounded-md focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 group-hover:bg-slate-800/90"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button 
                          className="absolute right-2 top-1.5 bg-slate-700/50 rounded-full p-0.5 hover:bg-slate-700 transition-colors duration-200"
                          onClick={() => setSearchTerm('')}
                        >
                          <X className="h-2.5 w-2.5 text-slate-300" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Content */}
            <CardContent className="p-0 overflow-y-auto max-h-[60vh] bg-gradient-to-b from-slate-900/90 to-slate-950/90">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/30 to-purple-500/30 blur-md animate-pulse-subtle"></div>
                    <div className="rounded-full bg-slate-800/70 p-4 relative z-10">
                      <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                    </div>
                  </div>
                  <p className="text-lg font-medium bg-gradient-to-r from-blue-100 to-blue-300 bg-clip-text text-transparent mb-2">Loading payments...</p>
                  <p className="text-sm text-blue-200/60">Please wait while we fetch your data</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="relative mb-4 p-3 rounded-full bg-slate-800/50">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-700/30 to-slate-600/30 blur-sm"></div>
                    <Receipt className="h-10 w-10 text-slate-400 animate-pulse-subtle" />
                  </div>
                  <p className="text-slate-300 font-medium bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">No payments found</p>
                  {searchTerm && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-800/50 px-3 py-1.5 rounded-full">Try adjusting your search criteria</p>
                  )}
                </div>
              ) : (
                <div className="p-3 space-y-2.5">
                  {filteredPayments.map((payment, index) => {
                    const status = getPaymentStatus(payment);
                    const { color, icon } = getPaymentMethodInfo(payment.paymentMethod);
                    const isPaid = status === "paid" || paidPayments.includes(payment.id);
                    const initials = payment.customerName.split(' ').map(n => n[0]).join('');
                    
                    // Define status-based styles
                    const statusStyles = {
                      paid: {
                        container: "glass-effect border-green-700/30 shadow-md shadow-green-900/10",
                        indicator: "bg-gradient-to-b from-green-400 to-green-600",
                        avatar: "bg-gradient-to-br from-green-700 to-green-900 ring-1 ring-green-400/30 shadow-md",
                        text: "text-green-300",
                        badge: "bg-green-900/40 border-green-700/30 text-green-300"
                      },
                      overdue: {
                        container: "glass-effect border-red-700/30 shadow-md shadow-red-900/10",
                        indicator: "bg-gradient-to-b from-red-400 to-red-600",
                        avatar: "bg-gradient-to-br from-red-700 to-red-900 ring-1 ring-red-400/30 shadow-md",
                        text: "text-red-300",
                        badge: "bg-red-900/40 border-red-700/30 text-red-300"
                      },
                      "due-now": {
                        container: "glass-effect border-amber-700/30 shadow-md shadow-amber-900/10",
                        indicator: "bg-gradient-to-b from-amber-400 to-amber-600",
                        avatar: "bg-gradient-to-br from-amber-700 to-amber-900 ring-1 ring-amber-400/30 shadow-md",
                        text: "text-amber-300",
                        badge: "bg-amber-900/40 border-amber-700/30 text-amber-300"
                      },
                      upcoming: {
                        container: "glass-effect border-blue-700/30 shadow-md shadow-blue-900/10",
                        indicator: "bg-gradient-to-b from-blue-400 to-blue-600",
                        avatar: "bg-gradient-to-br from-blue-700 to-blue-900 ring-1 ring-blue-400/30 shadow-md",
                        text: "text-blue-300",
                        badge: "bg-blue-900/40 border-blue-700/30 text-blue-300"
                      }
                    };
                    
                    const styles = statusStyles[isPaid ? "paid" : status];
                    
                    return (
                      <div 
                        key={payment.id}
                        className={`
                          relative flex flex-row items-center gap-3 p-3 rounded-xl 
                          ${styles.container}
                          ${status === "due-now" && !isPaid ? "animate-pulse-subtle" : ""}
                          hover-scale animate-scale-in
                        `}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Left border indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${styles.indicator}`} />
                        
                        {/* Customer avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${styles.avatar}`}>
                          {initials}
                        </div>
                        
                        {/* Customer info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-white text-xs flex items-center gap-1.5 truncate">
                              {payment.customerName}
                              <span className="inline-flex items-center">
                                {getStatusIcon(status)}
                              </span>
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-300 truncate">{payment.accountNumber}</span>
                            {payment.notes && (
                              <div className="bg-slate-700/30 rounded-full p-0.5">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <Info className="h-2.5 w-2.5 text-blue-300" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs bg-slate-800 border-slate-700 shadow-xl max-w-[200px]">
                                      {payment.notes}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Payment details */}
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="text-xs font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            {formatCurrency(payment.amount)}
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 h-auto font-medium rounded-md",
                                payment.status === "paid" && "bg-gradient-to-r from-green-600/30 to-green-500/30 text-green-200 border border-green-500/20 hover:from-green-600/40 hover:to-green-500/40",
                                payment.status === "overdue" && "bg-gradient-to-r from-red-600/30 to-red-500/30 text-red-200 border border-red-500/20 hover:from-red-600/40 hover:to-red-500/40",
                                payment.status === "due-now" && "bg-gradient-to-r from-amber-600/30 to-amber-500/30 text-amber-200 border border-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/40",
                                payment.status === "upcoming" && "bg-gradient-to-r from-blue-600/30 to-blue-500/30 text-blue-200 border border-blue-500/20 hover:from-blue-600/40 hover:to-blue-500/40"
                              )}
                            >
                              <div className="flex items-center gap-0.5">
                                {payment.status === "paid" && <Check className="h-2 w-2" />}
                                {payment.status === "overdue" && <AlertTriangle className="h-2 w-2" />}
                                {payment.status === "due-now" && <AlertCircle className="h-2 w-2" />}
                                {payment.status === "upcoming" && <Calendar className="h-2 w-2" />}
                                <span>
                                  {payment.status === "paid" && "Paid"}
                                  {payment.status === "overdue" && "Overdue"}
                                  {payment.status === "due-now" && "Due Now"}
                                  {payment.status === "upcoming" && "Upcoming"}
                                </span>
                              </div>
                            </Badge>
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 h-auto font-medium rounded-md",
                                payment.paymentMethod.toLowerCase() === "credit card" && "bg-gradient-to-r from-purple-600/30 to-purple-500/30 text-purple-200 border border-purple-500/20 hover:from-purple-600/40 hover:to-purple-500/40",
                                payment.paymentMethod.toLowerCase() === "cash" && "bg-gradient-to-r from-emerald-600/30 to-emerald-500/30 text-emerald-200 border border-emerald-500/20 hover:from-emerald-600/40 hover:to-emerald-500/40",
                                payment.paymentMethod.toLowerCase() === "eft" && "bg-gradient-to-r from-blue-600/30 to-blue-500/30 text-blue-200 border border-blue-500/20 hover:from-blue-600/40 hover:to-blue-500/40",
                                payment.paymentMethod.toLowerCase() === "easypay" && "bg-gradient-to-r from-cyan-600/30 to-cyan-500/30 text-cyan-200 border border-cyan-500/20 hover:from-cyan-600/40 hover:to-cyan-500/40"
                              )}
                            >
                              <div className="flex items-center gap-0.5">
                                {payment.paymentMethod.toLowerCase() === "credit card" && <CreditCard className="h-2 w-2" />}
                                {payment.paymentMethod.toLowerCase() === "cash" && <Banknote className="h-2 w-2" />}
                                {payment.paymentMethod.toLowerCase() === "eft" && <Building className="h-2 w-2" />}
                                {payment.paymentMethod.toLowerCase() === "easypay" && <Smartphone className="h-2 w-2" />}
                                {payment.paymentMethod.toLowerCase() === "debit order" && <Landmark className="h-2 w-2" />}
                                {payment.paymentMethod.toLowerCase() === "other" && <Wallet className="h-2 w-2" />}
                                <span>
                                  {payment.paymentMethod}
                                </span>
                              </div>
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1.5">
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white h-7 text-[10px] px-2.5 rounded-md shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105"
                            onClick={() => handleCallCustomer(payment)}
                          >
                            <div className="bg-blue-500/30 p-1 rounded-full mr-1.5">
                              <Phone className="h-2.5 w-2.5" />
                            </div>
                            Call
                          </Button>
                          {!isPaid ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-gradient-to-r from-green-900/40 to-green-800/40 border-green-700/50 text-green-300 hover:bg-green-800/60 h-7 text-[10px] px-2.5 rounded-md shadow-lg hover:shadow-green-500/20 transition-all duration-300 hover:scale-105"
                              onClick={() => handleMarkPaid(payment)}
                            >
                              <div className="bg-green-500/30 p-1 rounded-full mr-1.5">
                                <CheckCircle className="h-2.5 w-2.5" />
                              </div>
                              Mark Paid
                            </Button>
                          ) : (
                            <div className="bg-gradient-to-r from-green-600/30 to-green-500/30 border border-green-500/30 text-green-200 h-7 px-2.5 flex items-center gap-1.5 rounded-md shadow-lg">
                              <div className="bg-green-500/30 p-1 rounded-full">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                              <span className="text-[10px] font-medium">Paid</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            
            {/* Footer */}
            <CardFooter className="border-t border-slate-700/30 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-2.5 text-xs flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <span className="text-blue-200/80 font-medium">
                  Showing <span className="text-white">{filteredPayments.length}</span> of <span className="text-white">{payments.length}</span> settlements
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-200/80">
                <div className="bg-blue-900/30 p-1 rounded-md">
                  <Clock className="h-3 w-3 text-blue-400" />
                </div>
                <span className="font-medium">Updated: <span className="text-white">{format(currentTime, 'h:mm a')}</span></span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentsDue;