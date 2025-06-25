// components/Legal.tsx
"use client";

import { useState } from "react";
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
import { 
  Scale, 
  FileText, 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Calendar,
  ChevronDown,
  User,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LegalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorId: string;
  debtorName: string;
}

type LegalAction = {
  id: string;
  type: string;
  date: string;
  status: string;
  notes: string;
  documents: string[];
};

type LegalNote = {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
};

export function Legal({ 
  isOpen, 
  onClose, 
  debtorId, 
  debtorName 
}: LegalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [actionType, setActionType] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock data for legal actions
  const [legalActions, setLegalActions] = useState<LegalAction[]>([
    {
      id: "la-001",
      type: "Demand Letter",
      date: "2025-02-15",
      status: "Sent",
      notes: "Formal demand letter sent via registered mail.",
      documents: ["demand-letter-001.pdf"]
    },
    {
      id: "la-002",
      type: "Legal Notice",
      date: "2025-03-01",
      status: "Pending",
      notes: "Notice of intent to pursue legal action.",
      documents: ["legal-notice-001.pdf"]
    }
  ]);
  
  // Mock data for legal notes
  const [legalNotes, setLegalNotes] = useState<LegalNote[]>([
    {
      id: "ln-001",
      text: "Debtor contacted legal department claiming inability to pay.",
      createdBy: "John Smith",
      createdAt: "2025-02-20T14:30:00Z"
    },
    {
      id: "ln-002",
      text: "Reviewed case with legal team. Proceeding with formal notice.",
      createdBy: "Sarah Johnson",
      createdAt: "2025-02-28T09:15:00Z"
    }
  ]);
  
  // Legal action types
  const legalActionTypes = [
    { id: "demand-letter", name: "Demand Letter" },
    { id: "legal-notice", name: "Legal Notice" },
    { id: "summons", name: "Summons" },
    { id: "judgment", name: "Judgment" },
    { id: "garnishment", name: "Wage Garnishment" },
    { id: "lien", name: "Property Lien" },
    { id: "settlement", name: "Settlement Agreement" }
  ];
  
  const handleAddAction = async () => {
    if (!actionType) {
      toast.error("Please select an action type");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the action type name
      const actionTypeName = legalActionTypes.find(type => type.id === actionType)?.name || "";
      
      // Create new action
      const newAction: LegalAction = {
        id: `la-${Date.now()}`,
        type: actionTypeName,
        date: new Date().toISOString().split('T')[0],
        status: "Pending",
        notes: actionNotes,
        documents: []
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update state
      setLegalActions([...legalActions, newAction]);
      
      // Reset form
      setActionType("");
      setActionNotes("");
      
      // Show success message
      toast.success("Legal action added", {
        description: `${actionTypeName} has been initiated for ${debtorName}`,
        position: "top-center",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding legal action:", error);
      toast.error("Failed to add legal action", {
        description: "There was an error adding the legal action. Please try again.",
        position: "top-center",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create new note
      const note: LegalNote = {
        id: `ln-${Date.now()}`,
        text: newNote,
        createdBy: "Current User", // Replace with actual user name
        createdAt: new Date().toISOString()
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update state
      setLegalNotes([...legalNotes, note]);
      
      // Reset form
      setNewNote("");
      
      // Show success message
      toast.success("Note added", {
        description: "Your note has been added to the legal record",
        position: "top-center",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note", {
        description: "There was an error adding your note. Please try again.",
        position: "top-center",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format datetime for display
  const formatDateTime = (dateTimeString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString(undefined, options);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh]">
        <div className="relative h-full flex flex-col">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
          
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-2 rounded-full">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100">Legal Actions</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400">
              Manage legal actions for {debtorName}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="bg-slate-800/50 w-full">
                <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-slate-700">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex-1 data-[state=active]:bg-slate-700">
                  Actions
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-slate-700">
                  Notes
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div 
              style={{
                padding: "24px",
                overflowY: "scroll",
                maxHeight: "60vh",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(51, 65, 85, 0.5) rgba(15, 23, 42, 0.3)",
                backgroundColor: "#1e293b"
              }}
              className="flex-grow"
            >
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Legal Status</h3>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                      <span className="text-amber-300 font-medium">In Progress</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Legal actions have been initiated but are not yet complete.
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Next Steps</h3>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="text-slate-300">Awaiting response to legal notice</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Due by {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())}
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 p-4 border-b border-slate-700">
                    Recent Legal Actions
                  </h3>
                  <div className="divide-y divide-slate-700">
                    {legalActions.length > 0 ? (
                      legalActions.map((action) => (
                        <div key={action.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium text-slate-200">{action.type}</h4>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDate(action.date)} • Status: <span className={`font-medium ${
                                  action.status === "Sent" ? "text-green-400" : 
                                  action.status === "Pending" ? "text-amber-400" : "text-slate-300"
                                }`}>{action.status}</span>
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                          {action.notes && (
                            <p className="text-xs text-slate-400 mt-2 border-l-2 border-slate-700 pl-2">
                              {action.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No legal actions recorded
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-cyan-300">Legal Notice</h4>
                    <p className="text-xs text-cyan-200/70 mt-1">
                      All legal actions must be approved by a supervisor and comply with relevant debt collection laws and regulations. Ensure all documentation is properly recorded.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-6 mt-0">
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Initiate Legal Action</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="action-type" className="text-xs text-slate-400">
                        Action Type
                      </Label>
                      <Select value={actionType} onValueChange={setActionType}>
                        <SelectTrigger id="action-type" className="bg-slate-800 border-slate-700 text-slate-300 mt-1">
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                          {legalActionTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="action-notes" className="text-xs text-slate-400">
                        Notes
                      </Label>
                      <Textarea
                        id="action-notes"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Enter details about this legal action..."
                        className="bg-slate-800 border-slate-700 text-slate-300 mt-1 resize-none h-24"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleAddAction}
                      disabled={!actionType || isSubmitting}
                      className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Initiate Legal Action
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 p-4 border-b border-slate-700 flex justify-between items-center">
                    <span>Legal Action History</span>
                    <span className="text-xs text-slate-500">{legalActions.length} actions</span>
                  </h3>
                  
                  <Accordion type="single" collapsible className="divide-y divide-slate-700">
                    {legalActions.map((action, index) => (
                      <AccordionItem key={action.id} value={action.id} className="border-none">
                        <AccordionTrigger className="px-4 py-3 hover:bg-slate-800/50 hover:no-underline">
                          <div className="flex items-center space-x-3 text-left">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              action.status === "Sent" ? "bg-green-500/20 text-green-400" : 
                              "bg-amber-500/20 text-amber-400"
                            }`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-slate-200">{action.type}</h4>
                              <p className="text-xs text-slate-400">
                                {formatDate(action.date)}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3 pt-0">
                          <div className="bg-slate-800/30 rounded-lg p-3 space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-slate-400">Status</h5>
                              <p className={`text-sm ${
                                action.status === "Sent" ? "text-green-400" : 
                                action.status === "Pending" ? "text-amber-400" : "text-slate-300"
                              }`}>
                                {action.status}
                              </p>
                            </div>
                            
                            {action.notes && (
                              <div>
                                <h5 className="text-xs font-medium text-slate-400">Notes</h5>
                                <p className="text-sm text-slate-300">{action.notes}</p>
                              </div>
                            )}
                            
                            {action.documents.length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium text-slate-400">Documents</h5>
                                <div className="mt-1 space-y-1">
                                  {action.documents.map((doc, i) => (
                                    <div key={i} className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300">
                                      <FileText className="h-3.5 w-3.5" />
                                      <span>{doc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end space-x-2 pt-2">
                              <Button variant="outline" size="sm" className="h-8 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                                Update Status
                              </Button>
                              <Button size="sm" className="h-8 bg-cyan-600 hover:bg-cyan-700 text-white">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {legalActions.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No legal actions recorded
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-6 mt-0">
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Add Note</h3>
                  
                  <div className="space-y-4">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter legal notes, observations, or follow-up items..."
                      className="bg-slate-800 border-slate-700 text-slate-300 resize-none h-24"
                    />
                    
                    <Button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSubmitting}
                      className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Note
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 p-4 border-b border-slate-700">
                    Legal Notes History
                  </h3>
                  
                  <div className="divide-y divide-slate-700">
                    {legalNotes.length > 0 ? (
                      legalNotes.map((note) => (
                        <div key={note.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="text-sm font-medium text-slate-300">{note.createdBy}</h4>
                                <span className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</span>
                              </div>
                              <p className="text-sm text-slate-400">{note.text}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No notes recorded
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="p-6 pt-0 flex justify-between flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button 
              className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white"
              onClick={onClose}
            >
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}