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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { parseSpreadsheetFile } from "@/lib/file-parsers";
import { resumeDebtorsUpload, getBatchUploadStatus, updateBatchStatus } from "@/lib/debtors-service";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [batchId, setBatchId] = useState<string>("41d0978e-c72c-46f7-a6ad-46663ce56162"); // Default to the current batch
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'checking' | 'resuming' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  
  // Check the current status of the batch
  useEffect(() => {
    async function checkBatchStatus() {
      setUploadStatus('checking');
      try {
        const status = await getBatchUploadStatus(batchId);
        if (status.success) {
          setBatchInfo(status.batch);
          setCurrentCount(status.recordCount || 0);
          setUploadProgress(status.isComplete ? 100 : 50);
          
          if (status.isComplete) {
            setUploadStatus('success');
            toast({
              title: "Upload Complete",
              description: `All ${status.recordCount} records have been uploaded successfully.`,
              variant: "default",
            });
          } else {
            setUploadStatus('idle');
            toast({
              title: "Upload Incomplete",
              description: `${status.recordCount} records uploaded so far. Select the file again to resume.`,
              variant: "default",
            });
          }
        } else {
          setUploadError(status.error || "Failed to check batch status");
          setUploadStatus('error');
        }
      } catch (error: any) {
        setUploadError(error.message || "An error occurred while checking batch status");
        setUploadStatus('error');
      }
    }
    
    if (batchId) {
      checkBatchStatus();
    }
  }, [batchId, toast]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };
  
  // Handle resuming the upload
  const handleResumeUpload = async () => {
    if (!selectedFile || !batchId) {
      toast({
        title: "Error",
        description: "Please select a file and provide a batch ID",
        variant: "destructive",
      });
      return;
    }
    
    setUploadStatus('resuming');
    setUploadProgress(currentCount > 0 ? 50 : 0);
    setUploadError(null);
    
    try {
      // Parse the file
      const { records, errors, warnings } = await parseSpreadsheetFile(selectedFile);
      setTotalRecords(records.length);
      
      // Set progress to show parsing is complete
      setUploadProgress(60);
      
      toast({
        title: "File Parsed",
        description: `Successfully parsed ${records.length} records. Resuming upload from record ${currentCount}...`,
        variant: "default",
      });
      
      // Resume the upload from the current count
      const { success, count, errors: uploadErrors } = await resumeDebtorsUpload(
        records,
        batchId,
        currentCount,
        (processed, total) => {
          // Calculate progress from 60% to 90% based on records processed
          const progressPercentage = 60 + Math.floor((processed - currentCount) / (total - currentCount) * 30);
          setUploadProgress(progressPercentage);
        }
      );
      
      if (!success) {
        throw new Error(`Failed to resume upload: ${uploadErrors.join(', ')}`);
      }
      
      // Complete the upload
      setUploadProgress(100);
      setUploadStatus('success');
      
      toast({
        title: "Success",
        description: `Successfully uploaded ${currentCount + count} debtors to the database`,
        variant: "default",
      });
      
      // Redirect back to accounts page after 3 seconds
      setTimeout(() => {
        router.push('/admin/accounts');
      }, 3000);
    } catch (error: any) {
      console.error('Error resuming upload:', error);
      setUploadStatus('error');
      setUploadError(error.message);
      toast({
        title: "Error",
        description: error.message || 'An error occurred during upload',
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Resume Upload</CardTitle>
          <CardDescription>
            Resume uploading debtors from where the previous upload stopped
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadStatus === 'checking' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Checking current upload status...</p>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          {uploadStatus === 'success' && (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Upload Complete</AlertTitle>
              <AlertDescription>
                All records have been successfully uploaded to the database.
                Redirecting to accounts page...
              </AlertDescription>
            </Alert>
          )}
          
          {(uploadStatus === 'idle' || uploadStatus === 'error') && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Current Upload Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Batch ID</p>
                    <p className="font-mono text-xs">{batchId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Records Uploaded</p>
                    <p className="font-medium">{currentCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Batch Name</p>
                    <p>{batchInfo?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p>{batchInfo?.status || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select the same file again to resume upload
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                  />
                </div>
              </div>
            </>
          )}
          
          {uploadStatus === 'resuming' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              
              <p className="text-sm text-muted-foreground mt-2">
                Resuming from record {currentCount} of {totalRecords}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/accounts')}
            disabled={uploadStatus === 'resuming'}
          >
            Back to Accounts
          </Button>
          
          {(uploadStatus === 'idle' || uploadStatus === 'error') && (
            <Button
              onClick={handleResumeUpload}
              disabled={!selectedFile}
            >
              Resume Upload
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
