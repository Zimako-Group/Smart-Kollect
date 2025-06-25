import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, Download, Calendar, CreditCard, Clock, Info } from "lucide-react";
import { getPaymentHistory, Payment, formatPayment } from '@/lib/payment-service';
import { Badge } from './ui/badge';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { closeDialog } from '@/lib/redux/features/payment-history/paymentHistorySlice';

export function PaymentHistoryDialog() {
  const dispatch = useAppDispatch();
  const { isOpen, customerId, customerName, accountNumber } = useAppSelector(
    (state) => state.paymentHistory
  );
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const paymentHistory = await getPaymentHistory(customerId);
      setPayments(paymentHistory);
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetchPaymentHistory();
    }
  }, [isOpen, customerId]);

  const handleRefresh = () => {
    fetchPaymentHistory();
  };

  const handleExportCSV = () => {
    if (payments.length === 0) return;

    // Create CSV content
    const headers = ['Payment Date', 'Amount', 'Method', 'Reference', 'Description'];
    const csvContent = [
      headers.join(','),
      ...payments.map(payment => [
        payment.payment_date,
        payment.amount,
        payment.payment_method || 'N/A',
        payment.reference_number || 'N/A',
        payment.description || 'N/A'
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_history_${accountNumber}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dispatch(closeDialog())}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-indigo-400" />
            Payment History
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Payment records for {customerName} (Account: {accountNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
              {payments.length} Payments
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
              onClick={handleExportCSV}
              disabled={payments.length === 0 || loading}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-slate-400">Loading payment history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-red-900/20 p-3 rounded-full mb-3">
                <Info className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-red-400 mb-1">Error loading payment history</p>
              <p className="text-slate-500 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 bg-slate-800 border-slate-700 hover:bg-slate-700"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Try Again
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-slate-800/50 p-3 rounded-full mb-3">
                <CreditCard className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-300 mb-1">No payment records found</p>
              <p className="text-slate-500 text-sm">This account has no recorded payments yet.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {payments.map((payment) => {
                const formattedPayment = formatPayment(payment);
                return (
                  <div 
                    key={payment.id} 
                    className="bg-slate-800/40 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                        <span className="text-sm font-medium text-white">{formattedPayment.formattedDate}</span>
                      </div>
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full px-3 py-1 shadow-lg">
                        <p className="text-sm font-bold text-white">{formattedPayment.formattedAmount}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Payment Method</p>
                        <p className="text-sm text-slate-300">{payment.payment_method || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Reference</p>
                        <p className="text-sm text-slate-300">{payment.reference_number || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {payment.description && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Description</p>
                        <p className="text-sm text-slate-300">{payment.description}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-slate-500" />
                        <span className="text-xs text-slate-500">Recorded: {formattedPayment.formattedCreatedAt}</span>
                      </div>
                      {payment.batch_id && (
                        <Badge variant="outline" className="text-xs bg-slate-800/60 border-slate-700 text-slate-400">
                          Batch Import
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => dispatch(closeDialog())}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentHistoryDialog;
