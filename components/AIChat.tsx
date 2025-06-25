"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Send, Loader2, Bot, User, ChevronDown, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatProps {
  onClose: () => void;
}

export function AIChat({ onClose }: AIChatProps) {
  // State for messages, input, and loading
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi there! I\'m Zimako AI, your debt collection assistant. How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Custom function to handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Format messages for the API
      const apiMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call our API endpoint
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          store: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the assistant's message from the response
      let assistantContent = "I'm having trouble generating a response. Please try again.";
      
      if (data.choices && data.choices[0]?.message?.content) {
        assistantContent = data.choices[0].message.content;
      }
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: data.id || Date.now().toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 shadow-lg rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 p-3 cursor-pointer"
        onClick={() => setIsMinimized(false)}>
        <div className="relative">
          <Bot className="h-6 w-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[380px] h-[500px] bg-slate-900 border border-slate-800 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-full">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="font-medium">Zimako AI Assistant</h3>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4 bg-slate-900">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start gap-3 max-w-[90%]",
                message.role === 'assistant' ? "mr-auto" : "ml-auto flex-row-reverse"
              )}
            >
              <Avatar className={cn(
                "h-8 w-8 border-2",
                message.role === 'assistant' 
                  ? "bg-blue-600 border-blue-700" 
                  : "bg-slate-700 border-slate-600"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </Avatar>
              <div>
                <div className={cn(
                  "rounded-lg p-3 text-sm",
                  message.role === 'assistant' 
                    ? "bg-slate-800 text-slate-100" 
                    : "bg-blue-600 text-white"
                )}>
                  {message.content}
                </div>
                <div className={cn(
                  "text-xs mt-1",
                  message.role === 'assistant' ? "text-slate-500" : "text-slate-500 text-right"
                )}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3 max-w-[90%] mr-auto">
              <Avatar className="h-8 w-8 bg-blue-600 border-2 border-blue-700">
                <Bot className="h-4 w-4 text-white" />
              </Avatar>
              <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-slate-400">Zimako AI is thinking...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-600"
            disabled={isLoading}
          />
          <Button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-center">
          <Sparkles className="h-3 w-3 mr-1" />
          <span>Powered by Zimako AI</span>
        </div>
      </div>
    </div>
  );
}
