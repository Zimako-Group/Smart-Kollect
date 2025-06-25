"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, ChevronDown, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  options?: string[];
}

export function MahikengAIButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize chat with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          content: 'Welcome to Mahikeng AI Contact Page. How can I assist you today?',
          role: 'assistant',
          timestamp: new Date(),
          options: [
            'Customer Statement',
            'Payment Arrangement',
            'Settle Account',
            'Billing Query',
            'Connect to Agent',
            'Indigent Status',
            'Service Reconnection'
          ]
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'll help you with your "${input}" request. What additional information would you like?`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleOptionClick = (option: string) => {
    // Add user message with selected option
    const userMessage: Message = {
      id: Date.now().toString(),
      content: option,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response based on option
    setTimeout(() => {
      let responseContent = '';
      let responseOptions: string[] = [];
      
      switch(option) {
        case 'Customer Statement':
          responseContent = 'I can help you get your customer statement. Please provide your account number or registered email address.';
          break;
        case 'Payment Arrangement':
          responseContent = 'Let\'s set up a payment arrangement. What amount can you commit to paying monthly?';
          responseOptions = ['Less than R500', 'R500-R1000', 'R1000-R2000', 'More than R2000'];
          break;
        case 'Settle Account':
          responseContent = 'I can help you settle your account. Would you like to know your settlement amount?';
          responseOptions = ['Yes, show settlement amount', 'No, I have other questions'];
          break;
        case 'Incorrect Billing':
          responseContent = 'What specific billing issue would you like to address?';
          responseOptions = ['Incorrect amount', 'Missing payment', 'Interest query', 'Other'];
          break;
        case 'Connect to Agent':
          responseContent = 'I\'ll connect you with a live agent shortly. Please stay on this chat. What\'s the best contact number to reach you if we get disconnected?';
          break;
        case 'Indigent Status':
          responseContent = 'I can help you with your indigent status application or inquiry. What would you like to do?';
          responseOptions = ['Apply for indigent status', 'Check application status', 'Renew indigent status', 'Requirements information'];
          break;
        case 'Service Reconnection':
          responseContent = 'I can assist with service reconnection requests. What service do you need reconnected?';
          responseOptions = ['Water', 'Electricity', 'Both water and electricity', 'Other service'];
          break;
        default:
          responseContent = 'How else can I assist you today?';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: 'assistant',
        timestamp: new Date(),
        options: responseOptions.length > 0 ? responseOptions : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render minimized button
  if (isOpen && isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-50 shadow-lg rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 p-4 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="relative">
          <Bot className="h-6 w-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
        </div>
      </div>
    );
  }

  // Render chat interface if open
  if (isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col w-96 h-[500px] rounded-lg shadow-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {/* Chat header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-white" />
            <span className="font-semibold text-white">Mahikeng AI</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsMinimized(true)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4 bg-slate-900">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div 
                  className={cn(
                    "flex items-start gap-3 max-w-[90%]",
                    message.role === 'assistant' ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 border-2",
                    message.role === 'assistant' 
                      ? "bg-purple-600 border-purple-700" 
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
                        : "bg-purple-600 text-white"
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
                
                {/* Render options if available */}
                {message.role === 'assistant' && message.options && message.options.length > 0 && (
                  <div className="ml-11 mt-2 space-y-2">
                    {message.options.map((option, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition-colors"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input area */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-purple-600"
            />
            <Button 
              type="submit"
              disabled={!input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Render closed button
  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50 shadow-lg rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 p-4 cursor-pointer transition-all duration-300",
        isHovered ? "scale-110" : "scale-100"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsOpen(true)}
    >
      <div className="relative flex items-center">
        <Bot className="h-6 w-6 text-white" />
        <span className="ml-2 text-white font-medium">Mahikeng AI</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
      </div>
    </div>
  );
}
