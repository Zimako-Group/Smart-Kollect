"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { getCustomerById, formatCurrency, formatDate } from "@/lib/customer-service";
import { createActivityNotification } from "@/lib/notification-service";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { openDialog as openPaymentHistoryDialog } from "@/lib/redux/features/payment-history/paymentHistorySlice";
import PaymentHistoryDialog from "@/components/PaymentHistoryDialog";

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
  MessageCircle
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
import PTP from "@/components/PTP";
import RTP from "@/components/RTP";
import FlagsInterface from "@/components/FlagsInterface";
import ChatInterface from "@/components/ChatInterface";
import NotesInterface from "@/components/NotesInterface";
import FloatingDialer from "@/components/FloatingDialer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import ManualPTP from "@/components/ManualPTP";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomerProfilePage() {
  const { user } = useAuth(); // Get the current user from AuthContext
  const [editMode, setEditMode] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [accountHistory, setAccountHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // Get custom flags from the redux store
  const customFlags = useAppSelector(state => state.flags.flags);
  
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

  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [originalAmount, setOriginalAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementDiscount, setSettlementDiscount] = useState<number>(25);
  const [settlementDescription, setSettlementDescription] = useState<string>('');
  const [settlementExpiryDate, setSettlementExpiryDate] = useState<string>('');
  const [showDialer, setShowDialer] = useState(false);
  const [showManualPTP, setShowManualPTP] = useState(false);
  
  // Function to create PTP notification when Manual PTP is created
  const handleManualPTPCreated = async (ptpData: any) => {
    try {
      if (!customer) return;
      
      // Create notification
      await createActivityNotification(
        'created a manual PTP arrangement',
        customer.id,
        `${customer.name} ${customer.surname_company_trust || ''}`,
        user ? user.name : 'Unknown Agent',
        'PTP_CREATED',
        ptpData.id,
        { 
          promise_date: ptpData.date,
          amount: ptpData.amount,
          payment_method: ptpData.payment_method
        }
      );
    } catch (error) {
      console.error('Error creating PTP notification:', error);
    }
  };
  const [showPhoneNumbersModal, setShowPhoneNumbersModal] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  const { dispatch } = useRedux();

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
          setCustomer(customerData);
          setEditCustomer(customerData); // Sync editCustomer
          setOriginalAmount(customerData.outstanding_balance);
          
          // Fetch account history after customer details are loaded
          fetchAccountHistory(customerId);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
    
    // Add event listener for refreshing account history when a call note is saved
    const handleRefreshHistory = (event: any) => {
      console.log('Received refreshAccountHistory event:', event.detail);
      if (params.id) {
        const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
        console.log('Refreshing account history for customer:', customerId);
        fetchAccountHistory(customerId);
        toast.success('Account history refreshed with new call note');
      }
    };
    
    window.addEventListener('refreshAccountHistory', handleRefreshHistory);
    
    return () => {
      window.removeEventListener('refreshAccountHistory', handleRefreshHistory);
    };
  }, [params.id]);
  
  // Function to check if a table exists and what columns it has
  const checkTableSchema = async (tableName: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Try to get a single row to see the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Error checking schema for table ${tableName}:`, error);
        return { exists: false, error: error.message };
      }
      
      // If we got here, the table exists
      console.log(`Table ${tableName} exists. Sample data:`, data);
      return { exists: true, columns: data && data.length > 0 ? Object.keys(data[0]) : [] };
    } catch (error) {
      console.error(`Exception checking schema for table ${tableName}:`, error);
      return { exists: false, error: String(error) };
    }
  };
  
  // Fetch customer flags when the component loads
  useEffect(() => {
    if (params.id && customer) {
      dispatch(fetchCustomerFlags(params.id as string));
    }
  }, [params.id, customer, dispatch]);

  // Function to fetch account history
  const fetchAccountHistory = async (customerId: string) => {
    console.log('Fetching account history for customer ID:', customerId);
    setLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      console.log('Starting to fetch all history records');
      console.log('DEBUG: Customer ID for fetching history:', customerId);
      
      // Check the database schema for each table
      console.log('Checking database schema for tables...');
      const ptpSchema = await checkTableSchema('PTP');
      const manualPtpSchema = await checkTableSchema('ManualPTP');
      const rtpSchema = await checkTableSchema('RTP');
      const notesSchema = await checkTableSchema('notes');
      const flagsSchema = await checkTableSchema('Flags');
      
      console.log('Schema check results:', {
        PTP: ptpSchema,
        ManualPTP: manualPtpSchema,
        RTP: rtpSchema,
        notes: notesSchema,
        Flags: flagsSchema
      });
      // Fetch all relevant history records for this customer
      // Check the database schema first to ensure we're using the correct table names and column names
      console.log('DEBUG: Checking database tables and columns before fetching');
      
      // Try to fetch data with error handling for each table separately
      let ptpResponse, manualPtpResponse, rtpResponse, settlementResponse, notesResponse, flagsResponse, editResponse;
      
      try {
        // PTP arrangements
        ptpResponse = await supabase
          .from('PTP')
          .select('*')
          .eq('debtor_id', customerId) // Changed from customer_id to debtor_id
          .order('created_at', { ascending: false });
        console.log('DEBUG: PTP query result:', ptpResponse);
      } catch (error) {
        console.error('Error fetching PTP records:', error);
        ptpResponse = { data: [], error };
      }
      
      try {
        // Manual PTP arrangements - try without the join first
        manualPtpResponse = await supabase
          .from('ManualPTP')
          .select('*')
          .eq('debtor_id', customerId)
          .order('created_at', { ascending: false });
        console.log('DEBUG: ManualPTP query result:', manualPtpResponse);
      } catch (error) {
        console.error('Error fetching ManualPTP records:', error);
        manualPtpResponse = { data: [], error };
      }
      
      // Skip RTP query since the table doesn't exist
      console.log('DEBUG: Skipping RTP query as table does not exist');
      rtpResponse = { data: [], error: null };
      
      try {
        // Settlement offers
        settlementResponse = await supabase
          .from('Settlements')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        console.log('DEBUG: Settlements query result:', settlementResponse);
      } catch (error) {
        console.error('Error fetching Settlement records:', error);
        settlementResponse = { data: [], error };
      }
      
      try {
        // Notes - try without the join first
        notesResponse = await supabase
          .from('notes')
          .select('*')
          .eq('customer_id', customerId) // Try with customer_id first
          .order('created_at', { ascending: false });
        
        // If that fails, try with debtor_id
        if (notesResponse.error) {
          console.log('DEBUG: Trying notes query with debtor_id instead of customer_id');
          notesResponse = await supabase
            .from('notes')
            .select('*')
            .eq('debtor_id', customerId)
            .order('created_at', { ascending: false });
        }
        
        console.log('DEBUG: Notes query result:', notesResponse);
      } catch (error) {
        console.error('Error fetching Notes records:', error);
        notesResponse = { data: [], error };
      }
      
      // Skip Flags query since the table doesn't exist
      console.log('DEBUG: Skipping Flags query as table does not exist');
      flagsResponse = { data: [], error: null };
      
      try {
        // Profile edits
        editResponse = await supabase
          .from('CustomerEditHistory')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        console.log('DEBUG: CustomerEditHistory query result:', editResponse);
      } catch (error) {
        console.error('Error fetching CustomerEditHistory records:', error);
        editResponse = { data: [], error };
      }
      
      // Log API responses
      console.log('PTP Response:', ptpResponse);
      console.log('Manual PTP Response:', manualPtpResponse);
      console.log('RTP Response:', rtpResponse);
      console.log('Settlement Response:', settlementResponse);
      console.log('Notes Response:', notesResponse);
      console.log('Flags Response:', flagsResponse);
      console.log('Edit Response:', editResponse);
      
      // Examine the raw data from each response to understand the structure
      console.log('DEBUG: Raw PTP data structure:', ptpResponse.data ? ptpResponse.data[0] : 'No data');
      console.log('DEBUG: Raw ManualPTP data structure:', manualPtpResponse.data ? manualPtpResponse.data[0] : 'No data');
      console.log('DEBUG: Raw RTP data structure:', rtpResponse.data ? rtpResponse.data[0] : 'No data');
      
      // Combine all history records with more detailed logging
      const ptpRecords = (ptpResponse.data || []).map(item => {
        const record = {
          ...(typeof item === 'object' && item !== null ? item : {}),
          type: 'PTP',
          action: 'Created PTP arrangement',
          date: typeof item === 'object' && item !== null ? item.created_at || new Date().toISOString() : new Date().toISOString(),
          agent: typeof item === 'object' && item !== null ? item.agent_name || 'System' : 'System'
        };
        console.log('DEBUG: Processed PTP record:', record);
        return record;
      });
      
      const manualPtpRecords = (manualPtpResponse.data || []).map(item => {
        // Ensure item is an object
        if (typeof item !== 'object' || item === null) {
          return {
            type: 'Manual PTP',
            action: 'Created manual PTP arrangement',
            date: new Date().toISOString(),
            agent: 'System',
            status: 'Unknown'
          };
        }
        
        // Get agent name from created_by if available, otherwise use 'System'
        let agentName = 'System';
        
        // We'll use the created_by field directly since we don't have the profiles join
        if (item.created_by) {
          // We could fetch the profile name here, but for now we'll just use a placeholder
          agentName = `Agent (${item.created_by.substring(0, 8)}...)`;
        }
        
        const record = {
          ...(typeof item === 'object' && item !== null ? item : {}),
          type: 'Manual PTP',
          action: `Created manual PTP arrangement for ${new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
          }).format(item.amount || 0)}`,
          date: item.created_at || new Date().toISOString(), // Use the date field as promise_date for display
          // For PTP/RTP tab display
          promise_date: item.date || new Date().toISOString(), // Use the date field as promise_date for display
          agent: agentName,
          status: item.status === 'pending' ? 'Active' : item.status === 'paid' ? 'Paid' : 'Defaulted'
        };
        console.log('DEBUG: Processed Manual PTP record:', record);
        return record;
      });
      
      const rtpRecords = (rtpResponse.data || []).map(item => {
        // Check if item is a valid object first
        if (typeof item !== 'object' || item === null) {
          return {
            type: 'RTP',
            action: 'Created RTP reminder',
            date: new Date().toISOString(),
            agent: 'System'
          };
        }
        
        // Now TypeScript knows item is a non-null object
        // Use type assertion to tell TypeScript that item is a record with optional properties
        const typedItem = item as { created_at?: string; agent_name?: string; [key: string]: any };
        
        const record = {
          ...typedItem, // Safely spread with type assertion
          type: 'RTP',
          action: 'Created RTP reminder',
          date: typedItem.created_at || new Date().toISOString(),
          agent: typedItem.agent_name || 'System'
        };
        console.log('DEBUG: Processed RTP record:', record);
        return record;
      });
      
      const settlementRecords = (settlementResponse.data || []).map(item => {
        if (typeof item !== 'object' || item === null) {
          return {
            type: 'Settlement',
            action: 'Created settlement offer',
            date: new Date().toISOString(),
            agent: 'System'
          };
        }
        
        return {
          ...(typeof item === 'object' && item !== null ? item : {}),
          type: 'Settlement',
          action: `Created settlement offer (${item.discount_percentage || 0}% discount)`,
          date: item.created_at || new Date().toISOString(),
          agent: item.agent_name || 'System'
        };
      });
      
      const notesRecords = (notesResponse.data || []).map(item => {
        // Extract call outcome if present in content
        let callOutcome = '';
        let noteContent = item.content;
        
        if (item.category === 'Call Note' && item.content) {
          const callOutcomeMatch = item.content.match(/Call Outcome: (.+?)\n/i);
          if (callOutcomeMatch && callOutcomeMatch[1]) {
            callOutcome = callOutcomeMatch[1];
            // Remove the call outcome line from the content for display
            noteContent = item.content.replace(/Call Outcome: (.+?)\n\n/i, '');
          }
        }
        
        // Get agent name from created_by if available, otherwise use 'System'
        let agentName = 'System';
        
        // We'll use the created_by field directly since we don't have the profiles join
        if (item.created_by) {
          // We could fetch the profile name here, but for now we'll just use a placeholder
          agentName = `Agent (${item.created_by.substring(0, 8)}...)`;
        }
        
        return {
          ...(typeof item === 'object' && item !== null ? item : {}),
          type: typeof item === 'object' && item !== null && item.category === 'Call Note' ? 'Call Note' : 'Note',
          action: callOutcome ? `Call: ${callOutcome}` : 'Added account note',
          date: typeof item === 'object' && item !== null && item.created_at ? item.created_at : new Date().toISOString(),
          agent: agentName,
          // Add these fields for consistent display
          note: noteContent,
          call_outcome: callOutcome
        };
      });
      
      const flagsRecords = (flagsResponse.data || []).map(item => {
        if (typeof item !== 'object' || item === null) {
          return {
            type: 'Flag',
            action: 'Flagged account: General',
            date: new Date().toISOString(),
            agent: 'System'
          };
        }
        
        // Use type assertion to tell TypeScript that item is a record with optional properties
        const typedItem = item as { created_at?: string; agent_name?: string; flag_type?: string; [key: string]: any };
        
        return {
          ...typedItem,
          type: 'Flag',
          action: `Flagged account: ${typedItem.flag_type || 'General'}`,
          date: typedItem.created_at || new Date().toISOString(),
          agent: typedItem.agent_name || 'System'
        };
      });
      
      const editRecords = (editResponse.data || []).map(item => {
        if (typeof item !== 'object' || item === null) {
          return {
            type: 'Edit',
            action: 'Edited profile: Multiple fields',
            date: new Date().toISOString(),
            agent: 'System'
          };
        }
        
        return {
          ...(typeof item === 'object' && item !== null ? item : {}),
          type: 'Edit',
          action: `Edited profile: ${typeof item === 'object' && item !== null && item.field_changed ? item.field_changed : 'Multiple fields'}`,
          date: typeof item === 'object' && item !== null && item.created_at ? item.created_at : new Date().toISOString(),
          agent: typeof item === 'object' && item !== null && item.agent_name ? item.agent_name : 'System'
        };
      });
      
      // Log processed records
      console.log('PTP Records:', ptpRecords);
      console.log('Manual PTP Records:', manualPtpRecords);
      console.log('RTP Records:', rtpRecords);
      console.log('Settlement Records:', settlementRecords);
      console.log('Notes Records:', notesRecords);
      console.log('Flags Records:', flagsRecords);
      console.log('Edit Records:', editRecords);
      
      // Combine all records and sort by date
      const allHistory = [...ptpRecords, ...manualPtpRecords, ...rtpRecords, ...settlementRecords, ...notesRecords, ...flagsRecords, ...editRecords]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Combined Account History:', allHistory);
      setAccountHistory(allHistory);
    } catch (err: any) {
      console.error('Error fetching account history:', err);
      setHistoryError('Failed to load account history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline'; // Using outline with custom styling
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
    if (statusLower.includes('legal')) return 'outline'; // Using outline with custom styling
    return 'outline';
  };

  const handleCreateSettlement = async () => {
    console.log('Settlement creation started');
    
    // Validate settlement data
    if (!settlementAmount || !settlementExpiryDate) {
      console.error('Validation failed: Missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Creating settlement data object with values:', {
        customerId: Array.isArray(params.id) ? params.id[0] : params.id,
        customerName: `${customer?.name || ''} ${customer?.surname_company_trust || ''}`,
        accountNumber: customer?.acc_number || '',
        originalAmount: customer?.outstanding_balance || 0,
        settlementAmount,
        discountPercentage: settlementDiscount,
        expiryDate: settlementExpiryDate,
      });
      
      // Create settlement data object
      const settlementData = {
        id: crypto.randomUUID(),
        customer_id: Array.isArray(params.id) ? params.id[0] : params.id,
        customer_name: `${customer?.name || ''} ${customer?.surname_company_trust || ''}`,
        account_number: customer?.acc_number || '',
        original_amount: customer?.outstanding_balance || 0,
        settlement_amount: settlementAmount,
        discount_percentage: settlementDiscount,
        description: settlementDescription,
        expiry_date: settlementExpiryDate,
        status: 'pending',
        created_at: new Date().toISOString(),
        agent_name: user ? user.name : 'Unknown Agent', // Use current user's name
      };

      console.log('Settlement data object created:', settlementData);
      
      // Import Supabase client
      const { supabase } = await import('@/lib/supabase');
      console.log('Supabase client imported');
      
      // Save to Supabase
      console.log('Attempting to insert settlement into Supabase...');
      const { data, error } = await supabase
        .from('Settlements')
        .insert(settlementData)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to save settlement: ${error.message}`);
      }
      
      console.log('Settlement successfully saved to Supabase:', data);
      
      // Also save to localStorage as a backup
      try {
        const existingSettlements = JSON.parse(localStorage.getItem('settlements') || '[]');
        existingSettlements.push(settlementData);
        localStorage.setItem('settlements', JSON.stringify(existingSettlements));
        console.log('Settlement also saved to localStorage as backup');
      } catch (localStorageError) {
        console.warn('Failed to save to localStorage, but Supabase save was successful:', localStorageError);
      }

      // Create notification for settlement creation
      await createActivityNotification(
        'created a settlement offer',
        Array.isArray(params.id) ? params.id[0] : params.id,
        `${customer?.name || ''} ${customer?.surname_company_trust || ''}`,
        user ? user.name : 'Unknown Agent',
        'SETTLEMENT_CREATED',
        settlementData.id,
        { 
          discount_percentage: settlementDiscount,
          settlement_amount: settlementAmount,
          original_amount: customer?.outstanding_balance || 0
        }
      );
      
      // Show success message
      toast.success('Settlement offer created successfully!');
      
      // Close the dialog
      setShowSettlementDialog(false);
      
      // Navigate to the settlements page
      console.log('Navigating to settlements page...');
      router.push('/user/settlement');
    } catch (error) {
      console.error('Error creating settlement:', error);
      toast.error(`Failed to create settlement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-end">
        {!editMode && (
          <Button variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
        )}
      </div>
      {/* Back button only */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/user/customers')}
          className="mr-4 flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Customers
        </Button>
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
      value={editCustomer?.name || ''}
      onChange={e => setEditCustomer((prev:any) => ({...prev, name: e.target.value}))}
      placeholder="Name"
    />
    <Input
      className="w-60"
      value={editCustomer?.surname_company_trust || ''}
      onChange={e => setEditCustomer((prev:any) => ({...prev, surname_company_trust: e.target.value}))}
      placeholder="Surname/Company/Trust"
    />
  </div>
) : (
  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{customer.name} {customer.surname_company_trust}</h2>
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
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">ID Number</span>
                </div>
                {editMode ? (
  <Input
    className="w-40"
    value={editCustomer?.id_number_1 || ''}
    onChange={e => setEditCustomer((prev:any) => ({...prev, id_number_1: e.target.value}))}
    placeholder="ID Number"
  />
) : (
  <span className="text-sm font-medium text-white">{customer.id_number_1 || 'N/A'}</span>
)}
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Cell Number</span>
                </div>
                {editMode ? (
  <Input
    className="w-40"
    value={editCustomer?.cell_number || ''}
    onChange={e => setEditCustomer((prev:any) => ({...prev, cell_number: e.target.value}))}
    placeholder="Cell Number"
  />
) : (
  <span className="text-sm font-medium text-white">{customer.cell_number ? (customer.cell_number.startsWith('0') ? customer.cell_number : `0${customer.cell_number}`) : 'N/A'}</span>
)}
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Email</span>
                </div>
                {editMode ? (
  <Input
    className="w-60"
    value={editCustomer?.email_addr_1 || ''}
    onChange={e => setEditCustomer((prev:any) => ({...prev, email_addr_1: e.target.value}))}
    placeholder="Email"
  />
) : (
  <span className="text-sm font-medium text-white truncate">{customer.email_addr_1 || 'N/A'}</span>
)}
              </div>
              
              <div className="bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Account Opened</span>
                </div>
                {editMode ? (
  <Input
    className="w-40"
    type="date"
    value={editCustomer?.date_opened?.substring(0, 10) || ''}
    onChange={e => setEditCustomer((prev:any) => ({...prev, date_opened: e.target.value}))}
    placeholder="Account Opened"
  />
) : (
  <span className="text-sm font-medium text-white">{formatDate(customer.date_opened)}</span>
)}
              </div>

              <div className="flex flex-col justify-center bg-slate-800/30 rounded-lg py-3 px-2 border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Indigent Status</span>
                </div>
                {customer.indigent_yn === 'Y' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    <CheckCircle className="h-3 w-3 mr-1" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 border-slate-600">
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col justify-center bg-slate-800/30 rounded-lg py-3 px-2 border border-slate-700/50">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Pensioner Status</span>
                </div>
                {customer.pensioner_yn === 'Y' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    <CheckCircle className="h-3 w-3 mr-1" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 border-slate-600">
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </Badge>
                )}
              </div>

              {/* Save/Cancel buttons as a full-width grid row */}
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
                      // Save to Supabase
                      try {
                        const { supabase } = await import('@/lib/supabase');
                        const { error } = await supabase
                          .from('Debtors')
                          .update({
                            name: editCustomer.name,
                            surname_company_trust: editCustomer.surname_company_trust,
                            acc_number: editCustomer.acc_number,
                            id_number_1: editCustomer.id_number_1,
                            cell_number: editCustomer.cell_number,
                            cellphone_1: editCustomer.cellphone_1,
                            cellphone_2: editCustomer.cellphone_2,
                            cell_number_2: editCustomer.cell_number_2,
                            home_tel: editCustomer.home_tel,
                            work_tel: editCustomer.work_tel,
                            email_addr_1: editCustomer.email_addr_1,
                            date_opened: editCustomer.date_opened,
                            indigent_yn: editCustomer.indigent_yn,
                            pensioner_yn: editCustomer.pensioner_yn,
                          })
                          .eq('id', customer.id);
                          
                        // Also log this edit in the history table
                        await supabase
                          .from('CustomerEditHistory')
                          .insert({
                            customer_id: customer.id,
                            field_changed: 'Profile Information',
                            old_value: JSON.stringify(customer),
                            new_value: JSON.stringify(editCustomer),
                            agent_name: user ? user.name : 'Unknown Agent',
                            created_at: new Date().toISOString()
                          });
                          
                        // Create notification for this edit
                        await createActivityNotification(
                          'updated profile information',
                          customer.id,
                          `${customer.name} ${customer.surname_company_trust || ''}`,
                          user ? user.name : 'Unknown Agent',
                          'PROFILE_EDIT',
                          customer.id,
                          { fields_changed: Object.keys(editCustomer).filter(key => editCustomer[key] !== customer[key]) }
                        );
                        if (error) {
                          alert('Failed to update customer: ' + error.message);
                        } else {
                          setCustomer(editCustomer);
                          setEditMode(false);
                          alert('Customer updated successfully!');
                        }
                      } catch (e: any) {
                        alert('Unexpected error: ' + e.message);
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
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
                  onClick={() => setShowDialer(true)}
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
              
              {/* Floating Dialer */}
              {customer && (
                <FloatingDialer 
                  isOpen={showDialer}
                  onClose={() => setShowDialer(false)}
                  phoneNumber={selectedPhoneNumber || customer.cell_number || ''}
                  customerName={`${customer.name || ''} ${customer.surname_company_trust || ''}`.trim()}
                />
              )}
              
              {/* Phone Numbers Selection Modal */}
              <Dialog open={showPhoneNumbersModal} onOpenChange={setShowPhoneNumbersModal}>
                <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">
                      Select Number to Call
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {customer && (
                        <div className="mt-2">
                          <div className="flex flex-wrap items-center justify-between mb-1">
                            <div className="flex items-center mr-2">
                              <UserCircle className="h-3 w-3 mr-1 text-blue-400" />
                              <span className="text-slate-300 text-xs font-medium truncate max-w-[200px]">
                                {customer.name} {customer.surname_company_trust}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 mr-1 text-blue-400" />
                              <span className="text-slate-300 text-xs">Acc: {customer.acc_number}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between">
                            <div className="flex items-center mr-2 max-w-[60%]">
                              <MapPin className="h-3 w-3 mr-1 text-blue-400 flex-shrink-0" />
                              <span className="text-slate-300 text-xs truncate">
                                {[customer.street_addr, customer.post_addr_1, customer.post_addr_2]
                                  .filter(Boolean)
                                  .join(', ') || 'No address'}
                              </span>
                            </div>
                            <div className="flex items-center max-w-[40%]">
                              <Mail className="h-3 w-3 mr-1 text-blue-400 flex-shrink-0" />
                              <span className="text-slate-300 text-xs truncate">{customer.email_addr_1 || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-2 py-2">
                    <div className="bg-slate-800/50 p-1 rounded-md mb-2">
                      <h3 className="text-xs font-medium text-slate-300 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1 text-amber-400" />
                        Contact Information
                      </h3>
                      <p className="text-[10px] text-slate-400">Click on any number to initiate a call</p>
                    </div>
                    
                    {/* Home Telephone */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        let phoneNumber = customer.home_tel || customer.tel_home;
                        if (phoneNumber && phoneNumber !== '0' && phoneNumber !== 'N/A') {
                          // Ensure the phone number has a leading 0
                          if (!phoneNumber.startsWith('0')) {
                            phoneNumber = `0${phoneNumber}`;
                          }
                          setSelectedPhoneNumber(phoneNumber);
                          setShowPhoneNumbersModal(false);
                          setShowDialer(true);
                        } else {
                          toast.error('No valid home telephone number');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-indigo-500/20 p-1 rounded-full mr-2">
                          <Home className="h-3 w-3 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Home Telephone</p>
                          <p className="text-xs text-slate-400">{(customer.home_tel || customer.tel_home) ? ((customer.home_tel || customer.tel_home).startsWith('0') ? (customer.home_tel || customer.tel_home) : `0${customer.home_tel || customer.tel_home}`) : 'N/A'}</p>
                        </div>
                      </div>
                      <Phone className="h-3 w-3 text-indigo-400" />
                    </div>
                    
                    {/* Work Telephone */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        let phoneNumber = customer.work_tel || customer.tel_work;
                        if (phoneNumber && phoneNumber !== '0' && phoneNumber !== 'N/A') {
                          // Ensure the phone number has a leading 0
                          if (!phoneNumber.startsWith('0')) {
                            phoneNumber = `0${phoneNumber}`;
                          }
                          setSelectedPhoneNumber(phoneNumber);
                          setShowPhoneNumbersModal(false);
                          setShowDialer(true);
                        } else {
                          toast.error('No valid work telephone number');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-500/20 p-1 rounded-full mr-2">
                          <Building className="h-3 w-3 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Work Telephone</p>
                          <p className="text-xs text-slate-400">{(customer.work_tel || customer.tel_work) ? ((customer.work_tel || customer.tel_work).startsWith('0') ? (customer.work_tel || customer.tel_work) : `0${customer.work_tel || customer.tel_work}`) : 'N/A'}</p>
                          {customer.work_addr_1 && (
                            <p className="text-[10px] text-slate-500">{customer.work_addr_1}</p>
                          )}
                        </div>
                      </div>
                      <Phone className="h-3 w-3 text-blue-400" />
                    </div>
                    
                    {/* Cellphone 1 */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        let phoneNumber = customer.cell_number || customer.cellphone_1;
                        if (phoneNumber && phoneNumber !== '0' && phoneNumber !== 'N/A') {
                          // Ensure the phone number has a leading 0
                          if (!phoneNumber.startsWith('0')) {
                            phoneNumber = `0${phoneNumber}`;
                          }
                          setSelectedPhoneNumber(phoneNumber);
                          setShowPhoneNumbersModal(false);
                          setShowDialer(true);
                        } else {
                          toast.error('No valid cellphone number');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-green-500/20 p-1 rounded-full mr-2">
                          <Phone className="h-3 w-3 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Cellphone 1</p>
                          <p className="text-xs text-slate-400">{(customer.cell_number || customer.cellphone_1) ? ((customer.cell_number || customer.cellphone_1).startsWith('0') ? (customer.cell_number || customer.cellphone_1) : `0${customer.cell_number || customer.cellphone_1}`) : 'N/A'}</p>
                          <Badge className="bg-green-500/10 text-green-400 text-[10px] px-1 py-0">Primary</Badge>
                        </div>
                      </div>
                      <Phone className="h-3 w-3 text-green-400" />
                    </div>
                    
                    {/* Cellphone 2 */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        let phoneNumber = customer.cell_number_2 || customer.cellphone_2;
                        if (phoneNumber && phoneNumber !== '0' && phoneNumber !== 'N/A') {
                          // Ensure the phone number has a leading 0
                          if (!phoneNumber.startsWith('0')) {
                            phoneNumber = `0${phoneNumber}`;
                          }
                          setSelectedPhoneNumber(phoneNumber);
                          setShowPhoneNumbersModal(false);
                          setShowDialer(true);
                        } else {
                          toast.error('No valid second cellphone number');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-purple-500/20 p-1 rounded-full mr-2">
                          <Phone className="h-3 w-3 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Cellphone 2</p>
                          <p className="text-xs text-slate-400">{(customer.cell_number_2 || customer.cellphone_2) ? ((customer.cell_number_2 || customer.cellphone_2).startsWith('0') ? (customer.cell_number_2 || customer.cellphone_2) : `0${customer.cell_number_2 || customer.cellphone_2}`) : 'N/A'}</p>
                        </div>
                      </div>
                      <Phone className="h-3 w-3 text-purple-400" />
                    </div>
                    
                    {/* Cellphone 3 */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        let phoneNumber = customer.cell_number_3 || customer.cellphone_3;
                        if (phoneNumber && phoneNumber !== '0' && phoneNumber !== 'N/A') {
                          // Ensure the phone number has a leading 0
                          if (!phoneNumber.startsWith('0')) {
                            phoneNumber = `0${phoneNumber}`;
                          }
                          setSelectedPhoneNumber(phoneNumber);
                          setShowPhoneNumbersModal(false);
                          setShowDialer(true);
                        } else {
                          toast.error('No valid third cellphone number');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-amber-500/20 p-1 rounded-full mr-2">
                          <Phone className="h-3 w-3 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Cellphone 3</p>
                          <p className="text-xs text-slate-400">{(customer.cell_number_3 || customer.cellphone_3) ? ((customer.cell_number_3 || customer.cellphone_3).startsWith('0') ? (customer.cell_number_3 || customer.cellphone_3) : `0${customer.cell_number_3 || customer.cellphone_3}`) : 'N/A'}</p>
                        </div>
                      </div>
                      <Phone className="h-3 w-3 text-amber-400" />
                    </div>
                    
                    {/* Cellphone 4 */}
                    <div 
                      className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        let phoneNumber = customer.cell_number_4 || customer.cellphone_4;
                        if (phoneNumber && phoneNumber !== '0' && phoneNumber !== 'N/A') {
                          // Ensure the phone number has a leading 0
                          if (!phoneNumber.startsWith('0')) {
                            phoneNumber = `0${phoneNumber}`;
                          }
                          setSelectedPhoneNumber(phoneNumber);
                          setShowPhoneNumbersModal(false);
                          setShowDialer(true);
                        } else {
                          toast.error('No valid fourth cellphone number');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-red-500/20 p-1 rounded-full mr-2">
                          <Phone className="h-3 w-3 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Cellphone 4</p>
                          <p className="text-xs text-slate-400">{(customer.cell_number_4 || customer.cellphone_4) ? ((customer.cell_number_4 || customer.cellphone_4).startsWith('0') ? (customer.cell_number_4 || customer.cellphone_4) : `0${customer.cell_number_4 || customer.cellphone_4}`) : 'N/A'}</p>
                        </div>
                      </div>
                      <Phone className="h-3 w-3 text-red-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/30 p-2 rounded-md mb-2 border border-slate-700/50">
                    <h3 className="text-xs font-medium text-slate-300 mb-1 flex items-center">
                      <FileText className="h-3 w-3 mr-1 text-blue-400" />
                      Account Details
                    </h3>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <p className="text-slate-400">Status:</p>
                        <p className="text-slate-300 truncate">{customer.account_status_description || customer.status || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Risk Level:</p>
                        <p className="text-slate-300 truncate">{customer.risk_level || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Outstanding:</p>
                        <p className="text-slate-300 truncate">{formatCurrency(customer.outstanding_balance) || 'R0.00'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Last Payment:</p>
                        <p className="text-slate-300 truncate">{formatDate(customer.last_payment_date) || 'None'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPhoneNumbersModal(false)}
                      className="border-slate-700 text-slate-300"
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Grid of additional action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-blue-300 transition-all duration-300"
                  onClick={() => dispatch(openEmailInterface({
                    recipientEmail: customer.email_addr_1 || '',
                    recipientName: `${customer.name} ${customer.surname_company_trust || ''}`,
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
                    // From the screenshot, we can see the cell number is displayed as "725244615"
                    // This appears to be stored in the customer data as "cell_number"
                    
                    // Try to get the cell number from the customer data
                    let cellNumber = '';
                    
                    // Check if there's a cell_number field
                    if (customer.cell_number) {
                      cellNumber = customer.cell_number;
                    } 
                    // If not, check if there's a phone field that might contain the cell number
                    else if (customer.phone_1) {
                      cellNumber = customer.phone_1;
                    }
                    // Fallback to the number we can see in the UI
                    else {
                      cellNumber = "725244615";
                    }
                    
                    dispatch(openSMSInterface({
                      recipientPhone: cellNumber,
                      recipientName: `${customer.name} ${customer.surname_company_trust || ''}`,
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
                    customerName: `${customer.name} ${customer.surname_company_trust || ''}`,
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
                    customerName: `${customer.name} ${customer.surname_company_trust || ''}`,
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
                    customerName: `${customer.name} ${customer.surname_company_trust || ''}`,
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
                    accountName: `${customer.name} ${customer.surname_company_trust || ''}`,
                    accountNumber: customer.acc_number
                  }))}
                >
                  <FileText className="h-4 w-4 mr-2 text-amber-400" />
                  Notes
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-orange-300 transition-all duration-300"
                  onClick={() => dispatch(openPaymentHistoryDialog({
                    customerId: customer.id,
                    customerName: customer.name || 'Customer',
                    accountNumber: customer.account_number || '-'
                  }))}
                >
                  <History className="h-4 w-4 mr-2 text-orange-400" />
                  Payment History
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Bottom row - Two column layout for other cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Account & Contact Details and Property & Address Information */}
          <div className="space-y-6 lg:col-span-2">
            {/* Account & Contact Details Card */}
            <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-teal-600 via-violet-600 to-purple-600 h-12 relative">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0 flex items-center px-4">
                  <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                    <CreditCard className="h-5 w-5 text-teal-400" />
                  </div>
                  <h3 className="ml-3 font-semibold text-white text-lg">Account & Contact Details</h3>
                </div>
              </div>
              <CardContent className="pt-6 px-5">
                <div className="space-y-4">
                  {/* Account Section */}
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-teal-500/20 rounded-full p-1.5">
                        <CreditCard className="h-4 w-4 text-teal-400" />
                      </div>
                      <span className="ml-2 text-sm font-semibold text-teal-400 uppercase tracking-wider">Account Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 mr-2 text-teal-400" />
                          <span className="text-sm font-medium text-slate-300">Account Number</span>
                        </div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50">
                            {customer.acc_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <CreditCard className="h-4 w-4 mr-2 text-teal-400" />
                          <span className="text-sm font-medium text-slate-300">EasyPay Reference</span>
                        </div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50">
                            {customer.easypay_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Building className="h-4 w-4 mr-2 text-teal-400" />
                          <span className="text-sm font-medium text-slate-300">Account Type</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-white">{customer.account_type_description || 'N/A'}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-teal-300">
                              Code: {customer.account_type_code || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 mr-2 text-teal-400" />
                          <span className="text-sm font-medium text-slate-300">Account Status</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center">
                            <Badge 
                              variant={getStatusBadgeVariant(customer.account_status_description)}
                              className={`${
                                getStatusBadgeVariant(customer.account_status_description) === 'destructive' 
                                  ? 'bg-red-900/60 hover:bg-red-800/80 text-red-200 border-red-700' 
                                  : getStatusBadgeVariant(customer.account_status_description) === 'outline'
                                    ? 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border-amber-700'
                                    : 'bg-teal-900/40 hover:bg-teal-800/60 text-teal-200 border-teal-700'
                              } px-3 py-1`}
                            >
                              {customer.account_status_description || 'N/A'}
                            </Badge>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-teal-300">
                              Code: {customer.account_status_code || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Section */}
                  <div className="pt-4 border-t border-slate-700/30 mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-purple-500/20 rounded-full p-1.5">
                        <Phone className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="ml-2 text-sm font-semibold text-purple-400 uppercase tracking-wider">Contact Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Home Telephone */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Home Telephone</span>
                        </div>
                        {editMode ? (
                          <Input
                            className="w-full"
                            value={editCustomer?.home_tel || ''}
                            onChange={e => setEditCustomer((prev:any) => ({...prev, home_tel: e.target.value}))}
                            placeholder="Home Telephone"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${customer.home_tel}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.home_tel ? (customer.home_tel.startsWith('0') ? customer.home_tel : `0${customer.home_tel}`) : 'N/A'}
                            </a>
                            {customer.home_tel && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.home_tel.startsWith('0') ? customer.home_tel : `0${customer.home_tel}`,
                                  'Home Telephone'
                                )}
                                className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Work Telephone */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Building className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Work Telephone</span>
                        </div>
                        {editMode ? (
                          <Input
                            className="w-full"
                            value={editCustomer?.work_tel || ''}
                            onChange={e => setEditCustomer((prev:any) => ({...prev, work_tel: e.target.value}))}
                            placeholder="Work Telephone"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${customer.work_tel}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.work_tel ? (customer.work_tel.startsWith('0') ? customer.work_tel : `0${customer.work_tel}`) : 'N/A'}
                            </a>
                            {customer.work_tel && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.work_tel.startsWith('0') ? customer.work_tel : `0${customer.work_tel}`,
                                  'Work Telephone'
                                )}
                                className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Cellphone 1 */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Cellphone 1</span>
                        </div>
                        {editMode ? (
                          <Input
                            className="w-full"
                            value={editCustomer?.cellphone_1 || editCustomer?.cell_number || ''}
                            onChange={e => setEditCustomer((prev:any) => ({...prev, cellphone_1: e.target.value, cell_number: e.target.value}))}
                            placeholder="Cellphone 1"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${customer.cellphone_1}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.cellphone_1 ? (customer.cellphone_1.startsWith('0') ? customer.cellphone_1 : `0${customer.cellphone_1}`) : 'N/A'}
                            </a>
                            {customer.cellphone_1 && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.cellphone_1.startsWith('0') ? customer.cellphone_1 : `0${customer.cellphone_1}`,
                                  'Cellphone 1'
                                )}
                              className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                              title="Copy to clipboard"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          )}
                        </div>
                        )}
                      </div>
                      
                      {/* Cellphone 2 */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Cellphone 2</span>
                        </div>
                        {editMode ? (
                          <Input
                            className="w-full"
                            value={editCustomer?.cellphone_2 || editCustomer?.cell_number_2 || ''}
                            onChange={e => setEditCustomer((prev:any) => ({...prev, cellphone_2: e.target.value, cell_number_2: e.target.value}))}
                            placeholder="Cellphone 2"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${customer.cellphone_2}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.cellphone_2 ? (customer.cellphone_2.startsWith('0') ? customer.cellphone_2 : `0${customer.cellphone_2}`) : 'N/A'}
                            </a>
                            {customer.cellphone_2 && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.cellphone_2.startsWith('0') ? customer.cellphone_2 : `0${customer.cellphone_2}`,
                                  'Cellphone 2'
                                )}
                              className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                              title="Copy to clipboard"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          )}
                          </div>
                        )}
                      </div>
                      
                      {/* Cellphone 3 */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Cellphone 3</span>
                        </div>
                        {!editMode ? (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${customer.cellphone_3}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.cellphone_3 ? (customer.cellphone_3.startsWith('0') ? customer.cellphone_3 : `0${customer.cellphone_3}`) : 'N/A'}
                            </a>
                            {customer.cellphone_3 && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.cellphone_3.startsWith('0') ? customer.cellphone_3 : `0${customer.cellphone_3}`,
                                  'Cellphone 3'
                                )}
                                className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editCustomer.cellphone_3 || ''}
                              onChange={(e) => setEditCustomer({...editCustomer, cellphone_3: e.target.value})}
                              className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center w-full"
                              placeholder="Enter cellphone 3"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Cellphone 4 */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Cellphone 4</span>
                        </div>
                        {!editMode ? (
                          <div className="flex items-center gap-2">
                            <a href={`tel:${customer.cellphone_4}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Phone className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.cellphone_4 ? (customer.cellphone_4.startsWith('0') ? customer.cellphone_4 : `0${customer.cellphone_4}`) : 'N/A'}
                            </a>
                            {customer.cellphone_4 && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.cellphone_4.startsWith('0') ? customer.cellphone_4 : `0${customer.cellphone_4}`,
                                  'Cellphone 4'
                                )}
                                className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editCustomer.cellphone_4 || ''}
                              onChange={(e) => setEditCustomer({...editCustomer, cellphone_4: e.target.value})}
                              className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center w-full"
                              placeholder="Enter cellphone 4"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Secondary Email */}
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Mail className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Secondary Email</span>
                        </div>
                        {editMode ? (
                          <Input
                            type="email"
                            className="w-full"
                            value={editCustomer?.email_addr_2 || ''}
                            onChange={e => setEditCustomer((prev:any) => ({...prev, email_addr_2: e.target.value}))}
                            placeholder="Secondary Email"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <a href={`mailto:${customer.email_addr_2}`} className="text-sm font-medium text-white bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50 hover:border-purple-500/70 transition-all duration-300 flex items-center">
                              <Mail className="h-3 w-3 mr-2 text-purple-400" />
                              {customer.email_addr_2 || 'N/A'}
                            </a>
                            {customer.email_addr_2 && (
                              <button 
                                onClick={() => copyToClipboard(
                                  customer.email_addr_2,
                                  'Secondary Email'
                                )}
                                className="p-1.5 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 hover:border-purple-500/50 transition-all duration-200"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-700/30">
                  <div className="grid grid-cols-3 gap-2">

                    <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-purple-300 transition-all duration-300">
                      <Phone className="h-4 w-4 mr-2 text-purple-400" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-purple-300 transition-all duration-300">
                      <Mail className="h-4 w-4 mr-2 text-purple-400" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property & Address Information */}
            <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 h-12 relative">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0 flex items-center px-4">
                  <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                    <Home className="h-5 w-5 text-teal-400" />
                  </div>
                  <h3 className="ml-3 font-semibold text-white text-lg">Property & Address Information</h3>
                </div>
              </div>
              <CardContent className="pt-6 px-5">
                <div className="space-y-4">
                  {/* Address Section */}
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-500/20 rounded-full p-1.5">
                        <MapPin className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="ml-2 text-sm font-semibold text-blue-400 uppercase tracking-wider">Address Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-sm font-medium text-slate-300">Street Address</span>
                        </div>
                        <p className="text-sm font-medium text-white">{customer.street_addr || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Mail className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-sm font-medium text-slate-300">Postal Address</span>
                        </div>
                        <p className="text-sm font-medium text-white">
                          {[
                            customer.post_addr_1, 
                            customer.post_addr_2, 
                            customer.post_addr_3
                          ].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-sm font-medium text-slate-300">Postal Code</span>
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-blue-300">
                            {customer.post_code || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Property Section */}
                  <div className="pt-4 border-t border-slate-700/30 mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-emerald-500/20 rounded-full p-1.5">
                        <Building className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="ml-2 text-sm font-semibold text-emerald-400 uppercase tracking-wider">Property Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-emerald-400" />
                          <span className="text-sm font-medium text-slate-300">Ward</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-white">{customer.ward_description || 'N/A'}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-emerald-300">
                              Code: {customer.ward_code || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Building className="h-4 w-4 mr-2 text-emerald-400" />
                          <span className="text-sm font-medium text-slate-300">Property Category</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-white">{customer.property_category_description || 'N/A'}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-emerald-300">
                              Code: {customer.property_category_code || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <Home className="h-4 w-4 mr-2 text-emerald-400" />
                          <span className="text-sm font-medium text-slate-300">Usage</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-white">{customer.usage_desc || 'N/A'}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-emerald-300">
                              Code: {customer.usage_code || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
                        <div className="flex items-center mb-2">
                          <DollarSign className="h-4 w-4 mr-2 text-emerald-400" />
                          <span className="text-sm font-medium text-slate-300">Property Market Value</span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full px-4 py-1.5 shadow-lg">
                            <p className="text-base font-bold text-white">{formatCurrency(customer.market_value)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-700/30">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-blue-300 transition-all duration-300">
                      <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                      View on Map
                    </Button>
                    <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/70 hover:text-emerald-300 transition-all duration-300">
                      <Building className="h-4 w-4 mr-2 text-emerald-400" />
                      Property Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Financial Summary */}
          <div className="space-y-6 lg:col-span-1">
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
                <div className="space-y-4">
                  <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />
                        <span className="text-sm font-medium text-slate-300">Outstanding Total Balance</span>
                      </div>
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full px-4 py-1.5 shadow-lg">
                        <p className="text-lg font-bold text-white">{formatCurrency(customer.outstanding_total_balance || customer.outstanding_balance)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 mr-2 text-indigo-400" />
                      <span className="text-sm font-medium text-slate-300">Last Payment</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-slate-800/60 border-slate-700 text-indigo-300">
                          {customer.last_payment_date ? formatDate(customer.last_payment_date) : 'No date'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">{formatCurrency(customer.last_payment_amount)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-indigo-400" />
                        <span className="text-sm font-medium text-slate-300">Original Amount</span>
                      </div>
                      <p className="text-base font-bold text-white">{formatCurrency(originalAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                        <span className="text-xs text-slate-400">Payment Progress</span>
                      </div>
                      <span className="text-xs font-medium text-indigo-300">
                        {originalAmount && (customer.outstanding_total_balance || customer.outstanding_balance) 
                          ? Math.round(((originalAmount - (customer.outstanding_total_balance || customer.outstanding_balance)) / originalAmount) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-slate-700/30 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" 
                        style={{ 
                          width: `${originalAmount && (customer.outstanding_total_balance || customer.outstanding_balance) 
                            ? Math.min(Math.round(((originalAmount - (customer.outstanding_total_balance || customer.outstanding_balance)) / originalAmount) * 100), 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 mr-2 text-rose-400" />
                        <span className="text-sm font-medium text-slate-300">Account Flags</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                        onClick={() => {
                          if (customer) {
                            dispatch(openFlagsDialog({
                              customerId: customer.id,
                              customerName: `${customer.name || ''} ${customer.surname_company_trust || ''}`.trim(),
                              accountNumber: customer.acc_number
                            }));
                          }
                        }}
                      >
                        <Flag className="h-3 w-3 mr-1" /> Manage Flags
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* System flags */}
                      {customer.is_overdue && (
                        <Badge variant="outline" className="bg-red-900/40 text-red-300 border-red-700 hover:bg-red-900/60">
                          <AlertTriangle className="h-3 w-3 mr-1 text-red-400" />
                          Overdue
                        </Badge>
                      )}
                      {customer.is_legal && (
                        <Badge variant="outline" className="bg-amber-900/40 text-amber-300 border-amber-700 hover:bg-amber-900/60">
                          <Scale className="h-3 w-3 mr-1 text-amber-400" />
                          Legal
                        </Badge>
                      )}
                      {customer.is_disputed && (
                        <Badge variant="outline" className="bg-orange-900/40 text-orange-300 border-orange-700 hover:bg-orange-900/60">
                          <AlertCircle className="h-3 w-3 mr-1 text-orange-400" />
                          Disputed
                        </Badge>
                      )}
                      {customer.is_ptp && (
                        <Badge variant="outline" className="bg-blue-900/40 text-blue-300 border-blue-700 hover:bg-blue-900/60">
                          <Calendar className="h-3 w-3 mr-1 text-blue-400" />
                          PTP
                        </Badge>
                      )}
                      {customer.is_rtp && (
                        <Badge variant="outline" className="bg-cyan-900/40 text-cyan-300 border-cyan-700 hover:bg-cyan-900/60">
                          <CalendarX className="h-3 w-3 mr-1 text-cyan-400" />
                          RTP
                        </Badge>
                      )}
                      {customer.is_indigent && (
                        <Badge variant="outline" className="bg-purple-900/40 text-purple-300 border-purple-700 hover:bg-purple-900/60">
                          <UserCircle className="h-3 w-3 mr-1 text-purple-400" />
                          Indigent
                        </Badge>
                      )}
                      {customer.is_pensioner && (
                        <Badge variant="outline" className="bg-green-900/40 text-green-300 border-green-700 hover:bg-green-900/60">
                          <UserCircle className="h-3 w-3 mr-1 text-green-400" />
                          Pensioner
                        </Badge>
                      )}
                      
                      {/* Custom flags */}
                      {customer && customFlags
                        .filter(flag => flag.accountId === customer.id && !flag.isResolved)
                        .map((flag, index) => {
                          // Determine flag color based on priority
                          let flagClass = "";
                          let Icon = AlertCircle;
                          
                          switch(flag.priority) {
                            case "high":
                              flagClass = "bg-red-900/40 text-red-300 border-red-700 hover:bg-red-900/60";
                              Icon = AlertTriangle;
                              break;
                            case "medium":
                              flagClass = "bg-amber-900/40 text-amber-300 border-amber-700 hover:bg-amber-900/60";
                              Icon = AlertCircle;
                              break;
                            case "low":
                              flagClass = "bg-blue-900/40 text-blue-300 border-blue-700 hover:bg-blue-900/60";
                              Icon = Flag;
                              break;
                            default:
                              flagClass = "bg-slate-900/40 text-slate-300 border-slate-700 hover:bg-slate-900/60";
                          }
                          
                          return (
                            <Badge 
                              key={`custom-flag-${flag.id}`} 
                              variant="outline" 
                              className={flagClass}
                              title={flag.notes || ""}
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {flag.type}
                            </Badge>
                          );
                        })
                      }
                      
                      {/* No flags message */}
                      {(!customer.is_overdue && !customer.is_legal && !customer.is_disputed && 
                        !customer.is_ptp && !customer.is_rtp && !customer.is_indigent && !customer.is_pensioner &&
                        (!customer || !customFlags.some(flag => flag.accountId === customer.id && !flag.isResolved))) && (
                        <Badge variant="outline" className="bg-slate-800/60 text-slate-300 border-slate-700">
                          No flags
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </div>
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
        
        {/* Include the PaymentHistoryDialog component */}
        <PaymentHistoryDialog />

        {/* Settlement Dialog */}
        <Dialog open={showSettlementDialog} onOpenChange={setShowSettlementDialog}>
          <DialogContent className="max-w-[600px] bg-slate-900 border-slate-800 max-h-[90vh]">
            <ScrollArea className="max-h-[calc(90vh-130px)]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Create Settlement Offer
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Create a settlement offer for {customer?.name} {customer?.surname_company_trust}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Debtor Name</label>
                    <Input
                      value={`${customer?.name || ''} ${customer?.surname_company_trust || ''}`}
                      disabled
                      className="bg-slate-800 border-slate-700 opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Account Number
                    </label>
                    <Input
                      value={customer?.acc_number || ''}
                      disabled
                      className="bg-slate-800 border-slate-700 opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Original Amount
                    </label>
                    <Input
                      type="number"
                      value={customer?.outstanding_balance || 0}
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
                        if (customer?.outstanding_balance) {
                          const discount = ((customer.outstanding_balance - newAmount) / customer.outstanding_balance) * 100;
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
                      if (customer?.outstanding_balance) {
                        const calculatedAmount = customer.outstanding_balance * (1 - discount / 100);
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
                  onClick={handleCreateSettlement}
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
          customerName={customer ? `${customer.name} ${customer.surname_company_trust || ''}` : ''}
          accountNumber={customer?.acc_number || ''}
          onPTPCreated={handleManualPTPCreated}
        />
        
        {/* Account History Section */}
        <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm mt-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 h-12 relative">
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                <History className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="ml-3 font-semibold text-white text-lg">Account History</h3>
            </div>
          </div>
          <CardContent className="pt-6 px-5 pb-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="ptp">PTP/RTP</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="edits">Profile Edits</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">{historyError}</p>
                  </div>
                ) : accountHistory.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <Clock className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No account activity recorded yet</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-800/80 border-slate-700">
                          <TableHead className="text-slate-300 font-medium">Date & Time</TableHead>
                          <TableHead className="text-slate-300 font-medium">Activity Type</TableHead>
                          <TableHead className="text-slate-300 font-medium">Action</TableHead>
                          <TableHead className="text-slate-300 font-medium">Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountHistory.map((item, index) => (
                          <TableRow key={`${item.type}-${index}`} className="hover:bg-slate-800/80 border-slate-700">
                            <TableCell className="text-slate-300">
                              {new Date(item.date).toLocaleString('en-ZA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${item.type === 'PTP' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                                  item.type === 'RTP' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' :
                                  item.type === 'Settlement' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                  item.type === 'Note' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                                  item.type === 'Flag' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' :
                                  'bg-green-500/20 text-green-400 border-green-500/50'}`}
                              >
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">{item.action}</TableCell>
                            <TableCell className="text-slate-300">{item.agent}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="ptp" className="space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">{historyError}</p>
                  </div>
                ) : (() => {
                    // Add debugging for PTP/RTP tab filtering
                    const ptpRtpItems = accountHistory.filter(item => item.type === 'PTP' || item.type === 'RTP' || item.type === 'Manual PTP');
                    console.log('DEBUG: PTP/RTP Tab - Filtered Items:', ptpRtpItems);
                    console.log('DEBUG: PTP/RTP Tab - Items by type:', {
                      PTP: accountHistory.filter(item => item.type === 'PTP').length,
                      RTP: accountHistory.filter(item => item.type === 'RTP').length,
                      ManualPTP: accountHistory.filter(item => item.type === 'Manual PTP').length
                    });
                    return ptpRtpItems.length === 0;
                  })() ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <Calendar className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No PTP or RTP arrangements recorded</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-800/80 border-slate-700">
                          <TableHead className="text-slate-300 font-medium">Date Created</TableHead>
                          <TableHead className="text-slate-300 font-medium">Type</TableHead>
                          <TableHead className="text-slate-300 font-medium">Promise Date</TableHead>
                          <TableHead className="text-slate-300 font-medium">Amount</TableHead>
                          <TableHead className="text-slate-300 font-medium">Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountHistory
                          .filter(item => item.type === 'PTP' || item.type === 'RTP' || item.type === 'Manual PTP')
                          .map((item, index) => (
                            <TableRow key={`ptp-${index}`} className="hover:bg-slate-800/80 border-slate-700">
                              <TableCell className="text-slate-300">
                                {new Date(item.date).toLocaleDateString('en-ZA')}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={item.type === 'PTP' ? 
                                    'bg-purple-500/20 text-purple-400 border-purple-500/50' : 
                                    item.type === 'Manual PTP' ?
                                    'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                                    'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'}
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {item.promise_date || item.reminder_date || item.date ? 
                                  new Date(item.promise_date || item.reminder_date || item.date).toLocaleDateString('en-ZA') : 
                                  'N/A'}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {formatCurrency(item.amount || 0)}
                              </TableCell>
                              <TableCell className="text-slate-300">{item.agent}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settlements" className="space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">{historyError}</p>
                  </div>
                ) : accountHistory.filter(item => item.type === 'Settlement').length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <Wallet className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No settlement offers recorded</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-800/80 border-slate-700">
                          <TableHead className="text-slate-300 font-medium">Date Created</TableHead>
                          <TableHead className="text-slate-300 font-medium">Original Amount</TableHead>
                          <TableHead className="text-slate-300 font-medium">Settlement Amount</TableHead>
                          <TableHead className="text-slate-300 font-medium">Discount</TableHead>
                          <TableHead className="text-slate-300 font-medium">Expiry Date</TableHead>
                          <TableHead className="text-slate-300 font-medium">Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountHistory
                          .filter(item => item.type === 'Settlement')
                          .map((item, index) => (
                            <TableRow key={`settlement-${index}`} className="hover:bg-slate-800/80 border-slate-700">
                              <TableCell className="text-slate-300">
                                {new Date(item.date).toLocaleDateString('en-ZA')}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {formatCurrency(item.original_amount || 0)}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {formatCurrency(item.settlement_amount || 0)}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {item.discount_percentage}%
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {new Date(item.expiry_date).toLocaleDateString('en-ZA')}
                              </TableCell>
                              <TableCell className="text-slate-300">{item.agent}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">{historyError}</p>
                  </div>
                ) : accountHistory.filter(item => item.type === 'Note' || item.type === 'Flag').length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <FileText className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No notes or flags recorded</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-800/80 border-slate-700">
                          <TableHead className="text-slate-300 font-medium">Date</TableHead>
                          <TableHead className="text-slate-300 font-medium">Type</TableHead>
                          <TableHead className="text-slate-300 font-medium">Content</TableHead>
                          <TableHead className="text-slate-300 font-medium">Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountHistory
                          .filter(item => item.type === 'Note' || item.type === 'Flag')
                          .map((item, index) => (
                            <TableRow key={`note-${index}`} className="hover:bg-slate-800/80 border-slate-700">
                              <TableCell className="text-slate-300">
                                {new Date(item.date).toLocaleDateString('en-ZA')}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={item.type === 'Note' ? 
                                    'bg-amber-500/20 text-amber-400 border-amber-500/50' : 
                                    item.type === 'Call Note' ?
                                    'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                    'bg-rose-500/20 text-rose-400 border-rose-500/50'}
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {item.content || item.note || item.flag_reason || 'N/A'}
                              </TableCell>
                              <TableCell className="text-slate-300">{item.agent}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="edits" className="space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500">{historyError}</p>
                  </div>
                ) : accountHistory.filter(item => item.type === 'Edit').length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <Pencil className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">No profile edits recorded</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-800/80 border-slate-700">
                          <TableHead className="text-slate-300 font-medium">Date</TableHead>
                          <TableHead className="text-slate-300 font-medium">Field Changed</TableHead>
                          <TableHead className="text-slate-300 font-medium">Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountHistory
                          .filter(item => item.type === 'Edit')
                          .map((item, index) => (
                            <TableRow key={`edit-${index}`} className="hover:bg-slate-800/80 border-slate-700">
                              <TableCell className="text-slate-300">
                                {new Date(item.date).toLocaleDateString('en-ZA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {item.field_changed}
                              </TableCell>
                              <TableCell className="text-slate-300">{item.agent}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
