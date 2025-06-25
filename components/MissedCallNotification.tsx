"use client";

import { useState, useEffect } from "react";
import { PhoneMissed, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface MissedCall {
  id: string;
  callerName: string;
  timestamp: Date;
  phoneNumber: string;
  read?: boolean;
}

interface MissedCallNotificationProps {
  missedCalls: MissedCall[];
  onDismiss: (id: string) => void;
  onCallBack: (phoneNumber: string) => void;
}

export function MissedCallNotification({ 
  missedCalls, 
  onDismiss, 
  onCallBack 
}: MissedCallNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show notification when there are missed calls
  useEffect(() => {
    if (missedCalls.length > 0) {
      setIsVisible(true);
    }
  }, [missedCalls]);

  if (!isVisible || missedCalls.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {missedCalls.map((call) => (
        <Card 
          key={call.id} 
          className="w-80 bg-slate-900 border-red-700/30 shadow-lg animate-slideIn"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <PhoneMissed className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-200">{call.callerName}</h4>
                  <p className="text-xs text-slate-400">
                    Missed call {formatDistanceToNow(call.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                onClick={() => onDismiss(call.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                onClick={() => {
                  onCallBack(call.phoneNumber);
                  onDismiss(call.id);
                }}
              >
                Call Back
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
