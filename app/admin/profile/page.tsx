"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Clock,
  Activity,
  BarChart3,
  Users,
  FileText,
  Settings,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  department?: string;
  bio?: string;
  last_login?: string;
}

interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  totalCampaigns: number;
  totalCollections: number;
  lastLoginDate: string;
  accountAge: number;
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<AdminProfile>>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch various admin statistics
      const [usersResult, agentsResult, campaignsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'agent'),
        supabase.from('campaigns').select('id', { count: 'exact' })
      ]);

      const accountAge = profile?.created_at 
        ? Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalAgents: agentsResult.count || 0,
        totalCampaigns: campaignsResult.count || 0,
        totalCollections: 0, // This would come from a collections table
        lastLoginDate: new Date().toISOString(),
        accountAge
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          phone: editedProfile.phone,
          department: editedProfile.department,
          bio: editedProfile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({ ...profile!, ...editedProfile });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Profile Not Found</h3>
          <p className="text-slate-400">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Profile</h1>
          <p className="text-slate-400 mt-1">Manage your account settings and preferences</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(profile);
                }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700">Profile</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">Security</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{profile.full_name}</h3>
                    <p className="text-slate-400">{profile.email}</p>
                    <Badge variant="outline" className="mt-2 border-blue-600 text-blue-400">
                      <Shield className="h-3 w-3 mr-1" />
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={editedProfile.full_name || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <p className="text-white mt-1">{profile.full_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedProfile.phone || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-white mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {profile.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-slate-300">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={editedProfile.department || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter department"
                      />
                    ) : (
                      <p className="text-white mt-1">{profile.department || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-white mt-1">{profile.bio || 'No bio provided'}</p>
                  )}
                </div>

                {/* Account Info */}
                <div className="pt-4 border-t border-slate-600">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>Joined: {formatDate(profile.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>Last updated: {profile.updated_at ? formatDate(profile.updated_at) : 'Never'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Admin Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">Total Users</span>
                      </div>
                      <span className="text-white font-semibold">{stats.totalUsers}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Active Agents</span>
                      </div>
                      <span className="text-white font-semibold">{stats.totalAgents}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-300">Campaigns</span>
                      </div>
                      <span className="text-white font-semibold">{stats.totalCampaigns}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-400" />
                        <span className="text-slate-300">Account Age</span>
                      </div>
                      <span className="text-white font-semibold">{stats.accountAge} days</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                <div>
                  <h4 className="text-white font-medium">Password</h4>
                  <p className="text-slate-400 text-sm">Last changed: Never</p>
                </div>
                <Button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Change Password
                </Button>
              </div>

              {showPasswordChange && (
                <div className="space-y-4 p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <div>
                    <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handlePasswordChange}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Logged into admin dashboard</p>
                    <p className="text-slate-400 text-xs">Today at {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Profile information updated</p>
                    <p className="text-slate-400 text-xs">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Created new campaign</p>
                    <p className="text-slate-400 text-xs">Yesterday at 3:45 PM</p>
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
