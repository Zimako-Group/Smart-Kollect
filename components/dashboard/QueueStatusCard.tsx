"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface QueueStatusCardProps {
  callsInQueue: number;
  abandonedCalls: number;
  serviceLevel: number;
  isLoading: boolean;
}

export function QueueStatusCard({ callsInQueue, abandonedCalls, serviceLevel, isLoading }: QueueStatusCardProps) {
  // Determine service level status
  const getServiceLevelStatus = () => {
    if (serviceLevel >= 80) return "success";
    if (serviceLevel >= 60) return "warning";
    return "danger";
  };
  
  const serviceLevelStatus = getServiceLevelStatus();
  
  return (
    <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-indigo-500 overflow-hidden">
      <CardHeader className="pb-2 bg-indigo-500/5">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-indigo-500/10">
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          Queue Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-3xl font-bold">
                  {callsInQueue}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Calls In Queue
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-semibold ${
                  serviceLevelStatus === "success" ? "text-green-500" : 
                  serviceLevelStatus === "warning" ? "text-amber-500" : 
                  "text-red-500"
                }`}>
                  {serviceLevel}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Service Level
                </div>
              </div>
            </div>
            
            <div className="mt-3 mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">SLA Target (80%)</span>
                <span className={`font-medium ${
                  serviceLevelStatus === "success" ? "text-green-500" : 
                  serviceLevelStatus === "warning" ? "text-amber-500" : 
                  "text-red-500"
                }`}>
                  {serviceLevel}%
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    serviceLevelStatus === "success" ? "bg-green-500" : 
                    serviceLevelStatus === "warning" ? "bg-amber-500" : 
                    "bg-red-500"
                  }`}
                  style={{ width: `${serviceLevel}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex flex-col items-center p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Clock className="h-4 w-4 text-indigo-500 mb-1" />
                <span className="text-xs text-muted-foreground">In Queue</span>
                <span className="text-base font-semibold text-indigo-500">{callsInQueue}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500 mb-1" />
                <span className="text-xs text-muted-foreground">Abandoned</span>
                <span className="text-base font-semibold text-red-500">{abandonedCalls}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
