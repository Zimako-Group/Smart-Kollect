"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Globe, 
  UserCheck, 
  UserX, 
  Clock, 
  RefreshCw, 
  Download,
  Settings,
  Zap,
  Database,
  Server,
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'system_access' | 'data_export';
  user: string;
  email: string;
  timestamp: string;
  ip: string;
  location: string;
  status: 'success' | 'failed' | 'blocked';
  details: string;
}

interface SecurityMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [autoLockout, setAutoLockout] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  const securityMetrics: SecurityMetric[] = [
    {
      title: 'Active Sessions',
      value: '24',
      change: '+3 from yesterday',
      trend: 'up',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Failed Logins (24h)',
      value: '7',
      change: '-12 from yesterday',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-orange-400'
    },
    {
      title: 'Security Score',
      value: '94%',
      change: '+2% this week',
      trend: 'up',
      icon: Shield,
      color: 'text-green-400'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      change: 'Last 30 days',
      trend: 'stable',
      icon: Server,
      color: 'text-gray-400'
    }
  ];

  const mockSecurityEvents: SecurityEvent[] = [
    {
      id: '1',
      type: 'login',
      user: 'John Smith',
      email: 'john@smartkollect.co.za',
      timestamp: '2025-08-17T07:30:00Z',
      ip: '192.168.1.100',
      location: 'Johannesburg, ZA',
      status: 'success',
      details: 'Successful admin login'
    },
    {
      id: '2',
      type: 'failed_login',
      user: 'Unknown',
      email: 'attacker@malicious.com',
      timestamp: '2025-08-17T06:45:00Z',
      ip: '45.123.456.789',
      location: 'Unknown',
      status: 'blocked',
      details: 'Multiple failed login attempts - IP blocked'
    },
    {
      id: '3',
      type: 'permission_change',
      user: 'Sarah Johnson',
      email: 'sarah@smartkollect.co.za',
      timestamp: '2025-08-17T05:15:00Z',
      ip: '192.168.1.105',
      location: 'Cape Town, ZA',
      status: 'success',
      details: 'User role updated from agent to admin'
    },
    {
      id: '4',
      type: 'data_export',
      user: 'Mike Wilson',
      email: 'mike@smartkollect.co.za',
      timestamp: '2025-08-17T04:20:00Z',
      ip: '192.168.1.110',
      location: 'Durban, ZA',
      status: 'success',
      details: 'Customer data export - 500 records'
    },
    {
      id: '5',
      type: 'system_access',
      user: 'Admin User',
      email: 'admin@smartkollect.co.za',
      timestamp: '2025-08-17T03:30:00Z',
      ip: '192.168.1.101',
      location: 'Pretoria, ZA',
      status: 'success',
      details: 'Database maintenance access'
    }
  ];

  useEffect(() => {
    // Simulate loading security data
    setTimeout(() => {
      setSecurityEvents(mockSecurityEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
        return UserCheck;
      case 'logout':
        return UserX;
      case 'failed_login':
        return XCircle;
      case 'permission_change':
        return Settings;
      case 'system_access':
        return Database;
      case 'data_export':
        return Download;
      default:
        return Activity;
    }
  };

  const getEventColor = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'blocked':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleSaveSecuritySettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Security settings updated successfully');
    }, 2000);
  };

  const handleGenerateSecurityReport = () => {
    toast.success('Security report generated and downloaded');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="text-gray-100">Loading security data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-gray-400" />
            Security Center
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and manage system security across all tenants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleGenerateSecurityReport}
            className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Security Report
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {securityMetrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">{metric.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{metric.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-800/30 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900/30 border border-gray-700/30">
          <TabsTrigger value="events" className="data-[state=active]:bg-gray-600">
            Security Events
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-600">
            Settings
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-gray-600">
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-gray-600">
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-400" />
                Recent Security Events
              </CardTitle>
              <CardDescription className="text-gray-400">
                Real-time security events and access logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => {
                  const EventIcon = getEventIcon(event.type);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/30 transition-colors"
                    >
                      <div className={`p-2 rounded-lg bg-gray-800/30 ${getEventColor(event.status)}`}>
                        <EventIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{event.user}</p>
                          <Badge 
                            variant={event.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300">{event.details}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span>{formatTimestamp(event.timestamp)}</span>
                          <span>{event.ip}</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gray-400" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-400">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch 
                    checked={twoFactorEnabled} 
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={loginAttempts}
                    onChange={(e) => setLoginAttempts(Number(e.target.value))}
                    className="bg-gray-800/20 border-gray-700/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    className="bg-gray-800/20 border-gray-700/30 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Auto Account Lockout</Label>
                    <p className="text-sm text-gray-400">Lock accounts after failed attempts</p>
                  </div>
                  <Switch 
                    checked={autoLockout} 
                    onCheckedChange={setAutoLockout}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">IP Whitelist</Label>
                  <Textarea
                    placeholder="Enter IP addresses or ranges (one per line)"
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                    className="bg-gray-800/20 border-gray-700/30 text-white min-h-[100px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Audit Logging</Label>
                    <p className="text-sm text-gray-400">Log all security events</p>
                  </div>
                  <Switch 
                    checked={auditLogging} 
                    onCheckedChange={setAuditLogging}
                  />
                </div>

                <Button 
                  onClick={handleSaveSecuritySettings}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-gray-400" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Database</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">API Services</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Authentication</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">File Storage</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-400">Warning</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-gray-400" />
                  Network Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Latency</span>
                    <span className="text-green-400">12ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Throughput</span>
                    <span className="text-green-400">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Active Connections</span>
                    <span className="text-white">247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Blocked IPs</span>
                    <span className="text-red-400">15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gray-400" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">CPU Usage</span>
                    <span className="text-green-400">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Memory Usage</span>
                    <span className="text-yellow-400">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Disk Usage</span>
                    <span className="text-green-400">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Response Time</span>
                    <span className="text-green-400">120ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                Compliance Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Security compliance and audit information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Security Standards</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/20">
                      <span className="text-gray-300">ISO 27001</span>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/20">
                      <span className="text-gray-300">SOC 2 Type II</span>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/20">
                      <span className="text-gray-300">GDPR Compliance</span>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/20">
                      <span className="text-gray-300">PCI DSS</span>
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Audit Information</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-gray-800/20">
                      <p className="text-sm text-gray-400">Last Security Audit</p>
                      <p className="text-white font-medium">March 15, 2025</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/20">
                      <p className="text-sm text-gray-400">Next Scheduled Audit</p>
                      <p className="text-white font-medium">September 15, 2025</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/20">
                      <p className="text-sm text-gray-400">Compliance Score</p>
                      <p className="text-green-400 font-medium">94/100</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
