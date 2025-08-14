import { toast } from 'sonner';

export interface AIAnalysisResult {
  riskScore: number;
  paymentLikelihood: 'low' | 'medium' | 'high';
  recommendedStrategy: string;
  behavioralPatterns: string[];
  communicationPreferences: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  settlementRecommendations: string;
  keyInsights: string[];
  nextBestActions: string[];
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis?: AIAnalysisResult;
  error?: string;
  details?: string;
  timestamp?: string;
}

export async function analyzeCustomerProfile(
  customer: any,
  accountHistory?: any[],
  paymentHistory?: any[]
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer,
        accountHistory: accountHistory || [],
        paymentHistory: paymentHistory || []
      }),
    });

    const data: AIAnalysisResponse = await response.json();

    if (!data.success || !data.analysis) {
      throw new Error(data.error || 'Failed to analyze profile');
    }

    return data.analysis;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error(`AI Analysis Failed: ${errorMessage}`);
    throw error;
  }
}

// Utility functions for UI display
export function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-green-400';
}

export function getRiskScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-red-500/20 border-red-500/50';
  if (score >= 60) return 'bg-orange-500/20 border-orange-500/50';
  if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/50';
  return 'bg-green-500/20 border-green-500/50';
}

export function getPaymentLikelihoodIcon(likelihood: string): string {
  switch (likelihood) {
    case 'high': return '🟢';
    case 'medium': return '🟡';
    case 'low': return '🔴';
    default: return '⚪';
  }
}

export function getUrgencyLevelIcon(urgency: string): string {
  switch (urgency) {
    case 'high': return '🚨';
    case 'medium': return '⚠️';
    case 'low': return '✅';
    default: return '📋';
  }
}

export function formatRiskScore(score: number): string {
  return `${score}/100`;
}

export function getRiskScoreDescription(score: number): string {
  if (score >= 80) return 'High Risk - Immediate attention required';
  if (score >= 60) return 'Medium-High Risk - Priority follow-up needed';
  if (score >= 40) return 'Medium Risk - Standard collection process';
  if (score >= 20) return 'Low-Medium Risk - Gentle reminders appropriate';
  return 'Low Risk - Minimal intervention needed';
}
