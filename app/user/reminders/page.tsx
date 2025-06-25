"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, Plus, Filter, Search, ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, FileText, Tag, CalendarDays, ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { reminderService, Callback } from "@/lib/reminder-service";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Reminder } from "@/lib/redux/features/reminders/remindersSlice";
import { toast } from "@/components/ui/use-toast";

// Initial state for reminders data
const initialRemindersData = {
  totalReminders: 0,
  todayReminders: 0,
  weekReminders: 0,
  monthReminders: 0,
  completedToday: 0,
  remindersByType: [
    { type: "Call Back", count: 0, color: "bg-blue-500" },
    { type: "Payment Follow-up", count: 0, color: "bg-green-500" },
    { type: "Document Review", count: 0, color: "bg-purple-500" },
    { type: "Meeting", count: 0, color: "bg-amber-500" }
  ],
  upcomingReminders: [] as Reminder[]
};

export default function RemindersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("today");
  const [activeView, setActiveView] = useState("list");
  const [remindersData, setRemindersData] = useState(initialRemindersData);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [selectedCallback, setSelectedCallback] = useState<Callback | null>(null);
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  // Get current user ID from localStorage or session
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('zimako_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user && user.id) {
              console.log('Found user ID in localStorage:', user.id);
              setCurrentAgentId(user.id);
              return;
            }
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }
        
        // If not in localStorage, try Supabase session
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          console.log('Found user ID in Supabase session:', data.session.user.id);
          setCurrentAgentId(data.session.user.id);
        } else {
          // If we can't get the user from Supabase, try to use the admin client
          // This is a fallback for development/testing
          console.log('No user found in session, using admin client as fallback');
          const adminUser = await supabaseAdmin.auth.getUser();
          if (adminUser.data?.user) {
            console.log('Found user from admin client:', adminUser.data.user.id);
            setCurrentAgentId(adminUser.data.user.id);
          } else {
            console.error('No user found in localStorage or Supabase session');
            setError('User not authenticated. Please log in again.');
          }
        }
      } catch (err) {
        console.error('Error getting current user:', err);
        setError('Failed to get user information');
      }
    };
    
    getCurrentUser();
  }, [supabase.auth]);
  
  // Fetch reminders for the current agent
  useEffect(() => {
    if (!currentAgentId) return;
    
    const fetchReminders = async () => {
      try {
        setLoading(true);
        console.log(`Fetching callbacks for agent ${currentAgentId}...`);
        const fetchedCallbacks = await reminderService.getCallbacksByAgentId(currentAgentId, { useAdmin: true });
        console.log('Fetched agent callbacks:', fetchedCallbacks);
        
        if (fetchedCallbacks && fetchedCallbacks.length > 0) {
          console.log('Number of agent callbacks found:', fetchedCallbacks.length);
          console.log('First callback:', fetchedCallbacks[0]);
        } else {
          console.log('No agent callbacks found or empty array returned');
        }
        
        setCallbacks(fetchedCallbacks);
        
        // Also get the reminders format for the metrics
        const fetchedReminders = await reminderService.getReminders({ useAdmin: true });
        setReminders(fetchedReminders);
        
        // Calculate metrics
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const todayReminders = fetchedReminders.filter(reminder => reminder.dueDate === today);
        const todayCompletedReminders = todayReminders.filter(reminder => reminder.isCompleted);
        const weekReminders = fetchedReminders.filter(
          reminder => new Date(reminder.dueDate) >= startOfWeek && new Date(reminder.dueDate) <= now
        );
        const monthReminders = fetchedReminders.filter(
          reminder => new Date(reminder.dueDate) >= startOfMonth && new Date(reminder.dueDate) <= now
        );
        
        // Count reminders by type
        const typeMap: Record<string, number> = {};
        fetchedReminders.forEach(reminder => {
          const displayType = reminder.type === 'callback' ? 'Call Back' : 
                           reminder.type === 'follow-up' ? 'Payment Follow-up' : 
                           reminder.type === 'payment' ? 'Payment Follow-up' : 
                           'Other';
          typeMap[displayType] = (typeMap[displayType] || 0) + 1;
        });
        
        // Update reminders data
        setRemindersData({
          totalReminders: fetchedReminders.length,
          todayReminders: todayReminders.length,
          weekReminders: weekReminders.length,
          monthReminders: monthReminders.length,
          completedToday: todayCompletedReminders.length,
          remindersByType: [
            { type: "Call Back", count: typeMap["Call Back"] || 0, color: "bg-blue-500" },
            { type: "Payment Follow-up", count: typeMap["Payment Follow-up"] || 0, color: "bg-green-500" },
            { type: "Document Review", count: typeMap["Document Review"] || 0, color: "bg-purple-500" },
            { type: "Meeting", count: typeMap["Meeting"] || 0, color: "bg-amber-500" }
          ],
          upcomingReminders: fetchedReminders as Reminder[]
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reminders:", err);
        setError("Failed to load reminders. Please try again.");
        setLoading(false);
        toast({ variant: "destructive", title: "Failed to load reminders" });
      }
    };
    
    fetchReminders();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchReminders();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [currentAgentId]);

  // Format date and time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-ZA", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-ZA", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric" 
      });
    }
  };

  // Get priority class for styling
  const getPriorityClass = (priority: string) => {
    const classes = {
      "High": "bg-red-950/40 text-red-400 border-red-800/50",
      "Medium": "bg-amber-950/40 text-amber-400 border-amber-800/50",
      "Low": "bg-blue-950/40 text-blue-400 border-blue-800/50"
    };
    return classes[priority as keyof typeof classes];
  };

  // Get type class for styling
  const getTypeClass = (type: string) => {
    const typeMap: Record<string, string> = {
      "Call Back": "bg-blue-950/40 text-blue-400 border-blue-800/50",
      "Payment Follow-up": "bg-green-950/40 text-green-400 border-green-800/50",
      "Document Review": "bg-purple-950/40 text-purple-400 border-purple-800/50",
      "Meeting": "bg-amber-950/40 text-amber-400 border-amber-800/50"
    };
    return typeMap[type] || "bg-slate-950/40 text-slate-400 border-slate-800/50";
  };

  // Get icon for reminder type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Call Back":
        return <Phone className="h-4 w-4" />;
      case "Payment Follow-up":
        return <FileText className="h-4 w-4" />;
      case "Document Review":
        return <FileText className="h-4 w-4" />;
      case "Meeting":
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-orange-400 hover:bg-slate-800/50 rounded-full"
            onClick={() => router.push('/user/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Reminders</h1>
            <p className="text-slate-400">Manage your daily, weekly, and monthly reminders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-800 hover:bg-slate-800/50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="default"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Reminder
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Reminders Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Today&apos;s Reminders
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {remindersData.todayReminders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <Clock className="h-3 w-3" />
                <span>Due today</span>
              </div>
              <Badge variant="outline" className="bg-orange-950/40 text-orange-400 border-orange-800/50">
                {remindersData.completedToday} completed
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Completion rate</span>
                <span className="text-xs font-medium text-slate-300">
                  {remindersData.todayReminders > 0 ? Math.round((remindersData.completedToday / remindersData.todayReminders) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                  style={{ width: `${remindersData.todayReminders > 0 ? (remindersData.completedToday / remindersData.todayReminders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week's Reminders Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              This Week&apos;s Reminders
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {remindersData.weekReminders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <CalendarDays className="h-3 w-3" />
                <span>Next 7 days</span>
              </div>
              <Badge variant="outline" className="bg-blue-950/40 text-blue-400 border-blue-800/50">
                {remindersData.todayReminders} today
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Today&apos;s portion</span>
                <span className="text-xs font-medium text-slate-300">
                  {remindersData.weekReminders > 0 ? Math.round((remindersData.todayReminders / remindersData.weekReminders) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                  style={{ width: `${remindersData.weekReminders > 0 ? (remindersData.todayReminders / remindersData.weekReminders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month's Reminders Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              This Month&apos;s Reminders
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {remindersData.monthReminders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <Calendar className="h-3 w-3" />
                <span>March 2025</span>
              </div>
              <Badge variant="outline" className="bg-purple-950/40 text-purple-400 border-purple-800/50">
                {remindersData.weekReminders} this week
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Week&apos;s portion</span>
                <span className="text-xs font-medium text-slate-300">
                  {Math.round((remindersData.weekReminders / remindersData.monthReminders) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                  style={{ width: `${remindersData.monthReminders > 0 ? (remindersData.weekReminders / remindersData.monthReminders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminders by Type Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
          <div className="h-1 bg-gradient-to-r from-green-600 to-green-400"></div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Reminders by Type
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-200">
              {remindersData.remindersByType.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Tag className="h-3 w-3" />
                <span>Categories</span>
              </div>
              <Badge variant="outline" className="bg-green-950/40 text-green-400 border-green-800/50">
                {remindersData.totalReminders} total
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              {remindersData.remindersByType.map((type, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${type.color}`}></div>
                  <span className="text-xs text-slate-300 flex-1">{type.type}</span>
                  <span className="text-xs font-medium text-slate-400">{type.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-slate-900 to-slate-900/90">
        <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-400"></div>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Upcoming Reminders</CardTitle>
              <CardDescription>
                Your scheduled reminders and tasks
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search reminders..."
                  className="pl-9 bg-slate-950/50 border-slate-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={activeView === "list" ? "default" : "outline"}
                  size="sm"
                  className={activeView === "list" 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "border-slate-800 hover:bg-slate-800/50"}
                  onClick={() => setActiveView("list")}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeView === "calendar" ? "default" : "outline"}
                  size="sm"
                  className={activeView === "calendar" 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "border-slate-800 hover:bg-slate-800/50"}
                  onClick={() => setActiveView("calendar")}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="mb-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              className="w-full"
            >
              <TabsList className="h-9 bg-slate-950/50 border border-slate-800 p-0.5 w-full sm:w-auto grid grid-cols-3 sm:flex">
                <TabsTrigger
                  value="today"
                  className="h-7 px-3 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                  onClick={() => setActiveTab("today")}
                >
                  Today ({remindersData.todayReminders})
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="h-7 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  onClick={() => setActiveTab("week")}
                >
                  This Week ({remindersData.weekReminders})
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="h-7 px-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  onClick={() => setActiveTab("month")}
                >
                  This Month ({remindersData.monthReminders})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* List View */}
          {activeView === "list" && (
            <div className="space-y-3">
              {loading ? (
                <div className="border border-slate-800 rounded-md p-8 bg-slate-900/50 text-center">
                  <div className="animate-spin h-8 w-8 border-t-2 border-orange-500 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-slate-300">Loading reminders...</h3>
                </div>
              ) : error ? (
                <div className="border border-slate-800 rounded-md p-8 bg-slate-900/50 text-center">
                  <Bell className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300">Error loading reminders</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">{error}</p>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : callbacks.length === 0 ? (
                <div className="border border-slate-800 rounded-md p-8 bg-slate-900/50 text-center">
                  <Bell className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300">No reminders found</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
                    You don&apos;t have any scheduled callbacks in the database. Use the Floating Dialer to create callbacks.
                  </p>
                  <div className="flex justify-center mt-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-800 hover:bg-slate-800/50"
                      onClick={() => window.location.reload()}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => router.push('/user/dashboard')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {callbacks
                    // Remove filtering for now to show all callbacks
                    // .filter(callback => {
                    //   const callbackDate = new Date(callback.callback_date);
                    //   const today = new Date();
                    //   today.setHours(0, 0, 0, 0);
                      
                    //   if (activeTab === 'today') {
                    //     const callbackDay = new Date(callbackDate);
                    //     callbackDay.setHours(0, 0, 0, 0);
                    //     return callbackDay.getTime() === today.getTime();
                    //   } else if (activeTab === 'week') {
                    //     const startOfWeek = new Date(today);
                    //     startOfWeek.setDate(today.getDate() - today.getDay());
                    //     return callbackDate >= startOfWeek && callbackDate <= today;
                    //   } else if (activeTab === 'month') {
                    //     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    //     return callbackDate >= startOfMonth && callbackDate <= today;
                    //   }
                    //   return true;
                    // })
                    .map((callback) => (
                      <div key={callback.id} className="border border-slate-800 rounded-md p-4 bg-slate-900/50 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-md ${getTypeClass('Call Back')}`}>
                              {getTypeIcon('Call Back')}
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-200">Call {callback.phone_number}</h3>
                              <p className="text-sm text-slate-400 mt-1">{callback.notes || 'No additional notes'}</p>
                              
                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(new Date(callback.callback_date))}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(callback.callback_date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                </div>
                                {callback.debtor_id && callback.debtor_id !== '00000000-0000-0000-0000-000000000000' && (
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Tag className="h-3 w-3" />
                                    <span>Account: {callback.debtor_id}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <User className="h-3 w-3" />
                                  <span>Agent: {callback.agent_name || callback.agent_id}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${callback.status === 'completed' ? 'bg-green-950/40 text-green-400 border-green-800/50' : 'bg-amber-950/40 text-amber-400 border-amber-800/50'}`}>
                              {callback.status === 'completed' ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-3 gap-2">
                          {callback.status !== 'completed' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-slate-800 hover:bg-green-900/30 hover:text-green-400"
                              onClick={async () => {
                                try {
                                  // Update the callback status directly
                                  const { error } = await supabaseAdmin
                                    .from('callbacks')
                                    .update({ status: 'completed' })
                                    .eq('id', callback.id);
                                    
                                  if (error) throw error;
                                  
                                  toast({ title: "Callback marked as complete", description: "The callback has been updated successfully" });
                                  
                                  // Update the local state
                                  const updatedCallbacks = callbacks.map(c => 
                                    c.id === callback.id ? { ...c, status: 'completed' as 'pending' | 'completed' } : c
                                  );
                                  setCallbacks(updatedCallbacks);
                                } catch (err) {
                                  console.error("Error completing callback:", err);
                                  toast({ variant: "destructive", title: "Failed to mark callback as complete" });
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-slate-400 hover:text-slate-300"
                                onClick={() => setSelectedCallback(callback)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md border-slate-700 bg-slate-900">
                              <DialogHeader>
                                <DialogTitle className="text-slate-200">Callback Details</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  View and manage callback information
                                </DialogDescription>
                              </DialogHeader>
                              {selectedCallback && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-slate-400">Phone Number</h4>
                                      <p className="text-base font-medium text-slate-200">{selectedCallback.phone_number}</p>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-slate-400">Callback Date & Time</h4>
                                      <p className="text-base font-medium text-slate-200">
                                        {formatDate(new Date(selectedCallback.callback_date))} at {new Date(selectedCallback.callback_date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                      </p>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-slate-400">Status</h4>
                                      <div>
                                        <Badge variant="outline" className={`${selectedCallback.status === 'completed' ? 'bg-green-950/40 text-green-400 border-green-800/50' : 'bg-amber-950/40 text-amber-400 border-amber-800/50'}`}>
                                          {selectedCallback.status === 'completed' ? 'Completed' : 'Pending'}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-medium text-slate-400">Notes</h4>
                                      <p className="text-base text-slate-200 bg-slate-800/50 p-3 rounded-md">
                                        {selectedCallback.notes || 'No additional notes provided'}
                                      </p>
                                    </div>
                                    
                                    {selectedCallback.debtor_id && selectedCallback.debtor_id !== '00000000-0000-0000-0000-000000000000' && (
                                      <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-slate-400">Associated Account</h4>
                                        <p className="text-base font-medium text-slate-200">{selectedCallback.debtor_id}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                                {selectedCallback && selectedCallback.status !== 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 hover:bg-green-900/30 hover:text-green-400"
                                    onClick={async () => {
                                      try {
                                        if (!selectedCallback) return;
                                        
                                        const { error } = await supabaseAdmin
                                          .from('callbacks')
                                          .update({ status: 'completed' })
                                          .eq('id', selectedCallback.id);
                                          
                                        if (error) throw error;
                                        
                                        toast({ title: "Callback marked as complete", description: "The callback has been updated successfully" });
                                        
                                        // Update the local state
                                        const updatedCallbacks = callbacks.map(c => 
                                          c.id === selectedCallback.id ? { ...c, status: 'completed' as 'pending' | 'completed' } : c
                                        );
                                        setCallbacks(updatedCallbacks);
                                        setSelectedCallback({...selectedCallback, status: 'completed' as 'pending' | 'completed'});
                                      } catch (err) {
                                        console.error("Error completing callback:", err);
                                        toast({ variant: "destructive", title: "Failed to mark callback as complete" });
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Complete
                                  </Button>
                                )}
                                
                                {selectedCallback && selectedCallback.debtor_id && selectedCallback.debtor_id !== '00000000-0000-0000-0000-000000000000' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() => router.push(`/user/customers/${selectedCallback.debtor_id}`)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Go to Customer Profile
                                  </Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
          
          {/* Calendar View - Placeholder for now */}
          {activeView === "calendar" && (
            <div className="border border-slate-800 rounded-md p-4 bg-slate-900/50 text-center py-16">
              <CalendarDays className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Calendar view will be implemented in the next update</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-slate-800 hover:bg-slate-800/50"
                onClick={() => setActiveView("list")}
              >
                Switch to List View
              </Button>
            </div>
          )}
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              Showing <span className="font-medium text-slate-300">0</span> of <span className="font-medium text-slate-300">0</span> reminders
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 bg-slate-800/30 text-slate-500"
                disabled
              >
                1
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 border-slate-800 hover:bg-slate-800/50"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="outline"
          className="border-slate-800 hover:bg-slate-800/50"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All as Complete
        </Button>
        <Button
          variant="default"
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Reminder
        </Button>
      </div>
    </div>
  );
}
