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
import { Users, BarChart3, CheckCircle, Clock, FileText, ArrowLeft, UserPlus, Shield, UserCheck, UserX } from "lucide-react";

export default function TeamManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("admins");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agents, setAgents] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
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

  // Function to fetch users from Supabase and separate admins/agents
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        // Log all users for debugging
        console.log('All users from API:', data.users);
        
        // Separate admins and agents
        const adminUsers = data.users
          .filter((user: Profile) => {
            return user.role === 'admin' && user.full_name && user.email;
          })
          .sort((a: Profile, b: Profile) => 
            a.full_name.localeCompare(b.full_name)
          );

        const agentUsers = data.users
          .filter((user: Profile) => {
            const isAgent = (user.role === 'agent' || user.role === 'manager' || user.role === 'supervisor' || user.role === 'indigent clerk');
            return isAgent && user.full_name && user.email;
          })
          .sort((a: Profile, b: Profile) => 
            a.full_name.localeCompare(b.full_name)
          );
        
        console.log('Admin users:', adminUsers);
        console.log('Agent users:', agentUsers);
        setAdmins(adminUsers);
        setAgents(agentUsers);
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

  // Filter admins based on search and status
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      searchQuery === "" ||
      admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || admin.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter agents based on search and status
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      searchQuery === "" ||
      agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalAdmins: admins.length,
    activeAdmins: admins.filter(a => a.status === "active").length,
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === "active").length,
    inactiveUsers: [...admins, ...agents].filter(u => u.status === "inactive").length,
    onLeaveUsers: [...admins, ...agents].filter(u => u.status === "on leave").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-800"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Team Management</h1>
            <p className="text-sm text-slate-400">Manage administrators and collection agents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-800 hover:bg-slate-800/50"
              >
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Admins */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Admins</CardTitle>
            <div className="text-2xl font-bold text-slate-200">{stats.totalAdmins}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-purple-400">
              <Shield className="h-3 w-3 mr-1" />
              {stats.activeAdmins} active
            </div>
          </CardContent>
        </Card>

        {/* Active Admins */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Active Admins</CardTitle>
            <div className="text-2xl font-bold text-slate-200">{stats.activeAdmins}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-400">
              <UserCheck className="h-3 w-3 mr-1" />
              Online now
            </div>
          </CardContent>
        </Card>

        {/* Total Agents */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Agents</CardTitle>
            <div className="text-2xl font-bold text-slate-200">{stats.totalAgents}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-blue-400">
              <Users className="h-3 w-3 mr-1" />
              Collection team
            </div>
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Active Agents</CardTitle>
            <div className="text-2xl font-bold text-slate-200">{stats.activeAgents}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-emerald-400">
              <UserCheck className="h-3 w-3 mr-1" />
              Working
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Inactive</CardTitle>
            <div className="text-2xl font-bold text-slate-200">{stats.inactiveUsers}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-400">
              <UserX className="h-3 w-3 mr-1" />
              Not active
            </div>
          </CardContent>
        </Card>

        {/* On Leave */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">On Leave</CardTitle>
            <div className="text-2xl font-bold text-slate-200">{stats.onLeaveUsers}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-amber-400">
              <Clock className="h-3 w-3 mr-1" />
              Temporary
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-200">Team Management</CardTitle>
          <div className="text-sm text-slate-400">
            Manage {stats.totalAdmins + stats.totalAgents} team members across administrators and agents
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="admins" className="data-[state=active]:bg-slate-700">
                <Shield className="h-4 w-4 mr-2" />
                Administrators ({stats.totalAdmins})
              </TabsTrigger>
              <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700">
                <Users className="h-4 w-4 mr-2" />
                Collection Agents ({stats.totalAgents})
              </TabsTrigger>
            </TabsList>

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={`Search ${activeTab === 'admins' ? 'administrators' : 'agents'}...`}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddAgentDialogOpen} onOpenChange={setIsAddAgentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add {activeTab === 'admins' ? 'Admin' : 'Agent'}
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {/* Admins Tab Content */}
            <TabsContent value="admins" className="mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  <span className="ml-2 text-slate-400">Loading administrators...</span>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No administrators found</p>
                  <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Administrator</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-300">Last Active</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-purple-400" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-200">{admin.full_name}</div>
                                <div className="text-sm text-slate-400">Administrator</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-300">{admin.email}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">
                              {admin.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              admin.status === 'active' 
                                ? 'bg-green-600/20 text-green-400 border-green-600/30'
                                : admin.status === 'inactive'
                                ? 'bg-red-600/20 text-red-400 border-red-600/30'
                                : 'bg-amber-600/20 text-amber-400 border-amber-600/30'
                            }`}>
                              {admin.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-sm">
                            {admin.updated_at ? new Date(admin.updated_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-700 hover:bg-slate-700"
                                title="View Details"
                              >
                                <User className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-700 hover:bg-slate-700"
                                title="Edit Admin"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Agents Tab Content */}
            <TabsContent value="agents" className="mt-6">
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


      </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
