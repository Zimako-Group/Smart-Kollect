import { useEffect, useRef } from 'react';

/**
 * Custom hook for setting up an interval that is properly cleaned up when the component unmounts
 * @param callback Function to call on each interval
 * @param delay Delay in milliseconds, or null to pause the interval
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    
    // No cleanup needed if delay is null
    return undefined;
  }, [delay]);
}
