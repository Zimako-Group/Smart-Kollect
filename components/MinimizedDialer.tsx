"use client";

import { useState, useEffect } from "react";
import { useDialer } from "@/contexts/DialerContext";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

export function MinimizedDialer() {
  const {
    isDialerOpen,
    setIsDialerOpen,
    isMinimized,
    setIsMinimized,
    callState,
    callDuration,
    currentCustomer,
    isMuted,
    setIsMuted,
    isSpeakerOn,
    setIsSpeakerOn,
    endCall
  } = useDialer();

  // Format the call duration
  const formattedDuration = formatDuration(callDuration);

  // Only show the minimized dialer if a call is active and the dialer is minimized
  if (!isDialerOpen || !isMinimized || callState !== "connected") {
    return null;
  }

  // Handle ending the call
  const handleEndCall = () => {
    endCall();
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 w-[300px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">
              {currentCustomer?.name || "Unknown"}
            </div>
            <div className="text-xs text-slate-400">
              {formattedDuration}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <MicOff className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-slate-300" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            {isSpeakerOn ? (
              <Volume2 className="h-3.5 w-3.5 text-slate-300" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-red-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 className="h-3.5 w-3.5 text-slate-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-red-500/10 hover:bg-red-500/20"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
