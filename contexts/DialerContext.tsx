"use client";

import { ReactNode, createContext, useContext, useState, useEffect, useRef } from "react";
import { buzzBoxService, BuzzBoxConfig } from "@/lib/buzzBoxService";

type CallState = "idle" | "calling" | "connected" | "ended" | "registered" | "failed" | "incoming" | "missed";

interface Customer {
  id: string;
  name: string;
  surname_company_trust?: string;
  cell_number?: string;
  phone?: string; // For backward compatibility
  outstanding_balance?: number;
  balance?: number; // For backward compatibility
  account_status_description?: string;
  status?: string; // For backward compatibility
  acc_number?: string;
}

interface MissedCall {
  id: string;
  callerName: string;
  timestamp: Date;
  phoneNumber: string;
  read?: boolean;
}

// Using the SipConfig interface imported from sipService.ts

interface DialerContextType {
  isDialerOpen: boolean;
  setIsDialerOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  callState: CallState;
  setCallState: (state: CallState) => void;
  callDuration: number;
  setCallDuration: (duration: number) => void;
  currentCustomer: Customer | null;
  setCurrentCustomer: (customer: Customer | null) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSpeakerOn: boolean;
  setIsSpeakerOn: (on: boolean) => void;
  dialNumber: string;
  setDialNumber: (number: string) => void;
  callHistory: any[];
  addCallToHistory: (call: any) => void;
  startTimer: () => void;
  stopTimer: () => void;
  initializeBuzzBox: (apiKey: string, accountId: string, enableTestMode?: boolean, customConfig?: Partial<BuzzBoxConfig>) => boolean;
  makeCall: (phoneNumber: string) => void;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  callerInfo: string;
  isBuzzBoxInitialized: boolean;
  missedCalls: MissedCall[];
  addMissedCall: (callerName: string, phoneNumber: string) => void;
  markMissedCallAsRead: (id: string) => void;
  dismissMissedCall: (id: string) => void;
  clearAllMissedCalls: () => void;
  clearMissedCalls: () => void;
}

const DialerContext = createContext<DialerContextType | undefined>(undefined);

export function DialerProvider({ children }: { children: ReactNode }) {
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isBuzzBoxInitialized, setIsBuzzBoxInitialized] = useState(false);
  const [callerInfo, setCallerInfo] = useState("");
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [dialNumber, setDialNumber] = useState("");
  const [callHistory, setCallHistory] = useState<any[]>([]);
  
  // Timer reference for call duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start the timer for call duration
  const startTimer = () => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start a new timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop the timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };



  // Initialize BuzzBox service
  const initializeBuzzBox = (apiKey: string, accountId: string, enableTestMode: boolean = false, customConfig?: Partial<BuzzBoxConfig>): boolean => {
    try {
      // Enable MicroSIP integration by default
      const useMicroSip = customConfig?.useMicroSip !== undefined ? customConfig.useMicroSip : true;
      
      // Note: apiKey and accountId are passed but not actually used for authentication
      // Authentication is handled internally by the BuzzBox service using fixed credentials
      const success = buzzBoxService.initialize(
        apiKey,
        accountId,
        (state, caller) => {
          setCallState(state as CallState);
          if (caller) {
            setCallerInfo(caller);
          }
          
          // If we get an incoming call, show the dialer
          if (state === 'incoming') {
            setIsDialerOpen(true);
            setIsMinimized(false);
          }
        },
        () => {
          setCallDuration(prev => prev + 1);
        },
        enableTestMode,
        customConfig
      );
      
      // Set MicroSIP usage flag in the BuzzBox service
      buzzBoxService.setUseMicroSip(useMicroSip);
      
      // Always consider initialization successful
      setIsBuzzBoxInitialized(true);
      return true;
    } catch (error) {
      console.error('Error initializing BuzzBox service:', error);
      // Even if there's an error, try to continue
      setIsBuzzBoxInitialized(true);
      return true;
    }
  };

  // Make a call using BuzzBox
  const makeCall = (phoneNumber: string) => {
    if (isBuzzBoxInitialized) {
      console.log(`Making call to ${phoneNumber} via BuzzBox`);
      setCallState('calling');
      buzzBoxService.call(phoneNumber)
        .then(() => {
          // Call is initiated, the state will be updated by the callback
          // Add to call history
          if (currentCustomer) {
            addCallToHistory({
              id: `call-${Date.now()}`,
              customerName: `${currentCustomer.name} ${currentCustomer.surname_company_trust || ''}`.trim(),
              customerPhone: phoneNumber,
              timestamp: new Date(),
              direction: 'outgoing',
              status: 'initiated',
              customerId: currentCustomer.id
            });
          } else {
            // Call to a number not in the customer list
            addCallToHistory({
              id: `call-${Date.now()}`,
              customerName: 'Unknown',
              customerPhone: phoneNumber,
              timestamp: new Date(),
              direction: 'outgoing',
              status: 'initiated'
            });
          }
        })
        .catch(error => {
          console.error('Error making call:', error);
          setCallState('failed');
          // Reset to idle after a short delay
          setTimeout(() => {
            setCallState('idle');
          }, 2000);
        });
    } else {
      console.warn('BuzzBox not initialized. Please configure BuzzBox first.');
      // Show a notification or alert to the user
      alert('Please configure BuzzBox first to make calls.');
    }
  };

  // End call using BuzzBox
  const endCall = () => {
    if (isBuzzBoxInitialized && (callState === 'calling' || callState === 'connected')) {
      console.log('Ending call via BuzzBox');
      buzzBoxService.hangup()
        .then(() => {
          // Call is ended, the state will be updated by the callback
          // Update the most recent call in history
          if (callHistory.length > 0) {
            const updatedHistory = [...callHistory];
            updatedHistory[0] = {
              ...updatedHistory[0],
              status: 'completed',
              duration: callDuration
            };
            setCallHistory(updatedHistory);
          }
        })
        .catch(error => {
          console.error('Error ending call:', error);
          // Even if there's an error, we should update the UI state
          setCallState('ended');
          stopTimer();
          // Reset to idle after a short delay
          setTimeout(() => {
            setCallState('idle');
          }, 2000);
        });
    } else if (callState === 'incoming') {
      // If it's an incoming call, reject it
      rejectCall();
    } else {
      // If not in a call state, just reset the state
      setCallState('idle');
    }
  };

  // Accept incoming call
  const acceptCall = () => {
    if (isBuzzBoxInitialized && callState === 'incoming') {
      console.log('Accepting incoming call from', callerInfo);
      buzzBoxService.acceptIncomingCall()
        .then(() => {
          // Call is accepted, the state will be updated by the callback
          // Add to call history
          addCallToHistory({
            id: `call-${Date.now()}`,
            customerName: callerInfo || 'Unknown Caller',
            customerPhone: callerInfo.includes('+') ? callerInfo : '+27000000000',
            timestamp: new Date(),
            direction: 'incoming',
            status: 'connected'
          });
        })
        .catch((error: unknown) => {
          console.error('Error accepting call:', error);
          setCallState('failed');
          // Reset to idle after a short delay
          setTimeout(() => {
            setCallState('idle');
          }, 2000);
        });
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (callState === 'incoming') {
      if (isBuzzBoxInitialized) {
        console.log('Rejecting incoming call from', callerInfo);
        buzzBoxService.rejectIncomingCall()
          .then(() => {
            // Call is rejected, add to missed calls
            addMissedCall(callerInfo, callerInfo.includes('+')
              ? callerInfo
              : '+27000000000'); // Fallback number if no phone number is available
            
            // Add to call history
            addCallToHistory({
              id: `call-${Date.now()}`,
              customerName: callerInfo || 'Unknown Caller',
              customerPhone: callerInfo.includes('+') ? callerInfo : '+27000000000',
              timestamp: new Date(),
              direction: 'incoming',
              status: 'rejected'
            });
          })
          .catch(error => {
            console.error('Error rejecting call:', error);
            // Even if there's an error, we should update the UI state
            setCallState('idle');
            // Add to missed calls anyway
            addMissedCall(callerInfo, callerInfo.includes('+')
              ? callerInfo
              : '+27000000000');
          });
      } else {
        // Add to missed calls when explicitly rejected even if BuzzBox is not initialized
        addMissedCall(callerInfo, callerInfo.includes('+')
          ? callerInfo
          : '+27000000000'); // Fallback number if no phone number is available
        setCallState('idle');
      }
    }
  };

  // Removed simulation functionality
  
  // Add a missed call to the list
  const addMissedCall = (callerName: string, phoneNumber: string) => {
    const newMissedCall: MissedCall = {
      id: `missed-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      callerName: callerName || 'Unknown Caller',
      timestamp: new Date(),
      phoneNumber: phoneNumber || '+27000000000',
      read: false
    };
    
    setMissedCalls(prev => [newMissedCall, ...prev]);
  };
  
  // Dismiss a missed call notification
  const dismissMissedCall = (id: string) => {
    setMissedCalls(prev => prev.filter(call => call.id !== id));
  };
  
  // Clear all missed calls
  const clearAllMissedCalls = () => {
    setMissedCalls([]);
  };
  
  // Alias for clearAllMissedCalls for compatibility
  const clearMissedCalls = clearAllMissedCalls;
  
  // Mark a missed call as read
  const markMissedCallAsRead = (id: string) => {
    setMissedCalls(prev => prev.map(call => 
      call.id === id ? { ...call, read: true } : call
    ));
  };
  
  // Add a call to history
  const addCallToHistory = (call: any) => {
    setCallHistory(prev => [call, ...prev]);
  };

  // Reference to track previous call state for missed call detection
  const previousCallStateRef = useRef<CallState>("idle");
  
  // Watch for call state changes to manage timer
  useEffect(() => {
    if (callState === "connected") {
      startTimer();
    } else if (callState === "ended" || callState === "idle") {
      stopTimer();
      
      // Reset duration if call ended or idle
      if (callState === "idle") {
        setCallDuration(0);
      }
    }
    
    // If an incoming call changes to idle without going through connected,
    // it means the call was missed
    if (previousCallStateRef.current === "incoming" && callState === "idle") {
      // This was a missed call
      addMissedCall(callerInfo, callerInfo.includes('+')
        ? callerInfo
        : '+27000000000'); // Fallback number if no phone number is available
    }
    
    previousCallStateRef.current = callState;
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Disconnect BuzzBox service when component unmounts
      buzzBoxService.disconnect();
    };
  }, [callState, callerInfo]);

  // Watch for mute state changes
  useEffect(() => {
    if (isBuzzBoxInitialized) {
      buzzBoxService.toggleMute(isMuted);
    }
  }, [isMuted, isBuzzBoxInitialized]);

  return (
    <DialerContext.Provider
      value={{
        isDialerOpen,
        setIsDialerOpen,
        isMinimized,
        setIsMinimized,
        callState,
        setCallState,
        callDuration,
        setCallDuration,
        currentCustomer,
        setCurrentCustomer,
        isMuted,
        setIsMuted,
        isSpeakerOn,
        setIsSpeakerOn,
        dialNumber,
        setDialNumber,
        callHistory,
        addCallToHistory,
        startTimer,
        stopTimer,
        makeCall,
        endCall,
        acceptCall,
        rejectCall,
        callerInfo,
        initializeBuzzBox,
        isBuzzBoxInitialized,
        missedCalls,
        addMissedCall,
        markMissedCallAsRead,
        dismissMissedCall,
        clearAllMissedCalls,
        clearMissedCalls
      }}
    >
      {children}
    </DialerContext.Provider>
  );
}

export function useDialer() {
  const context = useContext(DialerContext);
  if (context === undefined) {
    throw new Error("useDialer must be used within a DialerProvider");
  }
  return context;
}
