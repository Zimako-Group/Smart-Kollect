"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Clock,
  X,
  Phone,
  Search,
  Calendar,
  ArrowRight,
  Check,
  User,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock4
} from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import { useDialer } from "@/contexts/DialerContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { callbackService, Callback } from "@/lib/callback-service";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Define the callback type for UI display
type ScheduledCallback = {
  id: string;
  debtorId: string; // Add debtor ID for navigation
  customerName: string;
  customerPhone: string;
  scheduledTime: Date;
  notes: string;
  amount: number;
  reason: string;
  status: "pending" | "completed" | "missed";
};

// Convert database callbacks to UI format
const convertCallbackToScheduled = (callback: Callback): ScheduledCallback => {
  return {
    id: callback.id || '',
    debtorId: callback.debtor_id, // Add debtor ID for navigation
    customerName: callback.debtor_name || 'Unknown Customer',
    customerPhone: callback.phone_number,
    scheduledTime: new Date(callback.callback_date),
    notes: callback.notes || '',
    amount: 0, // Default amount if not available
    reason: callback.notes || 'Follow up',
    status: callback.status as "pending" | "completed" | "missed"
  };
};

interface ViewScheduleProps {
  onClose: () => void;
}

const ViewSchedule: React.FC<ViewScheduleProps> = ({ onClose }) => {
  const { user } = useAuth();
  const router = useRouter(); // Add router hook for navigation
  const [searchTerm, setSearchTerm] = useState("");
  const [callbacks, setCallbacks] = useState<ScheduledCallback[]>([]);
  const [filteredCallbacks, setFilteredCallbacks] = useState<ScheduledCallback[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "missed">("all");
  const [completedCallbacks, setCompletedCallbacks] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { setIsDialerOpen, setCurrentCustomer } = useDialer();
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format time to display
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  // Get time status (upcoming, now, past)
  const getTimeStatus = useCallback((scheduledTime: Date) => {
    const diffMins = differenceInMinutes(scheduledTime, currentTime);
    
    if (diffMins < -15) return "past";
    if (diffMins >= -15 && diffMins <= 15) return "now";
    return "upcoming";
  }, [currentTime]);

  // TODO: Implement automatic missed call status after 1 hour of missing the scheduled time
  // This will be implemented in a future update
  // The logic would check if: differenceInMinutes(scheduledTime, currentTime) < -60
  // and automatically update the status to "missed"

  // Get time proximity text
  const getTimeProximityText = useCallback((scheduledTime: Date) => {
    const diffMins = differenceInMinutes(scheduledTime, currentTime);
    
    if (diffMins < -60) {
      const hours = Math.abs(Math.floor(diffMins / 60));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 0) {
      return `${Math.abs(diffMins)} minutes ago`;
    } else if (diffMins < 60) {
      return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }, [currentTime]);
  
  // Count callbacks by status
  const countByStatus = useCallback((status: "now" | "upcoming" | "past") => {
    return filteredCallbacks.filter(callback => 
      !completedCallbacks.includes(callback.id) && 
      getTimeStatus(callback.scheduledTime) === status
    ).length;
  }, [filteredCallbacks, completedCallbacks, getTimeStatus]);

  // Handle marking a callback as completed
  const handleMarkComplete = async (callback: ScheduledCallback) => {
    try {
      const response = await callbackService.updateCallbackStatus(
        callback.id,
        'completed'
      );
      
      if (response.success) {
        setCompletedCallbacks(prev => [...prev, callback.id]);
        toast.success(`Callback with ${callback.customerName} marked as completed`, {
          description: `ID: ${callback.id}`,
          duration: 3000,
        });
      } else {
        toast.error('Failed to update callback status', {
          description: response.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Error updating callback status:', error);
      toast.error('Failed to update callback status');
    }
  };
  
  // Handle calling a customer - navigate to customer profile
  const handleCallCustomer = (callback: ScheduledCallback) => {
    // Navigate to the customer profile page
    router.push(`/user/customers/${callback.debtorId}`);
    // Close the ViewSchedule modal
    onClose();
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status: "all" | "pending" | "completed" | "missed") => {
    setStatusFilter(status);
  };
  
  // Filter callbacks based on search term and status filter
  // Fetch callbacks for the current agent
  useEffect(() => {
    const fetchCallbacks = async () => {
      if (user && user.id) {
        setIsLoading(true);
        try {
          // Fetch callbacks for the current agent
          const response = await callbackService.getAgentCallbacks(user.id);
          
          if (response.success && response.data) {
            // Convert to UI format
            const scheduledCallbacks = response.data.map(convertCallbackToScheduled);
            setCallbacks(scheduledCallbacks);
          } else {
            toast.error('Failed to load callbacks', {
              description: response.error || 'Unknown error',
            });
            setCallbacks([]);
          }
        } catch (error) {
          console.error('Error fetching callbacks:', error);
          toast.error('Failed to load callbacks');
          setCallbacks([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchCallbacks();
  }, [user]);
  
  // Filter callbacks based on search term and status
  useEffect(() => {
    let filtered = callbacks;
    
    if (searchTerm) {
      filtered = filtered.filter(callback => 
        callback.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        callback.customerPhone.includes(searchTerm) ||
        callback.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        callback.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(callback => {
        if (statusFilter === "completed") {
          return completedCallbacks.includes(callback.id);
        } else if (statusFilter === "missed") {
          return !completedCallbacks.includes(callback.id) && 
                 getTimeStatus(callback.scheduledTime) === "past";
        } else {
          return !completedCallbacks.includes(callback.id) && 
                 (getTimeStatus(callback.scheduledTime) === "now" || 
                  getTimeStatus(callback.scheduledTime) === "upcoming");
        }
      });
    } else {
      // For "all" filter, still exclude completed callbacks from the list
      filtered = filtered.filter(callback => !completedCallbacks.includes(callback.id));
    }
    
    // Sort by scheduled time (earliest first)
    filtered = filtered.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    
    setFilteredCallbacks(filtered);
  }, [searchTerm, statusFilter, completedCallbacks, currentTime, getTimeStatus, callbacks]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-slate-800 text-slate-200 shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-xl font-semibold text-slate-200">My Scheduled Callbacks</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription className="text-slate-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} - Manage your personal scheduled callbacks
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name, phone or reason..."
                className="pl-9 bg-slate-800/60 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-500/20 transition-all duration-200"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={statusFilter === "all" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "all" ? "bg-slate-700 hover:bg-slate-600" : "border-slate-600/50 text-slate-400 hover:bg-slate-800/50 hover:border-slate-500"}
                onClick={() => handleStatusFilterChange("all")}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === "pending" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "pending" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-700/50 text-blue-400 hover:bg-blue-900/20 hover:border-blue-600"}
                onClick={() => handleStatusFilterChange("pending")}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Pending ({countByStatus("upcoming")})
              </Button>
              <Button 
                variant={statusFilter === "completed" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "completed" ? "bg-green-600 hover:bg-green-700" : "border-green-700/50 text-green-400 hover:bg-green-900/20 hover:border-green-600"}
                onClick={() => handleStatusFilterChange("completed")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Completed ({completedCallbacks.length})
              </Button>
              <Button 
                variant={statusFilter === "missed" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "missed" ? "bg-red-600 hover:bg-red-700" : "border-red-700/50 text-red-400 hover:bg-red-900/20 hover:border-red-600"}
                onClick={() => handleStatusFilterChange("missed")}
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                Missed ({countByStatus("past")})
              </Button>
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/40 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm hover:border-blue-600/50 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-full p-2.5 shadow-lg">
                  <Clock4 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-400">📅 Upcoming</div>
                  <div className="text-2xl font-bold text-blue-300">{countByStatus("upcoming")}</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-700/40 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm hover:border-amber-600/50 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-full p-2.5 shadow-lg animate-pulse">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-400">📞 Call Now</div>
                  <div className="text-2xl font-bold text-amber-300">{countByStatus("now")}</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/40 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm hover:border-red-600/50 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-full p-2.5 shadow-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-red-400">⏰ Overdue</div>
                  <div className="text-2xl font-bold text-red-300">{countByStatus("past")}</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-400">Loading your callbacks...</p>
            </div>
          ) : filteredCallbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
              <CalendarClock className="h-16 w-16 mb-4 text-slate-700" />
              <h3 className="text-xl font-medium mb-2">No callbacks found</h3>
              <p className="text-center text-slate-500 max-w-md">
                {statusFilter === "completed" 
                  ? "You haven't completed any callbacks yet today." 
                  : statusFilter === "missed" 
                  ? "No missed callbacks for today." 
                  : "No pending callbacks match your search criteria."}
              </p>
              {statusFilter !== "all" && (
                <Button 
                  variant="outline" 
                  className="mt-4 border-slate-700"
                  onClick={() => handleStatusFilterChange("all")}
                >
                  View All Callbacks
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4">
              {filteredCallbacks.map((callback) => {
                const timeStatus = getTimeStatus(callback.scheduledTime);
                
                return (
                  <div 
                    key={callback.id} 
                    className={`group relative overflow-hidden rounded-xl border ${
                      timeStatus === "now" ? "border-amber-500/60 bg-gradient-to-br from-slate-900/90 to-amber-950/40" : 
                      timeStatus === "past" ? "border-red-500/50 bg-gradient-to-br from-slate-900/90 to-red-950/30" : 
                      "border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/60"
                    } backdrop-blur-sm p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/30 hover:translate-y-[-3px] hover:border-slate-600/60`}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      timeStatus === "now" ? "bg-amber-500" : 
                      timeStatus === "past" ? "bg-red-500" : 
                      "bg-blue-500"
                    }`}></div>
                    
                    {timeStatus === "now" && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex h-3 w-3 rounded-full bg-amber-500 animate-ping opacity-75"></span>
                        <span className="absolute inline-flex rounded-full h-3 w-3 bg-amber-500 top-0 left-0"></span>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-200 font-semibold text-sm shadow-lg ring-2 ring-slate-600/50 group-hover:ring-slate-500/70 transition-all duration-300">
                            {callback.customerName.split(" ").map((n) => n[0]).join("")}
                          </div>
                          {/* Status indicator dot */}
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            timeStatus === "now" ? "bg-amber-500" : 
                            timeStatus === "past" ? "bg-red-500" : 
                            "bg-blue-500"
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-200">{callback.customerName}</h3>
                          <p className="text-sm text-slate-400">{callback.customerPhone}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-xs ${
                              timeStatus === "now" ? "bg-amber-900/40 text-amber-400 border-amber-800/40" : 
                              timeStatus === "past" ? "bg-red-900/40 text-red-400 border-red-800/40" : 
                              "bg-blue-900/40 text-blue-400 border-blue-800/40"
                            }`}>
                              {timeStatus === "now" ? "📞 Call Now" : 
                               timeStatus === "past" ? "⏰ Overdue" : 
                               "📅 Upcoming"}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-slate-900/30 text-slate-300 border-slate-700/50">
                              💬 Callback
                            </Badge>
                            <span className="text-xs text-slate-500">ID: {callback.id.slice(0, 8)}...</span>
                          </div>
                          
                          {callback.notes && (
                            <div className="mt-2 text-xs bg-slate-800/50 rounded-md px-2 py-1 border border-slate-700/50">
                              <p className="text-slate-300">{callback.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end">
                        <div className="text-xl font-bold text-slate-200">{formatCurrency(callback.amount)}</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-400">Reason: {callback.reason}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm mt-1 ${
                          timeStatus === "now" ? "text-amber-400" : 
                          timeStatus === "past" ? "text-red-400" : 
                          "text-blue-400"
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(callback.scheduledTime)}</span>
                          {timeStatus === "now" && <span className="ml-1 animate-pulse">• Now</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {getTimeProximityText(callback.scheduledTime)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <Button 
                          size="sm" 
                          className={`${
                            timeStatus === "now" ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800" : 
                            timeStatus === "past" ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" : 
                            "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          } text-white shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-105`}
                          onClick={() => handleCallCustomer(callback)}
                        >
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Call Now
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-slate-600/60 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200"
                          onClick={() => handleMarkComplete(callback)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-slate-800 p-4">
          <div className="w-full flex justify-between items-center text-xs text-slate-400">
            <div>
              Showing {filteredCallbacks.length} of {callbacks.length} callbacks
            </div>
            <div>
              Last updated: {format(new Date(), 'h:mm:ss a')}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ViewSchedule;
