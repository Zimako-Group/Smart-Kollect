"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Loader2
} from 'lucide-react';
import { getPaymentMetricsSummary, getPaymentMetricsChanges, PaymentMetrics, PaymentMetricsChanges } from '@/lib/payment-metrics-service';

export default function PaymentMetricsCards() {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [changes, setChanges] = useState<PaymentMetricsChanges | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        
        // Fetch metrics summary
        const summaries = await getPaymentMetricsSummary();
        const todayMetrics = summaries.find(summary => summary.period === 'today');
        
        if (todayMetrics) {
          setMetrics(todayMetrics);
        }
        
        // Fetch percentage changes
        const metricsChanges = await getPaymentMetricsChanges();
        setChanges(metricsChanges);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching payment metrics:', err);
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    
    // Set up a refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage change
  const formatChange = (change: number | null | undefined): string => {
    if (change === null || change === undefined) return '0%';
    return `${change > 0 ? '+' : ''}${change}%`;
  };

  // Determine badge color based on change
  const getBadgeClass = (change: number | null | undefined): string => {
    if (change === null || change === undefined) return 'bg-slate-500/20 text-slate-400';
    if (change > 0) return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
    if (change < 0) return 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
    return 'bg-slate-500/20 text-slate-400';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-800/40 border-slate-700/60 shadow-md backdrop-blur-sm">
            <CardContent className="pt-6 flex items-center justify-center h-[120px]">
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="bg-slate-800/40 border-slate-700/60 shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02] duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <Badge className={`${getBadgeClass(changes?.files_processed_change)}`}>
              {metrics?.files_processed ? formatChange(changes?.files_processed_change) : 'Today'}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {metrics?.files_processed || 0}
          </h3>
          <p className="text-sm text-slate-400">Files Processed</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/40 border-slate-700/60 shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02] duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <Badge className={`${getBadgeClass(changes?.payments_amount_change)}`}>
              {formatChange(changes?.payments_amount_change)}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {formatCurrency(metrics?.payments_amount || 0)}
          </h3>
          <p className="text-sm text-slate-400">Payments Processed</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/40 border-slate-700/60 shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02] duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
              Attention
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {metrics?.pending_validations || 0}
          </h3>
          <p className="text-sm text-slate-400">Pending Validations</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/40 border-slate-700/60 shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02] duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <Badge className={`${getBadgeClass(changes?.failed_uploads_change)}`}>
              {formatChange(changes?.failed_uploads_change)}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {metrics?.failed_uploads || 0}
          </h3>
          <p className="text-sm text-slate-400">Failed Uploads</p>
        </CardContent>
      </Card>
    </div>
  );
}
