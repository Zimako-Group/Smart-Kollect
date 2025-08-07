"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import PaymentMetricsCards from '@/components/PaymentMetricsCards';
import { DateDisplay } from "@/components/DateDisplay";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  FileX,
  Filter,
  Handshake,
  HelpCircle,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { parseSpreadsheetFile, validateAccountRecords, formatAccountRecords, AccountRecord, ValidationResult } from "@/lib/file-parsers";
import { createAccountBatch, uploadAccountRecords, getAccountBatches, getAccountsByBatch, allocateAccounts, AccountBatch, getAgents } from "@/lib/accounts-service";
import { createBatch, updateBatchStatus, insertDebtors, getDebtors, getDebtorsByBatch, getBatches, deleteBatch } from "@/lib/debtors-service";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { 
  createPaymentFileUpload, 
  processPaymentFileRecords,
  PaymentHistoryRecord,
  PaymentFileRecord 
} from '@/lib/payment-history-service';
import PaymentFileUploader from '@/components/PaymentFileUploader';
import PaymentFileHistory from '@/components/PaymentFileHistory';

export default function AdminAccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // State for parsed data
  const [parsedRecords, setParsedRecords] = useState<AccountRecord[]>([]);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);
  const [parsingWarnings, setParsingWarnings] = useState<string[]>([]);
  
  // State for validation
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  
  // State for allocation
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [allocationStrategy, setAllocationStrategy] = useState('balanced');
  const [priorityFilter, setPriorityFilter] = useState<'high-value' | 'overdue' | 'recent' | 'none'>('high-value');
  const [allocationComplete, setAllocationComplete] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  
  // State for batches
  const [accountBatches, setAccountBatches] = useState<AccountBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State for accounts preview
  const [accountsPreview, setAccountsPreview] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // State for agents
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  
  // State for payment file history refresh
  const [paymentHistoryRefreshTrigger, setPaymentHistoryRefreshTrigger] = useState(0);
  
  // State for payment file integration
  const [selectedPaymentFile, setSelectedPaymentFile] = useState<File | null>(null);
  const [isProcessingPayments, setIsProcessingPayments] = useState(false);
  const [paymentProcessingProgress, setPaymentProcessingProgress] = useState(0);
  const [paymentFileUploadId, setPaymentFileUploadId] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState("upload");

  // Function to fetch preview accounts
  const fetchPreviewAccounts = async (batchId: string, filter: 'high-value' | 'overdue' | 'recent' | 'none') => {
    if (!batchId) return;
    
    setIsLoadingAccounts(true);
    try {
      // Fetch up to 10 accounts to show in the preview using the debtors service
      const response = await getDebtorsByBatch(batchId, 1, 10);
      if (response.data) {
        setAccountsPreview(response.data);
      }
      
      // Log for debugging
      console.log("Fetched accounts preview:", response.data);
    } catch (error) {
      console.error('Error fetching accounts preview:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Existing mock data
  const mockValidationIssues = [
    { id: 1, field: "Phone Number", issue: "Invalid format", count: 3 },
    { id: 2, field: "Balance", issue: "Must be a number", count: 7 },
    { id: 3, field: "Email", issue: "Invalid format", count: 5 },
    { id: 4, field: "ID Number", issue: "Invalid format", count: 2 },
    { id: 5, field: "Status", issue: "Invalid status", count: 4 },
  ];

  // Mock data for uploaded accounts
  const uploadedAccounts = [
    { id: "ACC-1001", name: "John Doe", phone: "+27 61 234 5678", balance: 12500, status: "overdue" },
    { id: "ACC-1002", name: "Jane Smith", phone: "+27 62 345 6789", balance: 8750, status: "current" },
    { id: "ACC-1003", name: "Robert Johnson", phone: "+27 63 456 7890", balance: 15000, status: "overdue" },
    { id: "ACC-1004", name: "Mary Williams", phone: "+27 64 567 8901", balance: 5200, status: "current" },
    { id: "ACC-1005", name: "James Brown", phone: "+27 65 678 9012", balance: 9800, status: "overdue" },
  ];

  // Mock data for import history
  const importHistory = [
    { id: "IMP-1001", date: "2025-03-18", accounts: 156, status: "completed", user: "Admin User" },
    { id: "IMP-1002", date: "2025-03-15", accounts: 89, status: "completed", user: "Admin User" },
    { id: "IMP-1003", date: "2025-03-10", accounts: 212, status: "completed", user: "System Admin" },
    { id: "IMP-1004", date: "2025-03-05", accounts: 45, status: "failed", user: "System Admin" },
    { id: "IMP-1005", date: "2025-02-28", accounts: 178, status: "completed", user: "Admin User" },
  ];

  // Mock data for account statistics
  const accountStats = {
    totalAccounts: 3452,
    activeAccounts: 2890,
    overdueAccounts: 1245,
    totalValue: 24568900,
    averageBalance: 7118,
    highValueAccounts: 456,
    recentlyAdded: 156,
  };

  // Fetch account batches and agents on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoadingBatches(true);
      setIsLoadingAgents(true);
      
      try {
        // Fetch batches
        const batches = await getAccountBatches();
        setAccountBatches(batches);
        
        // Fetch agents
        const agentsList = await getAgents();
        setAgents(agentsList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBatches(false);
        setIsLoadingAgents(false);
      }
    }

    fetchData();
  }, [toast]);

  // Fetch accounts preview when batch or priority filter changes
  useEffect(() => {
    if (currentBatchId) {
      fetchPreviewAccounts(currentBatchId, priorityFilter);
    }
  }, [currentBatchId, priorityFilter]);

  // Set current batch ID when tab changes to allocate
  useEffect(() => {
    if (activeTab === "allocate" && accountBatches.length > 0 && !currentBatchId) {
      // If no batch is selected, select the most recent one
      setCurrentBatchId(accountBatches[0].id);
    }
  }, [activeTab, accountBatches, currentBatchId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    setParsedRecords([]);
    setValidationResult(null);
    setParsingErrors([]);
    setParsingWarnings([]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Parse the file
      const { records, errors, warnings } = await parseSpreadsheetFile(selectedFile);
      setParsedRecords(records);
      setParsingErrors(errors);
      setParsingWarnings(warnings);

      // Set progress to show parsing is complete (30%)
      setUploadProgress(30);
      
      toast({
        title: "File Parsed",
        description: `Successfully parsed ${records.length} records. Starting database upload...`,
        variant: "default",
      });

      // Create a new batch in the Batches table
      const batchName = `Debtors Import ${new Date().toISOString().slice(0, 10)}`;
      const batchDescription = `Imported from ${selectedFile.name}`;
      
      const batch = await createBatch(
        batchName,
        batchDescription,
        selectedFile.name,
        selectedFile.size
      );

      if (!batch) {
        throw new Error('Failed to create batch record');
      }

      // Set progress to show batch creation is complete (40%)
      setUploadProgress(40);

      // Insert the records into the Debtors table with progress reporting
      const { success, count, errors: insertErrors } = await insertDebtors(
        records, 
        batch.id,
        (processed, total) => {
          // Calculate progress from 40% to 90% based on records processed
          const progressPercentage = 40 + Math.floor((processed / total) * 50);
          setUploadProgress(progressPercentage);
        }
      );
      
      if (!success) {
        throw new Error(`Failed to insert debtor records: ${insertErrors.join(', ')}`);
      }

      // Update the batch status and record count
      await updateBatchStatus(batch.id, 'completed', count);

      setCurrentBatchId(batch.id);
      console.log("Set current batch ID to:", batch.id);

      // Complete the upload
      setUploadProgress(100);
      setUploadStatus('success');

      // Refresh the batches list
      const batchesResponse = await getBatches();
      if (batchesResponse.data) {
        setAccountBatches(batchesResponse.data.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          fileSize: b.file_size,
          fileName: b.file_name,
          recordCount: b.record_count,
          createdAt: b.created_at,
          status: b.status,
          uploaded_by: b.uploaded_by || '',
          created_at: b.created_at,
          updated_at: b.updated_at || b.created_at,
          file_name: b.file_name,
          file_size: b.file_size,
          record_count: b.record_count
        })));
      }

      // Move to the validate tab first
      setActiveTab("validate");

      toast({
        title: "Success",
        description: `Successfully uploaded ${count} debtors to the database`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadError(error.message);
      toast({
        title: "Error",
        description: error.message || 'An error occurred during upload',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset the upload form
  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadError(null);
    setParsedRecords([]);
    setValidationResult(null);
    setParsingErrors([]);
    setParsingWarnings([]);
    setValidationIssues([]);
    setCurrentBatchId(null);
    setActiveTab("upload" as string);
  };

  // Save accounts to database
  const handleSaveToDatabase = async () => {
    if (!selectedFile || !validationResult || parsedRecords.length === 0) {
      toast({
        title: "Error",
        description: "No valid data to save",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create a new batch in the Batches table
      const batchName = `Debtors Import ${new Date().toISOString().slice(0, 10)}`;
      const batchDescription = `Validated import from ${selectedFile.name}`;
      
      const batch = await createBatch(
        batchName,
        batchDescription,
        selectedFile.name,
        selectedFile.size
      );

      if (!batch) {
        throw new Error('Failed to create batch record');
      }

      // Insert the validated records into the Debtors table
      const { success, count, errors: insertErrors } = await insertDebtors(
        validationResult.validRecords, 
        batch.id
      );
      
      if (!success) {
        throw new Error(`Failed to insert debtor records: ${insertErrors.join(', ')}`);
      }

      // Update the batch status and record count
      await updateBatchStatus(batch.id, 'completed', count);

      setCurrentBatchId(batch.id);

      // Refresh the batches list
      const batchesResponse = await getBatches();
      if (batchesResponse.data) {
        setAccountBatches(batchesResponse.data.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          fileSize: b.file_size,
          fileName: b.file_name,
          recordCount: b.record_count,
          createdAt: b.created_at,
          status: b.status,
          uploaded_by: b.uploaded_by || '',
          created_at: b.created_at,
          updated_at: b.updated_at || b.created_at,
          file_name: b.file_name,
          file_size: b.file_size,
          record_count: b.record_count
        })));
      }

      toast({
        title: "Success",
        description: `Successfully saved ${count} debtor records to the database`,
        variant: "default",
      });

      // Switch to allocate tab
      setActiveTab("allocate");
    } catch (error: any) {
      console.error('Error saving to database:', error);
      toast({
        title: "Error",
        description: error.message || 'An error occurred while saving to database',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Enhanced allocation function with payment history integration
  const handleAllocateAccounts = async () => {
    if (!currentBatchId) {
      toast({
        title: "Error",
        description: 'Please select a batch to allocate',
        variant: "destructive",
      });
      return;
    }

    if (selectedAgents.length === 0) {
      toast({
        title: "Error",
        description: 'Please select at least one agent',
        variant: "destructive",
      });
      return;
    }

    setIsAllocating(true);
    setAllocationSuccess(false);
    setAllocationError(null);
    setPaymentProcessingProgress(0);

    try {
      // Step 1: Process payment file if one is selected
      let paymentUploadId: string | null = null;
      if (selectedPaymentFile) {
        setIsProcessingPayments(true);
        setPaymentProcessingProgress(10);
        
        toast({
          title: "Processing Payment File",
          description: `Processing ${selectedPaymentFile.name}...`,
          variant: "default",
        });

        try {
          // First, we need to parse the file to get the record count
          const { parsePaymentFile } = await import('@/lib/payment-file-parser');
          const parseResult = await parsePaymentFile(selectedPaymentFile);
          
          if (parseResult.errors.length > 0 || !parseResult.records || parseResult.records.length === 0) {
            const errorMessage = parseResult.errors.length > 0 
              ? `Failed to parse payment file: ${parseResult.errors.join(', ')}`
              : 'Failed to parse payment file: No records found';
            throw new Error(errorMessage);
          }
          
          // Get current user for uploadedBy field
          const { data: { user } } = await supabase.auth.getUser();
          const uploadedBy = user?.email || 'admin';
          
          // Create payment file upload record
          const uploadResult = await createPaymentFileUpload(
            selectedPaymentFile.name,
            selectedPaymentFile.size,
            uploadedBy,
            parseResult.records.length
          );
          
          if (!uploadResult || !uploadResult.id) {
            throw new Error('Failed to create payment file upload record');
          }
          
          paymentUploadId = uploadResult.id;
          setPaymentFileUploadId(paymentUploadId);
          setPaymentProcessingProgress(30);

          // Convert parsed records to PaymentFileRecord format
          const paymentFileRecords: PaymentFileRecord[] = parseResult.records.map(record => ({
            ACCOUNT_NO: String(record.ACCOUNT_NO || ''),
            ACCOUNT_HOLDER_NAME: String(record.ACCOUNT_HOLDER_NAME || ''),
            ACCOUNT_STATUS: String(record.ACCOUNT_STATUS || ''),
            'OCC/OWN': String(record.OCC_OWN || ''),
            INDIGENT: String(record.INDIGENT === true ? 'Y' : String(record.INDIGENT || 'N')),
            OUTSTANDING_TOTAL_BALANCE: String(record.OUTSTANDING_TOTAL_BALANCE || '0'),
            LAST_PAYMENT_AMOUNT: String(record.LAST_PAYMENT_AMOUNT || '0'),
            LAST_PAYMENT_DATE: record.LAST_PAYMENT_DATE instanceof Date 
              ? record.LAST_PAYMENT_DATE.toISOString().split('T')[0] 
              : String(record.LAST_PAYMENT_DATE || '')
          }));

          setPaymentProcessingProgress(50);

          // Process payment file records
          const processResult = await processPaymentFileRecords(
            paymentUploadId,
            paymentFileRecords
          );

          if (processResult.failed > 0 && processResult.successful === 0) {
            throw new Error(`Failed to process payment file: ${processResult.errors.join(', ')}`);
          } else if (processResult.failed > 0) {
            console.warn(`Some payment records failed to process: ${processResult.errors.join(', ')}`);
          }

          setPaymentProcessingProgress(70);
          
          toast({
            title: "Payment File Processed",
            description: `Successfully processed ${processResult.successful} payment records`,
            variant: "default",
          });
        } catch (paymentError: any) {
          console.error('Payment file processing error:', paymentError);
          toast({
            title: "Payment Processing Warning",
            description: `Payment file processing failed: ${paymentError.message}. Continuing with account allocation...`,
            variant: "destructive",
          });
          // Continue with allocation even if payment processing fails
        } finally {
          setIsProcessingPayments(false);
        }
      }

      // Step 2: Allocate accounts to agents
      setPaymentProcessingProgress(80);
      
      const result = await allocateAccounts(
        currentBatchId,
        selectedAgents,
        allocationStrategy,
        priorityFilter
      );

      if (result.success) {
        setPaymentProcessingProgress(90);
        
        // Step 3: Update payment history for allocated accounts if payment file was processed
        if (paymentUploadId) {
          try {
            console.log('Starting payment history linking process...');
            console.log('Payment upload ID:', paymentUploadId);
            console.log('Current batch ID:', currentBatchId);
            
            // Get allocated accounts from the batch
            const { accounts } = await getAccountsByBatch(currentBatchId, 1, 1000);
            console.log('Found accounts for linking:', accounts?.length || 0);
            
            if (accounts && accounts.length > 0) {
              // First, let's check what payment records exist for this upload
              const { data: allPaymentRecords, error: fetchError } = await supabase
                .from('PaymentHistory')
                .select('*')
                .eq('upload_batch_id', paymentUploadId);
              
              console.log('Payment records found for upload:', allPaymentRecords?.length || 0);
              if (allPaymentRecords && allPaymentRecords.length > 0) {
                console.log('Sample payment record:', allPaymentRecords[0]);
              }
              
              // Update payment history records to link with debtor accounts
              let updatedCount = 0;
              for (const account of accounts) {
                const accountNumber = account.account_number || account.id_Number;
                console.log(`Processing account: ${accountNumber} (ID: ${account.id})`);
                
                if (accountNumber) {
                  try {
                    // Link payment history records to this debtor
                    const { data: paymentRecords, error } = await supabase
                      .from('PaymentHistory')
                      .update({ 
                        debtor_id: account.id,
                        updated_at: new Date().toISOString()
                      })
                      .eq('upload_batch_id', paymentUploadId)
                      .eq('account_no', accountNumber)
                      .select();
                    
                    if (error) {
                      console.error(`Supabase error for account ${accountNumber}:`, error);
                    } else if (paymentRecords && paymentRecords.length > 0) {
                      console.log(`Successfully linked ${paymentRecords.length} payment records for account ${accountNumber}`);
                      updatedCount += paymentRecords.length;
                    } else {
                      console.log(`No payment records found for account ${accountNumber}`);
                    }
                  } catch (linkError) {
                    console.error(`Error linking payment history for account ${accountNumber}:`, linkError);
                  }
                } else {
                  console.log('Account has no account number:', account);
                }
              }
              
              console.log(`Total payment records linked: ${updatedCount}`);
              
              if (updatedCount > 0) {
                toast({
                  title: "Payment History Updated",
                  description: `Successfully linked ${updatedCount} payment records to allocated accounts`,
                  variant: "default",
                });
              } else {
                toast({
                  title: "Payment History Warning",
                  description: "No payment records were linked to accounts. Check console for details.",
                  variant: "destructive",
                });
              }
            } else {
              console.log('No accounts found for linking');
            }
          } catch (linkingError: any) {
            console.error('Error linking payment history:', linkingError);
            toast({
              title: "Payment History Warning",
              description: "Accounts allocated successfully, but some payment history linking failed",
              variant: "destructive",
            });
          }
        }
        
        setPaymentProcessingProgress(100);
        setAllocationSuccess(true);
        
        toast({
          title: "Success",
          description: paymentUploadId 
            ? 'Accounts allocated successfully and payment history updated'
            : 'Accounts allocated successfully',
          variant: "default",
        });
        
        // Refresh preview accounts and payment history
        fetchPreviewAccounts(currentBatchId, priorityFilter);
        setPaymentHistoryRefreshTrigger(prev => prev + 1);
        
        // Clear payment file after successful processing
        setSelectedPaymentFile(null);
        setPaymentFileUploadId(null);
        
      } else {
        setAllocationError(result.error || 'Failed to allocate accounts');
        toast({
          title: "Error",
          description: result.error || 'Failed to allocate accounts',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setAllocationError(error.message);
      toast({
        title: "Error",
        description: `Error during allocation process: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAllocating(false);
      setIsProcessingPayments(false);
      setPaymentProcessingProgress(0);
    }
  };

  // Simulate validation after upload
  const handleValidate = () => {
    // In a real implementation, this would validate the uploaded file
    setValidationIssues(mockValidationIssues);
    setActiveTab("validate" as string);
  };

  // Simulate account allocation
  const handleAllocate = () => {
    // In a real implementation, this would allocate accounts to agents
    setActiveTab("allocate" as string);
  };

  // Get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
      case 'csv':
        return <FileText className="w-12 h-12 text-blue-500" />;
      default:
        return <FileX className="w-12 h-12 text-red-500" />;
    }
  };

  // Handle agent selection
  const handleAgentSelection = (agentId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedAgents(prev => [...prev, agentId]);
    } else {
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
    }
  };

  // Handle priority filter change
  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value as 'high-value' | 'overdue' | 'recent' | 'none');
  };

  // Handle allocation strategy change
  const handleAllocationStrategyChange = (value: string) => {
    setAllocationStrategy(value);
  };

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account Management
          </h1>
          <DateDisplay />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4 mr-1" />
            Download Template
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => router.push('/admin/all-accounts')}
          >
            <Database className="h-4 w-4 mr-1" />
            View All Accounts
          </Button>
        </div>
      </div>
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-800">
          <TabsTrigger value="upload" className="data-[state=active]:bg-indigo-600">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="validate" className="data-[state=active]:bg-amber-600" disabled={uploadStatus !== 'success'}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Validate
          </TabsTrigger>
          <TabsTrigger value="allocate" className="data-[state=active]:bg-green-600" disabled={uploadStatus !== 'success'}>
            <Users className="h-4 w-4 mr-2" />
            Allocate
          </TabsTrigger>
          <TabsTrigger value="payment-uploader" className="data-[state=active]:bg-blue-600">
            <FileText className="h-4 w-4 mr-2" />
            Payment Files
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab Content */}
        <TabsContent value="upload" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Upload Card */}
            <Card className="col-span-1 lg:col-span-2 border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Upload Accounts Data</CardTitle>
                <CardDescription>
                  Upload debtor information in XLSX, XLS, or CSV format
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* File Upload Area */}
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer 
                      ${selectedFile ? 'border-indigo-600 bg-indigo-900/10' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50'} 
                      transition-all duration-200`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {!selectedFile ? (
                        <>
                          <Upload className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-300">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">
                            XLSX, XLS, or CSV (MAX. 10MB)
                          </p>
                        </>
                      ) : (
                        <>
                          {getFileIcon(selectedFile.name)}
                          <p className="mb-2 text-sm text-slate-300 mt-3">
                            <span className="font-semibold">{selectedFile.name}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      disabled={uploadStatus !== 'idle'}
                    />
                  </label>
                </div>

                {/* Upload Progress */}
                {uploadStatus !== 'idle' && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">
                        {uploadStatus === 'uploading' ? 'Uploading...' : 
                         uploadStatus === 'success' ? 'Upload Complete' : 
                         'Upload Failed'}
                      </span>
                      <span className="text-sm font-medium text-slate-300">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          uploadStatus === 'error' ? 'bg-red-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    
                    {uploadStatus === 'success' && (
                      <div className="mt-4 p-4 rounded-lg bg-green-900/20 border border-green-800/40 flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-green-500">Upload Successful</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Your file has been successfully uploaded and is now being processed. This may take a few minutes.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {uploadStatus === 'error' && (
                      <div className="mt-4 p-4 rounded-lg bg-red-900/20 border border-red-800/40 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-red-500">Upload Failed</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            There was an error uploading your file. Please try again or contact support if the problem persists.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-slate-800 pt-6">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={!selectedFile || uploadStatus !== 'idle'}
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/admin/accounts/resume-upload')}
                    disabled={isUploading}
                  >
                    Resume Upload
                  </Button>
                </div>
                <Button 
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStatus !== 'idle'}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Instructions Card */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Upload Instructions</CardTitle>
                <CardDescription>
                  How to prepare your data for upload
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300">Required Columns</h3>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-start">
                      <span className="bg-amber-900/40 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-2 mt-0.5">1</span>
                      <span><strong className="text-slate-300">Customer Name</strong> - Full name of the debtor</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-900/40 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-2 mt-0.5">2</span>
                      <span><strong className="text-slate-300">Phone Number</strong> - Valid contact number</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-900/40 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-2 mt-0.5">3</span>
                      <span><strong className="text-slate-300">Balance</strong> - Outstanding amount</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-900/40 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-2 mt-0.5">4</span>
                      <span><strong className="text-slate-300">Status</strong> - Current or Overdue</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-amber-900/40 text-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-2 mt-0.5">5</span>
                      <span><strong className="text-slate-300">Last Contact</strong> - Date of last contact</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300">File Format Tips</h3>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span>Ensure your file is under 10MB</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span>Use the template for correct formatting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span>Dates should be in YYYY-MM-DD format</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span>Phone numbers should include country code</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/40 flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-xs text-slate-400">
                    Need help? Download our template file or contact support for assistance with formatting your data correctly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validate Tab Content */}
        <TabsContent value="validate" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Validation Summary */}
            <Card className="md:col-span-1 border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Validation Summary</CardTitle>
                <CardDescription>
                  Issues found in your uploaded file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {validationResult && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Records</p>
                        <p className="text-2xl font-bold text-slate-200">{parsedRecords.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Valid Records</p>
                        <p className="text-2xl font-bold text-green-400">{validationResult.validRecords.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Invalid Records</p>
                        <p className="text-2xl font-bold text-amber-400">{validationResult.invalidRecords.length}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-slate-300">Issues by Type</h3>
                      {validationIssues.length > 0 ? (
                        <ul className="space-y-2">
                          {validationIssues.map((issue) => (
                            <li key={issue.id} className="flex items-center justify-between p-2 rounded-md bg-slate-800/50 border border-slate-700/50">
                              <div>
                                <p className="text-sm font-medium text-slate-300">{issue.field}</p>
                                <p className="text-xs text-slate-400">{issue.issue}</p>
                              </div>
                              <Badge variant="outline" className="bg-amber-900/40 text-amber-400 border-amber-800/40">
                                {issue.count} {issue.count === 1 ? 'record' : 'records'}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/40 flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-xs text-slate-400">
                            No validation issues found. Your data is ready for allocation.
                          </p>
                        </div>
                      )}
                    </div>

                    {parsingWarnings.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-300">Warnings</h3>
                        <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/40 flex items-start">
                          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="space-y-2">
                            {parsingWarnings.map((warning, index) => (
                              <p key={index} className="text-xs text-slate-400">{warning}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {parsingErrors.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-300">Errors</h3>
                        <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/40 flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="space-y-2">
                            {parsingErrors.map((error, index) => (
                              <p key={index} className="text-xs text-slate-400">{error}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Required Fields</h3>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-start">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Name</strong> - Full name of the debtor</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">ID Number</strong> - 13-digit South African ID</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Cellphone</strong> - Valid contact number</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Status</strong> - Must be either &ldquo;Current&rdquo; or &ldquo;Overdue&rdquo;</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Balance</strong> - Must be a number without currency symbols</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/40 flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-xs text-slate-400">
                    You can edit your file and re-upload it, or fix individual issues using the &ldquo;Fix&rdquo; button next to each validation error.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Validation Details */}
            <Card className="md:col-span-2 border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">Validation Details</CardTitle>
                  <CardDescription>
                    Review and fix individual records
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export Issues
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Revalidate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {validationResult && validationResult.invalidRecords.length > 0 ? (
                  <div className="rounded-md border border-slate-800 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 bg-slate-900/50">
                          <TableHead className="text-slate-400 w-[100px]">Record</TableHead>
                          <TableHead className="text-slate-400">Field</TableHead>
                          <TableHead className="text-slate-400">Current Value</TableHead>
                          <TableHead className="text-slate-400">Issue</TableHead>
                          <TableHead className="text-slate-400 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.invalidRecords.slice(0, 10).map((item, recordIndex) => (
                          item.issues.map((issue, issueIndex) => (
                            <TableRow key={`${recordIndex}-${issueIndex}`} className="border-slate-800">
                              <TableCell className="font-medium text-slate-300">
                                {recordIndex + 1}
                              </TableCell>
                              <TableCell className="text-slate-400">
                                {issue.split(' ')[1]?.replace(/\..*$/, '') || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-slate-400">
                                {issue.includes('ID number') ? item.record.id_Number :
                                 issue.includes('email') ? item.record.email :
                                 issue.includes('cellphone') ? item.record.cellphone :
                                 issue.includes('balance') || issue.includes('amount') ? 
                                   (typeof item.record.current_balance === 'number' ? 
                                     item.record.current_balance.toString() : item.record.current_balance) :
                                 'Invalid value'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-amber-900/40 text-amber-400 border-amber-800/40">
                                  {issue}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" className="h-7 px-2">
                                  Fix
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ))}
                      </TableBody>
                    </Table>
                    
                    {validationResult.invalidRecords.length > 10 && (
                      <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800">
                        Showing 10 of {validationResult.invalidRecords.length} records with issues. 
                        <Button variant="link" className="h-auto p-0 ml-1 text-xs text-indigo-400">
                          View All
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-xl font-medium text-slate-300 mb-2">All Records Valid</h3>
                    <p className="text-sm text-slate-400 max-w-md">
                      No validation issues found in your data. You can proceed to the allocation step.
                    </p>
                    <Button 
                      variant="default" 
                      className="mt-6 bg-green-600 hover:bg-green-700"
                      onClick={() => setActiveTab("allocate" as string)}
                    >
                      Continue to Allocation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Allocate Tab Content */}
        <TabsContent value="allocate" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="col-span-1 lg:col-span-2 border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Allocate Accounts</CardTitle>
                <CardDescription>
                  Assign accounts to debt collection agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Allocation Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Allocation Method</label>
                      <Select 
                        defaultValue="balanced"
                        value={allocationStrategy}
                        onValueChange={handleAllocationStrategyChange}
                      >
                        <SelectTrigger className="bg-slate-950/50 border-slate-800">
                          <SelectValue placeholder="Select allocation method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced (Default)</SelectItem>
                          <SelectItem value="performance">By Performance</SelectItem>
                          <SelectItem value="manual">Manual Allocation</SelectItem>
                          <SelectItem value="value">By Account Value</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Balanced allocation distributes accounts evenly among agents
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Priority Accounts</label>
                      <Select 
                        defaultValue="high-value"
                        value={priorityFilter}
                        onValueChange={handlePriorityFilterChange}
                      >
                        <SelectTrigger className="bg-slate-950/50 border-slate-800">
                          <SelectValue placeholder="Select priority setting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high-value">High Value First</SelectItem>
                          <SelectItem value="overdue">Overdue First</SelectItem>
                          <SelectItem value="recent">Recently Added</SelectItem>
                          <SelectItem value="none">No Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Determines which accounts get priority allocation
                      </p>
                    </div>
                  </div>

                  {/* Batch Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Select Batch</label>
                    <Select 
                      value={currentBatchId || ""}
                      onValueChange={(value) => setCurrentBatchId(value)}
                    >
                      <SelectTrigger className="bg-slate-950/50 border-slate-800">
                        <SelectValue placeholder="Select a batch to allocate" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingBatches ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading batches...
                            </div>
                          </SelectItem>
                        ) : accountBatches.length === 0 ? (
                          <SelectItem value="none" disabled>No batches available</SelectItem>
                        ) : (
                          accountBatches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} ({batch.record_count} accounts)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Select which batch of accounts to allocate
                    </p>
                  </div>

                  {/* Payment File Selection (Optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center">
                      Payment File (Optional)
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-900/20 text-blue-400 border-blue-800/40">
                        New Feature
                      </Badge>
                    </label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                      {selectedPaymentFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-slate-300">{selectedPaymentFile.name}</p>
                              <p className="text-xs text-slate-500">
                                {(selectedPaymentFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPaymentFile(null)}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileSpreadsheet className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-400 mb-2">
                            Upload a payment file to update payment history during allocation
                          </p>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedPaymentFile(file);
                              }
                            }}
                            className="hidden"
                            id="payment-file-input"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('payment-file-input')?.click()}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Select Payment File
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Payment files will be processed and linked to allocated accounts automatically
                    </p>
                  </div>

                  {/* Agents List */}
                  <div className="rounded-lg border border-slate-800 overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-3 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-slate-300">Available Agents</h3>
                      <Badge variant="outline" className="text-xs">
                        {agents.length} agents
                      </Badge>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {isLoadingAgents ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                      ) : agents.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No agents available
                        </div>
                      ) : (
                        agents.map((agent) => (
                          <div key={agent.id} className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                id={`agent-${agent.id}`} 
                                checked={selectedAgents.includes(agent.id)}
                                onCheckedChange={(checked) => 
                                  handleAgentSelection(agent.id, checked === true)
                                }
                              />
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-indigo-700 text-xs">
                                    {agent.name ? agent.name.substring(0, 2).toUpperCase() : 'AG'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-slate-200">{agent.name}</p>
                                  <p className="text-xs text-slate-500">{agent.email}</p>
                                </div>
                              </div>
                            </div>
                            <Badge variant={agent.role === 'agent' ? 'default' : 'outline'} className="text-xs">
                              {agent.role}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Accounts to Allocate Preview */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Accounts to Allocate</h3>
                    <div className="rounded-lg border border-slate-800 overflow-hidden">
                      {isLoadingAccounts ? (
                        <div className="px-4 py-8 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-slate-400 animate-spin mr-2" />
                          <p className="text-sm text-slate-400">Loading accounts preview...</p>
                        </div>
                      ) : accountsPreview.length === 0 ? (
                        <div className="px-4 py-8 flex items-center justify-center">
                          <div className="text-center">
                            <FileX className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No accounts found with current filter</p>
                            <p className="text-xs text-slate-500 mt-1">Try changing the priority filter or check if accounts were uploaded correctly</p>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto">
                          {accountsPreview.map((account) => (
                            <div key={account.id} className="px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-300">
                                  {account.name || 'N/A'} {account.surname || ''}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {account.id_Number || 'No ID'} • {account.cellphone || 'No Phone'}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className={
                                  account.days_since_last_payment > 30 
                                    ? "bg-red-900/20 text-red-400 border-red-800/40"
                                    : "bg-green-900/20 text-green-400 border-green-800/40"
                                }>
                                  {account.days_since_last_payment > 30 ? 'Overdue' : 'Current'}
                                </Badge>
                                <p className="text-sm font-medium text-slate-300">
                                  R{typeof account.current_balance === 'number' 
                                    ? account.current_balance.toLocaleString() 
                                    : parseFloat(account.current_balance || '0').toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {accountsPreview.length > 0 && (
                            <div className="px-4 py-2 bg-slate-800/30 text-center text-xs text-slate-500">
                              Showing preview of {accountsPreview.length} accounts • Filter: {
                                priorityFilter === 'high-value' ? 'High Value First' :
                                priorityFilter === 'overdue' ? 'Overdue First' :
                                priorityFilter === 'recent' ? 'Recently Added' : 'No Priority'
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardContent className="space-y-4">
                {/* Allocation Status */}
                {allocationSuccess && (
                  <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-md flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-500">Accounts allocated successfully</p>
                  </div>
                )}

                {allocationError && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-500">{allocationError}</p>
                  </div>
                )}

                {/* Payment Processing Progress */}
                {(isProcessingPayments || paymentProcessingProgress > 0) && (
                  <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-5 w-5 text-blue-400 mr-2" />
                        <p className="text-sm text-blue-400 font-medium">
                          {isProcessingPayments ? 'Processing Payment File...' : 'Payment Processing Complete'}
                        </p>
                      </div>
                      <span className="text-xs text-blue-300">{Math.round(paymentProcessingProgress)}%</span>
                    </div>
                    <Progress 
                      value={paymentProcessingProgress} 
                      className="h-2 bg-slate-800"
                    />
                    <p className="text-xs text-blue-300 mt-2">
                      {selectedPaymentFile ? `Processing ${selectedPaymentFile.name}` : 'Payment file processing'}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-slate-800 pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("validate" as string)}
                >
                  Back to Validation
                </Button>
                <Button 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAllocateAccounts}
                  disabled={isAllocating || selectedAgents.length === 0 || !currentBatchId}
                >
                  {isAllocating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isProcessingPayments ? 'Processing Payments...' : 'Allocating...'}
                    </>
                  ) : allocationSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      {selectedPaymentFile ? 'Allocation & Payment Processing Complete' : 'Allocation Successful'}
                    </>
                  ) : allocationError ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Allocation Failed
                    </>
                  ) : (
                    selectedPaymentFile ? 'Allocate Accounts & Process Payments' : 'Allocate Accounts'
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Allocation Tips Card */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Allocation Tips</CardTitle>
                <CardDescription>
                  Best practices for account allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-green-400 mb-2">Allocation Methods</h3>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Balanced</strong> - Evenly distributes accounts among agents</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Performance</strong> - Allocates more accounts to higher performing agents</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Manual</strong> - Allows you to manually assign accounts to specific agents</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5" />
                      <span><strong className="text-slate-300">Value</strong> - Distributes accounts based on monetary value</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/40">
                  <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Payment Integration
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">
                    Upload a payment file during allocation to automatically update payment history for allocated accounts.
                  </p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Payment records are automatically linked to debtor accounts</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Payment history is updated in real-time during allocation</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Supports XLSX, XLS, and CSV payment file formats</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/40 flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-xs text-slate-400">
                    Consider agent workload and performance when allocating accounts. High-value accounts should typically be assigned to your best-performing agents.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab Content */}
        <TabsContent value="history" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {/* Account Statistics */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Account Statistics</CardTitle>
                  <CardDescription>
                    Overview of all accounts in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col">
                      <span className="text-xs text-slate-400">Total Accounts</span>
                      <span className="text-2xl font-bold text-slate-200 mt-1">
                        {accountStats.totalAccounts.toLocaleString()}
                      </span>
                      <div className="mt-2 flex items-center text-xs">
                        <Badge variant="outline" className="bg-blue-900/40 text-blue-400 border-blue-800/40">
                          System
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col">
                      <span className="text-xs text-slate-400">Active Accounts</span>
                      <span className="text-2xl font-bold text-slate-200 mt-1">
                        {accountStats.activeAccounts.toLocaleString()}
                      </span>
                      <div className="mt-2 flex items-center text-xs">
                        <span className="text-green-400 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.round((accountStats.activeAccounts / accountStats.totalAccounts) * 100)}%
                        </span>
                        <span className="text-slate-500 ml-2">of total</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col">
                      <span className="text-xs text-slate-400">Overdue Accounts</span>
                      <span className="text-2xl font-bold text-slate-200 mt-1">
                        {accountStats.overdueAccounts.toLocaleString()}
                      </span>
                      <div className="mt-2 flex items-center text-xs">
                        <span className="text-amber-400 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.round((accountStats.overdueAccounts / accountStats.totalAccounts) * 100)}%
                        </span>
                        <span className="text-slate-500 ml-2">of total</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col">
                      <span className="text-xs text-slate-400">Total Value</span>
                      <span className="text-2xl font-bold text-slate-200 mt-1">
                        R{(accountStats.totalValue / 1000000).toFixed(2)}M
                      </span>
                      <div className="mt-2 flex items-center text-xs">
                        <Badge variant="outline" className="bg-green-900/40 text-green-400 border-green-800/40">
                          Avg: R{accountStats.averageBalance.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 bg-slate-800" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-300">Account Distribution</h3>
                      <Select defaultValue="all">
                        <SelectTrigger className="h-8 text-xs bg-slate-950/50 border-slate-800 w-32">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">High Value Accounts</span>
                          <span className="text-xs font-medium text-slate-300">
                            {accountStats.highValueAccounts.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${(accountStats.highValueAccounts / accountStats.totalAccounts) * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {Math.round((accountStats.highValueAccounts / accountStats.totalAccounts) * 100)}% of total accounts
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">Recently Added</span>
                          <span className="text-xs font-medium text-slate-300">
                            {accountStats.recentlyAdded.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(accountStats.recentlyAdded / accountStats.totalAccounts) * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Added in the last 30 days
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Import History */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Import History</CardTitle>
                  <CardDescription>
                    Recent account imports and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-400">ID</TableHead>
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400">Accounts</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">User</TableHead>
                        <TableHead className="text-slate-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importHistory.map((item) => (
                        <TableRow key={item.id} className="border-slate-800">
                          <TableCell className="font-medium text-slate-300">{item.id}</TableCell>
                          <TableCell className="text-slate-400">{item.date}</TableCell>
                          <TableCell className="text-slate-400">{item.accounts}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${
                              item.status === 'completed' 
                                ? 'bg-green-900/40 text-green-400 border-green-800/40' 
                                : 'bg-red-900/40 text-red-400 border-red-800/40'
                            }`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400">{item.user}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="h-8">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Tips and Actions Card */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
              <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Account Management</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      View All Accounts
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Agent Allocations
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Account Data
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">System Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-slate-400">Database</span>
                      </div>
                      <span className="text-xs text-green-400">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-slate-400">API</span>
                      </div>
                      <span className="text-xs text-green-400">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                        <span className="text-xs text-slate-400">Import Service</span>
                      </div>
                      <span className="text-xs text-amber-400">Degraded</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-slate-400">Allocation Engine</span>
                      </div>
                      <span className="text-xs text-green-400">Operational</span>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/40 flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      Need to modify existing accounts? Use the <strong>View All Accounts</strong> option to search and edit individual records.
                    </p>
                    <p className="text-xs text-slate-400">
                      For bulk updates, export the data, make changes, and re-import the file.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment File Uploader Tab Content */}
        <TabsContent value="payment-uploader" className="mt-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg mr-3">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-200">Payment File Management</h2>
                  <p className="text-sm text-slate-400">Upload and process payment files to update customer balances</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200">
                  <Download className="h-4 w-4 mr-2" /> Download History
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200">
                  <FileText className="h-4 w-4 mr-2" /> View Payment Logs
                </Button>
              </div>
            </div>
            
            {/* Payment Metrics Cards - Real-time data */}
            <PaymentMetricsCards />
            
            <PaymentFileUploader 
              onUploadComplete={() => {
                // Trigger refresh of payment file history
                setPaymentHistoryRefreshTrigger(prev => prev + 1);
              }}
            />
            
            {/* Payment File History */}
            <PaymentFileHistory refreshTrigger={paymentHistoryRefreshTrigger} />
            
            <div className="mt-6 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex items-start">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">About Payment File Processing</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Payment files are processed in batches and may take a few minutes to complete. Once processed, the system will automatically update customer balances and payment history. 
                  You can view the processing history and logs by clicking the &quot;View Payment Logs&quot; button above.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
