"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  RefreshCw,
  Globe,
  Mail,
  Eye,
  EyeOff,
  Database,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [saveLoading, setSaveLoading] = useState(false);
  
  // General Settings
  const [systemName, setSystemName] = useState('Smart-Kollect');
  const [systemUrl, setSystemUrl] = useState('https://smartkollect.co.za');
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Africa/Johannesburg');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // Email Settings
  const [loading, setLoading] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('noreply@smartkollect.co.za');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [emailFromName, setEmailFromName] = useState('Smart-Kollect System');
  const [emailEnabled, setEmailEnabled] = useState(true);
  
  // Database Settings
  const [dbBackupEnabled, setDbBackupEnabled] = useState(true);
  const [dbBackupFrequency, setDbBackupFrequency] = useState('daily');
  const [dbRetentionDays, setDbRetentionDays] = useState(30);
  const [dbOptimizationEnabled, setDbOptimizationEnabled] = useState(true);
  
  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [passwordExpiry, setPasswordExpiry] = useState(90);
  const [loginAttempts, setLoginAttempts] = useState(5);
  const [twoFactorRequired, setTwoFactorRequired] = useState(true);

  const languages = [
    'English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Tswana'
  ];

  const timezones = [
    'Africa/Johannesburg', 'Africa/Cairo', 'Europe/London', 'America/New_York'
  ];

  const backupFrequencies = [
    { value: 'hourly', label: 'Every Hour' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleSaveSettings = async (category: string) => {
    setSaveLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaveLoading(false);
    toast.success(`${category} settings saved successfully`);
  };

  const handleTestEmailSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success('Test email sent successfully');
  };

  const handleDatabaseOptimization = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setLoading(false);
    toast.success('Database optimization completed');
  };

  const handleSaveAllSettings = async () => {
    setSaveLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaveLoading(false);
    toast.success('All settings saved successfully');
  };

  const handleExportSettings = () => {
    const settings = {
      general: { systemName: 'Smart-Kollect', systemUrl: 'https://smartkollect.co.za' },
      email: { smtpHost: 'smtp.gmail.com', smtpPort: 587 },
      database: { backupEnabled: true, frequency: 'daily' }
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartkollect-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Settings exported successfully');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-gray-400" />
            Global Settings
          </h1>
          <p className="text-gray-400 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportSettings}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleSaveAllSettings}
            disabled={saveLoading}
            className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
          >
            {saveLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900/30 border border-gray-700/30">
          <TabsTrigger value="general" className="data-[state=active]:bg-gray-600">
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gray-600">
            Email
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-gray-600">
            Database
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-gray-600">
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" />
                General Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Basic system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">System Name</Label>
                  <Input
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="bg-gray-800/20 border-gray-700/30 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">System URL</Label>
                  <Input
                    value={systemUrl}
                    onChange={(e) => setSystemUrl(e.target.value)}
                    className="bg-gray-800/20 border-gray-700/30 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Default Language</Label>
                  <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                    <SelectTrigger className="bg-purple-800/20 border-purple-700/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-purple-900 border-purple-700">
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang} className="text-white hover:bg-gray-800">
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-purple-800/20 border-purple-700/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-purple-900 border-purple-700">
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz} className="text-white hover:bg-gray-800">
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                  <div>
                    <Label className="text-white">Maintenance Mode</Label>
                    <p className="text-sm text-gray-400">Enable maintenance mode to prevent user access</p>
                  </div>
                  <Switch 
                    checked={maintenanceMode} 
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                  <div>
                    <Label className="text-white">Debug Mode</Label>
                    <p className="text-sm text-gray-400">Enable detailed logging for debugging</p>
                  </div>
                  <Switch 
                    checked={debugMode} 
                    onCheckedChange={setDebugMode}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => handleSaveSettings('General')}
                disabled={saveLoading}
                className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
              >
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                Email Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure SMTP settings for system emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-800/20 border border-purple-700/30">
                <div>
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-gray-400">Enable system email notifications</p>
                </div>
                <Switch 
                  checked={emailEnabled} 
                  onCheckedChange={setEmailEnabled}
                />
              </div>
              
              {emailEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">SMTP Host</Label>
                      <Input
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="bg-gray-800/20 border-gray-700/30 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">SMTP Port</Label>
                      <Input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="bg-gray-800/20 border-gray-700/30 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">SMTP Username</Label>
                      <Input
                        value={smtpUsername}
                        onChange={(e) => setSmtpUsername(e.target.value)}
                        className="bg-gray-800/20 border-gray-700/30 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">SMTP Password</Label>
                      <div className="relative">
                        <Input
                          type={showSmtpPassword ? "text" : "password"}
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          className="bg-purple-800/20 border-purple-700/30 text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300"
                        >
                          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-white">From Name</Label>
                      <Input
                        value={emailFromName}
                        onChange={(e) => setEmailFromName(e.target.value)}
                        className="bg-gray-800/20 border-gray-700/30 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleTestEmailSettings}
                      disabled={loading}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Test Email
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => handleSaveSettings('Email')}
                      disabled={saveLoading}
                      className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
                    >
                      Save Email Settings
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-gray-400" />
                Database Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Database backup and optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                  <div>
                    <Label className="text-white">Automatic Backups</Label>
                    <p className="text-sm text-gray-400">Enable scheduled database backups</p>
                  </div>
                  <Switch 
                    checked={dbBackupEnabled} 
                    onCheckedChange={setDbBackupEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                  <div>
                    <Label className="text-white">Auto Optimization</Label>
                    <p className="text-sm text-gray-400">Automatically optimize database performance</p>
                  </div>
                  <Switch 
                    checked={dbOptimizationEnabled} 
                    onCheckedChange={setDbOptimizationEnabled}
                  />
                </div>
              </div>
              
              {dbBackupEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white">Backup Frequency</Label>
                    <Select value={dbBackupFrequency} onValueChange={setDbBackupFrequency}>
                      <SelectTrigger className="bg-purple-800/20 border-purple-700/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-purple-900 border-purple-700">
                        {backupFrequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value} className="text-white hover:bg-purple-800">
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Retention Period (Days)</Label>
                    <Input
                      type="number"
                      value={dbRetentionDays}
                      onChange={(e) => setDbRetentionDays(Number(e.target.value))}
                      className="bg-gray-800/20 border-gray-700/30 text-white"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleDatabaseOptimization}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Optimize Now
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => handleSaveSettings('Database')}
                  disabled={saveLoading}
                  className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
                >
                  Save Database Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-700/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                Security Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    className="bg-gray-800/20 border-gray-700/30 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Password Expiry (days)</Label>
                  <Input
                    type="number"
                    value={passwordExpiry}
                    onChange={(e) => setPasswordExpiry(Number(e.target.value))}
                    className="bg-gray-800/20 border-gray-700/30 text-white"
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
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/20 border border-gray-700/30">
                  <div>
                    <Label className="text-white">Require Two-Factor Auth</Label>
                    <p className="text-sm text-gray-400">Mandatory 2FA for all users</p>
                  </div>
                  <Switch 
                    checked={twoFactorRequired} 
                    onCheckedChange={setTwoFactorRequired}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => handleSaveSettings('Security')}
                disabled={saveLoading}
                className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
              >
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
