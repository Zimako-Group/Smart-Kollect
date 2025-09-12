"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { getCustomerById, formatCurrency, formatDate, Customer } from "@/lib/customer-service";
import { createActivityNotification } from "@/lib/notification-service";
import { useAppDispatch } from "@/lib/redux/store";
import { openDialog as openPaymentHistoryDialog } from "@/lib/redux/features/payment-history/paymentHistorySlice";
import PaymentHistoryDialog from "@/components/PaymentHistoryDialog";
import AIAnalysisFeedback from "@/components/AIAnalysisFeedback";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Banknote, 
  Building, 
  User, 
  Calendar, 
  ArrowLeft, 
  MessageSquare, 
  PieChart, 
  Wallet, 
  FileCheck, 
  FileClock, 
  FileWarning, 
  BarChart3, 
  Filter,
  ChevronDown,
  RefreshCw,
  ArrowRight,
  FileEdit,
  DollarSign,
  UserCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Flag,
  History,
  Scale,
  AlertCircle,
  Home,
  CreditCard,
  MapPin,
  CalendarX,
  Pencil,
  MessageCircle,
  Brain,
  Sparkles,
  Target,
  Zap,
  Lightbulb
} from "lucide-react";
import { useRedux } from "@/hooks/useRedux";
import { Progress } from "@/components/ui/progress";
import { EmailInterface } from "@/components/EmailInterface";
import { openEmailInterface } from "@/lib/redux/features/email/emailSlice";
import SMSInterface from "@/components/SMSInterface";
import { openSMSInterface } from "@/lib/redux/features/sms/smsSlice";
import { openPTPInterface } from "@/lib/redux/features/ptp/ptpSlice";
import { openRTPInterface } from "@/lib/redux/features/rtp/rtpSlice";
import { openDialog as openFlagsDialog, fetchCustomerFlags } from "@/lib/redux/features/flags/flagsSlice";
import { openDialog as openChatDialog } from "@/lib/redux/features/chat/chatSlice";
import { openDialog as openNotesDialog } from "@/lib/redux/features/notes/notesSlice";
import { openDialer, startCall } from "@/lib/redux/features/dialer/dialerSlice";
import PTP from "@/components/PTP";
import RTP from "@/components/RTP";
import FlagsInterface from "@/components/FlagsInterface";
import ChatInterface from "@/components/ChatInterface";
import NotesInterface from "@/components/NotesInterface";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import ManualPTP from "@/components/ManualPTP";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extended interface for University of Venda specific customer data
// This interface extends the base Customer interface with University of Venda specific fields
interface UnivenCustomer extends Customer {
  // University of Venda specific fields
  interest_rate?: number | null;
  interest_date?: string | null;
  in_duplum?: string | null;
  masked_client_reference?: string | null;
  client?: string | null;
  client_group?: string | null;
  status?: string | null;
  status_date?: string | null;
  debtor_under_dc?: string | null;
  debtor_status_date?: string | null;
  days_overdue?: number | null;
  client_division?: string | null;
  old_client_ref?: string | null;
  client_profile_account?: string | null;
  easypay_reference?: string | null;
  original_cost?: number | null;
  capital_on_default?: number | null;
  hand_over_date?: string | null;
  hand_over_amount?: number | null;
  payments_to_date?: number | null;
  interest_to_date?: number | null;
  adjustments_to_date?: number | null;
  fees_and_expenses?: number | null;
  collection_commission?: number | null;
  fcc_excl_vat?: number | null;
  current_balance?: number | null;
  capital_amount?: number | null;
  last_payment_method?: string | null;
  days_since_last_payment?: number | null;
  outbound_phone_call_outcome?: string | null;
  outbound_phone_call_comment?: string | null;
  last_inbound_phone_call_date?: string | null;
  inbound_phone_call_outcome?: string | null;

  email_2?: string | null;
  email_3?: string | null;
  street_address_1?: string | null;
  street_address_2?: string | null;
  street_address_3?: string | null;
  street_address_4?: string | null;
  street_code?: string | null;
  combined_street?: string | null;
  gender?: string | null;
  occupation?: string | null;
  employer_name?: string | null;
  employer_contact?: string | null;
  last_contact?: string | null;
  title?: string | null;
  first_name?: string | null;
  second_name?: string | null;
  surname?: string | null;
  account_load_date?: string | null;
  debtor_flags?: string | null;
  account_flags?: string | null;
  linked_account?: string | null;
  bucket?: string | null;
  campaign_exclusions?: string | null;
  error?: string | null;
  original_line?: string | null;
}

export default function UnivenCustomerProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editCustomer, setEditCustomer] = useState<UnivenCustomer | null>(null);
  const [accountHistory, setAccountHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<UnivenCustomer | null>(null);
  const [originalAmount, setOriginalAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementDiscount, setSettlementDiscount] = useState<number>(25);
  const [settlementDescription, setSettlementDescription] = useState<string>('');
  const [settlementExpiryDate, setSettlementExpiryDate] = useState<string>('');
  const [showManualPTP, setShowManualPTP] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  const [showPhoneNumbersModal, setShowPhoneNumbersModal] = useState(false);
  
  // AI analysis states
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisSessionId, setAnalysisSessionId] = useState<string>('');
  
  const { dispatch } = useRedux();
  
  // Function to open the global dialer with Redux
  const openGlobalDialer = (phoneNumber: string) => {
    if (customer) {
      dispatch(startCall({
        phoneNumber: phoneNumber,
        customerName: `${customer.first_name || customer.name || ''} ${customer.surname || customer.surname_company_trust || ''}`.trim(),
        customerId: customer.id
      }));
      dispatch(openDialer());
    }
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === 'N/A') {
      toast.error(`No ${label} available to copy`);
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard`);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!params.id) {
        setError("No customer ID provided");
        setLoading(false);
        return;
      }

      try {
        const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
        const customerData = await getCustomerById(customerId);
        
        if (!customerData) {
          setError("Customer not found");
        } else {
          // Cast the customer data to UnivenCustomer to include the additional fields
          const univenCustomer = customerData as UnivenCustomer;
          
          setCustomer(univenCustomer);
          setEditCustomer(univenCustomer);
          setOriginalAmount(univenCustomer.current_balance || univenCustomer.outstanding_balance || 0);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [params.id]);

  const getRiskBadgeVariant = (riskLevel: string | undefined) => {
    if (!riskLevel) return 'outline';
    
    const riskLevelLower = riskLevel.toLowerCase();
    switch (riskLevelLower) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('overdue')) return 'destructive';
    if (statusLower.includes('legal')) return 'outline';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading customer details...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/user/customers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Customer Not Found</h2>
          <p>The customer you are looking for does not exist or has been removed.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/user/customers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none py-6 space-y-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/user/customers')}
          className="flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Customers
        </Button>
        
        {!editMode && (
          <Button variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
        )}
      </div>

      {/* Main content area - Restructured */}
      <div className="space-y-8">
        {/* Top row - Full width Customer Profile Card */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 h-24 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="rounded-full bg-slate-800 p-1 border-2 border-slate-900/90">
                <UserCircle className="h-12 w-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <CardContent className="pt-6 pb-0 px-6">
            <div className="text-center mb-6">
              {editMode ? (
                <div className="flex gap-2 justify-center mb-2">
                  <Input
                    className="w-40"
                    value={editCustomer?.first_name || editCustomer?.name || ''}
                    onChange={e => setEditCustomer(prev => prev ? {...prev, first_name: e.target.value, name: e.target.value} : null)}
                    placeholder="First Name"
                  />
                  <Input
                    className="w-40"
                    value={editCustomer?.surname || editCustomer?.surname_company_trust || ''}
                    onChange={e => setEditCustomer(prev => prev ? {...prev, surname: e.target.value, surname_company_trust: e.target.value} : null)}
                    placeholder="Surname"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {customer.first_name || customer.name} {customer.surname || customer.surname_company_trust}
                </h2>
              )}
              <div className="flex items-center justify-center mt-1 space-x-2">
                <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-slate-300">
                  {customer.acc_number}
                </Badge>
                <Badge 
                  variant={getRiskBadgeVariant(customer.risk_level)}
                  className={
                    customer.risk_level === 'high' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                      : customer.risk_level === 'medium' 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                        : 'bg-green-500/20 text-green-400 border-green-500/50'
                  }
                >
                  {customer.risk_level?.toUpperCase() || 'UNKNOWN'} RISK
                </Badge>
              </div>
              
              {/* University of Venda branding */}
              <div className="mt-3">
                <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  University of Venda Customer Profile
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {/* Client Reference */}
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Client Reference</span>
                </div>
                <span className="text-sm font-medium text-white">{customer.acc_number || 'N/A'}</span>
              </div>
              
              {/* ID Number */}
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">ID Number</span>
                </div>
                <span className="text-sm font-medium text-white">{customer.id_number_1 || 'N/A'}</span>
              </div>
              
              {/* Cell Number */}
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Cell Number</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {customer.cell_number ? (customer.cell_number.startsWith('0') ? customer.cell_number : `0${customer.cell_number}`) : 'N/A'}
                </span>
              </div>
              
              {/* Email */}
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Email</span>
                </div>
                <span className="text-sm font-medium text-white truncate">{customer.email_addr_1 || 'N/A'}</span>
              </div>
              
              {/* Account Opened */}
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Account Opened</span>
                </div>
                <span className="text-sm font-medium text-white">{formatDate(customer.date_opened)}</span>
              </div>
              
              {/* Status */}
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Status</span>
                </div>
                <Badge 
                  variant={getStatusBadgeVariant(customer.account_status_description)}
                  className={
                    customer.account_status_description?.toLowerCase().includes('overdue') 
                      ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                      : customer.account_status_description?.toLowerCase().includes('legal') 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                        : 'bg-green-500/20 text-green-400 border-green-500/50'
                  }
                >
                  {customer.account_status_description || 'N/A'}
                </Badge>
              </div>
            </div>
            
            {/* Save/Cancel buttons when in edit mode */}
            {editMode && (
              <div className="col-span-full flex gap-4 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditCustomer(customer);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-blue-500"
                  onClick={async () => {
                    // In a real implementation, you would save the changes to the database here
                    toast.success('Customer information updated successfully!');
                    setCustomer(editCustomer);
                    setEditMode(false);
                  }}
                >
                  Save
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700/50 py-4 px-6">
            <div className="w-full space-y-4">
              {/* Contact buttons - centered */}
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-md shadow-green-900/30 transition-all duration-300 px-6"
                  onClick={() => router.push('/user/allocated-accounts?skipInteraction=true')}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Allocated Accounts
                </Button>
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-md shadow-indigo-900/30 transition-all duration-300 px-6"
                  onClick={() => {
                    if (customer) {
                      dispatch(startCall({
                        phoneNumber: customer.cell_number || '',
                        customerName: `${customer.first_name || customer.name || ''} ${customer.surname || customer.surname_company_trust || ''}`.trim(),
                        customerId: customer.id
                      }));
                      dispatch(openDialer());
                    }
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Customer
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white border-none shadow-md shadow-blue-900/30 transition-all duration-300 px-6"
                  onClick={() => setShowPhoneNumbersModal(true)}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Dial Next Number
                </Button>
              </div>
              
              {/* Grid of additional action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-blue-300 transition-all duration-300"
                  onClick={() => dispatch(openEmailInterface({
                    recipientEmail: customer.email_addr_1 || '',
                    recipientName: `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}`,
                    accountNumber: customer.acc_number
                  }))}
                >
                  <Mail className="h-4 w-4 mr-2 text-blue-400" />
                  Email
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-green-300 transition-all duration-300"
                  onClick={() => {
                    dispatch(openSMSInterface({
                      recipientPhone: customer.cell_number || '',
                      recipientName: `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}`,
                      accountNumber: customer.acc_number
                    }));
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2 text-green-400" />
                  SMS
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-purple-300 transition-all duration-300"
                  onClick={() => dispatch(openPTPInterface({
                    customerId: customer.id,
                    customerName: `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}`,
                    accountNumber: customer.acc_number
                  }))}
                >
                  <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                  PTP
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-amber-300 transition-all duration-300"
                  onClick={() => setShowManualPTP(true)}
                >
                  <FileEdit className="h-4 w-4 mr-2 text-amber-400" />
                  Manual PTP
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-cyan-300 transition-all duration-300"
                  onClick={() => dispatch(openRTPInterface({
                    customerId: customer.id,
                    customerName: `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}`,
                    accountNumber: customer.acc_number
                  }))}
                >
                  <CalendarX className="h-4 w-4 mr-2 text-cyan-400" />
                  RTP
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-rose-300 transition-all duration-300"
                  onClick={() => dispatch(openFlagsDialog({
                    customerId: customer.id,
                    customerName: `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}`,
                    accountNumber: customer.acc_number
                  }))}
                >
                  <Flag className="h-4 w-4 mr-2 text-rose-400" />
                  Flag Account
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-blue-300 transition-all duration-300"
                  onClick={() => setShowSettlementDialog(true)}
                >
                  <Wallet className="h-4 w-4 mr-2 text-blue-400" />
                  Settlement
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-amber-300 transition-all duration-300"
                  onClick={() => dispatch(openNotesDialog({
                    accountId: customer.id,
                    accountName: `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}`,
                    accountNumber: customer.acc_number
                  }))}
                >
                  <FileText className="h-4 w-4 mr-2 text-amber-400" />
                  Notes
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Financial Summary Card */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-12 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                <DollarSign className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="ml-3 font-semibold text-white text-lg">Financial Summary</h3>
            </div>
          </div>
          <CardContent className="pt-6 px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Balance */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">Current Balance</span>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full px-4 py-1.5 shadow-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(customer.current_balance || customer.outstanding_balance)}</p>
                  </div>
                </div>
              </div>
              
              {/* Capital Amount */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <CreditCard className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Capital Amount</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-base font-bold text-white">{formatCurrency(customer.capital_amount)}</p>
                </div>
              </div>
              
              {/* Original Cost */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">Original Cost</span>
                  </div>
                  <p className="text-base font-bold text-white">{formatCurrency(customer.original_cost || customer.outstanding_balance)}</p>
                </div>
              </div>
              
              {/* Days Overdue */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Days Overdue</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge 
                    variant={(customer.days_overdue && customer.days_overdue > 90) ? "destructive" : "outline"}
                    className={
                      customer.days_overdue && customer.days_overdue > 90 
                        ? "bg-red-500/20 text-red-400 border-red-500/50" 
                        : "bg-slate-800/60 border-slate-700 text-indigo-300"
                    }
                  >
                    {customer.days_overdue || 0} days
                  </Badge>
                </div>
              </div>
              
              {/* Interest Rate */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <BarChart3 className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Interest Rate</span>
                </div>
                <p className="text-base font-bold text-white">{customer.interest_rate ? `${customer.interest_rate}%` : 'N/A'}</p>
              </div>
              
              {/* Last Payment Date */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Last Payment Date</span>
                </div>
                <p className="text-base font-bold text-white">{formatDate(customer.last_payment_date)}</p>
              </div>
              
              {/* Last Payment Amount */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Banknote className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Last Payment Amount</span>
                </div>
                <p className="text-base font-bold text-white">{formatCurrency(customer.last_payment_amount)}</p>
              </div>
              
              {/* Payments To Date */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Wallet className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Payments To Date</span>
                </div>
                <p className="text-base font-bold text-white">{formatCurrency(customer.payments_to_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* University of Venda Specific Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 h-12 relative">
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
              <div className="absolute inset-0 flex items-center px-4">
                <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                  <User className="h-5 w-5 text-teal-400" />
                </div>
                <h3 className="ml-3 font-semibold text-white text-lg">Client Information</h3>
              </div>
            </div>
            <CardContent className="pt-6 px-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Client</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.client || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <Building className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Client Group</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.client_group || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Client Profile Account</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.client_profile_account || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Old Client Ref</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.old_client_ref || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Title</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.title || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Initials</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.initials || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Second Name</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.second_name || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">Gender</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.gender || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Details */}
          <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-12 relative">
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
              <div className="absolute inset-0 flex items-center px-4">
                <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="ml-3 font-semibold text-white text-lg">Account Details</h3>
              </div>
            </div>
            <CardContent className="pt-6 px-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Masked Client Reference</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.masked_client_reference || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <Building className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Client Division</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.client_division || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">EasyPay Reference</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.easypay_reference || customer.easypay_number || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">In Duplum</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.in_duplum || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Status Date</span>
                  </div>
                  <p className="text-sm font-medium text-white">{formatDate(customer.status_date)}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Interest Date</span>
                  </div>
                  <p className="text-sm font-medium text-white">{formatDate(customer.interest_date)}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Debtor under DC</span>
                  </div>
                  <p className="text-sm font-medium text-white">{customer.debtor_under_dc || 'N/A'}</p>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Debtor Status Date</span>
                  </div>
                  <p className="text-sm font-medium text-white">{formatDate(customer.debtor_status_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 h-12 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                <Phone className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="ml-3 font-semibold text-white text-lg">Contact Information</h3>
            </div>
          </div>
          <CardContent className="pt-6 px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cellphone 1 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Cellphone 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${customer.cell_number}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-green-500/70 transition-all duration-300 flex items-center">
                    <Phone className="h-3 w-3 mr-2 text-green-400" />
                    {customer.cell_number ? (customer.cell_number.startsWith('0') ? customer.cell_number : `0${customer.cell_number}`) : 'N/A'}
                  </a>
                  {customer.cell_number && (
                    <button 
                      onClick={() => copyToClipboard(
                        customer.cell_number.startsWith('0') ? customer.cell_number : `0${customer.cell_number}`,
                        'Cellphone 1'
                      )}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-green-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Cellphone 2 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Cellphone 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${customer.cellphone_2}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-green-500/70 transition-all duration-300 flex items-center">
                    <Phone className="h-3 w-3 mr-2 text-green-400" />
                    {customer.cellphone_2 ? (customer.cellphone_2.startsWith('0') ? customer.cellphone_2 : `0${customer.cellphone_2}`) : 'N/A'}
                  </a>
                  {customer.cellphone_2 && (
                    <button 
                      onClick={() => copyToClipboard(
                        customer.cellphone_2 && customer.cellphone_2.startsWith('0') ? customer.cellphone_2 : `0${customer.cellphone_2 || ''}`,
                        'Cellphone 2'
                      )}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-green-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Cellphone 3 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Cellphone 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${customer.cellphone_3}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-green-500/70 transition-all duration-300 flex items-center">
                    <Phone className="h-3 w-3 mr-2 text-green-400" />
                    {customer.cellphone_3 ? (customer.cellphone_3.startsWith('0') ? customer.cellphone_3 : `0${customer.cellphone_3}`) : 'N/A'}
                  </a>
                  {customer.cellphone_3 && (
                    <button 
                      onClick={() => copyToClipboard(
                        customer.cellphone_3 && customer.cellphone_3.startsWith('0') ? customer.cellphone_3 : `0${customer.cellphone_3 || ''}`,
                        'Cellphone 3'
                      )}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-green-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Cellphone 4 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Cellphone 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${customer.cellphone_4}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-green-500/70 transition-all duration-300 flex items-center">
                    <Phone className="h-3 w-3 mr-2 text-green-400" />
                    {customer.cellphone_4 ? (customer.cellphone_4.startsWith('0') ? customer.cellphone_4 : `0${customer.cellphone_4}`) : 'N/A'}
                  </a>
                  {customer.cellphone_4 && (
                    <button 
                      onClick={() => copyToClipboard(
                        customer.cellphone_4 && customer.cellphone_4.startsWith('0') ? customer.cellphone_4 : `0${customer.cellphone_4 || ''}`,
                        'Cellphone 4'
                      )}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-green-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Email 1 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Email 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${customer.email_addr_1}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-blue-500/70 transition-all duration-300 flex items-center">
                    <Mail className="h-3 w-3 mr-2 text-blue-400" />
                    {customer.email_addr_1 || 'N/A'}
                  </a>
                  {customer.email_addr_1 && (
                    <button 
                      onClick={() => copyToClipboard(customer.email_addr_1, 'Email 1')}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Email 2 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Email 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${customer.email_2 || customer.email_addr_2}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-blue-500/70 transition-all duration-300 flex items-center">
                    <Mail className="h-3 w-3 mr-2 text-blue-400" />
                    {customer.email_2 || customer.email_addr_2 || 'N/A'}
                  </a>
                  {(customer.email_2 || customer.email_addr_2) && (
                    <button 
                      onClick={() => copyToClipboard(customer.email_2 || customer.email_addr_2, 'Email 2')}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Email 3 */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Email 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${customer.email_3}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-blue-500/70 transition-all duration-300 flex items-center">
                    <Mail className="h-3 w-3 mr-2 text-blue-400" />
                    {customer.email_3 || 'N/A'}
                  </a>
                  {customer.email_3 && (
                    <button 
                      onClick={() => copyToClipboard(customer.email_3 || '', 'Email 3')}
                      className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 transition-all duration-200"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Last Contact */}
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Last Contact</span>
                </div>
                <p className="text-sm font-medium text-white">{formatDate(customer.last_contact)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 h-12 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                <MapPin className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="ml-3 font-semibold text-white text-lg">Address Information</h3>
            </div>
          </div>
          <CardContent className="pt-6 px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Street Address 1</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.street_address_1 || customer.street_addr || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Street Address 2</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.street_address_2 || customer.post_addr_1 || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Street Address 3</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.street_address_3 || customer.post_addr_2 || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Street Address 4</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.street_address_4 || customer.post_addr_3 || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Street Code</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.street_code || customer.post_code || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">Combined Street</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.combined_street || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 h-12 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                <Building className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="ml-3 font-semibold text-white text-lg">Employment Information</h3>
            </div>
          </div>
          <CardContent className="pt-6 px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <Building className="h-4 w-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Occupation</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.occupation || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <Building className="h-4 w-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Employer Name</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.employer_name || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Employer Contact</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.employer_contact || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management Information */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 h-12 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="ml-3 font-semibold text-white text-lg">Account Management Information</h3>
            </div>
          </div>
          <CardContent className="pt-6 px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Account Load Date</span>
                </div>
                <p className="text-sm font-medium text-white">{formatDate(customer.account_load_date)}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <Flag className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Debtor Flags</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.debtor_flags || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <Flag className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Account Flags</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.account_flags || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Linked Account</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.linked_account || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Bucket</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.bucket || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Campaign Exclusions</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.campaign_exclusions || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Error</span>
                </div>
                <p className="text-sm font-medium text-white">{customer.error || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Original Line</span>
                </div>
                <p className="text-sm font-medium text-white truncate">{customer.original_line || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Include the EmailInterface component */}
      <EmailInterface />
      
      {/* Include the SMSInterface component */}
      <SMSInterface />
      
      {/* Include the PTP component */}
      <PTP />
      
      {/* Include the RTP component */}
      <RTP />
      
      {/* Include the FlagsInterface component */}
      <FlagsInterface />
      
      {/* Include the ChatInterface component */}
      <ChatInterface />
      
      {/* Include the PaymentHistoryDialog component */}
      <PaymentHistoryDialog />
      
      {/* Include the NotesInterface component */}
      <NotesInterface />
      
      {/* Settlement Dialog */}
      <Dialog open={showSettlementDialog} onOpenChange={setShowSettlementDialog}>
        <DialogContent className="max-w-[600px] bg-slate-900 border-slate-800 max-h-[90vh]">
          <ScrollArea className="max-h-[calc(90vh-130px)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Create Settlement Offer
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a settlement offer for {customer?.first_name || customer?.name} {customer?.surname || customer?.surname_company_trust}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Debtor Name</label>
                  <Input
                    value={`${customer?.first_name || customer?.name || ''} ${customer?.surname || customer?.surname_company_trust || ''}`}
                    disabled
                    className="bg-slate-800 border-slate-700 opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Client Reference
                  </label>
                  <Input
                    value={customer?.acc_number || ''}
                    disabled
                    className="bg-slate-800 border-slate-700 opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Current Balance
                  </label>
                  <Input
                    type="number"
                    value={customer?.current_balance || customer?.outstanding_balance || 0}
                    disabled
                    className="bg-slate-800 border-slate-700 opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Settlement Amount</label>
                  <Input
                    type="number"
                    value={settlementAmount}
                    onChange={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      setSettlementAmount(newAmount);
                      if (customer?.current_balance || customer?.outstanding_balance) {
                        const balance = customer.current_balance || customer.outstanding_balance || 0;
                        const discount = ((balance - newAmount) / balance) * 100;
                        setSettlementDiscount(Math.round(discount));
                      }
                    }}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    Discount Percentage
                  </label>
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                    {settlementDiscount}%
                  </Badge>
                </div>
                <Slider
                  defaultValue={[25]}
                  max={100}
                  step={1}
                  value={[settlementDiscount]}
                  onValueChange={(value) => {
                    const discount = value[0];
                    setSettlementDiscount(discount);
                    if (customer?.current_balance || customer?.outstanding_balance) {
                      const balance = customer.current_balance || customer.outstanding_balance || 0;
                      const calculatedAmount = balance * (1 - discount / 100);
                      setSettlementAmount(Math.round(calculatedAmount));
                    }
                  }}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={settlementExpiryDate}
                  onChange={(e) => setSettlementExpiryDate(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Enter settlement details and terms"
                  value={settlementDescription}
                  onChange={(e) => setSettlementDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 min-h-[100px]"
                />
              </div>

              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Agent Information</span>
                </div>
                <div className="flex items-center">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                    {user ? user.name : 'Unknown Agent'}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter className="px-1 pb-4">
              <Button
                variant="outline"
                onClick={() => setShowSettlementDialog(false)}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-500"
                onClick={async () => {
                  toast.success('Settlement offer created successfully!');
                  setShowSettlementDialog(false);
                }}
              >
                Create Settlement
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Manual PTP Dialog */}
      <ManualPTP
        isOpen={showManualPTP}
        onClose={() => setShowManualPTP(false)}
        customerId={customer?.id || ''}
        customerName={customer ? `${customer.first_name || customer.name} ${customer.surname || customer.surname_company_trust || ''}` : ''}
        accountNumber={customer?.acc_number || ''}
        onPTPCreated={(ptpData) => {
          toast.success('Manual PTP created successfully!');
        }}
      />
    </div>
  );
}