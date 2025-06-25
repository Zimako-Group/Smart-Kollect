"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, UserCheck, Upload, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { allocateAccount, bulkAllocateAccounts } from "@/lib/allocation-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TestAllocationPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
  
  // Bulk allocation state
  const [bulkAccountNumbers, setBulkAccountNumbers] = useState<string>("");
  const [bulkSelectedAgent, setBulkSelectedAgent] = useState<string | null>(null);
  const [isBulkAllocating, setIsBulkAllocating] = useState(false);
  const [bulkAllocationResult, setBulkAllocationResult] = useState<{
    success: boolean;
    allocated: number;
    total: number;
    notFound: number;
  } | null>(null);
  
  // State for tracking record loading and pagination
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  const [displayedAccounts, setDisplayedAccounts] = useState<any[]>([]);
  
  // Pagination for allocations
  const [allocationsPage, setAllocationsPage] = useState(1);
  const allocationsPerPage = 20;
  const [displayedAllocations, setDisplayedAllocations] = useState<any[]>([]);
  
  // Fetch allocations
  const fetchAllocations = useCallback(async () => {
    setIsLoadingAllocations(true);
    try {
      // Check if the table exists by trying to query it
      try {
        const { count, error: tableCheckError } = await supabase
          .from('agent_allocations')
          .select('*', { count: 'exact', head: true });
        
        if (tableCheckError) {
          console.log("Table does not exist yet");
          setAllocations([]);
          return;
        }
      } catch (error) {
        console.log("Table does not exist yet");
        setAllocations([]);
        return;
      }
      
      // Fetch allocations
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('agent_allocations')
        .select(`
          id,
          account_id,
          agent_id,
          allocated_at,
          status
        `);
      
      if (allocationsError) {
        console.error("Error fetching allocations:", allocationsError);
        toast({
          title: "Error",
          description: "Failed to load allocations",
          variant: "destructive",
        });
        return;
      }
      
      // Get account and agent details for each allocation
      const enhancedAllocations = await Promise.all((allocationsData || []).map(async (allocation) => {
        // Get account details
        const { data: account } = await supabase
          .from('Debtors')
          .select('id, acc_number, name, surname_company_trust, outstanding_balance')
          .eq('id', allocation.account_id)
          .single();
        
        // Get agent details
        const { data: agent } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', allocation.agent_id)
          .single();
        
        return {
          ...allocation,
          account,
          agent
        };
      }));
      
      setAllocations(enhancedAllocations);
    } catch (error) {
      console.error("Error in fetchAllocations:", error);
      toast({
        title: "Error",
        description: "Failed to load allocations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAllocations(false);
    }
  }, [toast]);

  // Function to update displayed accounts based on pagination
  const updateDisplayedAccounts = useCallback((accounts: any[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    setDisplayedAccounts(accounts.slice(startIndex, endIndex));
  }, []);

  // Search accounts
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAccounts(accounts);
      updateDisplayedAccounts(accounts, currentPage, recordsPerPage);
    } else {
      const filtered = accounts.filter(account => 
        (account.name && account.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (account.surname_company_trust && account.surname_company_trust.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (account.acc_number && account.acc_number.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAccounts(filtered);
      // Reset to first page when searching
      setCurrentPage(1);
      updateDisplayedAccounts(filtered, 1, recordsPerPage);
    }
  }, [searchQuery, accounts, currentPage, recordsPerPage, updateDisplayedAccounts]);
  
  // Update displayed accounts when page or records per page changes
  useEffect(() => {
    updateDisplayedAccounts(filteredAccounts, currentPage, recordsPerPage);
  }, [currentPage, recordsPerPage, filteredAccounts, updateDisplayedAccounts]);
  
  // Update displayed allocations when allocations or page changes
  useEffect(() => {
    const startIndex = (allocationsPage - 1) * allocationsPerPage;
    const endIndex = startIndex + allocationsPerPage;
    setDisplayedAllocations(allocations.slice(startIndex, endIndex));
  }, [allocations, allocationsPage, allocationsPerPage]);
  
  // Fetch accounts and agents
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get total count of records
        const { count, error: countError } = await supabase
          .from('Debtors')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error("Error getting count:", countError);
        } else {
          console.log(`Total debtors in database: ${count}`);
          setTotalRecords(count || 0);
        }
        
        // Fetch all records using pagination to overcome Supabase limits
        console.log("Fetching all accounts using pagination");
        setIsLoadingAll(true);
        
        let allAccounts: any[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000; // Supabase's default max limit
        
        while (hasMore) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          
          console.log(`Fetching accounts batch ${page + 1}: records ${from} to ${to}`);
          
          const { data: batchData, error: batchError } = await supabase
            .from('Debtors')
            .select('id, acc_number, name, surname_company_trust, outstanding_balance')
            .order('name', { ascending: true })
            .range(from, to);
          
          if (batchError) {
            console.error(`Error fetching accounts batch ${page + 1}:`, batchError);
            toast({
              title: "Error",
              description: `Failed to load accounts batch ${page + 1}`,
              variant: "destructive",
            });
            break;
          }
          
          if (batchData && batchData.length > 0) {
            allAccounts = [...allAccounts, ...batchData];
            setLoadingProgress(allAccounts.length);
            
            // If we got fewer records than the page size, we've reached the end
            if (batchData.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }
        
        setIsLoadingAll(false);
        console.log(`Loaded a total of ${allAccounts.length} accounts`);
        
        const accountsData = allAccounts;
        
        if (accountsData.length === 0) {
          toast({
            title: "Warning",
            description: "No accounts found in the database",
            variant: "default",
          });
        }
        
        // Process and set the accounts
        const accounts = accountsData || [];
        console.log(`Loaded ${accounts.length} accounts`);
        setAccounts(accounts);
        
        // Initialize filtered accounts and first page of displayed accounts
        setFilteredAccounts(accounts);
        updateDisplayedAccounts(accounts, 1, recordsPerPage);
        
        // Fetch agents
        const { data: agentsData, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['agent', 'admin']);
        
        if (agentsError) {
          console.error("Error fetching agents:", agentsError);
          toast({
            title: "Error",
            description: "Failed to load agents",
            variant: "destructive",
          });
          return;
        }
        
        setAgents(agentsData || []);
        
        // Fetch existing allocations
        await fetchAllocations();
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast, fetchAllocations]);



  // Handle allocation
  const handleAllocate = async () => {
    if (!selectedAccount || !selectedAgent) {
      toast({
        title: "Error",
        description: "Please select both an account and an agent",
        variant: "destructive",
      });
      return;
    }
    
    setIsAllocating(true);
    try {
      await allocateAccount(selectedAccount, selectedAgent);
      
      toast({
        title: "Success",
        description: "Account allocated successfully",
        variant: "default",
      });
      
      // Refresh allocations
      await fetchAllocations();
      
      // Reset selections
      setSelectedAccount(null);
      setSelectedAgent(null);
    } catch (error) {
      console.error("Error allocating account:", error);
      toast({
        title: "Allocation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAllocating(false);
    }
  };
  
  // Handle bulk allocation
  const handleBulkAllocate = async () => {
    if (!bulkAccountNumbers.trim() || !bulkSelectedAgent) {
      toast({
        title: "Error",
        description: "Please enter account numbers and select an agent",
        variant: "destructive",
      });
      return;
    }
    
    // Parse account numbers from the text input
    const accountNumbers = bulkAccountNumbers
      .split(/[\n,;\s]+/) // Split by newlines, commas, semicolons, or whitespace
      .map(num => num.trim())
      .filter(num => num.length > 0); // Remove empty strings
    
    if (accountNumbers.length === 0) {
      toast({
        title: "Error",
        description: "No valid account numbers found",
        variant: "destructive",
      });
      return;
    }
    
    setIsBulkAllocating(true);
    setBulkAllocationResult(null);
    
    try {
      const result = await bulkAllocateAccounts(accountNumbers, bulkSelectedAgent);
      
      toast({
        title: "Bulk Allocation Complete",
        description: `Successfully allocated ${result.allocated} of ${result.total} accounts to the selected agent`,
        variant: "default",
      });
      
      setBulkAllocationResult(result);
      
      // Refresh allocations
      await fetchAllocations();
    } catch (error) {
      console.error("Error in bulk allocation:", error);
      toast({
        title: "Bulk Allocation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsBulkAllocating(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Allocation</h1>
        <Button 
          variant="outline" 
          onClick={fetchAllocations}
          disabled={isLoadingAllocations}
        >
          {isLoadingAllocations ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Allocations
            </>
          )}
        </Button>
      </div>
      <div className="flex flex-col gap-6">
        {/* Allocation Form */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader>
            <CardTitle>Allocate Accounts</CardTitle>
            <CardDescription>
              Allocate individual accounts or bulk allocate multiple accounts
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single">Single Allocation</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Allocation</TabsTrigger>
            </TabsList>
            
            {/* Single Allocation Tab */}
            <TabsContent value="single" className="space-y-4">
              <CardContent className="space-y-6 pt-0">
                {/* Account Selection */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">Select Account</h3>
                    <div className="text-xs text-slate-400">
                      {filteredAccounts.length === accounts.length 
                        ? `${accounts.length.toLocaleString()} accounts loaded` 
                        : `${filteredAccounts.length.toLocaleString()} of ${accounts.length.toLocaleString()} accounts`}
                    </div>
                  </div>
                  
                  {/* Search box */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => {
                        const query = e.target.value.toLowerCase();
                        setSearchQuery(query);
                      }}
                    />

                  </div>
                  <div className="flex flex-col gap-2 bg-slate-900/50 rounded-md">
                    <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto p-2">
                      {displayedAccounts.map(account => (
                        <div
                          key={account.id}
                          className={`p-2 rounded-md cursor-pointer transition-colors ${
                            selectedAccount === account.id
                              ? 'bg-blue-900/50 border border-blue-700'
                              : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                          }`}
                          onClick={() => setSelectedAccount(account.id)}
                        >
                          <div className="font-medium">{account.name} {account.surname_company_trust}</div>
                          <div className="text-xs text-slate-400">Account #: {account.acc_number || account.id}</div>
                          <div className="mt-1">
                            <span className="text-xs text-slate-400">Balance: R{account.outstanding_balance?.toLocaleString() || '0.00'}</span>
                          </div>
                        </div>
                      ))}
                      {accounts.length === 0 && !isLoading && (
                        <div className="p-4 text-center text-slate-400">
                          No accounts found
                        </div>
                      )}
                      {isLoading && (
                        <div className="p-4 text-center text-slate-400">
                          {isLoadingAll ? (
                            <div className="space-y-2">
                              <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" />
                              <div className="text-sm">Loading all accounts...</div>
                              <div className="text-xs">{loadingProgress.toLocaleString()} records loaded so far</div>
                              <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: totalRecords > 0 ? `${Math.min(100, (loadingProgress / totalRecords) * 100)}%` : '0%' }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" />
                              Loading accounts...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-2 border-t border-slate-800">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          disabled={currentPage === 1 || isLoading}
                          className="h-8 px-2"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const maxPage = Math.ceil(filteredAccounts.length / recordsPerPage);
                            if (currentPage < maxPage) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          disabled={currentPage >= Math.ceil(filteredAccounts.length / recordsPerPage) || isLoading}
                          className="h-8 px-2"
                        >
                          Next
                        </Button>
                      </div>
                      <div className="text-xs text-slate-400">
                        Page {currentPage} of {Math.max(1, Math.ceil(filteredAccounts.length / recordsPerPage))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Agent Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Select Agent</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto bg-slate-900/50 rounded-md p-2">
                    {agents.map(agent => (
                      <div
                        key={agent.id}
                        className={`p-2 rounded-md cursor-pointer transition-colors ${
                          selectedAgent === agent.id
                            ? 'bg-blue-900/50 border border-blue-700'
                            : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                        }`}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <div className="font-medium">{agent.full_name}</div>
                        <div className="text-xs text-slate-400">{agent.role || 'Agent'}</div>
                      </div>
                    ))}
                    {agents.length === 0 && !isLoading && (
                      <div className="p-4 text-center text-slate-400">
                        No agents found
                      </div>
                    )}
                    {isLoading && (
                      <div className="p-4 text-center text-slate-400">
                        <Loader2 className="h-4 w-4 mx-auto animate-spin mb-2" />
                        Loading agents...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleAllocate}
                  disabled={!selectedAccount || !selectedAgent || isAllocating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isAllocating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Allocating...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Allocate Account
                    </>
                  )}
                </Button>
              </CardFooter>
            </TabsContent>
            
            {/* Bulk Allocation Tab */}
            <TabsContent value="bulk" className="space-y-4">
              <CardContent className="space-y-6 pt-0">
                <div>
                  <h3 className="text-sm font-medium mb-3">Paste Account Numbers</h3>
                  <p className="text-xs text-slate-400 mb-2">
                    Enter account numbers separated by commas, spaces, or new lines
                  </p>
                  <Textarea 
                    placeholder="Enter account numbers here..."
                    className="min-h-[200px] bg-slate-800/50 border border-slate-700/50 text-sm"
                    value={bulkAccountNumbers}
                    onChange={(e) => setBulkAccountNumbers(e.target.value)}
                  />
                  <div className="mt-2 text-xs text-slate-400">
                    {bulkAccountNumbers.trim() ? (
                      <>
                        {bulkAccountNumbers
                          .split(/[\n,;\s]+/)
                          .map(num => num.trim())
                          .filter(num => num.length > 0).length} account numbers detected
                      </>
                    ) : 'No account numbers entered yet'}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Select Agent for Bulk Allocation</h3>
                  <Select
                    value={bulkSelectedAgent || ''}
                    onValueChange={(value) => setBulkSelectedAgent(value)}
                  >
                    <SelectTrigger className="w-full bg-slate-800/50 border border-slate-700/50">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {bulkAllocationResult && (
                  <div className="p-4 rounded-md bg-slate-800/50 border border-slate-700/50">
                    <h3 className="font-medium text-green-400 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Bulk Allocation Results
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>Total accounts processed: {bulkAllocationResult.total}</li>
                      <li>Successfully allocated: {bulkAllocationResult.allocated}</li>
                      <li>Not found in database: {bulkAllocationResult.notFound}</li>
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleBulkAllocate}
                  disabled={!bulkAccountNumbers.trim() || !bulkSelectedAgent || isBulkAllocating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isBulkAllocating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Bulk Allocation...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Bulk Allocate Accounts
                    </>
                  )}
                </Button>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* Allocations List */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader>
            <CardTitle>Current Allocations</CardTitle>
            <CardDescription>
              List of all account allocations in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedAllocations.map(allocation => (
                <div
                  key={allocation.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">
                        {allocation.account?.name} {allocation.account?.surname_company_trust || ''}
                      </h4>
                      <div className="text-xs text-slate-400">
                        Account #: {allocation.account?.acc_number || allocation.account_id}
                      </div>
                      {allocation.account?.outstanding_balance && (
                        <div className="text-xs text-slate-400 mt-1">
                          Balance: R{parseFloat(allocation.account.outstanding_balance).toLocaleString()}
                        </div>
                      )}

                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-700/30">
                        {allocation.status}
                      </Badge>

                    </div>
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <span className="font-medium">Allocated to:</span>
                    <span className="ml-2">{allocation.agent?.full_name || allocation.agent_id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Allocated on: {new Date(allocation.allocated_at).toLocaleString()}
                  </div>
                </div>
              ))}
              
              {allocations.length === 0 && !isLoadingAllocations && (
                <div className="p-8 text-center">
                  <div className="rounded-full bg-slate-800/60 p-3 mx-auto w-fit mb-4">
                    <AlertCircle className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-1">No allocations found</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Select an account and an agent from the left panel, then click &quot;Allocate Account&quot; to create a new allocation.
                  </p>
                </div>
              )}
              
              {isLoadingAllocations && (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4 text-slate-400" />
                  <p className="text-sm text-slate-400">Loading allocations...</p>
                </div>
              )}
            </div>
            
            {/* Pagination for allocations */}
            {allocations.length > 0 && !isLoadingAllocations && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (allocationsPage > 1) {
                        setAllocationsPage(allocationsPage - 1);
                      }
                    }}
                    disabled={allocationsPage === 1 || isLoadingAllocations}
                    className="h-8 px-2"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const maxPage = Math.ceil(allocations.length / allocationsPerPage);
                      if (allocationsPage < maxPage) {
                        setAllocationsPage(allocationsPage + 1);
                      }
                    }}
                    disabled={allocationsPage >= Math.ceil(allocations.length / allocationsPerPage) || isLoadingAllocations}
                    className="h-8 px-2"
                  >
                    Next
                  </Button>
                </div>
                <div className="text-xs text-slate-400">
                  Page {allocationsPage} of {Math.max(1, Math.ceil(allocations.length / allocationsPerPage))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
