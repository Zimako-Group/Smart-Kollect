"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getAdminDashboardMetrics, getTenantAgentPerformance } from "@/lib/admin-dashboard-service";
import { getNotifications } from "@/lib/notification-service";
import { getCollectionPerformanceData, getConsolidatedPaymentsData, getConsolidatedPaymentStats, type CollectionPerformanceData, type ConsolidatedPaymentData, type ConsolidatedPaymentStats } from "@/lib/performance-service";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  BarChart,
  BarChart2,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  HelpCircle,
  Home,
  Info,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Settings,
  Sliders,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import ApexCharts from "apexcharts";
import { Analytics } from "@vercel/analytics/next";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      Loading chart...
    </div>
  ),
});

interface Campaign {
  id: number;
  name: string;
  status?: string;
  progress?: number;
  collected?: number;
  collections?: number;
  target?: number;
  startDate?: string;
  endDate?: string;
  client?: string;
  priority: string;
  description?: string;
  clientContact?: string;
  clientEmail?: string;
  assignedAgents?: string[];
  success?: number;
}

interface Agent {
  id: string | number;
  name: string;
  avatar?: string;
  performance?: number | string;
  status?: string;
  collections?: number;
  cases?: number;
  rate?: number;
  role?: string;
  badge?: string | null;
  phone?: string;
  email?: string;
  joinDate?: string | null | number;
  lastMonthCollections?: number;
  lastMonthRate?: number;
  resolvedCases?: number;
  campaigns?: Campaign[];
  monthlyPerformance?: { month?: string; collections: number }[];
  // New properties for the dashboard cards
  totalAccounts?: number; // Added this property for agent allocations
  bookValue?: number;
  calls?: number;
  sms?: number;
  emails?: number;
  ptpsInPlace?: number;
  ptpsValue?: number;
}

// Data will be fetched from database

const COLORS = ["#0088FE", "#FFBB28", "#00C49F", "#FF8042"];

// We'll fetch real notifications from the database

export default function AdminDashboard() {
  const router = useRouter(); // Add router import
  const [timeRange, setTimeRange] = useState("monthly");
  const [totalCollections, setTotalCollections] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [agentAllocations, setAgentAllocations] = useState<{
    [key: string]: number;
  }>({});
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [onlineAgents, setOnlineAgents] = useState<Set<string>>(new Set());
  const [agentProfiles, setAgentProfiles] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [performanceData, setPerformanceData] = useState<CollectionPerformanceData[]>([]);
  const [consolidatedPaymentsData, setConsolidatedPaymentsData] = useState<ConsolidatedPaymentData[]>([]);
  const [consolidatedPaymentStats, setConsolidatedPaymentStats] = useState<ConsolidatedPaymentStats>({
    totalCollections: 0,
    currentMonth: 0,
    currentMonthDisplay: 'N/A',
    monthlyAverage: 0
  });
  const [loadingPerformanceData, setLoadingPerformanceData] = useState(true);

  // Use the fetched agent profiles as agents data
  const agents: Agent[] = availableAgents;

  const handleAssignAgents = () => {
    // In a real app, you would save this to your database
    if (selectedCampaign) {
      console.log(
        `Assigned agents to ${selectedCampaign.name}:`,
        selectedAgents
      );
    } else {
      console.log("No campaign selected for agent assignment");
    }
    setShowAssignModal(false);

    // Show success notification (in a real app)
    // toast.success("Agents successfully assigned to campaign");
  };

  const toggleAgentSelection = (agent: Agent) => {
    if (selectedAgents.some((a) => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter((a) => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  useEffect(() => {
    // Fetch tenant-specific dashboard metrics
    const fetchDashboardMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const metrics = await getAdminDashboardMetrics();
        setDashboardMetrics(metrics);
        setTotalCollections(metrics.totalCollections);
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    // Fetch agent profiles
    const fetchAgentProfiles = async () => {
      try {
        setLoadingAgents(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current user's tenant
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) return;

        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, status, avatar_url")
          .eq("role", "agent")
          .eq("tenant_id", profile.tenant_id);

        if (error) {
          console.error("Error fetching agent profiles:", error);
          return;
        }

        setAgentProfiles(profiles || []);
        
        // Convert profiles to Agent format for availableAgents
        const agents = profiles?.map((profile, index) => ({
          id: index + 1,
          name: profile.full_name || profile.email,
          performance: "Medium" // Default performance, could be calculated from actual data
        })) || [];
        
        setAvailableAgents(agents);
      } catch (error) {
        console.error("Error fetching agent profiles:", error);
      } finally {
        setLoadingAgents(false);
      }
    };

    // Setup Realtime Presence for tracking online agents
    const setupPresence = async () => {
      try {
        // Create a channel for agent presence
        const channel = supabase.channel("agent-presence", {
          config: {
            presence: {
              key: "agent-presence",
            },
          },
        });

        // Subscribe to presence events
        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const onlineAgentIds = new Set<string>();

            Object.keys(state).forEach((key) => {
              const presences = state[key];
              presences.forEach((presence: any) => {
                if (presence.role === "agent") {
                  onlineAgentIds.add(presence.user_id);
                }
              });
            });

            setOnlineAgents(onlineAgentIds);
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
            console.log("Agent joined:", newPresences);
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
            console.log("Agent left:", leftPresences);
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              console.log("Successfully subscribed to agent presence");
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error setting up presence:", error);
      }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current user's tenant
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) return;

        const notificationsData = await getNotifications("admin", undefined, 5);
        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    // Fetch agent allocations directly from the agent_allocations table
    const fetchAgentAllocations = async () => {
      try {
        console.log(
          "Fetching agent allocations from agent_allocations table..."
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current user's tenant
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (!profile?.tenant_id) return;

        // Query the agent_allocations table with tenant filtering
        const { data, error } = await supabase
          .from("agent_allocations")
          .select(`
            agent_id, 
            allocated_at, 
            status,
            profiles!inner(tenant_id)
          `)
          .eq('profiles.tenant_id', profile.tenant_id);

        if (error) {
          throw error;
        }

        console.log("Agent allocations data:", data);

        // Create a map to count allocations per agent
        const allocationsMap: { [key: string]: number } = {};

        // Count active allocations for each agent
        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const agentId = item.agent_id;
            console.log(
              `Processing allocation for agent ID: ${agentId}, status: ${item.status}`
            );

            // Initialize the count if it doesn't exist
            if (!allocationsMap[agentId]) {
              allocationsMap[agentId] = 0;
            }

            // Increment the count for active allocations
            if (item.status === "active") {
              allocationsMap[agentId]++;
              console.log(
                `Incremented count for agent ${agentId} to ${allocationsMap[agentId]}`
              );
            }
          });
        } else {
          console.log("No allocation data found");
        }

        console.log("Allocations map:", allocationsMap);

        // Agent data will be fetched from database when needed
        console.log("Agent allocations fetched from database");

        // Log the allocation counts from the database
        console.log("Allocation counts from database:", allocationsMap);

        // No hardcoding - we'll use the actual values from the database
        Object.keys(allocationsMap).forEach((agentId) => {
          console.log(
            `Agent ${agentId}: ${allocationsMap[agentId]} allocated accounts`
          );
        });

        // Agent allocation data is now stored in allocationsMap
        // Real agent data should be fetched from the database when needed
        console.log("Agent allocations stored in allocationsMap:", allocationsMap);

        setAgentAllocations(allocationsMap);
      } catch (error) {
        console.error("Error fetching agent allocations:", error);
      }
    };

    // Fetch performance data
    const fetchPerformanceData = async () => {
      try {
        setLoadingPerformanceData(true);
        const data = await getCollectionPerformanceData();
        setPerformanceData(data);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoadingPerformanceData(false);
      }
    };

    // Fetch consolidated payments data
    const fetchConsolidatedPayments = async () => {
      try {
        const data = await getConsolidatedPaymentsData();
        setConsolidatedPaymentsData(data);
        
        // Fetch consolidated payment statistics
        const stats = await getConsolidatedPaymentStats();
        setConsolidatedPaymentStats(stats);
      } catch (error) {
        console.error("Error fetching consolidated payments data:", error);
      }
    };

    fetchNotifications();
    fetchAgentAllocations();
    fetchPerformanceData();
    fetchConsolidatedPayments();
  }, []);

  // Separate useEffect to update the selected agent when needed
  useEffect(() => {
    if (selectedAgent) {
      // Agent data should be fetched from database when needed
      // For now, we'll keep the selected agent as is
      console.log(`Selected agent: ${selectedAgent.name}`);
    }
  }, [selectedAgent]);

  // Add these helper functions
  const handleAgentClick = (agent: Agent) => {
    console.log("Agent clicked:", agent);

    // No campaigns assigned for now
    const agentCampaigns: Campaign[] = [];

    // Use the clicked agent data
    const baseAgent = agent;

    const processedAgent: Agent = {
      ...baseAgent,
      campaigns: agentCampaigns,
      // Ensure other properties have default values
      collections: baseAgent.collections || 0,
      cases: baseAgent.cases || 0,
      rate: baseAgent.rate || 0,
      resolvedCases: baseAgent.resolvedCases || 0,
      lastMonthCollections: baseAgent.lastMonthCollections || 0,
      lastMonthRate: baseAgent.lastMonthRate || 0,
    };

    console.log("Setting selected agent with data:", processedAgent);
    console.log("Total accounts to display:", processedAgent.totalAccounts);

    setSelectedAgent(processedAgent);
    setShowAgentDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard Header */}
      <div className="card rounded-xl p-6 mb-8 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg border border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50"></div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Dashboard <span className="gradient-text">Overview</span>
              </h1>
            </div>
            <p className="text-white/70 pl-3">
              Monitor team performance and collection activities
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Calendar size={16} className="text-primary" />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="p-1 rounded-xl bg-black/30 backdrop-blur-md border border-white/10">
              <div className="flex">
                <button
                  onClick={() => setTimeRange("daily")}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    timeRange === "daily"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeRange("weekly")}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    timeRange === "weekly"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeRange("monthly")}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    timeRange === "monthly"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card rounded-xl p-6 bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-sm">Total Collections</p>
              <h3 className="text-2xl font-bold mt-1 gradient-text">
                R27,612,881,25
              </h3>
              <div className="flex items-center mt-3 text-red-400 bg-red-400/10 px-2 py-1 rounded-full text-xs w-fit">
                <ArrowDown size={14} className="mr-1" />
                <span>34% from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shadow-primary/10">
              <DollarSign size={24} className="text-primary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Monthly Goal</span>
              <span className="text-xs text-white/80">R6,000,000</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                style={{
                  width: "100%",
                }} /* Current collections exceed target */
              ></div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-sm border border-white/10 hover:border-secondary/30 transition-all hover:shadow-lg hover:shadow-secondary/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-sm">Active Agents</p>
              {loadingAgents ? (
                <div className="flex items-center mt-1">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary"></div>
                  <span className="ml-2 text-white/60 text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mt-1 text-white">{onlineAgents.size}</h3>
                  <div className="flex items-center mt-3 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs w-fit">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span>{onlineAgents.size} agents online</span>
                  </div>
                </>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center border border-secondary/20 shadow-sm shadow-secondary/10">
              <Users size={24} className="text-secondary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            {loadingAgents ? (
              <div className="flex justify-center py-2">
                <div className="text-white/40 text-xs">Loading agent status...</div>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-xs mb-3">
                  <div className="flex flex-col items-center">
                    <span className="text-white/40">Online</span>
                    <span className="text-green-400 font-medium mt-1">{onlineAgents.size}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-white/40">Total</span>
                    <span className="text-white font-medium mt-1">{agentProfiles.length}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-white/40">Offline</span>
                    <span className="text-red-400 font-medium mt-1">{agentProfiles.length - onlineAgents.size}</span>
                  </div>
                </div>
                {/* Online Agents List */}
                <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  {agentProfiles
                    .filter(agent => onlineAgents.has(agent.id))
                    .slice(0, 3)
                    .map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-white/80 text-xs truncate">{agent.full_name}</span>
                        </div>
                        <span className="text-green-400 text-xs">Online</span>
                      </div>
                    ))}
                  {onlineAgents.size > 3 && (
                    <div className="text-center text-white/40 text-xs pt-1">
                      +{onlineAgents.size - 3} more online
                    </div>
                  )}
                  {onlineAgents.size === 0 && (
                    <div className="text-center text-white/40 text-xs py-2">
                      No agents currently online
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card rounded-xl p-6 bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-sm border border-white/10 hover:border-tertiary/30 transition-all hover:shadow-lg hover:shadow-tertiary/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-sm">Collection Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-white">66%</h3>
              <div className="flex items-center mt-3 text-red-400 bg-red-400/10 px-2 py-1 rounded-full text-xs w-fit">
                <ArrowDown size={14} className="mr-1" />
                <span>5.3% from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tertiary/20 to-tertiary/10 flex items-center justify-center border border-tertiary/20 shadow-sm shadow-tertiary/10">
              <CheckCircle size={24} className="text-tertiary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <div className="text-xs text-white/40">High</div>
                <div className="text-sm font-medium mt-1">92%</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <div className="text-xs text-white/40">Medium</div>
                <div className="text-sm font-medium mt-1">76%</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <div className="text-xs text-white/40">Low</div>
                <div className="text-sm font-medium mt-1">65%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-sm">Avg. Resolution Time</p>
              <h3 className="text-2xl font-bold mt-1 text-white">0 days</h3>
              <div className="flex items-center mt-3 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs w-fit">
                <ArrowDown size={14} className="mr-1" />
                <span>1.5 days improvement</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm shadow-purple-500/10">
              <Clock size={24} className="text-purple-500" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40">Target</span>
                <span className="text-white/80">12 days</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-500/70 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Collection Performance Chart */}
        <div className="card rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 lg:col-span-2 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <div className="p-6 bg-gradient-to-r from-black/40 to-black/20 border-b border-white/5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50"></div>
                <h3 className="text-lg font-semibold text-white">
                  Collection Performance
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select className="appearance-none bg-black/30 border border-white/10 rounded-lg text-white/70 text-sm pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option>All Teams</option>
                    <option>Team A</option>
                    <option>Team B</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50"
                  />
                </div>
                <button className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/70 hover:text-white hover:bg-primary/20 transition-colors">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/20">
            <div className="h-[350px]">
              {typeof window !== "undefined" && (
                <ReactApexChart
                  type="area"
                  height={350}
                  options={{
                    chart: {
                      type: "area",
                      fontFamily: "Inter, sans-serif",
                      toolbar: {
                        show: false,
                      },
                      zoom: {
                        enabled: false,
                      },
                      background: "transparent",
                    },
                    theme: {
                      mode: "dark",
                    },
                    stroke: {
                      curve: "smooth",
                      width: [3, 2],
                    },
                    colors: ["#6366f1", "#94a3b8"],
                    fill: {
                      type: "gradient",
                      gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.3,
                        opacityTo: 0.1,
                        stops: [0, 90, 100],
                      },
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    grid: {
                      borderColor: "rgba(255, 255, 255, 0.05)",
                      xaxis: {
                        lines: {
                          show: true,
                        },
                      },
                      padding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 10,
                      },
                    },
                    tooltip: {
                      theme: "dark",
                      y: {
                        formatter: (value) => `R${value.toLocaleString()}`,
                      },
                    },
                    legend: {
                      position: "top",
                      horizontalAlign: "right",
                      labels: {
                        colors: "rgba(255, 255, 255, 0.7)",
                      },
                    },
                    xaxis: {
                      categories: performanceData.map((item) => item.name),
                      labels: {
                        style: {
                          colors: "rgba(255, 255, 255, 0.5)",
                        },
                      },
                      axisBorder: {
                        show: false,
                      },
                      axisTicks: {
                        show: false,
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: "rgba(255, 255, 255, 0.5)",
                        },
                        formatter: (value) => `R${value.toLocaleString()}`,
                      },
                    },
                    markers: {
                      size: 4,
                      strokeWidth: 0,
                      hover: {
                        size: 6,
                      },
                    },
                  }}
                  series={[
                    {
                      name: "Collections",
                      data: performanceData.map((item) => item.collections),
                    },
                    {
                      name: "Target",
                      data: performanceData.map((item) => item.target),
                    },
                  ]}
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"].map(
                (quarter, index) => (
                  <div
                    key={quarter}
                    className="bg-white/5 rounded-lg p-3 border border-white/5"
                  >
                    <div className="text-xs text-white/50 mb-1">
                      Q{index + 1} {quarter}
                    </div>
                    <div className="text-lg font-semibold">
                      {index === 0
                        ? "R0"
                        : index === 1
                        ? "R65,540,447.61"
                        : index === 2
                        ? "R25,756,766.28"
                        : "R0"}
                    </div>
                    <div
                      className={`text-xs mt-1 flex items-center ${
                        index === 1 ? "text-red-400" : "text-gray-400"
                      }`}
                    >
                      {index === 1 ? (
                        <ArrowDown size={12} className="mr-1" />
                      ) : (
                        <ArrowUpRight size={12} className="mr-1" />
                      )}
                      {index === 1 ? "-34%" : "0%"}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Consolidated Payments (MTD) */}
        <div className="card rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 transition-all hover:shadow-lg hover:shadow-tertiary/5 hover:border-tertiary/20">
          <div className="p-6 bg-gradient-to-r from-black/40 to-black/20 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-tertiary to-tertiary/50"></div>
              <h3 className="text-lg font-semibold text-white">
                Consolidated Payments (MTD)
              </h3>
            </div>
          </div>

          <div className="p-6 bg-black/20">
            <div className="h-[300px]">
              {typeof window !== "undefined" && (
                <ReactApexChart
                  type="bar"
                  height={300}
                  width="100%"
                  options={{
                    chart: {
                      type: "bar",
                      fontFamily: "Inter, sans-serif",
                      background: "transparent",
                      toolbar: {
                        show: false,
                      },
                    },
                    theme: {
                      mode: "dark",
                    },
                    colors: ["#00C49F"],
                    plotOptions: {
                      bar: {
                        borderRadius: 4,
                        columnWidth: "60%",
                        dataLabels: {
                          position: "top",
                        },
                      },
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function (val) {
                        return val === 0 ? "" : "R" + val.toLocaleString();
                      },
                      offsetY: -20,
                      style: {
                        fontSize: "12px",
                        colors: ["#fff"],
                      },
                    },
                    xaxis: {
                      categories: consolidatedPaymentsData.map(
                        (item) => item.month
                      ),
                      labels: {
                        style: {
                          colors: "rgba(255, 255, 255, 0.7)",
                        },
                      },
                      axisBorder: {
                        show: false,
                      },
                      axisTicks: {
                        show: false,
                      },
                    },
                    yaxis: {
                      labels: {
                        formatter: function (val) {
                          return "R" + (val / 1000000).toFixed(1) + "M";
                        },
                        style: {
                          colors: "rgba(255, 255, 255, 0.7)",
                        },
                      },
                    },
                    grid: {
                      borderColor: "rgba(255, 255, 255, 0.05)",
                      yaxis: {
                        lines: {
                          show: true,
                        },
                      },
                      padding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 10,
                      },
                    },
                    tooltip: {
                      theme: "dark",
                      y: {
                        formatter: function (val) {
                          return "R" + val.toLocaleString();
                        },
                      },
                    },
                  }}
                  series={[
                    {
                      name: "Monthly Payments",
                      data: consolidatedPaymentsData.map((item) => item.amount),
                    },
                  ]}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-white/50 mb-1">
                  Total Collections
                </div>
                <div className="text-xs font-semibold">
                  R{consolidatedPaymentStats.totalCollections.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1 flex items-center text-green-400">
                  <ArrowUp size={12} className="mr-1" />
                  <span>100% of total</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-white/50 mb-1">Current Month</div>
                <div className="text-xs font-semibold">
                  R{consolidatedPaymentStats.currentMonth.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1 flex items-center text-white/50">
                  <span>{consolidatedPaymentStats.currentMonthDisplay}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-white/50 mb-1">
                  Monthly Average
                </div>
                <div className="text-xs font-semibold">
                  R{consolidatedPaymentStats.monthlyAverage.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1 flex items-center text-white/50">
                  <span>Based on active months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Activity Feed and Notifications */}
      <div className="space-y-6">
        {/* Notifications */}
        <div className="card rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 transition-all hover:shadow-lg">
          <div className="p-6 bg-gradient-to-r from-black/40 to-black/20 border-b border-white/5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-purple-500 to-purple-700/50"></div>
                <h3 className="text-lg font-semibold text-white">
                  Notifications
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                <Bell size={12} />
                {notifications.length} New
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl flex items-start gap-3 transition-all hover:translate-x-1 cursor-pointer ${
                  notification.type === "urgent"
                    ? "bg-gradient-to-r from-red-500/10 to-black/30 border border-red-500/20"
                    : notification.type === "warning"
                    ? "bg-gradient-to-r from-yellow-500/10 to-black/30 border border-yellow-500/20"
                    : "bg-gradient-to-r from-blue-500/10 to-black/30 border border-blue-500/20"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    notification.type === "urgent"
                      ? "bg-red-500/20 text-red-400"
                      : notification.type === "warning"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {notification.type === "urgent" ? (
                    <AlertCircle size={16} />
                  ) : notification.type === "warning" ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Info size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{notification.message}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
                      : "Unknown date"}
                  </p>
                </div>
                <button className="text-white/30 hover:text-white/70 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/5 flex justify-center">
            <button
              onClick={() => router.push("/admin/notifications")}
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-all"
            >
              View All Notifications
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 transition-all hover:shadow-lg">
          <div className="p-6 bg-gradient-to-r from-black/40 to-black/20 border-b border-white/5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-700/50"></div>
                <h3 className="text-lg font-semibold text-white">
                  Recent Activity
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search activities"
                    className="pl-8 pr-4 py-2 text-sm bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder:text-white/40 w-full sm:w-auto"
                  />
                  <Search
                    size={14}
                    className="absolute left-2.5 top-2.5 text-white/40"
                  />
                </div>
                <button className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/70 hover:text-white transition-colors">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loadingNotifications ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="p-3 rounded-full bg-white/5 mb-3">
                  <Bell size={24} className="text-purple-400/70" />
                </div>
                <p className="text-white/70 text-base font-medium">
                  No notifications
                </p>
                <p className="text-white/40 text-xs mt-1 text-center">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg mb-2 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => router.push("/admin/notifications")}
                >
                  <div
                    className={`p-2 rounded-full ${
                      notification.type === "urgent"
                        ? "bg-red-500/20 text-red-400"
                        : notification.type === "warning"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {notification.type === "urgent" ? (
                      <AlertCircle size={16} />
                    ) : notification.type === "warning" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Info size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{notification.message}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                        : new Date().toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                    </p>
                  </div>
                  <button className="text-white/30 hover:text-white/70 transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-white/5 flex justify-center">
            <a
              href="/admin/notifications"
              className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 transition-all"
            >
              View All Activity
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}
