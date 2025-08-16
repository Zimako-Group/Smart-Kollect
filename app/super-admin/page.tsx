"use client";

import React from 'react';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp,
  Server,
  Shield,
  Globe,
  Zap,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const stats = [
  {
    name: 'Total Tenants',
    value: '12',
    change: '+2',
    changeType: 'increase',
    icon: Building2,
    color: 'from-purple-600 to-indigo-600',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600'
  },
  {
    name: 'Active Users',
    value: '248',
    change: '+18',
    changeType: 'increase',
    icon: Users,
    color: 'from-blue-600 to-cyan-600',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600'
  },
  {
    name: 'Total Revenue',
    value: 'R2.4M',
    change: '+12%',
    changeType: 'increase',
    icon: DollarSign,
    color: 'from-green-600 to-emerald-600',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-600'
  },
  {
    name: 'System Uptime',
    value: '99.9%',
    change: '0%',
    changeType: 'neutral',
    icon: Activity,
    color: 'from-orange-600 to-red-600',
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-600'
  }
];

const tenants = [
  { 
    id: 1, 
    name: 'Mahikeng Municipality', 
    subdomain: 'mahikeng',
    users: 45, 
    status: 'active',
    revenue: 'R450K',
    health: 98
  },
  { 
    id: 2, 
    name: 'OBS Corporation', 
    subdomain: 'obs',
    users: 10, 
    status: 'active',
    revenue: 'R120K',
    health: 95
  },
  { 
    id: 3, 
    name: 'City Power Johannesburg', 
    subdomain: 'citypower',
    users: 78, 
    status: 'active',
    revenue: 'R890K',
    health: 92
  },
  { 
    id: 4, 
    name: 'Ekurhuleni Metro', 
    subdomain: 'ekurhuleni',
    users: 56, 
    status: 'pending',
    revenue: 'R0',
    health: 0
  }
];

const systemMetrics = [
  { name: 'Database Size', value: '45.2 GB', max: '100 GB', percentage: 45 },
  { name: 'API Calls Today', value: '1.2M', max: '5M', percentage: 24 },
  { name: 'Storage Used', value: '234 GB', max: '500 GB', percentage: 47 },
  { name: 'Bandwidth Used', value: '780 GB', max: '1 TB', percentage: 78 }
];

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Globe className="h-10 w-10 text-purple-400" />
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-purple-300">Global system overview and tenant management</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-gray-900/50 backdrop-blur-xl border-purple-800/30 hover:border-purple-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} backdrop-blur-sm`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <Badge 
                  variant={stat.changeType === 'increase' ? 'default' : 'secondary'}
                  className={`${
                    stat.changeType === 'increase' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {stat.changeType === 'increase' && <ArrowUp className="h-3 w-3 mr-1" />}
                  {stat.changeType === 'decrease' && <ArrowDown className="h-3 w-3 mr-1" />}
                  {stat.change}
                </Badge>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-purple-300 text-sm">{stat.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tenant Overview */}
        <Card className="lg:col-span-2 bg-gray-900/50 backdrop-blur-xl border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              Active Tenants
            </CardTitle>
            <CardDescription className="text-purple-300">
              Manage and monitor all tenant organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl bg-purple-900/20 border border-purple-800/30 hover:bg-purple-900/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      {tenant.status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{tenant.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-purple-400">{tenant.subdomain}.smartkollect.co.za</span>
                        <Badge variant="outline" className="text-xs border-purple-700 text-purple-300">
                          {tenant.users} users
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{tenant.revenue}</p>
                      <p className="text-xs text-purple-400">Monthly</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-white">{tenant.health}%</div>
                      <Progress value={tenant.health} className="w-16 h-1.5 mt-1" />
                    </div>
                    <Button size="sm" variant="ghost" className="text-purple-400 hover:text-white hover:bg-purple-900/50">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              View All Tenants
            </Button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-gray-900/50 backdrop-blur-xl border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              System Health
            </CardTitle>
            <CardDescription className="text-purple-300">
              Real-time system performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">{metric.name}</span>
                    <span className="text-sm font-semibold text-white">{metric.value}</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={metric.percentage} 
                      className="h-2"
                    />
                    <span className="absolute right-0 -bottom-4 text-xs text-purple-400">
                      {metric.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-800/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="font-semibold text-green-400">All Systems Operational</span>
              </div>
              <p className="text-xs text-green-300">Last checked: 2 minutes ago</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-900/50 backdrop-blur-xl border-purple-800/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-24 flex-col gap-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/30">
              <Building2 className="h-6 w-6 text-purple-400" />
              <span className="text-xs">Add Tenant</span>
            </Button>
            <Button className="h-24 flex-col gap-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/30">
              <Users className="h-6 w-6 text-blue-400" />
              <span className="text-xs">Manage Users</span>
            </Button>
            <Button className="h-24 flex-col gap-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/30">
              <Database className="h-6 w-6 text-green-400" />
              <span className="text-xs">Database Backup</span>
            </Button>
            <Button className="h-24 flex-col gap-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/30">
              <Shield className="h-6 w-6 text-red-400" />
              <span className="text-xs">Security Audit</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
