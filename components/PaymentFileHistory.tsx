"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileSpreadsheet, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import { getUserPaymentFiles, getPaymentFileStats, PaymentFileMetadata } from '@/lib/payment-file-service';
import { useToast } from '@/components/ui/use-toast';

interface PaymentFileHistoryProps {
  refreshTrigger?: number; // Used to trigger refresh from parent component
}

export default function PaymentFileHistory({ refreshTrigger }: PaymentFileHistoryProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<PaymentFileMetadata[]>([]);
  const [stats, setStats] = useState({
    total_files: 0,
    total_records: 0,
    files_this_week: 0,
    files_this_month: 0,
    processing_status_counts: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Load files and stats in parallel
      const [filesResult, statsResult] = await Promise.all([
        getUserPaymentFiles(20), // Get last 20 files
        getPaymentFileStats()
      ]);

      if (filesResult.error) {
        console.error('Error loading payment files:', filesResult.error);
        toast({
          title: 'Error',
          description: 'Failed to load payment file history',
          variant: 'destructive',
        });
      } else {
        setFiles(filesResult.data || []);
      }

      setStats(statsResult);
    } catch (error) {
      console.error('Error loading payment file data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment file data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadData(true);
    }
  }, [refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return 'N/A';
    const seconds = Math.round(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Card className="w-full bg-slate-900/40 border-slate-800/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-slate-400">Loading payment file history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-200">{stats.total_files}</div>
            <p className="text-xs text-slate-400">Total Files</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-200">{stats.total_records.toLocaleString()}</div>
            <p className="text-xs text-slate-400">Total Records</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-200">{stats.files_this_week}</div>
            <p className="text-xs text-slate-400">This Week</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/60">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-200">{stats.files_this_month}</div>
            <p className="text-xs text-slate-400">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card className="w-full bg-slate-900/40 border-slate-800/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-2 rounded-lg mr-3">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-slate-200">Payment File History</CardTitle>
                <CardDescription className="text-slate-400">
                  Recent payment file uploads and processing status
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No payment files uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-300">File Name</TableHead>
                    <TableHead className="text-slate-300">Upload Date</TableHead>
                    <TableHead className="text-slate-300">Size</TableHead>
                    <TableHead className="text-slate-300">Records</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="text-slate-200 font-medium">
                        {file.file_name}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatDate(file.upload_date!)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        <div className="space-y-1">
                          <div>{file.records_count || 0} total</div>
                          {file.valid_records_count !== undefined && (
                            <div className="text-xs">
                              <span className="text-green-400">{file.valid_records_count} valid</span>
                              {file.invalid_records_count! > 0 && (
                                <span className="text-red-400 ml-2">{file.invalid_records_count} invalid</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(file.processing_status || 'pending')}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatDuration(file.processing_duration_ms)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
