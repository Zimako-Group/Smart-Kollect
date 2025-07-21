"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock,
  RefreshCw,
  Filter,
  AlertTriangle,
  CheckCircle,
  Pause
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { callTrackingService, ActiveCall, QueuedCall } from "@/lib/call-tracking-service";

interface RealtimeMetricsProps {
  activeCalls?: any[];
  queuedCalls?: any[];
}

export function RealtimeMetrics({ activeCalls: propActiveCalls = [], queuedCalls: propQueuedCalls = [] }: RealtimeMetricsProps) {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [queuedCalls, setQueuedCalls] = useState<QueuedCall[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCallType, setFilterCallType] = useState<"all" | "inbound" | "outbound">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Load initial data and set up real-time subscription
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [activeCallsData, queueData] = await Promise.all([
          callTrackingService.getActiveCalls(),
          callTrackingService.getCallQueue()
        ]);
        
        if (mounted) {
          setActiveCalls(activeCallsData);
          setQueuedCalls(queueData);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading call data:', err);
        if (mounted) {
          setError('Failed to load call data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Set up real-time subscription
    const channel = callTrackingService.subscribeToCallUpdates((payload) => {
      console.log('Real-time call update:', payload);
      
      if (payload.table === 'active_calls') {
        if (payload.eventType === 'INSERT') {
          setActiveCalls(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setActiveCalls(prev => prev.map(call => 
            call.id === payload.new.id ? payload.new : call
          ));
        } else if (payload.eventType === 'DELETE') {
          setActiveCalls(prev => prev.filter(call => call.id !== payload.old.id));
        }
      } else if (payload.table === 'call_queue') {
        if (payload.eventType === 'INSERT') {
          setQueuedCalls(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setQueuedCalls(prev => prev.map(call => 
            call.id === payload.new.id ? payload.new : call
          ));
        } else if (payload.eventType === 'DELETE') {
          setQueuedCalls(prev => prev.filter(call => call.id !== payload.old.id));
        }
      }
    });

    // Update queue wait times and call durations periodically
    const waitTimeInterval = setInterval(() => {
      callTrackingService.updateQueueWaitTimes();
      callTrackingService.updateCallDurations();
    }, 30000); // Update every 30 seconds

    // Update call durations every second
    const durationInterval = setInterval(() => {
      setActiveCalls(prevCalls => 
        prevCalls.map(call => ({
          ...call,
          duration: Math.floor((Date.now() - new Date(call.start_time).getTime()) / 1000)
        }))
      );
      
      setQueuedCalls(prevCalls => 
        prevCalls.map(call => ({
          ...call,
          wait_time: Math.floor((Date.now() - new Date(call.created_at).getTime()) / 1000)
        }))
      );
    }, 1000); // Update every second

    return () => {
      mounted = false;
      callTrackingService.unsubscribeFromCallUpdates();
      clearInterval(waitTimeInterval);
      clearInterval(durationInterval);
    };
  }, []);

  // Format duration in mm:ss format
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle clearing all calls
  const handleClearAllCalls = async () => {
    try {
      setClearing(true);
      const success = await callTrackingService.clearAllCalls();
      
      if (success) {
        setActiveCalls([]);
        setQueuedCalls([]);
      } else {
        setError('Failed to clear calls. Please try again.');
      }
    } catch (err) {
      console.error('Error clearing calls:', err);
      setError('An error occurred while clearing calls.');
    } finally {
      setClearing(false);
    }
  };

  // Get call status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dialing':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Dialing
          </Badge>
        );
      case 'connected':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'on_hold':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 flex items-center gap-1">
            <Pause className="h-3 w-3" />
            On Hold
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Get call type badge
  const getCallTypeBadge = (type: string) => {
    switch (type) {
      case "inbound":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1">
            <PhoneIncoming className="h-3 w-3" />
            Inbound
          </Badge>
        );
      case "outbound":
        return (
          <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20 flex items-center gap-1">
            <PhoneOutgoing className="h-3 w-3" />
            Outbound
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {type}
          </Badge>
        );
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Low
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {priority}
          </Badge>
        );
    }
  };

  // Filter active calls based on search and filter
  const filteredActiveCalls = activeCalls.filter(call => {
    const matchesSearch = call.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         call.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         call.customer_phone.includes(searchQuery);
    const matchesFilter = filterCallType === "all" || call.call_type === filterCallType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading call data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8 text-red-500">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Calls Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active Calls ({filteredActiveCalls.length})</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  {filterCallType === "all" ? "All Calls" : filterCallType.charAt(0).toUpperCase() + filterCallType.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterCallType("all")}>All Calls</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCallType("inbound")}>Inbound</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCallType("outbound")}>Outbound</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearAllCalls}
              disabled={clearing}
              className="ml-2"
            >
              {clearing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear All Calls'
              )}
            </Button>
          </div>
        </div>

        {filteredActiveCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active calls at the moment</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Call Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActiveCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {call.agent_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{call.agent_name}</div>
                          <div className="text-sm text-muted-foreground">Agent ID: {call.agent_id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{call.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getCallTypeBadge(call.call_type)}</TableCell>
                    <TableCell>{getStatusBadge(call.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {new Date(call.start_time).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {formatDuration(call.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Call Queue Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Call Queue ({queuedCalls.length})</h3>
        
        {queuedCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calls in queue</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queuedCalls.map((call) => (
              <Card key={call.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{call.customer_name}</div>
                    {getPriorityBadge(call.priority)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Phone: {call.phone_number}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      Wait Time: <span className="font-mono">{formatDuration(call.wait_time)}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Answer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
