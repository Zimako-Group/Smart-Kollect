"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Create a simpler Progress component that doesn't rely on Radix UI
// This will prevent build errors while maintaining functionality
const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => {
  // Ensure value is between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-slate-800",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress }
