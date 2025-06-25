"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  lastActive: string | null;
  stats: {
    callsHandled: number;
    avgCallTime: number;
    satisfactionScore: number;
    availabilityPercentage: number;
  };
}

interface AgentPerformanceTableProps {
  agents: Agent[];
}

export function AgentPerformanceTable({ agents }: AgentPerformanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("callsHandled");
  const [sortDirection, setSortDirection] = useState<string>("desc");

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "paused":
        return "bg-amber-500 hover:bg-amber-600";
      case "offline":
        return "bg-slate-500 hover:bg-slate-600";
      default:
        return "bg-slate-500 hover:bg-slate-600";
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name.substring(0, 2);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter and sort agents
  const filteredAndSortedAgents = [...agents]
    .filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      // Compare based on sort field
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "callsHandled":
          comparison = a.stats.callsHandled - b.stats.callsHandled;
          break;
        case "avgCallTime":
          comparison = a.stats.avgCallTime - b.stats.avgCallTime;
          break;
        case "satisfaction":
          comparison = a.stats.satisfactionScore - b.stats.satisfactionScore;
          break;
        case "availability":
          comparison = a.stats.availabilityPercentage - b.stats.availabilityPercentage;
          break;
        default:
          comparison = 0;
      }
      
      // Reverse if descending
      return sortDirection === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search agents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Agent
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort("callsHandled")}
                >
                  Calls
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort("avgCallTime")}
                >
                  Avg Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort("satisfaction")}
                >
                  Satisfaction
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort("availability")}
                >
                  Availability
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No agents found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={agent.avatarUrl || ''} />
                        <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.role}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{agent.stats.callsHandled}</TableCell>
                  <TableCell className="text-right">{formatDuration(agent.stats.avgCallTime)}</TableCell>
                  <TableCell className="text-right">
                    {agent.stats.satisfactionScore > 0 ? `${agent.stats.satisfactionScore.toFixed(1)}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {agent.stats.availabilityPercentage > 0 ? `${agent.stats.availabilityPercentage}%` : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
