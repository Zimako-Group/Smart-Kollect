// components/RTP.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CalendarX, 
  AlertTriangle, 
  Check, 
  X, 
  History, 
  Filter, 
  ArrowUpDown,
  Clock,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useRedux } from "@/hooks/useRedux";
import { 
  closeRTPInterface, 
  setReasonId, 
  setCustomReason, 
  setNotes, 
  createRTP,
  fetchRTPHistory,
  RTPRecord
} from "@/lib/redux/features/rtp/rtpSlice";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RTP() {
  const { dispatch, rtp } = useRedux();
  
  // Use the selectors to get the RTP state
  const isOpen = rtp.isOpen();
  const customer = rtp.customer();
  const formData = rtp.formData();
  const creating = rtp.creating();
  const createStatus = rtp.createStatus();
  const rtpHistory = rtp.history();
  const rtpReasons = rtp.reasons();
  
  const [activeTab, setActiveTab] = useState("create");
  
  // Reset form state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("create");
      
      // Fetch RTP history for this customer
      if (customer.id) {
        dispatch(fetchRTPHistory(customer.id));
      }
    }
  }, [isOpen, customer.id, dispatch]);
  
  // Handle creating RTP
  const handleCreateRTP = () => {
    if (!formData.reasonId || (formData.reasonId === 'custom' && !formData.customReason)) {
      toast.error("Please select or enter a reason for refusal to pay");
      return;
    }
    
    dispatch(createRTP())
      .unwrap()
      .then(() => {
        toast.success("Refusal to pay recorded successfully", {
          description: `RTP recorded for ${customer.name}`,
        });
      })
      .catch((error: string) => {
        toast.error(`Failed to record RTP: ${error}`);
      });
  };
  
  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    return format(parseISO(timestamp), "PPP");
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-amber-600/20 text-amber-400";
      case "resolved":
        return "bg-green-600/20 text-green-400";
      case "escalated":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dispatch(closeRTPInterface())}>
      <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-slate-800">
          <div className="flex items-center">
            <div className="bg-amber-600/20 rounded-full p-2 mr-3">
              <CalendarX className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-100">
                Refusal To Pay
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer: {customer.name} {customer.accountNumber ? `(${customer.accountNumber})` : ""}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 border-b border-slate-800">
            <TabsList className="bg-slate-800/50 h-9 p-1">
              <TabsTrigger value="create" className="text-xs h-7 px-3 data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-100">
                Create RTP
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7 px-3 data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-100">
                RTP History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            {createStatus.success ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Check className="h-16 w-16 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold text-amber-100 mb-2">RTP Successfully Recorded</h3>
                <p className="text-center text-slate-300 mb-6">
                  A refusal to pay has been recorded for {customer.name}.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab("history");
                    }}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                  <Button 
                    onClick={() => {
                      dispatch(closeRTPInterface());
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-slate-300">
                      Select reason for refusal to pay:
                    </Label>
                    <RadioGroup 
                      value={formData.reasonId} 
                      onValueChange={(value) => dispatch(setReasonId(value))}
                    >
                      <div className="space-y-3">
                        {rtpReasons.filter(r => r.id !== 'custom').map((reason) => (
                          <div
                            key={reason.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                              formData.reasonId === reason.id
                                ? "border-amber-500/50 bg-amber-500/10"
                                : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                            }`}
                          >
                            <RadioGroupItem 
                              value={reason.id} 
                              id={reason.id}
                              className="mt-1 border-slate-600 text-amber-500"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={reason.id}
                                className="text-sm font-medium text-slate-200 block cursor-pointer"
                              >
                                {reason.reason}
                              </label>
                              <p className="text-xs text-slate-400 mt-1">
                                {reason.description}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Custom option */}
                        <div
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                            formData.reasonId === "custom"
                              ? "border-amber-500/50 bg-amber-500/10"
                              : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                          }`}
                        >
                          <RadioGroupItem 
                            value="custom" 
                            id="custom"
                            className="mt-1 border-slate-600 text-amber-500"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor="custom"
                              className="text-sm font-medium text-slate-200 block cursor-pointer"
                            >
                              Other reason
                            </label>
                            {formData.reasonId === "custom" && (
                              <Textarea
                                placeholder="Enter custom reason for refusal to pay..."
                                value={formData.customReason}
                                onChange={(e) => dispatch(setCustomReason(e.target.value))}
                                className="mt-2 bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-amber-500 resize-none h-20"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-slate-300">
                      Additional notes:
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any additional context or notes about this refusal to pay..."
                      value={formData.notes}
                      onChange={(e) => dispatch(setNotes(e.target.value))}
                      className="bg-slate-800/60 border-slate-700 text-slate-300 focus:ring-amber-500 resize-none h-24"
                    />
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-300">Important Note</h4>
                      <p className="text-xs text-amber-200/70 mt-1">
                        Recording a refusal to pay will flag this account for review and may trigger the next step in the collections process. Ensure all information is accurate.
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}

            {!createStatus.success && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => dispatch(closeRTPInterface())}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRTP}
                    disabled={!formData.reasonId || (formData.reasonId === 'custom' && !formData.customReason) || creating}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {creating ? (
                      "Recording..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Record RTP
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 flex flex-col p-0 m-0 min-h-0">
            <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {rtpHistory.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-300">RTP History</h3>
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
                      {rtpHistory.map((item: RTPRecord) => (
                        <div key={item.id} className="bg-slate-800/30 rounded-md p-3 border border-slate-800/80">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center">
                                <h4 className="text-sm font-medium text-slate-200">
                                  {item.reason}
                                </h4>
                                <Badge className={`ml-2 ${getStatusColor(item.status)} px-1.5 py-0 h-5 text-[10px]`}>
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="h-3 w-3 mr-1" /> 
                              Created: {format(parseISO(item.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                          
                          {item.notes && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                              <div className="flex items-start text-xs">
                                <FileText className="h-3 w-3 mr-1 mt-0.5 text-slate-500" />
                                <p className="text-slate-400">{item.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="bg-slate-800/50 rounded-full p-3 mb-3">
                      <History className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-300 mb-1">No RTP History</h3>
                    <p className="text-xs text-slate-500 text-center max-w-xs">
                      There are no refusal to pay records for this customer yet.
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
                  Create New RTP
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}