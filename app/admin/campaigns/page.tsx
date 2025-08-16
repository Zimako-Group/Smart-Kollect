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
  Plus,
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

// Empty campaigns array for now - will be populated from database later
const campaigns: Campaign[] = [];

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
    <div className="w-full max-w-none py-6 space-y-6 px-6">
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
          {filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No campaigns found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {searchQuery ? "Try adjusting your search terms" : "Create your first campaign to get started"}
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
          )}
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
