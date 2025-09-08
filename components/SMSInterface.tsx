// components/SMSInterface.tsx
// SMS Interface Component - Updated to use MyMobileAPI service
// This component provides a dialog interface for sending SMS messages
// and viewing SMS history, now integrated with MyMobileAPI instead of Infobip
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Send,
  Save,
  Plus,
  X,
  ChevronDown,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRedux } from "@/hooks/useRedux";
import { 
  closeSMSInterface, 
  setMessage, 
  insertPlaceholder, 
  applyTemplate, 
  clearTemplate, 
  addTemplate, 
  deleteTemplate, 
  sendSMS,
  loadSmsHistoryForAccount,
  SMSTemplate 
} from "@/lib/redux/features/sms/smsSlice";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SMSInterface() {
  const { dispatch, sms } = useRedux();
  
  // Use the selectors to get the SMS state
  const isOpen = sms.isOpen();
  const recipient = sms.recipient();
  const recipientName = recipient.name;
  const recipientPhone = recipient.phone;
  const accountNumber = recipient.accountNumber; // Get account number for tracking
  const content = sms.content();
  const message = content.message;
  const charactersLeft = content.charactersLeft;
  const isMessageTooLong = content.isMessageTooLong;
  const templates = sms.templates();
  const selectedTemplate = sms.selectedTemplate();
  const sending = sms.sending();
  const sendStatus = sms.sendStatus();
  const smsHistory = sms.history();
  const error = sms.sendStatus().error;
  const historyLoading = sms.historyLoading();
  
  const [activeTab, setActiveTab] = useState("compose");
  const [newTemplate, setNewTemplate] = useState<Omit<SMSTemplate, "id">>({
    name: "",
    content: "",
    category: "custom",
  });
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  
  // Load SMS history when the component mounts or when the account number changes
  useEffect(() => {
    if (isOpen && accountNumber) {
      console.log('Loading SMS history for account:', accountNumber);
      dispatch(loadSmsHistoryForAccount(accountNumber));
    }
  }, [isOpen, accountNumber, dispatch]);

  // Handle closing the SMS interface
  const handleClose = () => {
    dispatch(closeSMSInterface());
  };
  
  // Handle sending an SMS
  const handleSendSMS = () => {
    if (sending) return;
    
    // Check if we have an account number
    if (!accountNumber) {
      toast.error("No account number available for this customer");
      return;
    }
    
    // Validate phone number - more lenient validation to handle various formats
    if (!recipientPhone || recipientPhone.trim() === '') {
      toast.error("No phone number available for this customer");
      return;
    }
    
    // Format the phone number for validation (remove all non-digit characters)
    const cleanedPhone = recipientPhone.replace(/\D/g, '');
    
    // Check if it's a valid South African number (more lenient check)
    // Allow numbers that are 9-10 digits, or international format with country code
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      toast.error("Invalid phone number format. Please check the number.");
      return;
    }
    
    dispatch(sendSMS())
      .unwrap()
      .then(() => {
        toast.success("SMS sent successfully");
        // Reload SMS history after sending
        if (accountNumber) {
          setTimeout(() => {
            dispatch(loadSmsHistoryForAccount(accountNumber));
          }, 1000); // Small delay to allow the database to update
        }
      })
      .catch((error) => {
        toast.error(error || "Failed to send SMS");
      });
  };
  
  // Handle setting the message
  const handleSetMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setMessage(e.target.value));
  };
  
  // Handle inserting a placeholder
  const handleInsertPlaceholder = (placeholder: string) => {
    dispatch(insertPlaceholder(placeholder));
  };
  
  // Handle applying a template
  const handleApplyTemplate = (templateId: string) => {
    dispatch(applyTemplate(templateId));
  };
  
  // Handle clearing the template
  const handleClearTemplate = () => {
    dispatch(clearTemplate());
  };
  
  // Handle showing the new template form
  const handleShowNewTemplate = () => {
    setShowNewTemplate(true);
    setNewTemplate({
      name: "",
      content: message || "",
      category: "custom",
    });
  };
  
  // Handle canceling the new template
  const handleCancelNewTemplate = () => {
    setShowNewTemplate(false);
  };
  
  // Handle saving the new template
  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error("Template name and content are required");
      return;
    }
    
    dispatch(addTemplate(newTemplate));
    setShowNewTemplate(false);
    toast.success("Template saved successfully");
  };
  
  // Handle updating the new template
  const handleUpdateNewTemplate = (field: keyof typeof newTemplate, value: string) => {
    setNewTemplate(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle deleting a template
  const handleDeleteTemplate = (templateId: string) => {
    dispatch(deleteTemplate(templateId));
    toast.success("Template deleted successfully");
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, yyyy h:mm a");
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "read":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };
  
  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, SMSTemplate[]>);
  
  // Category labels
  const categoryLabels: Record<string, string> = {
    payment: "Payment Templates",
    reminder: "Reminder Templates",
    legal: "Legal Templates",
    custom: "Custom Templates",
  };
  
  // If the dialog is not open, don't render anything
  if (!isOpen) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col bg-slate-900 text-slate-200 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-200">Send SMS</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="compose" className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-slate-400">Recipient</Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-800/50 px-3 py-2 rounded-md text-sm">
                    <div className="font-medium text-slate-200">{recipientName}</div>
                    <div className="text-slate-400 text-xs">{recipientPhone}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message" className="text-slate-400">Message</Label>
                  <span className={`text-xs ${isMessageTooLong ? 'text-red-400' : 'text-slate-400'}`}>
                    {charactersLeft} characters left
                  </span>
                </div>
                <Textarea
                  id="message"
                  value={message}
                  onChange={handleSetMessage}
                  placeholder="Type your message here..."
                  className={`min-h-[120px] bg-slate-800/50 border-slate-700 resize-none ${
                    isMessageTooLong ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                {isMessageTooLong && (
                  <p className="text-xs text-red-400">
                    Message is too long. It will be truncated when sent.
                  </p>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
                      onClick={() => handleInsertPlaceholder("name")}
                    >
                      +Name
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
                      onClick={() => handleInsertPlaceholder("amount")}
                    >
                      +Amount
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
                      onClick={() => handleInsertPlaceholder("dueDate")}
                    >
                      +Due Date
                    </Button>
                  </div>
                  
                  {selectedTemplate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-400 hover:text-slate-300"
                      onClick={handleClearTemplate}
                    >
                      <X className="h-3 w-3 mr-1" /> Clear Template
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-slate-400">Templates</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleShowNewTemplate}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Save Current
                  </Button>
                </div>
                
                {showNewTemplate ? (
                  <div className="space-y-3 bg-slate-800/30 p-3 rounded-md border border-slate-700">
                    <div className="space-y-2">
                      <Label htmlFor="templateName" className="text-xs text-slate-400">Template Name</Label>
                      <Input
                        id="templateName"
                        value={newTemplate.name}
                        onChange={(e) => handleUpdateNewTemplate("name", e.target.value)}
                        placeholder="e.g., Payment Reminder"
                        className="h-8 text-sm bg-slate-800/50 border-slate-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="templateContent" className="text-xs text-slate-400">Template Content</Label>
                      <Textarea
                        id="templateContent"
                        value={newTemplate.content}
                        onChange={(e) => handleUpdateNewTemplate("content", e.target.value)}
                        placeholder="Template content..."
                        className="min-h-[80px] text-sm bg-slate-800/50 border-slate-700 resize-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="templateCategory" className="text-xs text-slate-400">Category</Label>
                      <Select
                        value={newTemplate.category}
                        onValueChange={(value) => handleUpdateNewTemplate("category", value as any)}
                      >
                        <SelectTrigger className="h-8 text-sm bg-slate-800/50 border-slate-700">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleCancelNewTemplate}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleSaveTemplate}
                      >
                        <Save className="h-3 w-3 mr-1" /> Save Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[120px] overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {Object.entries(templatesByCategory).map(([category, templates]) => (
                        <Collapsible key={category} defaultOpen={category === "payment"}>
                          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-slate-800/30 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50">
                            {categoryLabels[category] || category}
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-1 pb-2">
                            <div className="space-y-1 pl-2">
                              {templates.map((template) => (
                                <div
                                  key={template.id}
                                  className={`rounded-md p-2 text-sm cursor-pointer hover:bg-slate-800/50 ${
                                    selectedTemplate === template.id ? "bg-slate-800/70 border border-slate-700" : ""
                                  }`}
                                  onClick={() => handleApplyTemplate(template.id)}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-medium text-slate-300">{template.name}</h4>
                                    <div className="flex space-x-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleApplyTemplate(template.id);
                                              }}
                                            >
                                              <Edit className="h-3 w-3 text-slate-400" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">
                                            <p className="text-xs">Use template</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      
                                      {template.category === "custom" && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 w-6 p-0" 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteTemplate(template.id);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3 text-slate-400" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                              <p className="text-xs">Delete template</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-2">{template.content}</p>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 flex flex-col p-0 m-0 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                <h3 className="text-sm font-medium text-slate-300">
                  Message History {accountNumber && `- Account #${accountNumber}`}
                </h3>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Filter className="h-3 w-3 mr-1" /> Filter
                </Button>
              </div>
              
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                      <p className="text-sm">Loading message history...</p>
                    </div>
                  ) : smsHistory.length > 0 ? (
                    <>
                      {smsHistory.map((item) => (
                        <div key={item.id} className="bg-slate-800/30 rounded-md p-3 border border-slate-800/80">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h4 className="text-sm font-medium text-slate-200">{item.recipientName || 'Unknown'}</h4>
                              <p className="text-xs text-slate-400">{item.recipientPhone}</p>
                            </div>
                            <Badge className={`${getStatusColor(item.status)} px-2 py-0.5 text-[10px]`}>
                              {item.status === 'sent' && <Clock className="h-3 w-3 mr-1" />}
                              {item.status === 'delivered' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {item.status === 'read' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {item.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300 mb-2">{item.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500">{formatTimestamp(item.timestamp)}</span>
                            {item.status === 'failed' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-amber-400 hover:text-amber-300 p-0"
                                onClick={() => {
                                  dispatch(setMessage(item.message));
                                  setActiveTab("compose");
                                }}
                              >
                                Try Again
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">No message history found</p>
                      {accountNumber && (
                        <p className="text-xs mt-1">
                          Messages sent to this customer will appear here
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="pt-4 mt-4 border-t border-slate-700 flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            Cancel
          </Button>
          {activeTab === "compose" && (
            <Button
              type="button"
              variant="default"
              onClick={handleSendSMS}
              disabled={sending || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Send SMS
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}