'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, Heart, Sparkles, Stars } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface AIAnalysisFeedbackProps {
  customerId: string;
  analysisSessionId: string;
  tenantId?: string;
}

type FeedbackState = 'idle' | 'upvoted' | 'downvoted' | 'submitting' | 'submitted';

export default function AIAnalysisFeedback({ 
  customerId, 
  analysisSessionId, 
  tenantId = 'mahikeng' 
}: AIAnalysisFeedbackProps) {
  const { user } = useAuth();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (feedbackType: 'upvote' | 'downvote', suggestionText?: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/ai-analysis-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          agentId: user.id,
          customerId,
          analysisSessionId,
          feedbackType,
          suggestion: suggestionText || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedbackState('submitted');
        if (feedbackType === 'downvote') {
          setShowSuggestionDialog(false);
          setSuggestion('');
        }
      } else {
        console.error('Failed to submit feedback:', data.error);
        setFeedbackState('idle');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = () => {
    setFeedbackState('upvoted');
    submitFeedback('upvote');
  };

  const handleDownvote = () => {
    setFeedbackState('downvoted');
    setShowSuggestionDialog(true);
  };

  const handleSuggestionSubmit = () => {
    submitFeedback('downvote', suggestion);
  };

  const handleSuggestionCancel = () => {
    setShowSuggestionDialog(false);
    setSuggestion('');
    setFeedbackState('idle');
  };

  if (feedbackState === 'submitted') {
    return (
      <div className="mt-6 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-4 w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-6 right-8 w-1 h-1 bg-blue-400/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-4 left-12 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-2 right-4 w-1 h-1 bg-indigo-400/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <Sparkles className="absolute top-3 right-16 h-3 w-3 text-emerald-400/20 animate-pulse" style={{ animationDelay: '1.5s' }} />
          <Stars className="absolute bottom-6 left-6 h-2 w-2 text-blue-400/20 animate-pulse" style={{ animationDelay: '2.5s' }} />
        </div>
        
        <Card className="border-emerald-500/30 bg-gradient-to-br from-slate-800/60 via-emerald-900/10 to-slate-800/60 backdrop-blur-sm relative">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full border border-emerald-500/30 backdrop-blur-sm">
                <CheckCircle className="h-7 w-7 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-emerald-300 text-lg mb-1">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-sm text-slate-300">
                  Your input helps us improve SmartKollect's AI analysis
                </p>
              </div>
              <Heart className="h-6 w-6 text-red-400 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-6 w-2 h-2 bg-indigo-400/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-6 left-16 w-1 h-1 bg-blue-400/25 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-3 right-8 w-2 h-2 bg-cyan-400/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }}></div>
          <div className="absolute top-12 left-1/3 w-1 h-1 bg-violet-400/30 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
          <Sparkles className="absolute top-4 right-20 h-3 w-3 text-indigo-400/15 animate-pulse" style={{ animationDelay: '0.8s' }} />
          <Stars className="absolute bottom-8 left-8 h-2.5 w-2.5 text-purple-400/15 animate-pulse" style={{ animationDelay: '1.8s' }} />
          <MessageSquare className="absolute top-6 left-1/2 h-2 w-2 text-blue-400/10 animate-pulse" style={{ animationDelay: '3s' }} />
        </div>

        <Card className="border-indigo-500/30 bg-gradient-to-br from-slate-800/70 via-indigo-900/10 to-slate-800/70 backdrop-blur-sm relative shadow-lg shadow-indigo-500/10">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-5">
              {/* Header Section */}
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full border border-indigo-500/30 backdrop-blur-sm">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                </div>
                <h4 className="font-bold text-indigo-300 text-lg">
                  Help Us Improve SmartKollect
                </h4>
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full border border-purple-500/30 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              
              <p className="text-slate-300 font-medium">
                Was this analysis helpful?
              </p>

              {/* Buttons Section */}
              <div className="flex items-center justify-center space-x-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpvote}
                  disabled={isSubmitting || feedbackState !== 'idle'}
                  className={`
                    relative overflow-hidden transition-all duration-500 ease-out transform hover:scale-110 hover:-translate-y-1
                    border-2 px-6 py-3 rounded-xl font-semibold shadow-lg
                    ${feedbackState === 'upvoted' 
                      ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 border-emerald-400/60 text-emerald-300 shadow-emerald-500/20' 
                      : 'bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-emerald-500/40 text-slate-300 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-green-500/20 hover:border-emerald-400/70 hover:text-emerald-300 hover:shadow-emerald-500/20'
                    }
                  `}
                >
                  <ThumbsUp className={`h-4 w-4 mr-2 transition-all duration-300 ${
                    feedbackState === 'upvoted' ? 'text-emerald-400 animate-pulse' : ''
                  }`} />
                  {feedbackState === 'upvoted' ? 'Thanks!' : 'Yes, helpful'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownvote}
                  disabled={isSubmitting || feedbackState !== 'idle'}
                  className={`
                    relative overflow-hidden transition-all duration-500 ease-out transform hover:scale-110 hover:-translate-y-1
                    border-2 px-6 py-3 rounded-xl font-semibold shadow-lg
                    ${feedbackState === 'downvoted' 
                      ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-400/60 text-amber-300 shadow-amber-500/20' 
                      : 'bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-amber-500/40 text-slate-300 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-orange-500/20 hover:border-amber-400/70 hover:text-amber-300 hover:shadow-amber-500/20'
                    }
                  `}
                >
                  <ThumbsDown className={`h-4 w-4 mr-2 transition-all duration-300 ${
                    feedbackState === 'downvoted' ? 'text-amber-400 animate-pulse' : ''
                  }`} />
                  {feedbackState === 'downvoted' ? 'Noted' : 'Needs improvement'}
                </Button>
              </div>

              {/* Loading State */}
              {isSubmitting && (
                <div className="flex items-center justify-center space-x-3 text-sm text-slate-300 bg-slate-700/30 rounded-lg py-3 px-4 backdrop-blur-sm border border-slate-600/30">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-400 border-t-transparent"></div>
                  <span className="font-medium">Submitting feedback...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>Help Us Improve</span>
            </DialogTitle>
            <DialogDescription>
              We'd love to hear your suggestions on how we can improve our AI analysis. 
              Your feedback is valuable to us!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Please share your suggestions for improvement..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {suggestion.length}/1000 characters
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={handleSuggestionCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuggestionSubmit}
              disabled={isSubmitting || !suggestion.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
