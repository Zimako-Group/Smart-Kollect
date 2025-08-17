"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Settings,
  Globe,
  DollarSign,
  Activity,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Shield,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'pending' | 'suspended' | 'trial';
  plan: 'starter' | 'professional' | 'enterprise';
  users: number;
  maxUsers: number;
  storage: number;
  maxStorage: number;
  monthlyRevenue: number;
  totalRevenue: number;
  createdAt: string;
  lastActive: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  features: string[];
  health: number;
}

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Mahikeng Municipality',
    subdomain: 'mahikeng',
    status: 'active',
    plan: 'enterprise',
    users: 45,
    maxUsers: 100,
    storage: 23.5,
    maxStorage: 50,
    monthlyRevenue: 450000,
    totalRevenue: 5400000,
    createdAt: '2023-01-15',
    lastActive: '2 minutes ago',
    contactName: 'John Doe',
    contactEmail: 'john@mahikeng.gov.za',
    contactPhone: '+27 18 381 0000',
    address: 'Mahikeng, North West, South Africa',
    features: ['SMS Integration', 'AI Analysis', 'Custom Reports', 'API Access'],
    health: 98
  },
  {
    id: '2',
    name: 'OBS Corporation',
    subdomain: 'obs',
    status: 'active',
    plan: 'professional',
    users: 10,
    maxUsers: 25,
    storage: 5.2,
    maxStorage: 10,
    monthlyRevenue: 120000,
    totalRevenue: 360000,
    createdAt: '2024-03-20',
    lastActive: '1 hour ago',
    contactName: 'Jane Smith',
    contactEmail: 'jane@obs.co.za',
    contactPhone: '+27 11 234 5678',
    address: 'Johannesburg, Gauteng, South Africa',
    features: ['SMS Integration', 'Basic Reports'],
    health: 95
  },
  {
    id: '3',
    name: 'City Power Johannesburg',
    subdomain: 'citypower',
    status: 'trial',
    plan: 'enterprise',
    users: 78,
    maxUsers: 200,
    storage: 45.8,
    maxStorage: 100,
    monthlyRevenue: 0,
    totalRevenue: 0,
    createdAt: '2024-06-01',
    lastActive: '5 minutes ago',
    contactName: 'Peter Johnson',
    contactEmail: 'peter@citypower.co.za',
    contactPhone: '+27 11 490 7000',
    address: 'Johannesburg, Gauteng, South Africa',
    features: ['SMS Integration', 'AI Analysis', 'Custom Reports', 'API Access', 'White Label'],
    health: 92
  }
];

const planColors = {
  starter: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  professional: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  enterprise: 'bg-purple-500/20 text-gray-400 border-gray-500/30'
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  trial: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || tenant.plan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    revenue: tenants.reduce((sum, t) => sum + t.monthlyRevenue, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Building2 className="h-10 w-10 text-blue-400" />
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
              <p className="text-gray-400">Manage all tenant organizations and subscriptions</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Tenant</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Set up a new tenant organization with their subdomain and plan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Organization Name</Label>
                    <Input id="name" placeholder="e.g., City Power" className="bg-gray-800/20 border-gray-700 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="subdomain" className="text-gray-300">Subdomain</Label>
                    <div className="flex">
                      <Input id="subdomain" placeholder="citypower" className="bg-gray-800/20 border-gray-700 text-white rounded-r-none" />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-700 bg-gray-800/30 text-gray-300 text-sm">
                        .smartkollect.co.za
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan" className="text-gray-300">Subscription Plan</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-800/20 border-gray-700 text-white">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="starter">Starter - R5,000/month</SelectItem>
                        <SelectItem value="professional">Professional - R15,000/month</SelectItem>
                        <SelectItem value="enterprise">Enterprise - R50,000/month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="trial" className="text-gray-300">Trial Period</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-800/20 border-gray-700 text-white">
                        <SelectValue placeholder="Select trial period" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="none">No Trial</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact" className="text-gray-300">Primary Contact</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Contact Name" className="bg-gray-800/20 border-gray-700 text-white" />
                    <Input placeholder="Email Address" type="email" className="bg-gray-800/20 border-gray-700 text-white" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="features" className="text-gray-300">Features & Modules</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20">
                      <span className="text-sm text-gray-300">SMS Integration</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20">
                      <span className="text-sm text-gray-300">AI Analysis</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20">
                      <span className="text-sm text-gray-300">Custom Reports</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20">
                      <span className="text-sm text-gray-300">API Access</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-700 text-gray-400">
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700">
                  Create Tenant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-700/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-8 w-8 text-gray-400" />
              <Badge className="bg-purple-500/20 text-gray-400 border-gray-500/30">
                Total
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
            <p className="text-gray-400 text-sm">Total Tenants</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-700/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.active}</h3>
            <p className="text-gray-400 text-sm">Active Tenants</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-700/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-orange-400" />
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Trial
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.trial}</h3>
            <p className="text-gray-400 text-sm">Trial Accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-700/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-green-400" />
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                MRR
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-white">R{(stats.revenue / 1000).toFixed(0)}K</h3>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-700/30 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/20 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-gray-800/20 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[180px] bg-gray-800/20 border-gray-700 text-white">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="bg-gray-900/50 backdrop-blur-xl border-gray-700/30 hover:border-gray-600/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gray-600 to-slate-600 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    {tenant.status === 'active' && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-900" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{tenant.name}</h3>
                      <Badge className={statusColors[tenant.status]}>
                        {tenant.status}
                      </Badge>
                      <Badge className={planColors[tenant.plan]}>
                        {tenant.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {tenant.subdomain}.smartkollect.co.za
                      </span>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tenant.users}/{tenant.maxUsers} users
                      </span>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {tenant.storage}/{tenant.maxStorage} GB
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">R{(tenant.monthlyRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-400">per month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white mb-1">{tenant.health}%</div>
                    <Progress value={tenant.health} className="w-20 h-2" />
                    <p className="text-xs text-gray-400 mt-1">Health</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800/50">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
                      <DropdownMenuLabel className="text-gray-300">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        className="text-gray-100 hover:bg-gray-800 hover:text-white"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-100 hover:bg-gray-800 hover:text-white">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Tenant
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-100 hover:bg-gray-800 hover:text-white">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem className="text-red-400 hover:bg-red-900/20 hover:text-red-300">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Tenant
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Tenant Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-700">
          {selectedTenant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  {selectedTenant.name}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Tenant details and configuration
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="bg-gray-800/20 border-gray-700">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Subdomain</p>
                      <p className="text-white">{selectedTenant.subdomain}.smartkollect.co.za</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Status</p>
                      <Badge className={statusColors[selectedTenant.status]}>
                        {selectedTenant.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Contact Name</p>
                      <p className="text-white">{selectedTenant.contactName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Contact Email</p>
                      <p className="text-white">{selectedTenant.contactEmail}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{selectedTenant.contactPhone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="text-white">{selectedTenant.address}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="usage" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Users</span>
                        <span className="text-sm text-white">{selectedTenant.users} / {selectedTenant.maxUsers}</span>
                      </div>
                      <Progress value={(selectedTenant.users / selectedTenant.maxUsers) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Storage</span>
                        <span className="text-sm text-white">{selectedTenant.storage} GB / {selectedTenant.maxStorage} GB</span>
                      </div>
                      <Progress value={(selectedTenant.storage / selectedTenant.maxStorage) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">System Health</span>
                        <span className="text-sm text-white">{selectedTenant.health}%</span>
                      </div>
                      <Progress value={selectedTenant.health} className="h-2" />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="billing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Current Plan</p>
                      <Badge className={planColors[selectedTenant.plan]}>
                        {selectedTenant.plan}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Monthly Revenue</p>
                      <p className="text-white font-semibold">R{selectedTenant.monthlyRevenue.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Total Revenue</p>
                      <p className="text-white font-semibold">R{selectedTenant.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="text-white">{selectedTenant.createdAt}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="features" className="space-y-4">
                  <div className="space-y-2">
                    {selectedTenant.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/20">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
