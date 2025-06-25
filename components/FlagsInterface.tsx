// components/FlagsInterface.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Flag, 
  X, 
  AlertTriangle, 
  Check, 
  Clock, 
  Filter, 
  ArrowUpDown,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRedux } from "@/hooks/useRedux";
import { 
  closeDialog, 
  Flag as FlagType,
  fetchCustomerFlags,
  createFlag,
  markFlagResolved,
  removeFlag 
} from "@/lib/redux/features/flags/flagsSlice";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, formatDistance } from "date-fns";
import { useAppSelector } from "@/lib/redux/store";
import { RootState } from "@/lib/redux/store";

// Predefined flag types
const flagTypes = [
  { 
    id: "fraud", 
    label: "Fraud Alert", 
    description: "Potential fraudulent activity detected on this account" 
  },
  { 
    id: "legal", 
    label: "Legal Action", 
    description: "Account is under legal proceedings or review" 
  },
  { 
    id: "dispute", 
    label: "Payment Dispute", 
    description: "Customer has disputed charges or payment amounts" 
  },
  { 
    id: "bankruptcy", 
    label: "Bankruptcy", 
    description: "Customer has declared bankruptcy" 
  },
  { 
    id: "deceased", 
    label: "Deceased", 
    description: "Customer is deceased" 
  },
  { 
    id: "trace", 
    label: "Trace Alert", 
    description: "Account requires tracing or location verification" 
  },
  { 
    id: "special", 
    label: "Special Handling", 
    description: "Account requires special handling or attention" 
  },
  { 
    id: "custom", 
    label: "Custom Flag", 
    description: "Create a custom flag for this account" 
  }
];

export default function FlagsInterface() {
  // Use direct state access instead of selector functions to avoid hooks issues
  const { dispatch } = useRedux();
  const flagsState = useAppSelector((state: RootState) => state.flags);
  
  // Get the current authenticated user
  const { user } = useAuth();
  
  // State for the form
  const [flagType, setFlagType] = useState("");
  const [customFlagLabel, setCustomFlagLabel] = useState("");
  const [flagPriority, setFlagPriority] = useState<"high" | "medium" | "low">("medium");
  const [flagNotes, setFlagNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  // Get the selected account from the flags slice
  const selectedAccount = flagsState.selectedAccount;
  
  // Filter flags for the current account
  const allFlags = flagsState.flags;
  const accountFlags = selectedAccount ? allFlags.filter((flag: FlagType) => flag.accountId === selectedAccount.id) : [];
  
  // Fetch flags when the dialog opens with a selected account
  React.useEffect(() => {
    if (flagsState.isDialogOpen && selectedAccount) {
      dispatch(fetchCustomerFlags(selectedAccount.id));
    }
  }, [flagsState.isDialogOpen, selectedAccount, dispatch]);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (selectedAccount) {
      setFlagType("");
      setCustomFlagLabel("");
      setFlagPriority("medium");
      setFlagNotes("");
      setIsSubmitting(false);
      setActiveTab("create");
    }
  }, [selectedAccount]);
  
  const handleAddFlag = () => {
    if (!selectedAccount || !user) return;
    
    // Validate form
    if (!flagType) {
      toast.error("Please select a flag type");
      return;
    }
    
    if (flagType === "custom" && !customFlagLabel) {
      toast.error("Please enter a custom flag label");
      return;
    }
    
    if (!flagNotes) {
      toast.error("Please enter flag notes");
      return;
    }
    
    setIsSubmitting(true);
    
    // Create new flag data
    const flagData = {
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      accountNumber: selectedAccount.accountNumber,
      type: flagType === "custom" ? customFlagLabel : flagTypes.find(f => f.id === flagType)?.label || "",
      priority: flagPriority,
      notes: flagNotes,
      addedById: user.id,
      addedBy: user.name
    };
    
    // Dispatch action to add flag
    dispatch(createFlag(flagData))
      .unwrap()
      .then(() => {
        // Reset form
        setFlagType("");
        setCustomFlagLabel("");
        setFlagPriority("medium");
        setFlagNotes("");
        
        // Show success message
        toast.success("Flag added successfully");
        
        // Switch to view tab
        setActiveTab("view");
      })
      .catch((error) => {
        toast.error(`Error adding flag: ${error}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  const handleResolveFlag = (flagId: string) => {
    if (!user) return;
    
    dispatch(markFlagResolved({
      flagId,
      resolvedById: user.id,
      resolvedBy: user.name
    }))
      .unwrap()
      .then(() => {
        toast.success("Flag resolved successfully");
      })
      .catch((error) => {
        toast.error(`Error resolving flag: ${error}`);
      });
  };
  
  const handleDeleteFlag = (flagId: string) => {
    dispatch(removeFlag(flagId))
      .unwrap()
      .then(() => {
        toast.success("Flag deleted successfully");
      })
      .catch((error) => {
        toast.error(`Error deleting flag: ${error}`);
      });
  };
  
  const getFlagPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 border-red-500";
      case "medium":
        return "text-amber-400 border-amber-500";
      case "low":
        return "text-blue-400 border-blue-500";
      default:
        return "text-slate-400 border-slate-500";
    }
  };
  
  const getFlagPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-900/30 text-red-300 border-red-700";
      case "medium":
        return "bg-amber-900/30 text-amber-300 border-amber-700";
      case "low":
        return "bg-blue-900/30 text-blue-300 border-blue-700";
      default:
        return "bg-slate-900/30 text-slate-300 border-slate-700";
    }
  };
  
  const getFlagStatusBadge = (isResolved: boolean) => {
    return isResolved
      ? "bg-green-900/30 text-green-300 border-green-700"
      : "bg-slate-900/30 text-slate-300 border-slate-700";
  };
  
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistance(parseISO(dateString), new Date(), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };
  
  // If no account is selected, don't render the dialog
  if (!selectedAccount) {
    return null;
  }
  
  return (
    <Dialog open={flagsState.isDialogOpen} onOpenChange={(open) => !open && dispatch(closeDialog())}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-slate-800">
          <div className="flex items-center">
            <div className="bg-red-600/20 rounded-full p-2 mr-3">
              <Flag className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-100">
                Account Flags
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedAccount.name} {selectedAccount.accountNumber ? `(${selectedAccount.accountNumber})` : ""}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 border-b border-slate-800">
            <TabsList className="bg-slate-800/50 h-9 p-1">
              <TabsTrigger value="create" className="text-xs h-7 px-3 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-100">
                Create Flag
              </TabsTrigger>
              <TabsTrigger value="view" className="text-xs h-7 px-3 data-[state=active]:bg-red-600/20 data-[state=active]:text-red-100">
                View Flags
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="create" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">
                    Select flag type:
                  </Label>
                  <RadioGroup 
                    value={flagType} 
                    onValueChange={setFlagType}
                  >
                    <div className="space-y-3">
                      {flagTypes.filter(f => f.id !== 'custom').map((type) => (
                        <div
                          key={type.id}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                            flagType === type.id
                              ? "border-red-500/50 bg-red-500/10"
                              : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                          }`}
                        >
                          <RadioGroupItem 
                            value={type.id} 
                            id={type.id}
                            className="mt-1 border-slate-600 text-red-500"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={type.id}
                              className="text-sm font-medium text-slate-200 block cursor-pointer"
                            >
                              {type.label}
                            </label>
                            <p className="text-xs text-slate-400 mt-1">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Custom option */}
                      <div
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                          flagType === "custom"
                            ? "border-red-500/50 bg-red-500/10"
                            : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                        }`}
                      >
                        <RadioGroupItem 
                          value="custom" 
                          id="custom"
                          className="mt-1 border-slate-600 text-red-500"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="custom"
                            className="text-sm font-medium text-slate-200 block cursor-pointer"
                          >
                            Custom Flag
                          </label>
                          {flagType === "custom" && (
                            <Input
                              placeholder="Enter custom flag description..."
                              value={customFlagLabel}
                              onChange={(e) => setCustomFlagLabel(e.target.value)}
                              className="mt-2 bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-red-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-slate-300">Priority:</Label>
                  <RadioGroup 
                    value={flagPriority} 
                    onValueChange={(value) => setFlagPriority(value as "high" | "medium" | "low")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="low"
                        id="priority-low"
                        className="border-blue-500 text-blue-500"
                      />
                      <Label
                        htmlFor="priority-low"
                        className="text-xs font-medium text-blue-400"
                      >
                        Low
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="medium"
                        id="priority-medium"
                        className="border-amber-500 text-amber-500"
                      />
                      <Label
                        htmlFor="priority-medium"
                        className="text-xs font-medium text-amber-400"
                      >
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="high"
                        id="priority-high"
                        className="border-red-500 text-red-500"
                      />
                      <Label
                        htmlFor="priority-high"
                        className="text-xs font-medium text-red-400"
                      >
                        High
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-slate-300">
                    Additional notes:
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional context or notes about this flag..."
                    value={flagNotes}
                    onChange={(e) => setFlagNotes(e.target.value)}
                    className="bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-red-500 resize-none h-24"
                  />
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-300">Important Note</h4>
                    <p className="text-xs text-red-200/70 mt-1">
                      Adding a flag to this account will alert other agents about special handling requirements. High priority flags may trigger additional processes.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => dispatch(closeDialog())}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddFlag}
                  disabled={!flagType || (flagType === 'custom' && !customFlagLabel) || !flagNotes || isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? (
                    "Adding..."
                  ) : (
                    <>
                      <Flag className="mr-2 h-4 w-4" /> Add Flag
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="view" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {accountFlags.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-300">Account Flags</h3>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Filter className="h-3 w-3 mr-1" /> Filter
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ArrowUpDown className="h-3 w-3 mr-1" /> Sort
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {accountFlags.map((flag) => (
                        <div key={flag.id} className="bg-slate-800/30 rounded-md p-3 border border-slate-800/80">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center">
                                <motion.div
                                  initial={{ rotate: 0 }}
                                  animate={{ rotate: flag.isResolved ? 0 : [0, 15, 0, 15, 0] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: flag.isResolved ? 0 : Infinity,
                                    repeatDelay: 5,
                                  }}
                                >
                                  <Flag className={`h-4 w-4 mr-2 ${getFlagPriorityColor(flag.priority)}`} />
                                </motion.div>
                                <h4 className="text-sm font-medium text-slate-200">
                                  {flag.type}
                                </h4>
                                <Badge className={`ml-2 ${getFlagPriorityBadge(flag.priority)} px-1.5 py-0 h-5 text-[10px]`}>
                                  {flag.priority}
                                </Badge>
                                <Badge className={`ml-2 ${getFlagStatusBadge(flag.isResolved)} px-1.5 py-0 h-5 text-[10px]`}>
                                  {flag.isResolved ? "Resolved" : "Active"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="h-3 w-3 mr-1" /> 
                              {getTimeAgo(flag.dateAdded)}
                            </div>
                          </div>
                          
                          {flag.notes && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                              <div className="flex items-start text-xs">
                                <FileText className="h-3 w-3 mr-1 mt-0.5 text-slate-500" />
                                <p className="text-slate-400">{flag.notes}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center">
                            <div className="text-xs text-slate-500">
                              Added by {flag.addedBy}
                            </div>
                            <div className="flex gap-2">
                              {!flag.isResolved && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  onClick={() => handleResolveFlag(flag.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => handleDeleteFlag(flag.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="bg-slate-800/50 rounded-full p-3 mb-3">
                      <Flag className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-300 mb-1">No Flags</h3>
                    <p className="text-xs text-slate-500 text-center max-w-xs">
                      There are no flags on this account yet. Create a flag to highlight important information about this account.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("create")}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                >
                  <Flag className="mr-2 h-4 w-4" /> Create New Flag
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}