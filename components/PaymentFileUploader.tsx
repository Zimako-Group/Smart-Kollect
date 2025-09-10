"use client";

import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle, 
  Clock,
  ArrowRight,
  ArrowDownToLine,
  ArrowDown,
  Download,
  FileText,
  FileX,
  Info,
  Database
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { parsePaymentFile, validatePaymentRecords, formatPaymentRecords, PaymentRecord, generatePaymentFileTemplate } from '@/lib/payment-file-parser';
import { createPaymentBatch, processPaymentRecords, updatePaymentBatchStatus } from '@/lib/payment-service';
import { incrementFilesProcessed, updatePaymentsProcessed, updatePendingValidations, incrementFailedUploads } from '@/lib/payment-metrics-service';
import { updateCustomerFinancialSummary } from '@/lib/customer-financial-service';
import { supabase } from '@/lib/supabaseClient';
import { 
  createPaymentFile, 
  markProcessingStarted, 
  markProcessingCompleted, 
  markProcessingFailed,
  checkFileHashExists,
  generateFileHash,
  PaymentFileMetadata 
} from '@/lib/payment-file-service';
import { 
  insertPaymentRecordsBatch,
  BatchProcessingResult 
} from '@/lib/payment-records-service';
import { getAllocationStats, canAllocatePayments, getAllocationDetails } from '@/lib/payment-allocation-service';
import { AllocationProgress } from '@/lib/direct-payment-allocation-service';
import { allocatePaymentsDirect, resetFailedPaymentRecords } from '@/lib/direct-payment-allocation-service';
import { useInterval } from '@/lib/hooks/use-interval';

interface PaymentFileUploaderProps {
  onUploadComplete?: () => void;
}

export default function PaymentFileUploader({ onUploadComplete }: PaymentFileUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File selection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    'idle' | 'parsing' | 'validating' | 'processing' | 'complete' | 'error'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Results state
  const [parsedRecords, setParsedRecords] = useState<PaymentRecord[]>([]);
  const [validRecords, setValidRecords] = useState<PaymentRecord[]>([]);
  const [formattedRecords, setFormattedRecords] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [processingResults, setProcessingResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  // Batch state
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Payment file metadata state
  const [currentPaymentFileId, setCurrentPaymentFileId] = useState<string | null>(null);
  const [paymentFileMetadata, setPaymentFileMetadata] = useState<PaymentFileMetadata | null>(null);

  // Batch processing state
  const [batchProcessingResult, setBatchProcessingResult] = useState<BatchProcessingResult | null>(null);
  const [batchProgress, setBatchProgress] = useState({ processed: 0, total: 0 });

  // Payment allocation state
  const [allocationResult, setAllocationResult] = useState<AllocationProgress | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);
  const [canAllocate, setCanAllocate] = useState(false);
  const [allocationStats, setAllocationStats] = useState<any>(null);
  const [allocationProgress, setAllocationProgress] = useState<AllocationProgress | null>(null);
  const [processingRate, setProcessingRate] = useState<number>(0);
  const [lastProcessedCount, setLastProcessedCount] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an XLSX, XLS, or CSV file',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Generate file hash for duplicate detection
      const fileContent = await file.arrayBuffer();
      const fileHash = await generateFileHash(fileContent);
      
      // Check if file already exists
      const { exists, file: existingFile } = await checkFileHashExists(fileHash);
      if (exists && existingFile) {
        toast({
          title: 'Duplicate file detected',
          description: `This file was already uploaded on ${new Date(existingFile.upload_date!).toLocaleDateString()}`,
          variant: 'destructive',
        });
        return;
      }
      
      // Create payment file record
      const { data: paymentFile, error } = await createPaymentFile({
        file_name: file.name,
        file_size: file.size,
        file_type: fileExtension || 'unknown',
        file_content: fileContent,
        metadata: {
          original_name: file.name,
          upload_source: 'web_uploader'
        }
      });
      
      if (error) {
        console.error('Error creating payment file record:', error);
        toast({
          title: 'Error',
          description: 'Failed to create file record. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (paymentFile) {
        setCurrentPaymentFileId(paymentFile.id!);
        setPaymentFileMetadata(paymentFile);
        toast({
          title: 'File selected',
          description: 'File has been selected and recorded successfully.',
        });
      }
      
    } catch (error) {
      console.error('Error handling file selection:', error);
      toast({
        title: 'Error',
        description: 'Failed to process file. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    // Set the selected file first
    setSelectedFile(file);
    
    // Reset other state variables but preserve the payment file ID
    setProcessingStep('idle');
    setProgress(0);
    setProgressMessage('');
    setParsedRecords([]);
    setValidRecords([]);
    setFormattedRecords([]);
    setErrors([]);
    setWarnings([]);
    setProcessingResults(null);
    setCurrentBatchId(null);
    setBatchProcessingResult(null);
    setBatchProgress({ processed: 0, total: 0 });
    setAllocationResult(null);
    setIsAllocating(false);
    setCanAllocate(false);
    setAllocationStats(null);
  };

  // Reset state when a new file is selected
  const resetState = () => {
    setProcessingStep('idle');
    setProgress(0);
    setProgressMessage('');
    setParsedRecords([]);
    setValidRecords([]);
    setFormattedRecords([]);
    setErrors([]);
    setWarnings([]);
    setProcessingResults(null);
    setCurrentBatchId(null);
    // Don't reset the payment file ID when a file is selected
    // setCurrentPaymentFileId(null);
    // setPaymentFileMetadata(null);
    setBatchProcessingResult(null);
    setBatchProgress({ processed: 0, total: 0 });
    setAllocationResult(null);
    setIsAllocating(false);
    setCanAllocate(false);
    setAllocationStats(null);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Click handler for the drop zone
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Process the selected file
  const processFile = async () => {
    console.log('processFile called');
    console.log('selectedFile:', selectedFile);
    console.log('currentPaymentFileId:', currentPaymentFileId);
    
    if (!selectedFile || !currentPaymentFileId) {
      console.log('Missing selectedFile or currentPaymentFileId');
      return;
    }
    
    console.log('Starting file processing...');
    setIsProcessing(true);
    setProcessingStep('parsing');
    setProgress(10);
    setProgressMessage('Parsing file...');
    
    // Mark processing as started
    const processingStartTime = new Date().toISOString();
    await markProcessingStarted(currentPaymentFileId);
    
    try {
      // Parse the file
      const { records, errors: parsingErrors } = await parsePaymentFile(selectedFile);
      setParsedRecords(records);
      setErrors(parsingErrors);
      
      if (parsingErrors.length > 0) {
        toast({
          title: 'Parsing errors',
          description: `${parsingErrors.length} errors found while parsing the file`,
          variant: 'destructive',
        });
        
        if (records.length === 0) {
          setProcessingStep('error');
          setProgressMessage('Failed to parse file. Please check the errors and try again.');
          setIsProcessing(false);
          
          // Track failed upload
          await incrementFailedUploads();
          return;
        }
      }
      
      setProgress(30);
      setProcessingStep('validating');
      setProgressMessage('Validating records...');
      
      // Validate the records
      const validationResult = validatePaymentRecords(records);
      setValidRecords(validationResult.validRecords);
      setWarnings(validationResult.warnings.map(w => `${w.field}: ${w.message}`));
      
      // Track pending validations if there are errors
      if (validationResult.errors.length > 0) {
        await updatePendingValidations(validationResult.errors.length);
      }
      
      if (!validationResult.valid) {
        const validationErrors = validationResult.errors.map(e => `${e.field}: ${e.message}`);
        setErrors(prev => [...prev, ...validationErrors]);
        
        toast({
          title: 'Validation errors',
          description: `${validationResult.errors.length} validation errors found`,
          variant: 'destructive',
        });
        
        if (validationResult.validRecords.length === 0) {
          setProcessingStep('error');
          setProgressMessage('No valid records found. Please check the errors and try again.');
          setIsProcessing(false);
          return;
        }
      }
      
      // Format the valid records for display
      const formatted = formatPaymentRecords(validationResult.validRecords);
      setFormattedRecords(formatted);
      
      setProgress(70);
      setProcessingStep('processing');
      setProgressMessage('Saving records to database...');
      
      // Process the records using batch processing
      const batchResult = await insertPaymentRecordsBatch(
        validationResult.validRecords,
        currentPaymentFileId,
        1000, // Batch size of 1000 records
        (processed, total) => {
          setBatchProgress({ processed, total });
          const progressPercent = 70 + (processed / total) * 25; // 70-95% range
          setProgress(progressPercent);
          setProgressMessage(`Processing records: ${processed}/${total}`);
        }
      );
      
      setBatchProcessingResult(batchResult);
      
      // Create a legacy batch record for compatibility (optional)
      const batch = await createPaymentBatch({
        name: `Payment Import - ${new Date().toLocaleDateString()}`,
        description: `Imported from ${selectedFile.name}`,
        status: batchResult.failed_records > 0 ? 'failed' as const : 'completed' as const,
        total_records: batchResult.total_records,
        successful_records: batchResult.successful_records,
        failed_records: batchResult.failed_records,
        created_by: 'system',
        file_name: selectedFile.name,
        file_size: selectedFile.size
      });
      setCurrentBatchId(batch.id);
      
      // Use batch result instead of old results
      const results = {
        successful: batchResult.successful_records,
        failed: batchResult.failed_records,
        errors: batchResult.errors.map(e => e.error)
      };
      
      setProcessingResults(results);
      
      // Update batch status
      await updatePaymentBatchStatus(batch.id, 'completed', {
        successful_records: results.successful,
        failed_records: results.failed
      });
      
      // Track metrics for successful processing
      await incrementFilesProcessed();
      
      // Calculate total payment amount from the formatted records
      const totalAmount = formatted.reduce((sum, record) => {
        const amount = parseFloat(record.amount?.toString() || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      await updatePaymentsProcessed(results.successful, totalAmount);
      
      // Update customer financial summaries for each processed payment
      if (results.successful > 0) {
        try {
          // Group payments by customer account
          const paymentsByAccount = validationResult.validRecords.reduce((acc, record) => {
            if (!record.account_number) return acc;
            
            if (!acc[record.account_number]) {
              acc[record.account_number] = [];
            }
            acc[record.account_number].push(record);
            return acc;
          }, {} as Record<string, PaymentRecord[]>);
          
          // Update each customer's financial summary
          for (const [accountNumber, payments] of Object.entries(paymentsByAccount)) {
            const totalPaid = payments.reduce((sum, payment) => {
              const amount = parseFloat(payment.amount?.toString() || '0');
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            if (totalPaid > 0) {
              // This will update the outstanding balance, payment progress, and last payment info
              await updateCustomerFinancialSummary(accountNumber, totalPaid);
            }
          }
          
          setProgressMessage('Processing complete - Customer financial data updated');
        } catch (error) {
          console.error('Error updating customer financial summaries:', error);
          setProgressMessage('Processing complete - Note: Some customer financial data may not be updated');
        }
      }
      
      // Mark processing as completed
      await markProcessingCompleted(currentPaymentFileId, {
        records_count: batchResult.total_records,
        valid_records_count: batchResult.successful_records,
        invalid_records_count: batchResult.failed_records,
        errors_count: batchResult.errors.length,
        warnings_count: 0,
        batch_id: batchResult.batch_id,
        processing_started_at: processingStartTime
      });
      
      // Check if payments can be allocated
      if (batchResult.successful_records > 0) {
        const canAllocatePaymentRecordsResult = await canAllocatePayments(currentPaymentFileId);
        setCanAllocate(canAllocatePaymentRecordsResult);
        
        // Get initial allocation stats
        const stats = await getAllocationStats(currentPaymentFileId);
        setAllocationStats(stats);
      }
      
      setProgress(100);
      setProcessingStep('complete');
      setProgressMessage('File processing completed successfully!');
      
      // Trigger refresh of payment file history
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      
      setProcessingStep('error');
      setProgressMessage(`Error: ${error.message}`);
      
      // Mark processing as failed
      await markProcessingFailed(currentPaymentFileId, error.message);
      
      // Track failed upload
      await incrementFailedUploads();
      
      toast({
        title: 'Processing error',
        description: error.message,
        variant: 'destructive',
      });
      
      // Update batch status if a batch was created
      if (currentBatchId) {
        await updatePaymentBatchStatus(currentBatchId, 'failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate processing rate and estimated time remaining
  useInterval(() => {
    if (isAllocating && allocationProgress && allocationStats) {
      // Calculate records processed since last check
      const currentProcessed = allocationProgress.total_processed;
      const recordsProcessedSinceLastCheck = currentProcessed - lastProcessedCount;
      setLastProcessedCount(currentProcessed);
      
      // Calculate processing rate (records per second) with smoothing
      const rate = recordsProcessedSinceLastCheck;
      // Apply exponential moving average for smoother rate calculation
      const smoothedRate = processingRate > 0 
        ? processingRate * 0.7 + rate * 0.3 
        : rate;
      setProcessingRate(smoothedRate);
      
      // Calculate estimated time remaining with better formatting
      const remainingRecords = allocationStats.total - currentProcessed;
      if (smoothedRate > 0) {
        const secondsRemaining = Math.ceil(remainingRecords / smoothedRate);
        if (secondsRemaining < 60) {
          setEstimatedTimeRemaining(`${secondsRemaining} seconds`);
        } else if (secondsRemaining < 3600) {
          setEstimatedTimeRemaining(`${Math.ceil(secondsRemaining / 60)} minutes`);
        } else {
          const hours = Math.floor(secondsRemaining / 3600);
          const minutes = Math.ceil((secondsRemaining % 3600) / 60);
          setEstimatedTimeRemaining(`${hours}h ${minutes}m`);
        }
      } else {
        setEstimatedTimeRemaining('calculating...');
      }
    }
  }, 1000); // Update every second for more responsive progress

  // Handle payment allocation with improved error handling and progress tracking
  const handleAllocatePayments = async () => {
    if (!paymentFileMetadata?.id) {
      toast({
        title: 'Error',
        description: 'No payment file selected for allocation',
        variant: 'destructive'
      });
      return;
    }

    setIsAllocating(true);
    
    // Keep existing progress if we're resuming an allocation
    if (!allocationProgress) {
      setAllocationResult(null);
      setAllocationProgress(null);
      setLastProcessedCount(0);
      setProcessingRate(0);
      setEstimatedTimeRemaining('');
    }

    try {
      // Use only direct allocation method
      console.log('Starting direct payment allocation...');
      
      // Reset any records that might have been marked as failed
      if (!allocationProgress || allocationProgress.total_processed === 0) {
        await resetFailedPaymentRecords(paymentFileMetadata.id);
      } else {
        console.log('Resuming previous allocation, skipping reset of failed records');
      }
      
      // Use the robust large file processing method instead of timeout protection
      const { processLargePaymentFile } = await import('@/lib/direct-payment-allocation-service');
      
      // Get detailed allocation stats for better progress tracking
      const { getDetailedAllocationStats } = await import('@/lib/payment-allocation-service');
      const detailedStats = await getDetailedAllocationStats(paymentFileMetadata.id);
      setAllocationStats(detailedStats);
      
      // Process large payment file with automatic resuming
      const progress = await processLargePaymentFile(
        paymentFileMetadata.id,
        (progressUpdate: AllocationProgress) => {
          // Update progress in real-time with better tracking
          setAllocationProgress(progressUpdate);
          
          // Update UI with more detailed progress information
          if (progressUpdate.total_processed > 0) {
            const percentage = Math.min(100, Math.round((progressUpdate.total_processed / (detailedStats?.total || progressUpdate.total_processed)) * 100));
            setProgressMessage(`Allocating payments: ${progressUpdate.total_processed}/${detailedStats?.total || 'unknown'} (${percentage}%)`);
          }
        },
        20 // Increased max attempts for very large files
      );
      
      // Set final progress
      setAllocationProgress(progress);
      setAllocationResult(progress);
      
      // Get updated allocation stats
      const stats = await getDetailedAllocationStats(paymentFileMetadata.id);
      setAllocationStats(stats);
      
      // Check if more payments can be allocated
      const { canAllocatePayments } = await import('@/lib/payment-allocation-service');
      const canStillAllocate = await canAllocatePayments(paymentFileMetadata.id);
      setCanAllocate(canStillAllocate);

      if (progress.is_complete) {
        toast({
          title: 'Allocation Complete',
          description: `Successfully processed ${progress.total_processed} records. ${progress.accounts_updated} updated, ${progress.accounts_created} created.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Allocation Paused',
          description: `Processed ${progress.total_processed} records so far. Click 'Resume Allocation' to continue.`,
          variant: 'default'
        });
      }
      
    } catch (error: any) {
      console.error('Payment allocation error:', error);
      
      // Check if we have partial progress that we can resume from
      if (allocationProgress && allocationProgress.total_processed > 0) {
        toast({
          title: 'Allocation Paused',
          description: `Processed ${allocationProgress.total_processed} records so far. Click 'Resume Allocation' to continue.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Allocation Failed',
          description: error.message || 'Failed to allocate payments',
          variant: 'destructive'
        });
      }
    } finally {
      setIsAllocating(false);
    }
  };
  
  // Cancel processing
  const cancelProcessing = () => {
    if (isProcessing && currentBatchId) {
      updatePaymentBatchStatus(currentBatchId, 'failed')
        .catch(error => {
          console.error('Error cancelling processing:', error);
        });
    }
    
    setIsProcessing(false);
    setProcessingStep('idle');
    setProgress(0);
    setProgressMessage('');
  };

  // Clear the selected file
  const clearFile = () => {
    setSelectedFile(null);
    resetState();
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download a template file
  const downloadTemplate = () => {
    // Use the new template generation function
    const content = generatePaymentFileTemplate();
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template Downloaded',
      description: 'Payment file template has been downloaded successfully.',
    });
  };

  // Render the file upload zone
  const renderFileUploadZone = () => {
    return (
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out
          ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20' : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50'}
          ${selectedFile ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-900/40'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleDropZoneClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
        />
        
        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-full">
                <FileSpreadsheet className="h-12 w-12" />
              </div>
            </div>
            <p className="text-xl font-medium text-slate-200 mb-1">{selectedFile.name}</p>
            <p className="text-sm text-slate-400 mb-6">
              {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.type || 'Unknown type'}
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                <X className="h-4 w-4 mr-2" /> Clear
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Process File button clicked');
                  console.log('Current state:', { 
                    selectedFile, 
                    currentPaymentFileId, 
                    paymentFileMetadata 
                  });
                  
                  if (!selectedFile) {
                    toast({
                      title: 'Error',
                      description: 'No file selected. Please select a file first.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  if (!currentPaymentFileId) {
                    toast({
                      title: 'Error',
                      description: 'File ID not found. Please try selecting the file again.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  try {
                    processFile();
                  } catch (error: any) {
                    console.error('Error calling processFile:', error);
                    toast({
                      title: 'Processing Error',
                      description: error.message || 'An unexpected error occurred',
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Process File
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md group-hover:bg-blue-500/20 transition-all duration-300"></div>
              <div className="relative bg-slate-800 text-slate-400 group-hover:text-blue-400 p-6 rounded-full transition-all duration-300">
                <Upload className="h-14 w-14 transition-transform group-hover:scale-110 duration-300" />
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-xl font-medium text-slate-200">Drag and drop your file here</p>
              <p className="text-slate-400">or click to browse</p>
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/80 text-slate-400 text-sm mb-6">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-400" />
              Supports XLSX, XLS, and CSV files up to 10MB
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 group"
              onClick={(e) => {
                e.stopPropagation();
                downloadTemplate();
              }}
            >
              <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" /> Download Template
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render the processing status
  const renderProcessingStatus = () => {
    if (processingStep === 'idle') return null;
    
    const getStepColor = () => {
      switch (processingStep) {
        case 'parsing':
        case 'validating':
        case 'processing':
          return 'text-blue-500';
        case 'complete':
          return 'text-green-500';
        case 'error':
          return 'text-red-500';
        default:
          return 'text-blue-500';
      }
    };
    
    return (
      <div className="mt-8 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {processingStep === 'parsing' && (
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm animate-pulse"></div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 relative" />
              </div>
            )}
            {processingStep === 'validating' && (
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm animate-pulse"></div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 relative" />
              </div>
            )}
            {processingStep === 'processing' && (
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-sm animate-pulse"></div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 relative" />
              </div>
            )}
            {processingStep === 'complete' && (
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm"></div>
                <CheckCircle className="h-5 w-5 text-green-500 relative" />
              </div>
            )}
            {processingStep === 'error' && (
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-sm"></div>
                <AlertCircle className="h-5 w-5 text-red-500 relative" />
              </div>
            )}
            <span className={`font-medium text-lg ${getStepColor()}`}>
              {processingStep === 'parsing' && 'Parsing File'}
              {processingStep === 'validating' && 'Validating Records'}
              {processingStep === 'processing' && 'Processing Records'}
              {processingStep === 'complete' && 'Processing Complete'}
              {processingStep === 'error' && 'Processing Error'}
            </span>
          </div>
          <div className="bg-slate-900/60 px-3 py-1 rounded-full">
            <span className={`text-sm font-medium ${getStepColor()}`}>{progress}%</span>
          </div>
        </div>
        
        <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-4">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full ${processingStep === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
            style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}
          ></div>
        </div>
        
        {batchProgress.total > 0 && processingStep === 'processing' && (
          <div className="mt-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Database Batch Progress</span>
              <span className="text-sm text-slate-400">
                {batchProgress.processed.toLocaleString()} / {batchProgress.total.toLocaleString()} records
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(batchProgress.processed / batchProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-400">
              <span>Batch Size: 1,000 records</span>
              <span>{((batchProgress.processed / batchProgress.total) * 100).toFixed(1)}% complete</span>
            </div>
          </div>
        )}
        
        <p className="text-sm text-slate-400 mt-2">{progressMessage}</p>
        
        {isProcessing && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
            onClick={cancelProcessing}
          >
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
        )}
      </div>
    );
  };

  // Render the results summary
  const renderResultsSummary = () => {
    if (processingStep !== 'complete' && processingStep !== 'error') return null;
    
    return (
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <div className="relative mr-3">
            {processingStep === 'complete' ? (
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm"></div>
            ) : (
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-sm"></div>
            )}
            {processingStep === 'complete' ? (
              <CheckCircle className="h-5 w-5 text-green-500 relative" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 relative" />
            )}
          </div>
          <h3 className="text-xl font-medium text-slate-200">Processing Summary</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700 transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 mr-2 text-slate-400" />
              <p className="text-sm text-slate-400">Total Records</p>
            </div>
            <p className="text-2xl font-bold text-slate-200">{parsedRecords.length}</p>
          </div>
          
          <div className="bg-slate-800/60 p-5 rounded-xl border border-green-900/30 transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <p className="text-sm text-green-500">Valid Records</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{validRecords.length}</p>
          </div>
          
          <div className="bg-slate-800/60 p-5 rounded-xl border border-red-900/30 transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
              <p className="text-sm text-red-500">Invalid Records</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{parsedRecords.length - validRecords.length}</p>
          </div>
        </div>
        
        {processingResults && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/60 p-5 rounded-xl border border-green-900/30 transition-transform hover:scale-[1.02] duration-300">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <p className="text-sm text-green-500">Successfully Processed</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{processingResults.successful}</p>
            </div>
            
            <div className="bg-slate-800/60 p-5 rounded-xl border border-red-900/30 transition-transform hover:scale-[1.02] duration-300">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                <p className="text-sm text-red-500">Failed to Process</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{processingResults.failed}</p>
            </div>
          </div>
        )}
        
        {batchProcessingResult && (
          <div className="mt-6 bg-slate-800/40 p-5 rounded-xl border border-slate-700">
            <h4 className="text-md font-medium mb-4 flex items-center text-slate-200">
              <Database className="h-4 w-4 mr-2 text-blue-500" />
              Batch Processing Details
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Batch ID</p>
                <p className="text-sm font-mono text-slate-300 truncate">{batchProcessingResult.batch_id}</p>
              </div>
              
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Processing Time</p>
                <p className="text-sm font-medium text-slate-300">
                  {(batchProcessingResult.processing_time_ms / 1000).toFixed(2)}s
                </p>
              </div>
              
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Records/Second</p>
                <p className="text-sm font-medium text-slate-300">
                  {Math.round(batchProcessingResult.total_records / (batchProcessingResult.processing_time_ms / 1000))}
                </p>
              </div>
              
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Success Rate</p>
                <p className="text-sm font-medium text-green-400">
                  {((batchProcessingResult.successful_records / batchProcessingResult.total_records) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            {batchProcessingResult.errors.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-red-400 mb-2">
                  Processing Errors ({batchProcessingResult.errors.length})
                </h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {batchProcessingResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-xs bg-red-900/20 border border-red-900/30 rounded p-2">
                      <span className="text-red-400 font-medium">Record {error.record_index + 1}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-300">{error.account_number}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-red-300">{error.error}</span>
                    </div>
                  ))}
                  {batchProcessingResult.errors.length > 10 && (
                    <p className="text-xs text-slate-400 text-center py-2">
                      ... and {batchProcessingResult.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Payment Allocation Section */}
        {batchProcessingResult && batchProcessingResult.successful_records > 0 && (
          <div className="mt-6 bg-slate-800/40 p-5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-slate-200">Payment Allocation</span>
              </h4>
              
              {allocationStats && (
                <div className="text-sm text-slate-400">
                  {allocationStats.allocated}/{allocationStats.total} allocated ({allocationStats.allocation_percentage.toFixed(1)}%)
                </div>
              )}
            </div>
            
            {canAllocate && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <Button
                    onClick={handleAllocatePayments}
                    disabled={isAllocating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-4"
                  >
                    {isAllocating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Allocating Payments...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        {allocationProgress && !allocationProgress.is_complete ? 'Resume Allocation' : 'Allocate Payments'}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  This will update existing debtor records or create new ones based on account numbers
                </p>
              </div>
            )}
            
            {/* Real-time Allocation Progress */}
            {isAllocating && allocationProgress && (
              <div className="mb-4 space-y-3">
                <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Allocation Progress</span>
                    <span className="text-xs text-slate-400">
                      {allocationProgress.total_processed} / {allocationStats?.total || '?'} records processed
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-700 rounded-full h-2.5 mb-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ 
                        width: `${allocationStats ? (allocationProgress.total_processed / allocationStats.total * 100).toFixed(1) : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Processing details */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-slate-400">Processing Rate</div>
                      <div className="text-blue-400 font-medium">{processingRate} records/sec</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-slate-400">Est. Time Remaining</div>
                      <div className="text-blue-400 font-medium">{estimatedTimeRemaining || 'calculating...'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center bg-slate-700/30 p-2 rounded">
                      <div className="text-blue-400 font-medium">{allocationProgress.accounts_updated}</div>
                      <div className="text-slate-400">Updated</div>
                    </div>
                    <div className="text-center bg-slate-700/30 p-2 rounded">
                      <div className="text-green-400 font-medium">{allocationProgress.accounts_created}</div>
                      <div className="text-slate-400">Created</div>
                    </div>
                    <div className="text-center bg-slate-700/30 p-2 rounded">
                      <div className="text-red-400 font-medium">{allocationProgress.failed_allocations}</div>
                      <div className="text-slate-400">Failed</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-400 flex justify-between">
                    <span>Processing time: {(allocationProgress.total_time_ms / 1000).toFixed(1)}s</span>
                    <span>Current offset: {allocationProgress.current_offset}</span>
                  </div>
                </div>
              </div>
            )}
            
            {allocationResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Records Processed</p>
                    <p className="text-sm font-medium text-slate-300">
                      {allocationResult.total_processed}
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Accounts Updated</p>
                    <p className="text-sm font-medium text-blue-400">
                      {allocationResult.accounts_updated}
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Accounts Created</p>
                    <p className="text-sm font-medium text-green-400">
                      {allocationResult.accounts_created}
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Failed</p>
                    <p className="text-sm font-medium text-red-400">
                      {allocationResult.failed_allocations}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Processing Time</p>
                    <p className="text-sm font-medium text-slate-300">
                      {(allocationResult.total_time_ms / 1000).toFixed(2)}s
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Success Rate</p>
                    <p className="text-sm font-medium text-green-400">
                      {allocationResult.total_processed > 0 
                        ? (((allocationResult.accounts_updated + allocationResult.accounts_created) / allocationResult.total_processed) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
                
                {allocationResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-red-400 mb-2">
                      Allocation Errors ({allocationResult.errors.length})
                    </h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {allocationResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-xs bg-red-900/20 border border-red-900/30 rounded p-2">
                          <span className="text-red-400 font-medium">{error.account_number}</span>
                          <span className="text-slate-400 mx-2">•</span>
                          <span className="text-red-300">{error.error}</span>
                        </div>
                      ))}
                      {allocationResult.errors.length > 10 && (
                        <p className="text-xs text-slate-400 text-center py-2">
                          ... and {allocationResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!canAllocate && !allocationResult && allocationStats && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-slate-300">All payments have been allocated</p>
                <p className="text-xs text-slate-400">
                  {allocationStats.allocated} out of {allocationStats.total} records processed
                </p>
              </div>
            )}
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="mt-6 bg-slate-800/40 p-5 rounded-xl border border-red-900/30">
            <h4 className="text-md font-medium mb-3 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-red-400">Errors ({errors.length})</span>
            </h4>
            <div className="bg-slate-900/60 p-4 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
              <ul className="list-disc list-inside text-sm text-red-400 space-y-1">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 10 && (
                  <li className="mt-2 text-slate-400">...and {errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {warnings.length > 0 && (
          <div className="mt-6 bg-slate-800/40 p-5 rounded-xl border border-yellow-900/30">
            <h4 className="text-md font-medium mb-3 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="text-yellow-400">Warnings ({warnings.length})</span>
            </h4>
            <div className="bg-slate-900/60 p-4 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
              <ul className="list-disc list-inside text-sm text-yellow-400 space-y-1">
                {warnings.slice(0, 10).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {warnings.length > 10 && (
                  <li className="mt-2 text-slate-400">...and {warnings.length - 10} more warnings</li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 px-4"
            onClick={clearFile}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Upload Another File
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full bg-slate-900/40 border-slate-800/60 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center mb-1">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-2 rounded-lg mr-3">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-slate-200">Payment File Uploader</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Upload payment files to update customer balances and payment history.
          Supports XLSX, XLS, and CSV formats.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {renderFileUploadZone()}
        {renderProcessingStatus()}
        {renderResultsSummary()}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-slate-800/60 pt-4">
        <div className="flex items-center text-sm text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-full">
          <Info className="h-4 w-4 mr-2 text-blue-400" />
          <p>
            <span className="font-medium">Note:</span> Empty fields will default to &quot;N/A&quot;
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={downloadTemplate}
          className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <Download className="h-4 w-4 mr-2" /> Download Template
        </Button>
      </CardFooter>
    </Card>
  );
}
