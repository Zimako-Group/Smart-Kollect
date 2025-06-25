"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { supabaseAuth } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/lib/supabaseClient";
import {
  AlertCircle,
  ArrowUpDown,
  Briefcase,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Users, BarChart3, CheckCircle, Clock, FileText } from "lucide-react";

// Types for jobs
interface Job {
  id: string;
  title: string;
  debtor: string;
  amount: number;
  priority: "high" | "medium" | "low";
  status: "pending" | "in progress" | "completed";
  dueDate: string;
  assignedTo?: string;
}

// Mock jobs data (we'll implement real jobs later)
const mockJobs: Job[] = [
  {
    id: "j1",
    title: "High-value recovery - ABC Corp",
    debtor: "ABC Corporation",
    amount: 125000,
    priority: "high",
    status: "in progress",
    dueDate: "2025-03-30",
    assignedTo: "1",
  },
  {
    id: "j2",
    title: "Small business loan - Johnson Retail",
    debtor: "Johnson Retail LLC",
    amount: 45000,
    priority: "medium",
    status: "pending",
    dueDate: "2025-04-15",
  },
  {
    id: "j3",
    title: "Personal loan recovery - Smith",
    debtor: "John Smith",
    amount: 12500,
    priority: "low",
    status: "pending",
    dueDate: "2025-04-10",
  },
  {
    id: "j4",
    title: "Corporate debt - XYZ Industries",
    debtor: "XYZ Industries",
    amount: 230000,
    priority: "high",
    status: "pending",
    dueDate: "2025-03-25",
  },
];

export default function TeamManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("agents");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "agent" as const,
    status: "active" as "active" | "inactive" | "on leave",
  });
  const [isAddAgentDialogOpen, setIsAddAgentDialogOpen] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);

  // Function to fetch agents from Supabase
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        // Log all users for debugging
        console.log('All users from API:', data.users);
        
        // Filter users with valid roles and sort by name
        const filteredAgents = data.users
          .filter((user: Profile) => {
            // Check if the user has a valid role
            const isValid = (user.role === 'admin' || user.role === 'agent' || user.role === 'manager' || user.role === 'supervisor' || user.role === 'indigent clerk');
            
            // Log each user's role status for debugging
            console.log(`User ${user.email || user.id}: role=${user.role}, isValid=${isValid}`);
            
            return isValid;
          })
          .sort((a: Profile, b: Profile) => 
            a.full_name.localeCompare(b.full_name)
          );
        
        console.log('Filtered agents:', filteredAgents);
        setAgents(filteredAgents);
      } else {
        console.error('Error fetching agents:', data.error);
        toast({
          title: "Error",
          description: data.error || "Failed to fetch agents.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Function to create a new agent
  const handleCreateAgent = async () => {
    // Validate form
    if (!newAgentData.full_name || !newAgentData.email || !newAgentData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAgent(true);
    try {
      // Use the API route instead of direct Supabase call
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newAgentData.email,
          password: newAgentData.password,
          userData: {
            full_name: newAgentData.full_name,
            role: newAgentData.role,
            status: newAgentData.status,
          }
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // First close the dialog
        setIsAddAgentDialogOpen(false);
        
        // Reset form
        setNewAgentData({
          full_name: "",
          email: "",
          password: "",
          role: "agent",
          status: "active",
        });
        
        // Then show success toast
        toast({
          title: "Success",
          description: `Agent ${newAgentData.full_name} created successfully.`,
          variant: "default",
        });
        
        // Refresh agent list
        fetchAgents();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create agent.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  // Function to update agent status
  const handleUpdateStatus = async (agentId: string, newStatus: 'active' | 'inactive' | 'on leave') => {
    try {
      // Use the API route instead of direct Supabase call
      const response = await fetch(`/api/users?id=${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update local state
        setAgents(agents.map(agent => 
          agent.id === agentId ? { ...agent, status: newStatus } : agent
        ));
        
        toast({
          title: "Status Updated",
          description: `Agent status changed to ${newStatus}.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Function to update agent role
  const handleUpdateRole = async (agentId: string, agentName: string, newRole: 'admin' | 'agent' | 'manager' | 'supervisor' | 'indigent clerk') => {
    // Confirm before promoting to admin
    if (newRole === 'admin' && !window.confirm(`Are you sure you want to promote ${agentName} to admin? This will give them full access to the system.`)) {
      return;
    }
    
    try {
      // Use the API route to update the role
      const response = await fetch(`/api/users?id=${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Role Updated",
          description: `${agentName}'s role has been updated to ${newRole}.`,
        });
        
        // Refresh agent list
        fetchAgents();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update agent role.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Function to delete an agent
  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    // Confirm before deletion
    if (!window.confirm(`Are you sure you want to delete ${agentName}'s profile? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // Use the API route to delete the user
      const response = await fetch(`/api/users?id=${agentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Immediately remove agent from local state to update UI
        setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
        
        toast({
          title: "Profile Deleted",
          description: `${agentName}'s profile has been deleted successfully.`,
        });
        
        // Force a refresh of the agent list after a short delay
        setTimeout(() => {
          fetchAgents();
        }, 500);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete profile.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Calculate performance metrics
  const averageCollectionRate = agents.length > 0
    ? Math.round(
        agents.reduce(
          (sum, agent) => sum + (agent.performance?.collectionRate || 0),
          0
        ) / agents.length
      )
    : 0;

  // Filter agents based on search and status
  const filteredAgents = agents.filter((agent) => {
    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your debt collection team, track performance, and assign jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Team Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Team Broadcast</DialogTitle>
                <DialogDescription>
                  Send a message to all team members or a selected group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="recipients" className="text-sm font-medium">
                    Recipients
                  </label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Members</SelectItem>
                      <SelectItem value="active">Active Agents Only</SelectItem>
                      <SelectItem value="senior">Senior Agents Only</SelectItem>
                      <SelectItem value="junior">Junior Agents Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="Message subject" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBroadcastDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => {
                  toast({
                    title: "Broadcast Sent",
                    description: "Your message has been sent to the team.",
                  });
                  setIsBroadcastDialogOpen(false);
                }}>Send Broadcast</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog 
            open={isAddAgentDialogOpen} 
            onOpenChange={(open) => {
              setIsAddAgentDialogOpen(open);
              // If dialog is closing, reset the form
              if (!open) {
                setNewAgentData({
                  full_name: "",
                  email: "",
                  password: "",
                  role: "agent",
                  status: "active",
                });
                setIsCreatingAgent(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
                <DialogDescription>
                  Create a new debt collection agent profile.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input 
                    id="name" 
                    placeholder="Full name" 
                    value={newAgentData.full_name}
                    onChange={(e) => setNewAgentData({...newAgentData, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Email address" 
                    value={newAgentData.email}
                    onChange={(e) => setNewAgentData({...newAgentData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Create password" 
                    value={newAgentData.password}
                    onChange={(e) => setNewAgentData({...newAgentData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select 
                    value={newAgentData.status} 
                    onValueChange={(value) => setNewAgentData({...newAgentData, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select 
                    value={newAgentData.role} 
                    onValueChange={(value) => setNewAgentData({...newAgentData, role: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="indigent clerk">Indigent Clerk</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Additional Notes
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddAgentDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateAgent} 
                  disabled={isCreatingAgent}
                >
                  {isCreatingAgent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreatingAgent ? "Creating..." : "Add Agent"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{agents.length}</div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {agents.filter((a) => a.status === "active").length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {averageCollectionRate}%
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="w-full h-2 mt-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${averageCollectionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {mockJobs.filter((j) => j.status !== "completed").length}
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {mockJobs.filter((j) => j.priority === "high" && j.status !== "completed").length} high priority
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="agents" className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading agents...</span>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No agents found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first agent to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Collection Rate
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Cases Resolved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium">
                            {agent.full_name.charAt(0)}
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium">{agent.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{agent.role}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          agent.status === "active"
                            ? "bg-green-500 hover:bg-green-600"
                            : agent.status === "inactive"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-yellow-500 hover:bg-yellow-600"
                        }
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {agent.performance?.collectionRate || 0}%
                        </div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${agent.performance?.collectionRate || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent.performance?.casesResolved || 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "View Profile",
                                description: `Viewing ${agent.full_name}'s profile`,
                              });
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Edit Profile",
                                description: `Editing ${agent.full_name}'s profile`,
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(agent.id, 'active')}
                            disabled={agent.status === 'active'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Set Active
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(agent.id, 'inactive')}
                            disabled={agent.status === 'inactive'}
                          >
                            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                            Set Inactive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(agent.id, 'on leave')}
                            disabled={agent.status === 'on leave'}
                          >
                            <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                            Set On Leave
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Role</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(agent.id, agent.full_name, 'admin')}
                            disabled={agent.role === 'admin'}
                          >
                            <User className="h-4 w-4 mr-2 text-green-500" />
                            Promote to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(agent.id, agent.full_name, 'indigent clerk')}
                            disabled={agent.role === 'indigent clerk'}
                          >
                            <FileText className="h-4 w-4 mr-2 text-purple-500" />
                            Set as Indigent Clerk
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(agent.id, agent.full_name, 'agent')}
                            disabled={agent.role === 'agent'}
                          >
                            <User className="h-4 w-4 mr-2 text-blue-500" />
                            Set as Agent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              handleDeleteAgent(agent.id, agent.full_name);
                            }}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Debtor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-medium">{job.title}</div>
                  </TableCell>
                  <TableCell>{job.debtor}</TableCell>
                  <TableCell>R{job.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        job.priority === "high"
                          ? "bg-red-500 hover:bg-red-600"
                          : job.priority === "medium"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }
                    >
                      {job.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        job.status === "completed"
                          ? "bg-green-500 hover:bg-green-600"
                          : job.status === "in progress"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(job.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {job.assignedTo ? (
                      agents.find((a) => a.id === job.assignedTo)?.full_name || "Unknown"
                    ) : (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {agents
                            .filter((a) => a.status === "active")
                            .map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
