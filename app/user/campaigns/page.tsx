"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Edit,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  PieChart,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

// Types
type Campaign = {
  id: string;
  name: string;
  client: string;
  logo: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "completed" | "paused";
  debtorCount: number;
  totalDebt: number;
  collectedAmount: number;
  collectionRate: number;
  priority: "high" | "medium" | "low";
  tags: string[];
  agents: Agent[];
  recentActivity: Activity[];
};

type Agent = {
  id: string;
  name: string;
  avatar: string;
  assignedDebtors: number;
  collectionRate: number;
};

type Activity = {
  id: string;
  type: "payment" | "call" | "email" | "sms" | "note";
  description: string;
  timestamp: string;
  amount?: number;
  agent: string;
};

// Mock data
const campaigns: Campaign[] = [
  {
    id: "camp-001",
    name: "WesBank",
    client: "WesBank Financial Services",
    logo: "/logos/wesbank.png",
    description: "Vehicle finance debt recovery campaign",
    startDate: "2025-01-15",
    endDate: "2025-07-15",
    status: "active",
    debtorCount: 3245,
    totalDebt: 42500000,
    collectedAmount: 12750000,
    collectionRate: 30,
    priority: "high",
    tags: ["vehicle-finance", "high-value", "financial-services"],
    agents: [
      {
        id: "agent-001",
        name: "Thabo Mokoena",
        avatar: "/avatars/thabo.png",
        assignedDebtors: 412,
        collectionRate: 32,
      },
      {
        id: "agent-002",
        name: "Lerato Ndlovu",
        avatar: "/avatars/lerato.png",
        assignedDebtors: 389,
        collectionRate: 28,
      },
      {
        id: "agent-003",
        name: "Sipho Nkosi",
        avatar: "/avatars/sipho.png",
        assignedDebtors: 401,
        collectionRate: 31,
      },
    ],
    recentActivity: [
      {
        id: "act-001",
        type: "payment",
        description: "Payment received - R15,000",
        timestamp: "2025-03-09T09:45:00",
        amount: 15000,
        agent: "Thabo Mokoena",
      },
      {
        id: "act-002",
        type: "call",
        description: "Successful call - Promise to pay",
        timestamp: "2025-03-09T10:15:00",
        agent: "Lerato Ndlovu",
      },
      {
        id: "act-003",
        type: "payment",
        description: "Payment received - R8,500",
        timestamp: "2025-03-08T14:30:00",
        amount: 8500,
        agent: "Sipho Nkosi",
      },
    ],
  },
  {
    id: "camp-002",
    name: "Vodacom",
    client: "Vodacom South Africa",
    logo: "/logos/vodacom.png",
    description: "Telecommunications debt recovery campaign",
    startDate: "2025-02-01",
    endDate: "2025-08-01",
    status: "active",
    debtorCount: 5876,
    totalDebt: 18500000,
    collectedAmount: 6475000,
    collectionRate: 35,
    priority: "medium",
    tags: ["telecommunications", "consumer", "high-volume"],
    agents: [
      {
        id: "agent-004",
        name: "Nomsa Dlamini",
        avatar: "/avatars/nomsa.png",
        assignedDebtors: 578,
        collectionRate: 36,
      },
      {
        id: "agent-005",
        name: "David Mthembu",
        avatar: "/avatars/david.png",
        assignedDebtors: 602,
        collectionRate: 33,
      },
      {
        id: "agent-006",
        name: "Precious Moloi",
        avatar: "/avatars/precious.png",
        assignedDebtors: 545,
        collectionRate: 37,
      },
    ],
    recentActivity: [
      {
        id: "act-004",
        type: "payment",
        description: "Payment received - R2,500",
        timestamp: "2025-03-09T11:20:00",
        amount: 2500,
        agent: "Nomsa Dlamini",
      },
      {
        id: "act-005",
        type: "sms",
        description: "Payment reminder sent to 245 debtors",
        timestamp: "2025-03-09T08:00:00",
        agent: "System",
      },
      {
        id: "act-006",
        type: "call",
        description: "Successful calls - 45 promises to pay",
        timestamp: "2025-03-08T16:45:00",
        agent: "David Mthembu",
      },
    ],
  },
  {
    id: "camp-003",
    name: "Legal Practice Council",
    client: "Legal Practice Council of South Africa",
    logo: "/logos/lpc.png",
    description: "Professional fees and disciplinary fines recovery",
    startDate: "2025-01-10",
    endDate: "2025-06-30",
    status: "active",
    debtorCount: 1245,
    totalDebt: 28750000,
    collectedAmount: 8625000,
    collectionRate: 30,
    priority: "high",
    tags: ["legal", "professional", "regulatory"],
    agents: [
      {
        id: "agent-007",
        name: "Mandla Khumalo",
        avatar: "/avatars/mandla.png",
        assignedDebtors: 312,
        collectionRate: 29,
      },
      {
        id: "agent-008",
        name: "Zanele Mbeki",
        avatar: "/avatars/zanele.png",
        assignedDebtors: 298,
        collectionRate: 32,
      },
      {
        id: "agent-009",
        name: "Thabiso Tshabalala",
        avatar: "/avatars/thabiso.png",
        assignedDebtors: 305,
        collectionRate: 28,
      },
    ],
    recentActivity: [
      {
        id: "act-007",
        type: "payment",
        description: "Payment received - R35,000",
        timestamp: "2025-03-09T10:05:00",
        amount: 35000,
        agent: "Zanele Mbeki",
      },
      {
        id: "act-008",
        type: "email",
        description: "Legal notice sent to 78 debtors",
        timestamp: "2025-03-08T09:30:00",
        agent: "System",
      },
      {
        id: "act-009",
        type: "note",
        description: "Case referred to legal department",
        timestamp: "2025-03-07T14:15:00",
        agent: "Mandla Khumalo",
      },
    ],
  },
  {
    id: "camp-004",
    name: "Vhembe",
    client: "Vhembe District Municipality",
    logo: "/logos/vhembe.png",
    description: "Municipal services debt recovery campaign",
    startDate: "2025-02-15",
    endDate: "2025-08-15",
    status: "active",
    debtorCount: 4532,
    totalDebt: 15800000,
    collectedAmount: 3950000,
    collectionRate: 25,
    priority: "medium",
    tags: ["municipal", "utilities", "public-sector"],
    agents: [
      {
        id: "agent-010",
        name: "Tshilidzi Mulaudzi",
        avatar: "/avatars/tshilidzi.png",
        assignedDebtors: 578,
        collectionRate: 26,
      },
      {
        id: "agent-011",
        name: "Fhatuwani Nemakonde",
        avatar: "/avatars/fhatuwani.png",
        assignedDebtors: 562,
        collectionRate: 24,
      },
      {
        id: "agent-012",
        name: "Ndivhuwo Makhado",
        avatar: "/avatars/ndivhuwo.png",
        assignedDebtors: 545,
        collectionRate: 25,
      },
    ],
    recentActivity: [
      {
        id: "act-010",
        type: "payment",
        description: "Payment received - R4,200",
        timestamp: "2025-03-09T09:10:00",
        amount: 4200,
        agent: "Tshilidzi Mulaudzi",
      },
      {
        id: "act-011",
        type: "call",
        description: "Outbound calls - 85 contacts made",
        timestamp: "2025-03-08T13:45:00",
        agent: "Fhatuwani Nemakonde",
      },
      {
        id: "act-012",
        type: "sms",
        description: "Payment reminder sent to 320 debtors",
        timestamp: "2025-03-07T08:00:00",
        agent: "System",
      },
    ],
  },
  {
    id: "camp-005",
    name: "Musina",
    client: "Musina Local Municipality",
    logo: "/logos/musina.png",
    description: "Property rates and taxes recovery campaign",
    startDate: "2025-03-01",
    endDate: "2025-09-01",
    status: "active",
    debtorCount: 2876,
    totalDebt: 12500000,
    collectedAmount: 2500000,
    collectionRate: 20,
    priority: "medium",
    tags: ["municipal", "property-tax", "public-sector"],
    agents: [
      {
        id: "agent-013",
        name: "Livhuwani Sinyosi",
        avatar: "/avatars/livhuwani.png",
        assignedDebtors: 385,
        collectionRate: 21,
      },
      {
        id: "agent-014",
        name: "Rendani Netshikweta",
        avatar: "/avatars/rendani.png",
        assignedDebtors: 362,
        collectionRate: 19,
      },
      {
        id: "agent-015",
        name: "Mashudu Mudau",
        avatar: "/avatars/mashudu.png",
        assignedDebtors: 378,
        collectionRate: 20,
      },
    ],
    recentActivity: [
      {
        id: "act-013",
        type: "payment",
        description: "Payment received - R5,800",
        timestamp: "2025-03-09T08:30:00",
        amount: 5800,
        agent: "Livhuwani Sinyosi",
      },
      {
        id: "act-014",
        type: "email",
        description: "Final notices sent to 125 debtors",
        timestamp: "2025-03-08T10:15:00",
        agent: "System",
      },
      {
        id: "act-015",
        type: "call",
        description: "Successful calls - 28 promises to pay",
        timestamp: "2025-03-07T15:30:00",
        agent: "Rendani Netshikweta",
      },
    ],
  },
  // Add this campaign to the campaigns array
  {
    id: "camp-006",
    name: "MiX Telematics",
    client: "MiX Telematics South Africa",
    logo: "/logos/mix-telematics.png",
    description: "Fleet management and vehicle tracking debt recovery",
    startDate: "2025-02-20",
    endDate: "2025-08-20",
    status: "active",
    debtorCount: 1876,
    totalDebt: 22800000,
    collectedAmount: 7980000,
    collectionRate: 35,
    priority: "high",
    tags: ["fleet-management", "telematics", "corporate"],
    agents: [
      {
        id: "agent-016",
        name: "Thulani Mkhize",
        avatar: "/avatars/thulani.png",
        assignedDebtors: 325,
        collectionRate: 36,
      },
      {
        id: "agent-017",
        name: "Ayanda Naidoo",
        avatar: "/avatars/ayanda.png",
        assignedDebtors: 298,
        collectionRate: 34,
      },
      {
        id: "agent-018",
        name: "Kagiso Molefe",
        avatar: "/avatars/kagiso.png",
        assignedDebtors: 312,
        collectionRate: 35,
      },
    ],
    recentActivity: [
      {
        id: "act-016",
        type: "payment",
        description: "Payment received - R24,500",
        timestamp: "2025-03-09T09:15:00",
        amount: 24500,
        agent: "Thulani Mkhize",
      },
      {
        id: "act-017",
        type: "email",
        description: "Payment reminders sent to 85 corporate clients",
        timestamp: "2025-03-08T11:30:00",
        agent: "System",
      },
      {
        id: "act-018",
        type: "call",
        description: "Successful calls - 12 payment arrangements",
        timestamp: "2025-03-07T14:00:00",
        agent: "Ayanda Naidoo",
      },
    ],
  },
];

// Format currency in ZAR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Format timestamp
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Filter campaigns based on search and active tab
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      searchQuery === "" ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && campaign.status === "active") ||
      (activeTab === "pending" && campaign.status === "pending") ||
      (activeTab === "completed" && campaign.status === "completed") ||
      (activeTab === "paused" && campaign.status === "paused");

    return matchesSearch && matchesTab;
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "paused":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "";
    }
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "medium":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "low":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      default:
        return "";
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "call":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-purple-500" />;
      case "sms":
        return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      case "note":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  // View campaign details
  const viewCampaignDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and track your debt collection campaigns
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaigns.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Debtors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaigns
                .reduce((acc, campaign) => acc + campaign.debtorCount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Debt Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(
                campaigns.reduce((acc, campaign) => acc + campaign.totalDebt, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(
                (campaigns.reduce(
                  (acc, campaign) => acc + campaign.collectedAmount,
                  0
                ) /
                  campaigns.reduce(
                    (acc, campaign) => acc + campaign.totalDebt,
                    0
                  )) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Campaigns</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search campaigns..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs
                defaultValue="all"
                className="w-full sm:w-auto"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewCampaignDetails(campaign)}
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={campaign.logo} alt={campaign.name} />
                        <AvatarFallback>
                          {campaign.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {campaign.name}
                        </CardTitle>
                        <CardDescription>{campaign.client}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={getStatusBadge(campaign.status)}
                    >
                      {campaign.status.charAt(0).toUpperCase() +
                        campaign.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    {campaign.description}
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {campaign.debtorCount.toLocaleString()} debtors
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(campaign.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{campaign.collectionRate}% collected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">
                        {campaign.priority} priority
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Collection Progress</span>
                      <span>
                        {formatCurrency(campaign.collectedAmount)} of{" "}
                        {formatCurrency(campaign.totalDebt)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                        style={{
                          width: `${Math.min(campaign.collectionRate, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-1">
                    {campaign.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      {selectedCampaign && (
        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage
                    src={selectedCampaign.logo}
                    alt={selectedCampaign.name}
                  />
                  <AvatarFallback>
                    {selectedCampaign.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>{selectedCampaign.name}</DialogTitle>
                  <DialogDescription>
                    {selectedCampaign.client}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Campaign Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Description
                    </div>
                    <div>{selectedCampaign.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Start Date
                      </div>
                      <div>{formatDate(selectedCampaign.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        End Date
                      </div>
                      <div>{formatDate(selectedCampaign.endDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Status
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusBadge(selectedCampaign.status)}
                      >
                        {selectedCampaign.status.charAt(0).toUpperCase() +
                          selectedCampaign.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Priority
                      </div>
                      <Badge
                        variant="outline"
                        className={getPriorityBadge(selectedCampaign.priority)}
                      >
                        {selectedCampaign.priority.charAt(0).toUpperCase() +
                          selectedCampaign.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tags</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCampaign.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-medium mt-6 mb-2">
                  Collection Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Debtors</div>
                    <div>{selectedCampaign.debtorCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Debt
                    </div>
                    <div>{formatCurrency(selectedCampaign.totalDebt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Collected
                    </div>
                    <div>
                      {formatCurrency(selectedCampaign.collectedAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Collection Rate
                    </div>
                    <div>{selectedCampaign.collectionRate}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Collection Progress</span>
                    <span>
                      {formatCurrency(selectedCampaign.collectedAmount)} of{" "}
                      {formatCurrency(selectedCampaign.totalDebt)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        width: `${Math.min(
                          selectedCampaign.collectionRate,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Assigned Agents</h3>
                <div className="space-y-3">
                  {selectedCampaign.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback>
                            {agent.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.assignedDebtors} debtors assigned
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-medium">
                            {agent.collectionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Collection rate
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-medium mt-6 mb-2">
                  Recent Activity
                </h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {selectedCampaign.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded-md"
                      >
                        <div className="mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {activity.description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.timestamp)}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.agent}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
              >
                Close
              </Button>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                View Debtors
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
