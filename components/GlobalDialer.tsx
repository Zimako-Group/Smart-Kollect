"use client";

import { useDialer } from "@/contexts/DialerContext";
import { Dialer } from "@/components/Dialer";
import { MinimizedDialer } from "@/components/MinimizedDialer";

export function GlobalDialer() {
  const { 
    isDialerOpen, 
    setIsDialerOpen, 
    isMinimized, 
    callState 
  } = useDialer();

  // Only show the dialer if it's open
  if (!isDialerOpen) return null;

  return (
    <>
      <Dialer 
        open={isDialerOpen} 
        onOpenChange={setIsDialerOpen} 
      />
    </>
  );
}
