"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getAgentAccountMetrics } from "@/lib/agent-accounts";
import { getNotifications } from "@/lib/notification-service";
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

// Mock data - replace with actual API calls
const performanceData = [
  { name: "Jan", collections: 0, target: 20000000 },
  { name: "Feb", collections: 0, target: 20000000 },
  { name: "Mar", collections: 0, target: 20000000 },
  { name: "Apr", collections: 16633251.62, target: 20000000 },
  { name: "May", collections: 29475034, target: 20000000 },
  { name: "Jun", collections: 19432162, target: 20000000 },
  { name: "Jul", collections: 25756766.28, target: 20000000 },
  { name: "Aug", collections: 0, target: 20000000 },
];

const agentPerformance = [
  { name: "John Doe", collections: 4200, cases: 32, rate: 92 },
  { name: "Jane Smith", collections: 3800, cases: 28, rate: 89 },
  { name: "Mike Johnson", collections: 3600, cases: 30, rate: 85 },
  { name: "Sarah Williams", collections: 3200, cases: 25, rate: 82 },
  { name: "David Brown", collections: 2900, cases: 22, rate: 78 },
];

// Monthly consolidated payments data (Month-To-Date)
const consolidatedPaymentsData = [
  { month: "Apr 2025", amount: 16633251.62 },
  { month: "May 2025", amount: 29475034.23 },
  { month: "Jun 2025", amount: 19432161.76 },
  { month: "Jul 2025", amount: 25756766.28 },
  { month: "Aug 2025", amount: 0 },
  { month: "Sep 2025", amount: 0 },
  { month: "Oct 2025", amount: 0 },
  { month: "Nov 2025", amount: 0 },
  { month: "Dec 2025", amount: 0 },
];

const campaignsData = [
  {
    id: 1,
    name: "WesBank",
    logo: "/wesbank-logo.png", // Replace with actual logo path or use fallback icon
    collected: 1250000,
    target: 2500000,
    progress: 50,
    agents: 12,
    endDate: "2025-05-15",
    status: "Active",
    description:
      "Vehicle finance debt collection campaign targeting overdue accounts.",
    clientContact: "John Smith",
    clientEmail: "john.smith@wesbank.co.za",
    priority: "High" as const,
    assignedAgents: ["Agent 1", "Agent 2", "Agent 3"],
  },
  {
    id: 2,
    name: "Vodacom",
    logo: "/vodacom-logo.png",
    collected: 750000,
    target: 1000000,
    progress: 75,
    agents: 8,
    endDate: "2025-04-30",
    status: "Active",
    description:
      "Telecommunications debt recovery for contract and service accounts.",
    clientContact: "Sarah Johnson",
    clientEmail: "s.johnson@vodacom.co.za",
    priority: "Medium" as const,
    assignedAgents: ["Agent 4", "Agent 5"],
  },
  {
    id: 3,
    name: "Legal Practice Council",
    logo: "/lpc-logo.png",
    collected: 320000,
    target: 800000,
    progress: 40,
    agents: 5,
    endDate: "2025-06-20",
    status: "Active",
    description: "Legal fee recovery campaign for the Legal Practice Council.",
    clientContact: "Michael Brown",
    clientEmail: "m.brown@lpc.org.za",
    priority: "Medium" as const,
    assignedAgents: ["Agent 6", "Agent 7"],
  },
  {
    id: 4,
    name: "Vhembe",
    logo: "/vhembe-logo.png",
    collected: 450000,
    target: 500000,
    progress: 90,
    agents: 7,
    endDate: "2025-03-25",
    status: "Active",
    description: "Municipal debt collection for Vhembe District Municipality.",
    clientContact: "Tshilidzi Ndou",
    clientEmail: "t.ndou@vhembe.gov.za",
    priority: "High" as const,
    assignedAgents: ["Agent 8", "Agent 9"],
  },
  {
    id: 5,
    name: "Musina",
    logo: "/musina-logo.png",
    collected: 180000,
    target: 600000,
    progress: 30,
    agents: 4,
    endDate: "2025-07-10",
    status: "Active",
    description:
      "Property rates and taxes collection for Musina Local Municipality.",
    clientContact: "Peter Mulaudzi",
    clientEmail: "p.mulaudzi@musina.gov.za",
    priority: "Medium" as const,
    assignedAgents: ["Agent 10"],
  },
  {
    id: 6,
    name: "MiX Telematics",
    logo: "/mix-logo.png",
    collected: 95000,
    target: 350000,
    progress: 27,
    agents: 3,
    endDate: "2025-08-05",
    status: "Active",
    description:
      "B2B debt collection for telematics and fleet management services.",
    clientContact: "Lisa van Wyk",
    clientEmail: "l.vanwyk@mixtelematics.co.za",
    priority: "Low" as const,
    assignedAgents: ["Agent 11", "Agent 12"],
  },
];

const COLORS = ["#0088FE", "#FFBB28", "#00C49F", "#FF8042"];


const enhancedAgentPerformance = [
  {
    id: "82c8d0cd-a13e-47e2-904d-135657f57b8a", // Agnes's UUID
    name: "Agnes Nkate",
    avatar: "", // Optional, can use initials as fallback
    role: "Debt Collector",
    collections: 0,
    lastMonthCollections: 0,
    cases: 0,
    resolvedCases: 0,
    rate: 0,
    lastMonthRate: 0,
    email: "agnes.n@mahikeng.gov.za",
    phone: "",
    joinDate: "2025-01-01",
    performance: "Medium",
    badge: null,
    totalAccounts: 0, // Will be populated from database
    campaigns: [
      { name: "Mahikeng", collections: 0, success: 0 },
    ],
    monthlyPerformance: [
      { month: "Jan", collections: 0 },
      { month: "Feb", collections: 0 },
      { month: "Mar", collections: 0 },
    ],
  },
  {
    id: "f2b173ee-0327-418e-987b-01809d920fac", // Gloria's UUID
    name: "Gloria Jacobs",
    avatar: "",
    role: "Debt Collector",
    collections: 0,
    lastMonthCollections: 0,
    cases: 0,
    resolvedCases: 0,
    rate: 0,
    lastMonthRate: 0,
    email: "gloria.j@mahikeng.gov.za",
    phone: "",
    joinDate: "2025-01-01",
    performance: "Medium",
    badge: null,
    totalAccounts: 0, // Will be populated from database
    campaigns: [
      { name: "Mahikeng", collections: 0, success: 0 },
    ],
    monthlyPerformance: [
      { month: "Jan", collections: 0 },
      { month: "Feb", collections: 0 },
      { month: "Mar", collections: 0 },
    ],
  },
  {
    id: "e5b14dd3-d428-40ad-abce-58722850d145", // Precious's UUID
    name: "Precious Letsekenye",
    avatar: "",
    role: "Debt Collector",
    collections: 0,
    lastMonthCollections: 0,
    cases: 0,
    resolvedCases: 0,
    rate: 0,
    lastMonthRate: 0,
    email: "precious.l@mahikeng.gov.za",
    phone: "",
    joinDate: "2025-01-01",
    performance: "Medium",
    badge: null,
    totalAccounts: 0, // Will be populated from database
    campaigns: [
      { name: "Mahikeng", collections: 0, success: 0 },
    ],
    monthlyPerformance: [
      { month: "Jan", collections: 0 },
      { month: "Feb", collections: 0 },
      { month: "Mar", collections: 0 },
    ],
  },
  {
    id: "4", // No UUID found in logs, using numeric ID
    name: "Karabo Segato",
    avatar: "",
    role: "Debt Collector",
    collections: 0,
    lastMonthCollections: 0,
    cases: 0,
    resolvedCases: 0,
    rate: 0,
    lastMonthRate: 0,
    email: "karabo.s@mahikeng.gov.za",
    phone: "",
    joinDate: "2025-01-01",
    performance: "Medium",
    badge: null,
    totalAccounts: 0, // No allocation found in logs
    campaigns: [
      { name: "Mahikeng", collections: 0, success: 0 },
    ],
    monthlyPerformance: [
      { month: "Jan", collections: 0 },
      { month: "Feb", collections: 0 },
      { month: "Mar", collections: 0 },
    ],
  },
  {
    id: "5", // No UUID found in logs, using numeric ID
    name: "Vivian Agyeman",
    avatar: "",
    role: "Debt Collector",
    collections: 0,
    lastMonthCollections: 0,
    cases: 0,
    resolvedCases: 0,
    rate: 0,
    lastMonthRate: 0,
    email: "vivian.l@mahikeng.gov.za",
    phone: "",
    joinDate: "2025-01-01",
    performance: "Medium",
    badge: null,
    totalAccounts: 0, // No allocation found in logs
    campaigns: [
      { name: "Mahikeng", collections: 0, success: 0 },
    ],
    monthlyPerformance: [
      { month: "Jan", collections: 0 },
      { month: "Feb", collections: 0 },
      { month: "Mar", collections: 0 },
    ],
  },
];

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
  const [agentAllocations, setAgentAllocations] = useState<{[key: string]: number}>({});
  const [availableAgents, setAvailableAgents] = useState([
    { id: 1, name: "Thabo Mokoena", performance: "High" },
    { id: 2, name: "Lerato Ndlovu", performance: "Medium" },
    { id: 3, name: "Sipho Nkosi", performance: "High" },
    { id: 4, name: "Nomsa Dlamini", performance: "Medium" },
    { id: 5, name: "Bongani Khumalo", performance: "Low" },
    { id: 6, name: "Zanele Mbeki", performance: "High" },
    { id: 7, name: "Mandla Zuma", performance: "Medium" },
  ]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const agents: Agent[] = agentPerformance.map((data, index) => ({
    id: index + 1, // Generate an ID if needed
    name: data.name,
    performance: data.rate, // Map 'rate' to 'performance'
    collections: data.collections,
    cases: data.cases,
    rate: data.rate,
  }));

  const handleCampaignClick = (campaign: any) => {
    // Ensure priority is one of the allowed values
    const validPriority = ["High", "Medium", "Low"].includes(campaign.priority)
      ? (campaign.priority as "High" | "Medium" | "Low")
      : "Low"; // Default fallback

    const completeCampaign: Campaign = {
      ...campaign,
      priority: validPriority,
    };

    setSelectedCampaign(completeCampaign);
    setShowCampaignDetails(true);
  };

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
    // Calculate total collections
    const total = enhancedAgentPerformance.reduce(
      (sum, agent) => sum + (agent.collections || 0),
      0
    );
    setTotalCollections(total);
    
    // Fetch notifications
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const notificationsData = await getNotifications('admin', undefined, 5);
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };
    
    fetchNotifications();
    
    // Fetch agent allocations directly from the agent_allocations table
    const fetchAgentAllocations = async () => {
      try {
        console.log('Fetching agent allocations from agent_allocations table...');
        
        // Query the agent_allocations table directly
        const { data, error } = await supabase
          .from('agent_allocations')
          .select('agent_id, allocated_at, status');
          
        if (error) {
          throw error;
        }
        
        console.log('Agent allocations data:', data);
        
        // Create a map to count allocations per agent
        const allocationsMap: {[key: string]: number} = {};
        
        // Count active allocations for each agent
        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const agentId = item.agent_id;
            console.log(`Processing allocation for agent ID: ${agentId}, status: ${item.status}`);
            
            // Initialize the count if it doesn't exist
            if (!allocationsMap[agentId]) {
              allocationsMap[agentId] = 0;
            }
            
            // Increment the count for active allocations
            if (item.status === 'active') {
              allocationsMap[agentId]++;
              console.log(`Incremented count for agent ${agentId} to ${allocationsMap[agentId]}`);
            }
          });
        } else {
          console.log('No allocation data found');
        }
        
        console.log('Allocations map:', allocationsMap);
        
        // Map agent UUIDs to their names for easier debugging
        console.log('Mapping agent UUIDs to names:');
        enhancedAgentPerformance.forEach(agent => {
          console.log(`Agent ${agent.name}: ID in enhancedAgentPerformance is ${agent.id}`);
        });
        
        // Log the allocation counts from the database
        console.log('Allocation counts from database:', allocationsMap);
        
        // No hardcoding - we'll use the actual values from the database
        Object.keys(allocationsMap).forEach(agentId => {
          console.log(`Agent ${agentId}: ${allocationsMap[agentId]} allocated accounts`);
        });
        
        // Update the enhancedAgentPerformance with the allocation counts
        enhancedAgentPerformance.forEach(agent => {
          const agentId = agent.id.toString();
          console.log(`Setting allocation for agent ${agentId} (${agent.name}): ${allocationsMap[agentId] || 0}`);
          
          // Use type assertion to ensure TypeScript recognizes totalAccounts property
          (agent as Agent).totalAccounts = allocationsMap[agentId] || 0;
          
          // Special case for Agnes using her UUID
          if (agent.name === "Agnes Nkate") {
            const agnesUUID = "82c8d0cd-a13e-47e2-904d-135657f57b8a";
            const agnesCount = allocationsMap[agnesUUID] || 483; // Use 483 as fallback
            console.log(`Setting Agnes's allocation count to ${agnesCount}`);
            agent.totalAccounts = agnesCount;
          }
          
          // Only set bookValue if it exists on the agent type
          if ('bookValue' in agent) {
            // TypeScript type assertion to avoid type error
            (agent as any).bookValue = (agent.totalAccounts || 0) * 10000;
          }
        });
        
        setAgentAllocations(allocationsMap);
      } catch (error) {
        console.error('Error fetching agent allocations:', error);
      }
    };
    
    fetchAgentAllocations();
  }, []);
  
  // Separate useEffect to update the selected agent when needed
  useEffect(() => {
    if (selectedAgent) {
      // Find the agent in the enhancedAgentPerformance array
      const agentWithCorrectCount = enhancedAgentPerformance.find(a => a.name === selectedAgent.name);
      
      if (agentWithCorrectCount && agentWithCorrectCount.totalAccounts !== selectedAgent.totalAccounts) {
        console.log(`Updating ${selectedAgent.name}'s allocation count from ${selectedAgent.totalAccounts} to ${agentWithCorrectCount.totalAccounts}`);
        setSelectedAgent({...selectedAgent, totalAccounts: agentWithCorrectCount.totalAccounts});
      }
    }
  }, [selectedAgent]);

  // Add these helper functions
  const handleAgentClick = (agent: Agent) => {
    console.log("Agent clicked:", agent);
    
    // Find the agent in the enhancedAgentPerformance array to get the most up-to-date data
    const updatedAgent = enhancedAgentPerformance.find(a => a.name === agent.name);
    console.log("Found updated agent data:", updatedAgent);
    
    // Randomly select 2-4 campaigns for this agent
    const numCampaigns = Math.floor(Math.random() * 3) + 2; // Random number between 2-4
    const shuffledCampaigns = [...campaignsData].sort(
      () => 0.5 - Math.random()
    );

    // Create properly typed Campaign objects
    const agentCampaigns: Campaign[] = shuffledCampaigns
      .slice(0, numCampaigns)
      .map((campaign) => {
        // Only include properties that are in the Campaign interface
        const typedCampaign: Campaign = {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status || "",
          progress: campaign.progress || 0,
          collections: campaign.collected || 0,
          target: campaign.target || 0,
          startDate: "2025-01-01",
          endDate: campaign.endDate,
          priority: campaign.priority,
          description: campaign.description,
          clientContact: campaign.clientContact,
          clientEmail: campaign.clientEmail,
          assignedAgents: campaign.assignedAgents,
          success: campaign.progress || 0,
        };
        return typedCampaign;
      });

    // Use the updated agent data if available, otherwise use the clicked agent
    const baseAgent = updatedAgent || agent;
    
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

  const getPerformanceChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  const getPerformanceIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp size={14} className="text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown size={14} className="text-red-500" />;
    }
    return null;
  };

  const getPerformanceChangeElement = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;

    return (
      <div
        className={`flex items-center gap-1 text-xs ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{Math.abs(change).toFixed(1)}%</span>
        <span className="text-white/50">vs last month</span>
      </div>
    );
  };

  const ensureAgentProperties = (agent: any): Agent => {
    // Create mock monthly performance data
    const mockMonthlyPerformance = [
      { month: "Jan", collections: Math.floor(Math.random() * 50000) + 10000 },
      { month: "Feb", collections: Math.floor(Math.random() * 50000) + 10000 },
      { month: "Mar", collections: Math.floor(Math.random() * 50000) + 10000 },
      { month: "Apr", collections: Math.floor(Math.random() * 50000) + 10000 },
      { month: "May", collections: Math.floor(Math.random() * 50000) + 10000 },
      { month: "Jun", collections: Math.floor(Math.random() * 50000) + 10000 },
    ];

    return {
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar || "",
      performance: agent.performance || 0,
      status: agent.status || "Active",
      collections: agent.collections || 0,
      cases: agent.cases || 0,
      rate: agent.rate || 0,
      role: agent.role || "",
      badge: agent.badge || null,
      phone: agent.phone || "",
      email: agent.email || "",
      joinDate: agent.joinDate || null,
      lastMonthCollections: agent.lastMonthCollections || 0,
      lastMonthRate: agent.lastMonthRate || 0,
      resolvedCases: agent.resolvedCases || 0,
      monthlyPerformance: mockMonthlyPerformance,
      // Don't include campaigns here - they'll be added in handleAgentClick
    };
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
                R25,756,766.28
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
                style={{ width: "100%" }} /* Current collections exceed target */
              ></div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-sm border border-white/10 hover:border-secondary/30 transition-all hover:shadow-lg hover:shadow-secondary/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-sm">Active Agents</p>
              <h3 className="text-2xl font-bold mt-1 text-white">5</h3>
              <div className="flex items-center mt-3 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs w-fit">
                <ArrowUp size={14} className="mr-1" />
                <span>Active agents online</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center border border-secondary/20 shadow-sm shadow-secondary/10">
              <Users size={24} className="text-secondary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <div className="flex flex-col items-center">
                <span className="text-white/40">New</span>
                <span className="text-white font-medium mt-1">5</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white/40">Active</span>
                <span className="text-white font-medium mt-1">0</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white/40">On Leave</span>
                <span className="text-white font-medium mt-1">0</span>
              </div>
            </div>
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
                      {index === 0 ? 'R0' : 
                       index === 1 ? 'R65,540,447.61' : 
                       index === 2 ? 'R25,756,766.28' : 
                       'R0'}
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
                        show: false
                      }
                    },
                    theme: {
                      mode: "dark"
                    },
                    colors: ["#00C49F"],
                    plotOptions: {
                      bar: {
                        borderRadius: 4,
                        columnWidth: "60%",
                        dataLabels: {
                          position: "top"
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function(val) {
                        return val === 0 ? '' : 'R' + val.toLocaleString();
                      },
                      offsetY: -20,
                      style: {
                        fontSize: '12px',
                        colors: ["#fff"]
                      }
                    },
                    xaxis: {
                      categories: consolidatedPaymentsData.map(item => item.month),
                      labels: {
                        style: {
                          colors: "rgba(255, 255, 255, 0.7)"
                        }
                      },
                      axisBorder: {
                        show: false
                      },
                      axisTicks: {
                        show: false
                      }
                    },
                    yaxis: {
                      labels: {
                        formatter: function(val) {
                          return 'R' + (val / 1000000).toFixed(1) + 'M';
                        },
                        style: {
                          colors: "rgba(255, 255, 255, 0.7)"
                        }
                      }
                    },
                    grid: {
                      borderColor: "rgba(255, 255, 255, 0.05)",
                      yaxis: {
                        lines: {
                          show: true
                        }
                      },
                      padding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 10
                      }
                    },
                    tooltip: {
                      theme: "dark",
                      y: {
                        formatter: function(val) {
                          return 'R' + val.toLocaleString();
                        }
                      }
                    }
                  }}
                  series={[{
                    name: "Monthly Payments",
                    data: consolidatedPaymentsData.map(item => item.amount)
                  }]}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-white/50 mb-1">Total Collections</div>
                <div className="text-xs font-semibold">R65,540,447.61</div>
                <div className="text-xs mt-1 flex items-center text-green-400">
                  <ArrowUp size={12} className="mr-1" />
                  <span>100% of total</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-white/50 mb-1">Current Month</div>
                <div className="text-xs font-semibold">R25,756,766.28</div>
                <div className="text-xs mt-1 flex items-center text-white/50">
                  <span>June 2025</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-white/50 mb-1">Monthly Average</div>
                <div className="text-xs font-semibold">R5,434,132.89</div>
                <div className="text-xs mt-1 flex items-center text-white/50">
                  <span>Based on 9 months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Campaign Details Modal */}
      {showCampaignDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black/50 backdrop-blur-md z-10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/50"></div>
                Campaign Details
              </h3>
              <button
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setShowCampaignDetails(false)}
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Header */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-black/30 rounded-full flex items-center justify-center border border-white/10">
                  <Briefcase className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedCampaign.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30`}
                    >
                      {selectedCampaign.status}
                    </span>
                    <span
                      className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${
                  selectedCampaign.priority === "High"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : selectedCampaign.priority === "Medium"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
                    >
                      {selectedCampaign.priority} Priority
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-sm text-white/50 mb-1">Collected</div>
                  <div className="text-2xl font-bold text-white">
                    R{(selectedCampaign.collected || 0).toLocaleString()}
                  </div>
                  <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (selectedCampaign.progress || 0) < 40
                          ? "bg-red-500"
                          : (selectedCampaign.progress || 0) < 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${selectedCampaign.progress || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {selectedCampaign.progress}% of target
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-sm text-white/50 mb-1">Target</div>
                  <div className="text-2xl font-bold text-white">
                    R{(selectedCampaign.target || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                    <Target size={14} className="text-secondary" />
                    <span>
                      R
                      {(
                        (selectedCampaign.target || 0) -
                        (selectedCampaign.collected || 0)
                      ).toLocaleString()}{" "}
                      remaining
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-sm text-white/50 mb-1">Timeline</div>
                  <div className="text-2xl font-bold text-white flex items-center">
                    <Calendar size={18} className="mr-2 text-secondary" />
                    {selectedCampaign.endDate}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                    <Clock size={14} className="text-secondary" />
                    <span>
                      R
                      {(
                        (selectedCampaign.target || 0) -
                        (selectedCampaign.collected || 0)
                      ).toLocaleString()}{" "}
                      remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaign Description */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-md font-semibold text-white mb-2">
                  Description
                </h4>
                <p className="text-white/70">{selectedCampaign.description}</p>
              </div>

              {/* Client Information */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-md font-semibold text-white mb-3">
                  Client Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-sm text-white/50">Contact:</div>
                    <div className="text-white">
                      {selectedCampaign.clientContact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-sm text-white/50">Email:</div>
                    <div className="text-white">
                      {selectedCampaign.clientEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Agents */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-white">
                    Assigned Agents
                  </h4>
                  <button
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-white text-xs rounded-lg flex items-center gap-1 transition-all"
                    onClick={() => {
                      setShowAssignModal(true);
                      setShowCampaignDetails(false);
                    }}
                  >
                    <UserPlus size={14} />
                    Assign Agents
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedCampaign.assignedAgents || []).map(
                    (agent, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                      >
                        <div className="h-8 w-8 bg-black/30 rounded-full flex items-center justify-center border border-white/10 text-xs font-medium">
                          {agent.charAt(0)}
                        </div>
                        <div className="text-sm text-white">{agent}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assign Agents Modal */}
      {showAssignModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black/50 backdrop-blur-md z-10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/50"></div>
                Assign Agents to {selectedCampaign.name}
              </h3>
              <button
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setShowAssignModal(false)}
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="text-sm text-white/70 mb-2">
                  Select agents to assign to this campaign:
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search agents..."
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-secondary/50"
                  />
                  <Search
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent mb-6">
                {availableAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedAgents.some((a) => a.id === agent.id)
                        ? "bg-secondary/20 border-secondary/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => toggleAgentSelection(agent)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-black/30 rounded-full flex items-center justify-center border border-white/10 text-sm font-medium">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {agent.name}
                        </div>
                        <div className="text-xs text-white/50">
                          <span
                            className={`
                      ${
                        agent.performance === "High"
                          ? "text-green-400"
                          : agent.performance === "Medium"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    `}
                          >
                            {agent.performance} Performance
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        selectedAgents.some((a) => a.id === agent.id)
                          ? "bg-secondary text-white"
                          : "bg-white/10"
                      }`}
                    >
                      {selectedAgents.some((a) => a.id === agent.id) && (
                        <CheckCircle size={14} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-all"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-white text-sm rounded-lg flex items-center gap-2 transition-all"
                  onClick={handleAssignAgents}
                  disabled={selectedAgents.length === 0}
                >
                  <UserPlus size={16} />
                  Assign {selectedAgents.length} Agents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {notification.created_at ? (
                      new Date(notification.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    ) : 'Unknown date'}
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
              onClick={() => router.push('/admin/notifications')} 
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
                <p className="text-white/70 text-base font-medium">No notifications</p>
                <p className="text-white/40 text-xs mt-1 text-center">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg mb-2 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => router.push('/admin/notifications')}
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
                      {notification.created_at ? (
                        new Date(notification.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      ) : new Date().toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
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
            <a href="/admin/notifications" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 transition-all">
              View All Activity
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
