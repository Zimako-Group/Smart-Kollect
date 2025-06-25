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
import { callbackService, Callback } from "@/lib/callback-service";

// Define the callback type for UI display
type ScheduledCallback = {
  id: string;
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
  
  // Handle calling a customer
  const handleCallCustomer = (callback: ScheduledCallback) => {
    // Set the current customer in the dialer context
    setCurrentCustomer({
      id: callback.id,
      name: callback.customerName,
      phone: callback.customerPhone,
      balance: callback.amount,
      status: "callback"
    });
    // Open the dialer
    setIsDialerOpen(true);
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
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name, phone or reason..."
                className="pl-9 bg-slate-800 border-slate-700 text-slate-200"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={statusFilter === "all" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "all" ? "bg-slate-700" : "border-slate-700 text-slate-400"}
                onClick={() => handleStatusFilterChange("all")}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === "pending" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "pending" ? "bg-blue-600" : "border-blue-800/40 text-blue-400"}
                onClick={() => handleStatusFilterChange("pending")}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Pending ({countByStatus("upcoming")})
              </Button>
              <Button 
                variant={statusFilter === "completed" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "completed" ? "bg-green-600" : "border-green-800/40 text-green-400"}
                onClick={() => handleStatusFilterChange("completed")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Completed ({completedCallbacks.length})
              </Button>
              <Button 
                variant={statusFilter === "missed" ? "default" : "outline"} 
                size="sm"
                className={statusFilter === "missed" ? "bg-red-600" : "border-red-800/40 text-red-400"}
                onClick={() => handleStatusFilterChange("missed")}
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                Missed ({countByStatus("past")})
              </Button>
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-900/50 rounded-full p-2">
                  <Clock4 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-blue-400">Upcoming</div>
                  <div className="text-xl font-bold text-blue-300">{countByStatus("upcoming")}</div>
                </div>
              </div>
            </div>
            <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-amber-900/50 rounded-full p-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm text-amber-400">Now</div>
                  <div className="text-xl font-bold text-amber-300">{countByStatus("now")}</div>
                </div>
              </div>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-900/50 rounded-full p-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <div className="text-sm text-red-400">Missed</div>
                  <div className="text-xl font-bold text-red-300">{countByStatus("past")}</div>
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
                    className={`relative overflow-hidden rounded-lg border ${
                      timeStatus === "now" ? "border-amber-500/50 bg-gradient-to-br from-slate-900 to-amber-950/30" : 
                      timeStatus === "past" ? "border-red-500/30 bg-gradient-to-br from-slate-900 to-red-950/20" : 
                      "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/90"
                    } p-4 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20 hover:translate-y-[-2px]`}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      timeStatus === "now" ? "bg-amber-500" : 
                      timeStatus === "past" ? "bg-red-500" : 
                      "bg-blue-500"
                    }`}></div>
                    
                    {timeStatus === "now" && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping opacity-75"></span>
                        <span className="absolute inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-slate-200 font-medium ${
                          timeStatus === "now" ? "bg-amber-900/50 text-amber-200" : 
                          timeStatus === "past" ? "bg-red-900/50 text-red-200" : 
                          "bg-blue-900/50 text-blue-200"
                        }`}>
                          {callback.customerName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-200">{callback.customerName}</h3>
                          <p className="text-sm text-slate-400">{callback.customerPhone}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`
                              ${timeStatus === "now" ? "bg-amber-900/40 text-amber-400 border-amber-800/40" : 
                                timeStatus === "past" ? "bg-red-900/40 text-red-400 border-red-800/40" : 
                                "bg-blue-900/40 text-blue-400 border-blue-800/40"}
                            `}>
                              {timeStatus === "now" ? "Call Now" : 
                               timeStatus === "past" ? "Overdue" : 
                               "Upcoming"}
                            </Badge>
                            <span className="text-xs text-slate-500">ID: {callback.id}</span>
                          </div>
                          
                          <div className="mt-2 text-xs text-slate-400">
                            <p>{callback.notes}</p>
                          </div>
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
                      
                      <div className="flex sm:flex-col gap-2 sm:justify-center">
                        <Button 
                          size="sm" 
                          className={`${
                            timeStatus === "now" ? "bg-amber-600 hover:bg-amber-700" : 
                            timeStatus === "past" ? "bg-red-600 hover:bg-red-700" : 
                            "bg-blue-600 hover:bg-blue-700"
                          } text-white`}
                          onClick={() => handleCallCustomer(callback)}
                        >
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Call
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-slate-700 text-slate-200 hover:bg-slate-800"
                          onClick={() => handleMarkComplete(callback)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Mark Complete
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
