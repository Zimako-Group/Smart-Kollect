"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  MessageCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  X,
  Loader2
} from 'lucide-react';
import { 
  AIAnalysisResult, 
  analyzeCustomerProfile,
  getRiskScoreColor,
  getRiskScoreBgColor,
  getPaymentLikelihoodIcon,
  getUrgencyLevelIcon,
  formatRiskScore,
  getRiskScoreDescription
} from '@/lib/ai-analysis-service';
import { toast } from 'sonner';

interface AIAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  accountHistory?: any[];
  paymentHistory?: any[];
}

export default function AIAnalysisDialog({
  isOpen,
  onClose,
  customer,
  accountHistory = [],
  paymentHistory = []
}: AIAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await analyzeCustomerProfile(customer, accountHistory, paymentHistory);
      setAnalysis(result);
      toast.success('AI analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze profile';
      setError(errorMessage);
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAnalysis(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold text-white">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2 mr-3">
              <Brain className="h-5 w-5 text-white" />
            </div>
            AI Customer Profile Analysis
            <Sparkles className="h-4 w-4 ml-2 text-yellow-400" />
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Customer Info Header */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-400" />
                  Analysis Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Customer:</span>
                    <p className="text-white font-medium">{customer?.name} {customer?.surname_company_trust}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account:</span>
                    <p className="text-white font-medium">{customer?.acc_number || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Button */}
            {!analysis && !isLoading && (
              <div className="text-center">
                <Button
                  onClick={handleAnalyze}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
                  disabled={isLoading}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Analyze Customer Profile
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
                    <p className="text-white text-lg font-medium">Analyzing customer profile...</p>
                    <p className="text-slate-400 mt-2">AI is processing customer data and generating insights</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-red-900/20 border-red-700">
                <CardContent className="py-6">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 text-lg font-medium">Analysis Failed</p>
                    <p className="text-red-300 mt-2">{error}</p>
                    <Button 
                      onClick={handleAnalyze}
                      variant="outline"
                      className="mt-4 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-6">
                {/* Risk Score & Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={`${getRiskScoreBgColor(analysis.riskScore)} border`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Risk Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getRiskScoreColor(analysis.riskScore)}`}>
                          {formatRiskScore(analysis.riskScore)}
                        </div>
                        <Progress 
                          value={analysis.riskScore} 
                          className="mt-2 h-2"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          {getRiskScoreDescription(analysis.riskScore)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Payment Likelihood
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {getPaymentLikelihoodIcon(analysis.paymentLikelihood)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${analysis.paymentLikelihood === 'high' ? 'border-green-500 text-green-400' : ''}
                            ${analysis.paymentLikelihood === 'medium' ? 'border-yellow-500 text-yellow-400' : ''}
                            ${analysis.paymentLikelihood === 'low' ? 'border-red-500 text-red-400' : ''}
                          `}
                        >
                          {analysis.paymentLikelihood.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-300 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Urgency Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {getUrgencyLevelIcon(analysis.urgencyLevel)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${analysis.urgencyLevel === 'high' ? 'border-red-500 text-red-400' : ''}
                            ${analysis.urgencyLevel === 'medium' ? 'border-orange-500 text-orange-400' : ''}
                            ${analysis.urgencyLevel === 'low' ? 'border-green-500 text-green-400' : ''}
                          `}
                        >
                          {analysis.urgencyLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Insights */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.keyInsights.map((insight, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-300 text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Strategy */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-400" />
                      Recommended Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed">{analysis.recommendedStrategy}</p>
                  </CardContent>
                </Card>

                {/* Next Best Actions */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                      Next Best Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.nextBestActions.map((action, index) => (
                        <div key={index} className="flex items-start">
                          <div className="bg-purple-500/20 rounded-full p-1 mr-3 mt-0.5">
                            <span className="text-purple-400 text-xs font-bold">{index + 1}</span>
                          </div>
                          <p className="text-slate-300 text-sm">{action}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Behavioral Patterns & Communication */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
                        Behavioral Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.behavioralPatterns.map((pattern, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                            <p className="text-slate-300 text-sm">{pattern}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center">
                        <MessageCircle className="h-5 w-5 mr-2 text-green-400" />
                        Communication Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.communicationPreferences.map((pref, index) => (
                          <Badge key={index} variant="outline" className="mr-2 mb-2 border-green-500 text-green-400">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Settlement Recommendations */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-cyan-400" />
                      Settlement Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed">{analysis.settlementRecommendations}</p>
                  </CardContent>
                </Card>

                {/* Analyze Again Button */}
                <div className="text-center pt-4">
                  <Button
                    onClick={handleAnalyze}
                    variant="outline"
                    className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                    disabled={isLoading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Re-analyze Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
