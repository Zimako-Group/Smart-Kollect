"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, CheckCircle, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDebtorById } from "@/lib/debtors-service";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { allocateAccount } from "@/lib/allocation-service";

export default function AllocateAccountPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const accountId = params.id || '';
  const { toast } = useToast();
  const [account, setAccount] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch account and agents data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("[ALLOCATION PAGE] Fetching data for account ID:", accountId);
        
        // Fetch account details
        const { data: accountData, error: accountError } = await getDebtorById(accountId);
        
        if (accountError) {
          setError("Error fetching account details");
          console.error("[ALLOCATION PAGE] Error fetching account:", accountError);
          return;
        }
        
        console.log("[ALLOCATION PAGE] Account data fetched:", accountData);
        setAccount(accountData);
        
        // Fetch agents from profiles table
        const { data: agentsData, error: agentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'agent');
        
        if (agentsError) {
          setError("Error fetching agents");
          console.error("[ALLOCATION PAGE] Error fetching agents:", agentsError);
          return;
        }
        
        console.log("[ALLOCATION PAGE] Found", agentsData?.length || 0, "agents");
        setAgents(agentsData || []);
        
        // Check if this account is already allocated
        const { data: existingAllocation, error: allocationError } = await supabase
          .from('AccountAllocations')
          .select('*')
          .eq('account_id', accountId)
          .maybeSingle();
          
        if (!allocationError && existingAllocation) {
          console.log("[ALLOCATION PAGE] Account is already allocated:", existingAllocation);
        }
      } catch (error) {
        console.error("[ALLOCATION PAGE] Error in fetchData:", error);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [accountId]);

  // Handle allocation
  const handleAllocate = async () => {
    if (!selectedAgent) {
      toast({
        title: "Error",
        description: "Please select an agent to allocate this account to",
        variant: "destructive",
      });
      return;
    }
    
    setIsAllocating(true);
    
    try {
      console.log("[ALLOCATION PAGE] Allocating account ID:", accountId, "to agent ID:", selectedAgent);
      
      // Use our new allocation service
      await allocateAccount(accountId, selectedAgent);
      
      console.log("[ALLOCATION PAGE] Allocation successful");
      
      // Show success toast
      toast({
        title: "Account Allocated",
        description: "The account has been successfully allocated to the selected agent",
        variant: "default",
      });
      
      // Redirect back to all accounts page
      router.push('/admin/all-accounts');
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get agent initials for avatar
  const getAgentInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Allocate Account</h1>
          <p className="text-muted-foreground">
            Assign this account to an agent for collection
          </p>
        </div>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500">Loading account details...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/all-accounts')}
              >
                Return to Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Account Details Card */}
          <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Review the account information before allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Account Number</h3>
                    <p className="text-lg font-medium">{account.acc_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Customer Name</h3>
                    <p className="text-lg font-medium">{account.name} {account.surname_company_trust}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Contact Information</h3>
                    <p className="text-sm">{account.cell_number || 'No phone number'}</p>
                    <p className="text-sm">{account.email_addr_1 || 'No email address'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Outstanding Balance</h3>
                    <p className="text-lg font-medium">{formatCurrency(account.outstanding_balance || 0)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Status</h3>
                    <Badge variant="outline" className="mt-1">
                      {account.account_status_description || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">ID Number</h3>
                    <p className="text-sm">{account.id_number_1 || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Allocation Card */}
          <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader>
              <CardTitle>Allocate to Agent</CardTitle>
              <CardDescription>
                Select an agent to handle this account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full bg-slate-900 border-slate-800">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.length > 0 ? (
                      agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{getAgentInitials(agent.full_name)}</AvatarFallback>
                            </Avatar>
                            <span>{agent.full_name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-agents" disabled>No agents available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {selectedAgent && (
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                    <h3 className="text-sm font-medium mb-2">Selected Agent</h3>
                    {agents.filter(agent => agent.id === selectedAgent).map((agent) => (
                      <div key={agent.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getAgentInitials(agent.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agent.full_name}</p>
                          <p className="text-xs text-slate-400">{agent.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/all-accounts')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllocate}
                disabled={!selectedAgent || isAllocating}
                className="bg-green-600 hover:bg-green-700"
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
          </Card>
        </>
      )}
    </div>
  );
}
