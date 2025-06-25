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
  Filter
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock data for active calls
const mockActiveCalls = [
  {
    id: "call-1",
    agentName: "Thabo Johnson",
    agentAvatar: "/avatars/thabo.jpg",
    customerName: "John Smith",
    customerPhone: "+27 82 123 4567",
    callType: "inbound",
    startTime: new Date(Date.now() - 320000), // 5:20 ago
    duration: 320, // seconds
  },
  {
    id: "call-2",
    agentName: "Lerato Moloi",
    agentAvatar: "/avatars/lerato.jpg",
    customerName: "Sarah Williams",
    customerPhone: "+27 71 987 6543",
    callType: "outbound",
    startTime: new Date(Date.now() - 180000), // 3:00 ago
    duration: 180, // seconds
  },
  {
    id: "call-3",
    agentName: "Zanele Mbeki",
    agentAvatar: "/avatars/zanele.jpg",
    customerName: "Michael Brown",
    customerPhone: "+27 83 456 7890",
    callType: "inbound",
    startTime: new Date(Date.now() - 90000), // 1:30 ago
    duration: 90, // seconds
  },
  {
    id: "call-4",
    agentName: "Mandla Zuma",
    agentAvatar: "/avatars/mandla.jpg",
    customerName: "Elizabeth Taylor",
    customerPhone: "+27 76 234 5678",
    callType: "outbound",
    startTime: new Date(Date.now() - 420000), // 7:00 ago
    duration: 420, // seconds
  },
];

// Mock data for agents waiting in queue
const mockQueuedCalls = [
  {
    id: "queue-1",
    customerName: "David Johnson",
    customerPhone: "+27 73 345 6789",
    waitTime: 45, // seconds
    priority: "high",
  },
  {
    id: "queue-2",
    customerName: "Nomvula Khumalo",
    customerPhone: "+27 78 456 7890",
    waitTime: 30, // seconds
    priority: "medium",
  },
  {
    id: "queue-3",
    customerName: "Robert Chen",
    customerPhone: "+27 84 567 8901",
    waitTime: 15, // seconds
    priority: "low",
  },
];

interface RealtimeMetricsProps {
  activeCalls: any[];
  queuedCalls: any[];
}

export function RealtimeMetrics({ activeCalls: initialActiveCalls = mockActiveCalls, queuedCalls: initialQueuedCalls = mockQueuedCalls }: RealtimeMetricsProps) {
  // Ensure we have valid data with all required fields
  const validateCallData = (calls: any[]) => {
    return calls.map(call => ({
      id: call.id || `call-${Math.random().toString(36).substr(2, 9)}`,
      agentName: call.agentName || 'Unknown Agent',
      agentAvatar: call.agentAvatar || '',
      customerName: call.customerName || 'Unknown Customer',
      customerPhone: call.customerPhone || 'N/A',
      callType: call.callType || 'unknown',
      startTime: call.startTime instanceof Date ? call.startTime : new Date(call.startTime || Date.now()),
      duration: call.duration || 0
    }));
  };

  const [activeCalls, setActiveCalls] = useState(validateCallData(initialActiveCalls.length > 0 ? initialActiveCalls : mockActiveCalls));
  const [queuedCalls, setQueuedCalls] = useState(initialQueuedCalls.length > 0 ? initialQueuedCalls : mockQueuedCalls);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCallType, setFilterCallType] = useState<"all" | "inbound" | "outbound">("all");
  const [now, setNow] = useState(new Date());

  // Initialize with props when they change
  useEffect(() => {
    if (initialActiveCalls.length > 0) {
      setActiveCalls(validateCallData(initialActiveCalls));
    }
    if (initialQueuedCalls.length > 0) {
      setQueuedCalls(initialQueuedCalls);
    }
  }, [initialActiveCalls, initialQueuedCalls]);

  // Update the current time every second to keep durations accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      
      // Update durations
      setActiveCalls(prev => prev.map(call => {
        // Make sure startTime is a Date object and handle potential undefined values
        const startTime = call.startTime instanceof Date ? call.startTime : new Date(call.startTime || Date.now());
        return {
          ...call,
          duration: Math.floor((now.getTime() - startTime.getTime()) / 1000)
        };
      }));
      
      // Update wait times for queued calls
      setQueuedCalls(prev => prev.map(call => ({
        ...call,
        waitTime: (call.waitTime || 0) + 1
      })));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [now]);

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
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

  // Filter active calls
  const filteredActiveCalls = activeCalls
    .filter(call => 
      ((call.agentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
       (call.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
       (call.customerPhone || '').includes(searchQuery)) &&
      (filterCallType === "all" || call.callType === filterCallType)
    );

  return (
    <div className="space-y-6">
      {/* Active Calls Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Active Calls ({activeCalls.length})</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search calls..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  {filterCallType === "all" 
                    ? "All Calls" 
                    : filterCallType === "inbound" 
                    ? "Inbound" 
                    : "Outbound"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterCallType("all")}>
                  All Calls
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCallType("inbound")}>
                  Inbound Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterCallType("outbound")}>
                  Outbound Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Agent</TableHead>
                <TableHead className="w-[200px]">Customer</TableHead>
                <TableHead>Call Type</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActiveCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No active calls matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActiveCalls.map((call) => (
                  <TableRow key={call.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={call.agentAvatar} alt={call.agentName || 'Agent'} />
                          <AvatarFallback>
                            {call.agentName ? call.agentName.split(" ").map((n: string) => n[0]).join("") : 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{call.agentName || 'Unknown Agent'}</div>
                          <div className="text-xs text-muted-foreground">Agent ID: {call.id.split('-')[1]}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.customerName || 'Unknown Customer'}</div>
                        <div className="text-xs text-muted-foreground">{call.customerPhone || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getCallTypeBadge(call.callType)}</TableCell>
                    <TableCell>
                      {call.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <div className={`font-mono ${
                        call.duration > 300 ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {formatDuration(call.duration)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <PhoneCall className="h-4 w-4" />
                          <span className="sr-only">Monitor Call</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Call Queue Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Call Queue ({queuedCalls.length})</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {queuedCalls.map((call) => (
            <Card key={call.id} className={`transition-all duration-300 hover:shadow-md ${
              call.waitTime > 60 ? 'border-red-500/50' : 
              call.waitTime > 30 ? 'border-amber-500/50' : 
              'border-slate-200 dark:border-slate-800'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{call.customerName}</span>
                  {getPriorityBadge(call.priority)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{call.customerPhone}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Wait Time:</span>
                    <span className={`font-mono ${
                      call.waitTime > 60 ? 'text-red-500' : 
                      call.waitTime > 30 ? 'text-amber-500' : 
                      'text-green-500'
                    }`}>
                      {formatDuration(call.waitTime)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" variant="outline" className="h-8">
                      <Phone className="h-3 w-3 mr-1" />
                      Answer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {queuedCalls.length === 0 && (
            <div className="col-span-3 py-8 text-center text-muted-foreground">
              No calls in queue at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
