"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  BarChart, 
  PieChart,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  PhoneCall,
  DollarSign,
  Wallet
} from "lucide-react";

// Define agent and performance types
type Agent = {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
  status?: 'active' | 'inactive' | 'on leave';
};

type Performance = {
  collectionRate?: number;
  casesResolved?: number;
  customerSatisfaction?: number;
  callsPerDay?: number;
  averageCallDuration?: number;
  successfulPayments?: number;
  ptpConversion?: number;
};

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [ptpCount, setPtpCount] = useState<number>(0);
  const [manualPtpCount, setManualPtpCount] = useState<number>(0);
  const [settlementsCount, setSettlementsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch the total PTP count for the agent
  const fetchPtpCount = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      
      // Count PTPs created by this agent
      const { count, error } = await supabase
        .from('PTP')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', id);
      
      if (error) throw error;
      
      return count || 0;
    } catch (err) {
      console.error('Error fetching PTP count:', err);
      return 0;
    }
  };
  
  // Function to fetch the total Manual PTP count for the agent
  const fetchManualPtpCount = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      
      // Count Manual PTPs created by this agent
      const { count, error } = await supabase
        .from('ManualPTP')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', id);
      
      if (error) throw error;
      
      return count || 0;
    } catch (err) {
      console.error('Error fetching Manual PTP count:', err);
      return 0;
    }
  };
  
  // Function to fetch the total Settlements count for the agent
  const fetchSettlementsCount = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      
      // Count Settlements created by this agent
      const { count, error } = await supabase
        .from('Settlements')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', id);
      
      if (error) throw error;
      
      return count || 0;
    } catch (err) {
      console.error('Error fetching Settlements count:', err);
      return 0;
    }
  };

  // Fetch agent details from Supabase
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId || typeof window === 'undefined') return;
      
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        
        // Fetch agent profile
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', agentId)
          .single();
        
        if (agentError) throw agentError;
        
        if (!agentData) {
          throw new Error('Agent not found');
        }
        
        setAgent(agentData);
        
        // Fetch PTP counts (regular and manual) and settlements count
        const [ptpTotal, manualPtpTotal, settlementsTotal] = await Promise.all([
          fetchPtpCount(agentId),
          fetchManualPtpCount(agentId),
          fetchSettlementsCount(agentId)
        ]);
        
        setPtpCount(ptpTotal);
        setManualPtpCount(manualPtpTotal);
        setSettlementsCount(settlementsTotal);
        
        // For now, we'll use mock performance data
        // In a real app, this would come from your database
        setPerformance({
          collectionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
          casesResolved: Math.floor(Math.random() * 50) + 150, // 150-200 cases
          customerSatisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
          callsPerDay: Math.floor(Math.random() * 15) + 30, // 30-45 calls
          averageCallDuration: Math.floor(Math.random() * 4) + 2, // 2-6 minutes
          successfulPayments: Math.floor(Math.random() * 40) + 80, // 80-120 payments
          ptpConversion: Math.floor(Math.random() * 30) + 60, // 60-90%
        });
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching agent details:', err);
        setError(err.message || 'Failed to load agent details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgentData();
  }, [agentId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/monthly-performance" className="inline-flex">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Performance
          </Button>
        </Link>
      </div>
      
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-md">
          <h2 className="flex items-center text-red-500 gap-2 font-medium">
            <AlertCircle className="h-5 w-5" />
            Error
          </h2>
          <p className="text-red-500/90 mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 text-red-500 border-red-500/20"
            onClick={() => window.location.href = '/admin/monthly-performance'}
          >
            Return to Monthly Performance
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-center p-12">
          <div className="h-12 w-12 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading agent details...</p>
        </div>
      )}

      {!loading && !error && agent && (
        <>
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-xl uppercase font-semibold">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.full_name} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  agent.full_name?.substring(0, 2) || '??'
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{agent.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">{agent.role || 'Agent'}</span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${agent.status === 'active' ? 'bg-green-500/10 text-green-500' : agent.status === 'inactive' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {agent.status || 'Unknown status'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Phone className="h-4 w-4" />
                Contact
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Agent Information</CardTitle>
              <CardDescription>
                Personal and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Full Name</p>
                  <p className="text-muted-foreground">{agent.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground">{agent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-muted-foreground capitalize">{agent.role || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-muted-foreground">
                    {agent.created_at 
                      ? new Date(agent.created_at).toLocaleDateString('en-ZA', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        }) 
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-muted-foreground capitalize">{agent.status || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance metrics cards */}
          <h2 className="text-xl font-bold mt-8 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance?.collectionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Target: 85%</p>
                <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${performance?.collectionRate || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cases Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance?.casesResolved}</div>
                <p className="text-xs text-muted-foreground mt-1">Monthly Total</p>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% from previous month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance?.customerSatisfaction}%</div>
                <p className="text-xs text-muted-foreground mt-1">Based on feedback</p>
                <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${performance?.customerSatisfaction || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">PTP Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance?.ptpConversion}%</div>
                <p className="text-xs text-muted-foreground mt-1">Promise to Pay conversion</p>
                <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${performance?.ptpConversion || 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium">Promise To Pay (PTP) Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-center space-x-8 mb-4">
                  {/* Regular PTPs */}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="font-bold text-2xl">{ptpCount}</div>
                    <p className="text-muted-foreground text-xs">Regular PTPs</p>
                  </div>
                  
                  {/* Manual PTPs */}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="font-bold text-2xl">{manualPtpCount}</div>
                    <p className="text-muted-foreground text-xs">Manual PTPs</p>
                  </div>
                </div>
                
                {/* Total PTPs */}
                <div className="border-t pt-3 mt-1">
                  <div className="flex items-center justify-center">
                    <div className="bg-emerald-100 dark:bg-emerald-900/20 p-2 rounded-full mr-3">
                      <BarChart className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="font-bold text-2xl">{ptpCount + manualPtpCount}</div>
                      <p className="text-muted-foreground text-xs">Total PTP Commitments</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Settlements Card */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-sm font-medium">Settlements Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-center">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-full mr-3">
                    <Wallet className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl">{settlementsCount}</div>
                    <p className="text-muted-foreground text-xs">Total Settlements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Activity metrics */}
          <h2 className="text-xl font-bold mt-8 mb-4">Activity Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>
                  Average activity statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-blue-500" />
                        <p className="text-sm font-medium">Calls Per Day</p>
                      </div>
                      <p className="text-muted-foreground text-xs">Average outbound calls</p>
                    </div>
                    <span className="text-lg font-semibold">{performance?.callsPerDay}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-medium">Avg. Call Duration</p>
                      </div>
                      <p className="text-muted-foreground text-xs">Time per customer call</p>
                    </div>
                    <span className="text-lg font-semibold">{performance?.averageCallDuration} min</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-sm font-medium">Successful Payments</p>
                      </div>
                      <p className="text-muted-foreground text-xs">Processed this month</p>
                    </div>
                    <span className="text-lg font-semibold">{performance?.successfulPayments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Against team average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Collection Rate</span>
                      <span className="font-medium">{performance?.collectionRate}% vs 78% avg</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                      <div className="h-1.5 w-[78%] absolute top-0 border-r-2 border-dashed border-yellow-500"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium">{performance?.customerSatisfaction}% vs 82% avg</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '90%' }}></div>
                      <div className="h-1.5 w-[82%] absolute top-0 border-r-2 border-dashed border-yellow-500"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>PTP Conversion</span>
                      <span className="font-medium">{performance?.ptpConversion}% vs 70% avg</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                      <div className="h-1.5 w-[70%] absolute top-0 border-r-2 border-dashed border-yellow-500"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}