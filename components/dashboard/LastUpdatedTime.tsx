'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface LastUpdatedTimeProps {
  timestamp?: Date | null;
  date?: Date;
  formatString?: string;
}

export function LastUpdatedTime({ timestamp, date, formatString = 'MMM d, yyyy, h:mm:ss a' }: LastUpdatedTimeProps) {
  const [mounted, setMounted] = useState(false);
  
  // Only render the timestamp on the client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <span>Loading...</span>;
  }
  
  // Use the provided date if available, otherwise use timestamp
  const displayDate = date || timestamp;
  
  // Hardcoded date for the wallboard demo
  const hardcodedDate = new Date("2025-05-27T09:34:20+02:00");
  
  return (
    <span>
      {displayDate ? format(displayDate, formatString) : format(hardcodedDate, formatString)}
    </span>
  );
}
