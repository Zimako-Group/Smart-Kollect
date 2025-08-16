'use client';

import { useState } from 'react';
import { Search, Filter, UserPlus, MoreVertical, Mail, Phone, Shield, Activity, Calendar, ChevronDown, X, Save, Trash2, Edit2, Ban, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// Mock data for users
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@mahikeng.smartkollect.co.za',
    phone: '+27 82 123 4567',
    role: 'admin',
    tenant: 'Mahikeng Municipality',
    tenantId: 'mahikeng',
    status: 'active',
    lastActive: '2 hours ago',
    createdAt: '2024-01-15',
    loginCount: 245,
    permissions: ['view_dashboard', 'manage_debtors', 'make_calls', 'view_reports', 'manage_users', 'manage_settings'],
    avatar: 'JD'
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah.smith@obs.smartkollect.co.za',
    phone: '+27 83 234 5678',
    role: 'agent',
    tenant: 'OBS Collections',
    tenantId: 'obs',
    status: 'active',
    lastActive: '5 minutes ago',
    createdAt: '2024-02-20',
    loginCount: 156,
    permissions: ['view_dashboard', 'manage_debtors', 'make_calls'],
    avatar: 'SS'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.j@mahikeng.smartkollect.co.za',
    phone: '+27 84 345 6789',
    role: 'manager',
    tenant: 'Mahikeng Municipality',
    tenantId: 'mahikeng',
    status: 'inactive',
    lastActive: '3 days ago',
    createdAt: '2024-01-20',
    loginCount: 89,
    permissions: ['view_dashboard', 'manage_debtors', 'view_reports'],
    avatar: 'MJ'
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily.brown@obs.smartkollect.co.za',
    phone: '+27 85 456 7890',
    role: 'supervisor',
    tenant: 'OBS Collections',
    tenantId: 'obs',
    status: 'active',
    lastActive: '1 hour ago',
    createdAt: '2024-03-01',
    loginCount: 203,
    permissions: ['view_dashboard', 'manage_debtors', 'make_calls', 'view_reports'],
    avatar: 'EB'
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.w@mahikeng.smartkollect.co.za',
    phone: '+27 86 567 8901',
    role: 'agent',
    tenant: 'Mahikeng Municipality',
    tenantId: 'mahikeng',
    status: 'suspended',
    lastActive: '1 week ago',
    createdAt: '2024-02-10',
    loginCount: 45,
    permissions: ['view_dashboard', 'manage_debtors'],
    avatar: 'DW'
  }
];

const roleColors = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  agent: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  manager: 'bg-green-500/20 text-green-300 border-green-500/30',
  supervisor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'super_admin': 'bg-red-500/20 text-red-300 border-red-500/30'
};

const statusColors = {
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  suspended: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = selectedTenant === 'all' || user.tenantId === selectedTenant;
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesTenant && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-400 mt-1">Manage users across all tenants</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="Enter full name" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="user@tenant.smartkollect.co.za" className="bg-gray-800 border-gray-700" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+27 XX XXX XXXX" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mahikeng">Mahikeng Municipality</SelectItem>
                      <SelectItem value="obs">OBS Collections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Password</Label>
                  <Input type="password" placeholder="Enter initial password" className="bg-gray-800 border-gray-700" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['View Dashboard', 'Manage Debtors', 'Make Calls', 'View Reports', 'Manage Users', 'Manage Settings'].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Switch />
                      <Label className="text-sm font-normal">{permission}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Send welcome email to user</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Create User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                <SelectItem value="mahikeng">Mahikeng Municipality</SelectItem>
                <SelectItem value="obs">OBS Collections</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-purple-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                    {user.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedUser(user);
                      setShowUserDialog(true);
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Ban className="w-4 h-4 mr-2" />
                      Suspend User
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Role</span>
                  <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                    {user.role}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                    {user.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Tenant</span>
                  <span className="text-sm text-gray-300">{user.tenant}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Last Active</span>
                  <span className="text-sm text-gray-300">{user.lastActive}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Logins</span>
                  <span className="text-sm text-gray-300">{user.loginCount}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{user.createdAt}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-3xl bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={selectedUser.name} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={selectedUser.email} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={selectedUser.phone} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select defaultValue={selectedUser.role}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tenant</Label>
                    <Input value={selectedUser.tenant} disabled className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select defaultValue={selectedUser.status}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Add notes about this user..." 
                    className="bg-gray-800 border-gray-700 min-h-[100px]"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm">Last Login</span>
                    <span className="text-sm text-gray-400">{selectedUser.lastActive}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm">Total Logins</span>
                    <span className="text-sm text-gray-400">{selectedUser.loginCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm">Account Created</span>
                    <span className="text-sm text-gray-400">{selectedUser.createdAt}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm">Failed Login Attempts</span>
                    <span className="text-sm text-gray-400">2</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {['View Dashboard', 'Manage Debtors', 'Make Calls', 'View Reports', 'Manage Users', 'Manage Settings'].map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <Label className="text-sm font-normal">{permission}</Label>
                      <Switch defaultChecked={selectedUser.permissions.includes(permission.toLowerCase().replace(' ', '_'))} />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="sessions" className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-400">Chrome on Windows</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300">Active</Badge>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>IP: 192.168.1.100</p>
                      <p>Started: 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg opacity-60">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Previous Session</p>
                        <p className="text-sm text-gray-400">Safari on iPhone</p>
                      </div>
                      <Badge className="bg-gray-500/20 text-gray-300">Expired</Badge>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>IP: 192.168.1.50</p>
                      <p>Duration: 45 minutes</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
