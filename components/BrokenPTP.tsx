"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Calendar, 
  Clock, 
  Search, 
  ArrowLeft, 
  Filter, 
  AlertCircle,
  X,
  CheckCircle2,
  History,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Users
} from "lucide-react";
import { useDialer } from "@/contexts/DialerContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BrokenPTPOutcome from "./BrokenPTPOutcome";
import { getDefaultedPTPsByAgent } from "@/lib/ptp-service";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type BrokenPTPCustomer = {
  id: string;
  name: string;
  phone: string;
  amount: number;
  promiseDate: string;
  daysLate: number;
  status: "high" | "medium" | "low";
  agentId?: string;
  agentName?: string;
  source?: 'PTP' | 'ManualPTP'; // Source table indicator
};

type CallOutcome = {
  id: string;
  customerId: string;
  outcome: string;
  notes: string;
  newPromiseDate?: Date;
  newAmount?: number;
  timestamp: Date;
};

// Sample data for broken PTPs - empty since we have no broken PTPs yet
const sampleBrokenPTPs: BrokenPTPCustomer[] = [];

type AgentPTPs = {
  agent: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  ptps: BrokenPTPCustomer[];
  expanded?: boolean;
};

interface BrokenPTPProps {
  onClose: () => void;
}

const BrokenPTP: React.FC<BrokenPTPProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPTPs, setFilteredPTPs] = useState<BrokenPTPCustomer[]>(sampleBrokenPTPs);
  const [statusFilter, setStatusFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [resolvedPTPs, setResolvedPTPs] = useState<string[]>([]);
  const [callOutcomes, setCallOutcomes] = useState<CallOutcome[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<BrokenPTPCustomer | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [agentPTPs, setAgentPTPs] = useState<Record<string, AgentPTPs>>({});
  const [loading, setLoading] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const { setIsDialerOpen, setCurrentCustomer } = useDialer();
  const { user } = useAuth(); // Get the current logged-in user

  // Load defaulted PTPs grouped by agent
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ptpsByAgent = await getDefaultedPTPsByAgent();
        
        // Convert from API format to component state format
        const formattedPTPs: Record<string, AgentPTPs> = {};
        
        // Only process PTPs for the current logged-in agent
        if (user && user.id) {
          // Check if there are PTPs for the current user
          if (ptpsByAgent[user.id]) {
            const { agent, ptps } = ptpsByAgent[user.id];
            
            // Format each PTP with additional fields and calculate days late
            const formattedPtps = ptps.map(ptp => ({
              id: ptp.id,
              name: ptp.debtor_name || 'Unknown Customer', // Use the debtor name we fetched
              phone: ptp.debtor_phone || 'No Phone', // Use the debtor phone we fetched
              amount: ptp.amount,
              promiseDate: ptp.date,
              daysLate: Math.ceil((new Date().getTime() - new Date(ptp.date).getTime()) / (1000 * 3600 * 24)),
              status: determinePTPStatus(Math.ceil((new Date().getTime() - new Date(ptp.date).getTime()) / (1000 * 3600 * 24))),
              agentId: agent.id,
              agentName: agent.full_name
            }));
            
            formattedPTPs[user.id] = {
              agent,
              ptps: formattedPtps,
              expanded: true // Always expand the current agent's PTPs
            };
          }
        }
        
        setAgentPTPs(formattedPTPs);
        
        // Also set filtered PTPs for backwards compatibility
        const allPTPs = Object.values(formattedPTPs)
          .flatMap(agentData => agentData.ptps)
          .filter(ptp => !resolvedPTPs.includes(ptp.id));
          
        setFilteredPTPs(allPTPs);
      } catch (error) {
        console.error('Error fetching defaulted PTPs:', error);
        toast.error('Failed to load defaulted promises to pay');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [expandedAgents, resolvedPTPs, user]); // Add user as a dependency
  
  // Determine PTP status based on days late
  const determinePTPStatus = (daysLate: number): "high" | "medium" | "low" => {
    if (daysLate > 14) return "high";
    if (daysLate > 7) return "medium";
    return "low";
  };
  
  // Toggle agent section expanded/collapsed
  const toggleAgentExpanded = (agentId: string) => {
    setExpandedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };
  
  // Filter PTPs based on search term and status filter
  const filterPTPs = () => {
    // Create a filtered copy of the agent PTPs
    const filteredAgentPTPs: Record<string, AgentPTPs> = {};
    
    Object.entries(agentPTPs).forEach(([agentId, agentData]) => {
      let filtered = agentData.ptps.filter(ptp => !resolvedPTPs.includes(ptp.id));
      
      if (searchTerm) {
        filtered = filtered.filter(ptp => 
          ptp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ptp.phone.includes(searchTerm) ||
          ptp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ptp.agentName && ptp.agentName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      if (statusFilter !== "all") {
        filtered = filtered.filter(ptp => ptp.status === statusFilter);
      }
      
      if (filtered.length > 0) {
        filteredAgentPTPs[agentId] = {
          ...agentData,
          ptps: filtered
        };
      }
    });
    
    // Also update the flat list for backward compatibility
    const allFilteredPTPs = Object.values(filteredAgentPTPs)
      .flatMap(agentData => agentData.ptps);
    
    setFilteredPTPs(allFilteredPTPs);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    filterPTPs();
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: "all" | "high" | "medium" | "low") => {
    setStatusFilter(status);
    filterPTPs();
  };

  // Handle calling a customer
  const handleCallCustomer = (customer: BrokenPTPCustomer) => {
    // Set the current customer in the dialer context
    setCurrentCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      balance: customer.amount,
      status: customer.status === "high" ? "overdue" : customer.status === "medium" ? "current" : "pending"
    });
    
    // Set the selected customer for outcome tracking
    setSelectedCustomer(customer);
    
    // Open the dialer
    setIsDialerOpen(true);
    
    // Close the BrokenPTP modal
    onClose();
  };

  // Handle marking a PTP as resolved
  const handleMarkResolved = (customer: BrokenPTPCustomer) => {
    // Add the customer ID to the resolved list
    setResolvedPTPs(prev => [...prev, customer.id]);
    
    // Show a success toast
    toast.success(`${customer.name}'s payment has been marked as resolved.`, {
      description: `PTP ID: ${customer.id}`,
      duration: 3000,
    });
    
    // Update the filtered list
    filterPTPs();
  };

  // Handle recording a call outcome
  const handleRecordOutcome = (customer: BrokenPTPCustomer) => {
    setSelectedCustomer(customer);
    setShowOutcomeModal(true);
  };

  // Handle when an outcome is recorded
  const handleOutcomeRecorded = (customerId: string, outcome: CallOutcome) => {
    // Add the outcome to the list
    setCallOutcomes(prev => [...prev, outcome]);
    
    // If the outcome is a full payment or a new PTP, mark it as resolved
    if (outcome.outcome === "full_payment") {
      setResolvedPTPs(prev => [...prev, customerId]);
      filterPTPs();
    }
    
    // Close the outcome modal
    setShowOutcomeModal(false);
    setSelectedCustomer(null);
  };

  // Get the latest outcome for a customer
  const getLatestOutcome = (customerId: string) => {
    const customerOutcomes = callOutcomes.filter(outcome => outcome.customerId === customerId);
    if (customerOutcomes.length === 0) return null;
    
    // Sort by timestamp (newest first)
    return customerOutcomes.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

return (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-slate-800 text-slate-200">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-200"
              onClick={onClose}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-xl font-semibold text-slate-200">My Broken Promises to Pay</CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Your customers who promised to pay but have not fulfilled their commitment
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by name, phone or ID..."
              className="pl-9 bg-slate-800 border-slate-700 text-slate-200"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={statusFilter === "all" ? "default" : "outline"} 
              size="sm"
              className={statusFilter === "all" ? "bg-slate-700" : "border-slate-700 text-slate-400"}
              onClick={() => handleStatusFilterChange("all")}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === "high" ? "default" : "outline"} 
              size="sm"
              className={statusFilter === "high" ? "bg-red-600" : "border-red-800/40 text-red-400"}
              onClick={() => handleStatusFilterChange("high")}
            >
              High Priority
            </Button>
            <Button 
              variant={statusFilter === "medium" ? "default" : "outline"} 
              size="sm"
              className={statusFilter === "medium" ? "bg-amber-600" : "border-amber-800/40 text-amber-400"}
              onClick={() => handleStatusFilterChange("medium")}
            >
              Medium
            </Button>
            <Button 
              variant={statusFilter === "low" ? "default" : "outline"} 
              size="sm"
              className={statusFilter === "low" ? "bg-blue-600" : "border-blue-800/40 text-blue-400"}
              onClick={() => handleStatusFilterChange("low")}
            >
              Low
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto p-0">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {Object.keys(agentPTPs).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-800/30 rounded-lg border border-slate-700/40">
                <div className="rounded-full bg-slate-700/50 p-3 mb-3">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">No Broken Promises</h3>
                <p className="text-sm text-slate-400 text-center max-w-md">
                  There are currently no customers with broken promises to pay. All payments are up to date!
                </p>
              </div>
            ) : (
              Object.values(agentPTPs).map(({ agent, ptps }) => (
                <Card key={agent.id} className="bg-slate-900/80 border border-slate-800 overflow-hidden">
                  <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleAgentExpanded(agent.id)}
                  >
                    <div className="flex items-center gap-3">
                      {agent.avatar_url ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar_url} />
                          <AvatarFallback>{agent.full_name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{agent.full_name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                      )}
                      <CardTitle className="text-slate-200 text-base font-medium flex items-center gap-2">
                        {agent.full_name}
                        <span className="text-xs font-normal text-slate-400">({ptps.length})</span>
                      </CardTitle>
                    </div>
                    {expandedAgents.includes(agent.id) ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </CardHeader>
                  {expandedAgents.includes(agent.id) && (
                    <CardContent className="space-y-4 py-4">
                      {ptps.map((ptp) => {
                        const latestOutcome = getLatestOutcome(ptp.id);
                        return (
                          <div
                            key={ptp.id}
                            className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-sm p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/30 hover:translate-y-[-3px] hover:border-slate-600/60"
                          >
                            <div
                              className={`absolute top-0 left-0 w-1 h-full ${
                                ptp.status === "high"
                                  ? "bg-red-500"
                                  : ptp.status === "medium"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }`}
                            ></div>
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="relative">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-200 font-semibold text-sm shadow-lg ring-2 ring-slate-600/50 group-hover:ring-slate-500/70 transition-all duration-300">
                                    {ptp.name.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                  {/* Priority indicator dot */}
                                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                                    ptp.status === "high"
                                      ? "bg-red-500"
                                      : ptp.status === "medium"
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                                  }`}></div>
                                </div>
                                <div>
                                  <h3 className="font-medium text-slate-200">{ptp.name}</h3>
                                  <p className="text-sm text-slate-400">{ptp.phone}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      className={`${
                                        ptp.status === "high"
                                          ? "bg-red-900/40 text-red-400 border-red-800/40"
                                          : ptp.status === "medium"
                                          ? "bg-amber-900/40 text-amber-400 border-amber-800/40"
                                          : "bg-blue-900/40 text-blue-400 border-blue-800/40"
                                      }`}
                                    >
                                      {ptp.status === "high"
                                        ? "High Priority"
                                        : ptp.status === "medium"
                                        ? "Medium Priority"
                                        : "Low Priority"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        ptp.source === 'ManualPTP'
                                          ? "bg-purple-900/30 text-purple-300 border-purple-700/50"
                                          : "bg-indigo-900/30 text-indigo-300 border-indigo-700/50"
                                      }`}
                                    >
                                      {ptp.source === 'ManualPTP' ? '📝 Manual PTP' : '🔄 Auto PTP'}
                                    </Badge>
                                    <span className="text-xs text-slate-500">ID: {ptp.id.slice(0, 8)}...</span>
                                  </div>
                                  {latestOutcome && (
                                    <div className="mt-2 text-xs bg-slate-800/50 rounded-md px-2 py-1 border border-slate-700/50">
                                      <div className="flex items-center gap-1 text-slate-300">
                                        <History className="h-3 w-3" />
                                        <span>Last outcome: </span>
                                        <span className="font-medium">
                                          {latestOutcome.outcome === "new_ptp"
                                            ? "New Promise to Pay"
                                            : latestOutcome.outcome === "partial_payment"
                                            ? "Partial Payment"
                                            : latestOutcome.outcome === "full_payment"
                                            ? "Full Payment"
                                            : latestOutcome.outcome === "dispute"
                                            ? "Dispute"
                                            : latestOutcome.outcome === "callback"
                                            ? "Call Back Later"
                                            : latestOutcome.outcome === "no_answer"
                                            ? "No Answer"
                                            : latestOutcome.outcome === "wrong_number"
                                            ? "Wrong Number"
                                            : latestOutcome.outcome === "refused"
                                            ? "Refused to Pay"
                                            : latestOutcome.outcome}
                                        </span>
                                      </div>
                                      {latestOutcome.outcome === "new_ptp" && latestOutcome.newPromiseDate && (
                                        <div className="text-green-400 mt-0.5">
                                          New promise date: {latestOutcome.newPromiseDate.toLocaleDateString()}
                                          {latestOutcome.newAmount && ` (R${latestOutcome.newAmount.toFixed(2)})`}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:items-end">
                                <div className="text-xl font-bold text-slate-200">{formatCurrency(ptp.amount)}</div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-400">Promised: {formatDate(ptp.promiseDate)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm mt-1">
                                  <Clock className="h-3.5 w-3.5 text-red-400" />
                                  <span className="text-red-400">
                                    {ptp.daysLate} {ptp.daysLate === 1 ? "day" : "days"} overdue
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[140px]">
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                                  onClick={() => handleCallCustomer(ptp)}
                                >
                                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                                  Call Now
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600/60 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200"
                                  onClick={() => handleRecordOutcome(ptp)}
                                >
                                  <History className="h-3.5 w-3.5 mr-1.5" />
                                  Record
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-600/60 text-emerald-300 hover:bg-emerald-700/20 hover:border-emerald-500 transition-all duration-200"
                                  onClick={() => handleMarkResolved(ptp)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Resolve
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      )}
                    </CardContent>
                  )}
                </Card>
              )))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {showOutcomeModal && selectedCustomer && (
        <BrokenPTPOutcome
          customer={selectedCustomer}
          onClose={() => setShowOutcomeModal(false)}
          onOutcomeRecorded={handleOutcomeRecorded}
        />
      )}
    </div>
  );
};

export default BrokenPTP;
