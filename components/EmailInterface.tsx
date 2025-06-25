// app/components/EmailInterface.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Paperclip, 
  Send, 
  X, 
  Plus, 
  FileText, 
  CheckCircle, 
  History, 
  Clock 
} from "lucide-react";
import { toast } from "sonner";
import { useRedux } from "@/hooks/useRedux";
import { 
  closeEmailInterface, 
  setSubject, 
  setMessage, 
  addCcEmail, 
  removeCcEmail, 
  addAttachment, 
  removeAttachment, 
  toggleTemplates, 
  applyTemplate as applyEmailTemplate,
  sendEmail,
  EmailAttachment,
  EmailTemplate
} from "@/lib/redux/features/email/emailSlice";
import { formatDistanceToNow } from "date-fns";

export function EmailInterface() {
  const { dispatch, email } = useRedux();
  const isOpen = email.isOpen();
  const recipient = email.recipient();
  const content = email.content();
  const templates = email.templates();
  const showTemplates = email.showTemplates();
  const sending = email.sending();
  const sendStatus = email.sendStatus();
  const history = email.history();
  const [newCcEmail, setNewCcEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Filter email history for the current recipient
  const recipientEmailHistory = history.filter(
    email => email.recipientEmail === recipient.email
  );

  // Handle close
  const handleClose = () => {
    dispatch(closeEmailInterface());
  };

  // Handle adding CC email
  const handleAddCcEmail = () => {
    if (newCcEmail) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(newCcEmail)) {
        dispatch(addCcEmail(newCcEmail));
        setNewCcEmail("");
      } else {
        toast.error("Please enter a valid email address");
      }
    }
  };

  // Handle removing CC email
  const handleRemoveCcEmail = (email: string) => {
    dispatch(removeCcEmail(email));
  };

  // Handle attachment change
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const attachment: EmailAttachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          content: file
        };
        dispatch(addAttachment(attachment));
      });
    }
  };

  // Handle removing attachment
  const handleRemoveAttachment = (name: string) => {
    dispatch(removeAttachment(name));
  };

  // Handle applying template
  const handleApplyTemplate = (templateId: string) => {
    dispatch(applyEmailTemplate(templateId));
    toast.success(`Applied template`);
  };

  // Handle sending email
  const handleSendEmail = async () => {
    console.log('=== EMAIL SENDING PROCESS STARTED ===');
    console.log('Email recipient:', recipient);
    console.log('Email content:', content);
    console.log('Email attachments:', content.attachments);
    
    if (!content.subject || !content.message) {
      console.log('Error: Missing subject or message');
      toast.error("Please enter a subject and message");
      return;
    }
    
    try {
      console.log('Dispatching sendEmail action...');
      const result = await dispatch(sendEmail()).unwrap();
      console.log('Email send result:', result);
      toast.success("Email sent successfully");
    } catch (error) {
      console.error('Email send error:', error);
      toast.error(`Failed to send email: ${error}`);
    }
    
    console.log('=== EMAIL SENDING PROCESS COMPLETED ===');
  };

  // Effect to show success/error messages when send status changes
  useEffect(() => {
    if (sendStatus.success === true) {
      toast.success("Email sent successfully");
    } else if (sendStatus.success === false && sendStatus.error) {
      toast.error(`Failed to send email: ${sendStatus.error}`);
    }
  }, [sendStatus.success, sendStatus.error]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh]">
        <div className="relative h-full flex flex-col">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-600"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-full">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100">Compose Email</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 flex items-center">
              <span>To: {recipient.name} &lt;{recipient.email}&gt;</span>
              {recipient.accountNumber && recipient.accountNumber !== "N/A" && (
                <span className="ml-2 text-xs bg-slate-800 px-2 py-0.5 rounded-full">
                  Account: {recipient.accountNumber}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs 
            defaultValue="compose" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "compose" | "history")} 
            className="flex-grow flex flex-col"
          >
            <TabsList className="grid grid-cols-2 mx-6 mt-4 bg-slate-800/60">
              <TabsTrigger 
                value="compose" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                Compose
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
              >
                <History className="h-4 w-4 mr-2" />
                History {recipientEmailHistory.length > 0 && `(${recipientEmailHistory.length})`}
              </TabsTrigger>
            </TabsList>
            
            <div 
              style={{
                padding: "24px",
                overflowY: "auto",
                maxHeight: "60vh",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(51, 65, 85, 0.5) rgba(15, 23, 42, 0.3)",
                backgroundColor: "#1e293b"
              }}
              className="flex-grow"
            >
              <TabsContent value="compose" className="mt-0 h-full">
                {showTemplates ? (
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-slate-200">Email Templates</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => dispatch(toggleTemplates())}
                        className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Close Templates
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {templates.map((template) => (
                        <div 
                          key={template.id}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer"
                          onClick={() => handleApplyTemplate(template.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-slate-200">{template.name}</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyTemplate(template.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-slate-400 mb-1">Subject: {template.subject}</p>
                          <div className="text-xs text-slate-500 line-clamp-2">
                            {template.body.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(toggleTemplates())}
                        className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="to" className="text-sm text-slate-400">To:</Label>
                      <Input 
                        id="to" 
                        value={recipient.email} 
                        readOnly 
                        className="bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* CC Email Section */}
                    <div className="grid gap-2">
                      <Label htmlFor="cc" className="text-sm text-slate-400">CC:</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="cc" 
                          value={newCcEmail} 
                          onChange={(e) => setNewCcEmail(e.target.value)} 
                          placeholder="Add CC email address" 
                          className="bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCcEmail();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCcEmail}
                          className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {content.ccEmails.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {content.ccEmails.map((email, index) => (
                            <div 
                              key={index} 
                              className="flex items-center bg-slate-800 rounded-full px-3 py-1 text-xs"
                            >
                              <span className="truncate max-w-[150px]">{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCcEmail(email)}
                                className="ml-2 text-slate-400 hover:text-slate-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="subject" className="text-sm text-slate-400">Subject:</Label>
                      <Input 
                        id="subject" 
                        value={content.subject} 
                        onChange={(e) => dispatch(setSubject(e.target.value))} 
                        placeholder="Enter email subject" 
                        className="bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="message" className="text-sm text-slate-400">Message:</Label>
                      <Textarea 
                        id="message" 
                        value={content.message} 
                        onChange={(e) => dispatch(setMessage(e.target.value))} 
                        placeholder="Type your message here..." 
                        className="min-h-[200px] bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="attachments" className="text-sm text-slate-400 flex items-center">
                        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                        Attachments:
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="attachments"
                          type="file"
                          multiple
                          onChange={handleAttachmentChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => document.getElementById("attachments")?.click()}
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Add Files
                        </Button>
                        <span className="text-xs text-slate-400">
                          {content.attachments.length > 0 
                            ? `${content.attachments.length} file${content.attachments.length > 1 ? 's' : ''} selected` 
                            : 'No files selected'}
                        </span>
                      </div>
                      
                      {content.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {content.attachments.map((file, index) => (
                            <div 
                              key={index} 
                              className="flex items-center bg-slate-800 rounded-full px-3 py-1 text-xs"
                            >
                              <span className="truncate max-w-[150px]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(file.name)}
                                className="ml-2 text-slate-400 hover:text-slate-200"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="mt-0 h-full">
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-200">
                      Email History for {recipient.name}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {recipientEmailHistory.length} email{recipientEmailHistory.length !== 1 ? 's' : ''} sent
                    </span>
                  </div>
                  
                  {recipientEmailHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="bg-slate-800/60 p-3 rounded-full mb-3">
                        <Clock className="h-6 w-6 text-slate-400" />
                      </div>
                      <h4 className="text-slate-300 font-medium mb-1">No emails sent yet</h4>
                      <p className="text-sm text-slate-400">
                        When you send emails to this recipient, they will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {recipientEmailHistory.map((email) => (
                        <div 
                          key={email.id}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-slate-200">{email.subject}</h4>
                            <div className="flex items-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                email.status === 'sent' 
                                  ? 'bg-green-900/20 text-green-400' 
                                  : 'bg-red-900/20 text-red-400'
                              }`}>
                                {email.status === 'sent' ? 'Sent' : 'Failed'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-slate-400 mb-3">
                            Sent {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                          </div>
                          
                          <div className="text-xs text-slate-500 bg-slate-800/80 p-3 rounded-md max-h-[120px] overflow-y-auto mb-2">
                            {email.message}
                          </div>
                          
                          {email.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-slate-400 mb-1 flex items-center">
                                <Paperclip className="h-3 w-3 mr-1" />
                                Attachments:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {email.attachments.map((file, index) => (
                                  <div 
                                    key={index} 
                                    className="flex items-center bg-slate-800 rounded-full px-3 py-1 text-xs"
                                  >
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="p-6 pt-0 flex justify-between flex-shrink-0 bg-slate-900 border-t border-slate-800">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            {activeTab === "compose" && (
              <Button 
                onClick={handleSendEmail} 
                disabled={!content.subject || !content.message || sending || showTemplates}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {sending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}