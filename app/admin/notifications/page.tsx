"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Bell, 
  Calendar, 
  Check, 
  CheckCircle, 
  ChevronDown, 
  Clock, 
  Eye, 
  Filter, 
  Info, 
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  Trash2, 
  User,
  Activity
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Notification, 
  getAllNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  deleteNotification 
} from "@/lib/notification-service";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "info" | "warning" | "urgent">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Protect admin routes
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User is not logged in
        router.push('/login');
      } else if (user.role !== 'admin') {
        // User is logged in but not an admin
        router.push('/');
      }
    }
  }, [user, authLoading, router]);
  
  // Define applyFilters with useCallback before using it in useEffect
  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    // Apply read/unread filter
    if (filter === "unread") {
      filtered = filtered.filter((notification) => !notification.read);
    } else if (filter === "read") {
      filtered = filtered.filter((notification) => notification.read);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((notification) => notification.type === typeFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.message.toLowerCase().includes(query) ||
          (notification.agent_name && notification.agent_name.toLowerCase().includes(query)) ||
          (notification.customer_name && notification.customer_name.toLowerCase().includes(query))
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, filter, typeFilter]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getAllNotifications('admin');
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // The applyFilters function has been moved above the useEffect hooks

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead('admin');
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
      if (selectedNotification?.id === id) {
        setSelectedNotification(null);
        setShowDetails(false);
      }
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetails(true);
    
    // Mark as read when viewing details
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
            Urgent
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">
            Warning
          </Badge>
        );
      case 'info':
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
            Info
          </Badge>
        );
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render anything if user is not an admin
  if (!user || user.role !== "admin") {
    return null;
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchNotifications}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 relative">
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                    <Bell className="h-5 w-5 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">All Notifications</CardTitle>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  {notifications.filter(n => !n.read).length} Unread
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search notifications..."
                      className="pl-10 bg-slate-800/40 border-slate-700/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select
                    value={filter}
                    onValueChange={(value) => setFilter(value as "all" | "unread" | "read")}
                  >
                    <SelectTrigger className="w-[130px] bg-slate-800/40 border-slate-700/50">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value as "all" | "info" | "warning" | "urgent")}
                  >
                    <SelectTrigger className="w-[130px] bg-slate-800/40 border-slate-700/50">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <Bell className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-lg">No notifications found</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {searchQuery || filter !== "all" || typeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "You're all caught up!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all hover:border-blue-500/30 cursor-pointer ${
                        notification.read
                          ? "bg-slate-800/30 border-slate-700/30"
                          : "bg-slate-800/50 border-slate-700/50"
                      }`}
                      onClick={() => handleViewDetails(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          notification.type === "urgent"
                            ? "bg-red-500/20"
                            : notification.type === "warning"
                            ? "bg-amber-500/20"
                            : "bg-blue-500/20"
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              )}
                              <p className={`font-medium ${
                                notification.read ? "text-slate-400" : "text-white"
                              }`}>
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getNotificationBadge(notification.type)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-700" />
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(notification);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!notification.read && (
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification.id);
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                      Mark as Read
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="flex items-center gap-2 text-red-400 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(notification.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                            {notification.agent_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{notification.agent_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{getTimeAgo(notification.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {showDetails && selectedNotification ? (
            <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm sticky top-6">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 relative">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                      <Eye className="h-5 w-5 text-indigo-400" />
                    </div>
                    <CardTitle className="text-white">Notification Details</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      setSelectedNotification(null);
                      setShowDetails(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(selectedNotification.type)}
                      <h3 className="font-semibold text-white">
                        {getNotificationBadge(selectedNotification.type)}
                      </h3>
                    </div>
                    <div className="text-sm text-slate-400">
                      {formatDate(selectedNotification.created_at)}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                    <p className="text-white">{selectedNotification.message}</p>
                  </div>

                  <Separator className="bg-slate-700/50" />

                  <div className="space-y-3">
                    {selectedNotification.agent_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Agent</p>
                          <p className="text-white">{selectedNotification.agent_name}</p>
                        </div>
                      </div>
                    )}

                    {selectedNotification.customer_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Customer</p>
                          <p className="text-white">{selectedNotification.customer_name}</p>
                        </div>
                      </div>
                    )}

                    {selectedNotification.action_type && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Action Type</p>
                          <p className="text-white">{selectedNotification.action_type}</p>
                        </div>
                      </div>
                    )}

                    {selectedNotification.created_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Date & Time</p>
                          <p className="text-white">{formatDate(selectedNotification.created_at)}</p>
                        </div>
                      </div>
                    )}

                    {selectedNotification.details && (
                      <div className="mt-4 p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                        <p className="text-sm text-slate-400 mb-2">Additional Details</p>
                        <pre className="text-xs text-slate-300 overflow-auto p-2 bg-slate-800/70 rounded border border-slate-700/50 max-h-[200px]">
                          {JSON.stringify(selectedNotification.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-slate-800/30 border-t border-slate-700/50">
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300"
                    onClick={() => {
                      setSelectedNotification(null);
                      setShowDetails(false);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                    onClick={() => {
                      handleDeleteNotification(selectedNotification.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="overflow-hidden border-none shadow-lg bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 relative">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-slate-700/50">
                    <Info className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Notification Info</CardTitle>
                    <CardDescription className="text-white/70">
                      Select a notification to view details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                    <h3 className="font-medium text-white mb-2">Notification Types</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
                          Info
                        </Badge>
                        <span className="text-sm text-slate-400">General information</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">
                          Warning
                        </Badge>
                        <span className="text-sm text-slate-400">Important notices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
                          Urgent
                        </Badge>
                        <span className="text-sm text-slate-400">Critical alerts</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                    <h3 className="font-medium text-white mb-2">Quick Tips</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span>Click on a notification to view its details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span>Use filters to find specific notifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span>Mark notifications as read when reviewed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span>Delete notifications you no longer need</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
