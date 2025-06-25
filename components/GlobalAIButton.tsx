"use client";

import React, { useState } from 'react';
import { FloatingAIButton } from '@/components/FloatingAIButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { AIChat } from '@/components/AIChat';

interface GlobalAIButtonProps {
  fixed?: boolean;
}

export function GlobalAIButton({ fixed = false }: GlobalAIButtonProps) {
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);

  const handleStartConversation = () => {
    setShowAIDialog(false);
    setShowChatInterface(true);
  };

  const handleCloseChat = () => {
    setShowChatInterface(false);
  };

  return (
    <>
      {/* Zimako AI Button */}
      <FloatingAIButton onClick={() => setShowAIDialog(true)} fixed={fixed} />

      {/* Zimako AI Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              Zimako AI Assistant
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              How can I help you today with your debt collection tasks?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-800/50 rounded-md">
            <p className="text-sm text-slate-300">
              I can help you with:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Analyzing payment trends
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Suggesting collection strategies
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Drafting communication templates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Answering questions about accounts
              </li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Close
            </Button>
            <Button onClick={handleStartConversation}>
              Start Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Interface */}
      {showChatInterface && <AIChat onClose={handleCloseChat} />}
    </>
  );
}
