'use client';

import { useState } from 'react';
import { Settings, Database, Shield, Bell, Mail, Globe, Server, Key, AlertTriangle, Save, RefreshCw, Download, Upload, Clock, Zap, HardDrive, Cpu, Activity, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SystemPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [apiRateLimit, setApiRateLimit] = useState('1000');
  const [sessionTimeout, setSessionTimeout] = useState('30');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-gray-400 mt-1">Configure global system settings and preferences</p>
      </div>

      {/* System Status Alert */}
      <Alert className="bg-green-500/10 border-green-500/50">
        <Activity className="w-4 h-4 text-green-400" />
        <AlertDescription className="text-green-300">
          System is running normally. All services are operational.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gray-800/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                General Configuration
              </CardTitle>
              <CardDescription>Basic system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>System Name</Label>
                  <Input defaultValue="Smart-Kollect" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label>System URL</Label>
                  <Input defaultValue="https://smartkollect.co.za" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                      <SelectItem value="zu">Zulu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="africa/johannesburg">
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africa/johannesburg">Africa/Johannesburg</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">Maintenance Mode</Label>
                    <p className="text-sm text-gray-400">Enable maintenance mode to prevent user access</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>

                {maintenanceMode && (
                  <div className="space-y-2">
                    <Label>Maintenance Message</Label>
                    <Textarea 
                      placeholder="System is under maintenance. Please check back later."
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-400">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input 
                      type="number" 
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="bg-gray-800 border-gray-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Expiry (days)</Label>
                    <Input type="number" defaultValue="90" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input type="number" defaultValue="5" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lockout Duration (minutes)</Label>
                    <Input type="number" defaultValue="15" className="bg-gray-800 border-gray-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>IP Whitelist (one per line)</Label>
                  <Textarea 
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    className="bg-gray-800 border-gray-700 font-mono text-sm"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Database Configuration
              </CardTitle>
              <CardDescription>Manage database connections and backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Database Size</span>
                      <Badge className="bg-blue-500/20 text-blue-300">2.4 GB</Badge>
                    </div>
                    <Progress value={24} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">24% of 10 GB limit</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Active Connections</span>
                      <Badge className="bg-green-500/20 text-green-300">45 / 100</Badge>
                    </div>
                    <Progress value={45} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">45% connection pool used</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">Automatic Backups</Label>
                    <p className="text-sm text-gray-400">Enable daily automatic database backups</p>
                  </div>
                  <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                </div>

                {autoBackup && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Backup Schedule</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Retention Period</Label>
                      <Select defaultValue="30">
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Download className="w-4 h-4 mr-2" />
                    Backup Now
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Restore Backup
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Recent Backups</Label>
                <div className="space-y-2">
                  {['2024-03-20 02:00:00', '2024-03-19 02:00:00', '2024-03-18 02:00:00'].map((date) => (
                    <div key={date} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <HardDrive className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-300">Success</Badge>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Email Configuration
              </CardTitle>
              <CardDescription>Configure email service and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-400">Enable system email notifications</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input defaultValue="smtp.gmail.com" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input defaultValue="587" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input defaultValue="noreply@smartkollect.co.za" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input type="password" placeholder="••••••••" className="bg-gray-800 border-gray-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>From Address</Label>
                  <Input defaultValue="Smart-Kollect <noreply@smartkollect.co.za>" className="bg-gray-800 border-gray-700" />
                </div>

                <div className="space-y-2">
                  <Label>Admin Email Addresses (comma separated)</Label>
                  <Input 
                    defaultValue="admin@smartkollect.co.za, support@smartkollect.co.za" 
                    className="bg-gray-800 border-gray-700" 
                  />
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                API Configuration
              </CardTitle>
              <CardDescription>Manage API settings and rate limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>API Rate Limit (requests/hour)</Label>
                  <Input 
                    type="number" 
                    value={apiRateLimit}
                    onChange={(e) => setApiRateLimit(e.target.value)}
                    className="bg-gray-800 border-gray-700" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Timeout (seconds)</Label>
                  <Input type="number" defaultValue="30" className="bg-gray-800 border-gray-700" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>API Keys</Label>
                <div className="space-y-2">
                  {['Production API Key', 'Development API Key', 'Testing API Key'].map((key) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{key}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-300">Active</Badge>
                        <Button size="sm" variant="ghost">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Generate New API Key
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Allowed Origins (one per line)</Label>
                <Textarea 
                  defaultValue="https://smartkollect.co.za&#10;https://*.smartkollect.co.za"
                  className="bg-gray-800 border-gray-700 font-mono text-sm"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Settings */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                System Monitoring
              </CardTitle>
              <CardDescription>Configure monitoring and alerting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">CPU Usage</span>
                      <Cpu className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">45%</div>
                    <Progress value={45} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Memory Usage</span>
                      <HardDrive className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">6.2 GB</div>
                    <Progress value={62} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Disk Usage</span>
                      <Server className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">78%</div>
                    <Progress value={78} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Label>Alert Thresholds</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">CPU Alert Threshold (%)</Label>
                    <Input type="number" defaultValue="80" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Memory Alert Threshold (%)</Label>
                    <Input type="number" defaultValue="85" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Disk Alert Threshold (%)</Label>
                    <Input type="number" defaultValue="90" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Error Rate Threshold (%)</Label>
                    <Input type="number" defaultValue="5" className="bg-gray-800 border-gray-700" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Recent Alerts</Label>
                <div className="space-y-2">
                  <Alert className="bg-yellow-500/10 border-yellow-500/50">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      High memory usage detected (85%) - 2 hours ago
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-blue-500/10 border-blue-500/50">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      Database backup completed successfully - 6 hours ago
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
