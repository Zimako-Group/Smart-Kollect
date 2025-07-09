"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Phone, X, Mic, MicOff, PhoneOff, User, Clock, Volume2, ChevronDown, MoreVertical, Copy,
  VoicemailIcon, CheckSquare, Clock3, PhoneMissed, XCircle, Skull, Ban, Shield, UserCog,
  DollarSign, CheckCircle2, MessagesSquare, XSquare, UserCheck, Users, UserRound, SearchIcon,
  Briefcase, UserMinus, AlertTriangle, PhoneForwarded, Calendar as CalendarIcon,
  BellRing, Info, CheckCircle, AlertCircle
} from "lucide-react";
import { buzzBoxService } from "@/lib/buzzBoxService";
import { callbackService } from "@/lib/callback-service";
import { callTrackingService, ActiveCall } from "@/lib/call-tracking-service";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase, supabaseAdmin } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface FloatingDialerProps {
  phoneNumber: string;
  customerName?: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function FloatingDialer({ phoneNumber, customerName, onClose, isOpen }: FloatingDialerProps) {
  // State to track call status and duration
  const [callStatus, setCallStatus] = useState<string>("idle");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [showWrapUpDialog, setShowWrapUpDialog] = useState(false);
  const [isAutoConnectActive, setIsAutoConnectActive] = useState(false);
  const [wrapUpOutcome, setWrapUpOutcome] = useState<string>("No Answer");
  const [wrapUpNotes, setWrapUpNotes] = useState<string>("");
  const [callbackDate, setCallbackDate] = useState<Date | undefined>();
  const [showCallbackDatePicker, setShowCallbackDatePicker] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80); // Default volume at 80%
  
  // Callback dialog state
  const [showCallbackDialog, setShowCallbackDialog] = useState(false);
  const [callbackNotes, setCallbackNotes] = useState<string>("");
  const [callbackTime, setCallbackTime] = useState<string>("12:00");
  const [callbackReason, setCallbackReason] = useState<string>("");
  const [debtorId, setDebtorId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  const [agentName, setAgentName] = useState<string>("");
  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false);
  
  // Call tracking state
  const [activeCallRecord, setActiveCallRecord] = useState<ActiveCall | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current user info when component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // First try to get user from localStorage where it's stored by AuthContext
        const storedUser = localStorage.getItem('zimako_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            console.log('Found user ID in localStorage:', parsedUser.id);
            setAgentId(parsedUser.id);
            setAgentName(parsedUser.name || parsedUser.email || 'Unknown Agent');
          }
        }
        
        // If we couldn't get the user from localStorage, try to get it from the Supabase session
        if (!agentId) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            console.log('Found user ID from Supabase session:', data.session.user.id);
            setAgentId(data.session.user.id);
            setAgentName(data.session.user.email || 'Unknown Agent');
          }
        }
        
        // Try to extract debtor ID from URL if we're on a customer profile page
        const url = window.location.pathname;
        const match = url.match(/\/user\/customers\/([\w-]+)/);
        if (match && match[1]) {
          console.log('Found debtor ID in URL:', match[1]);
          setDebtorId(match[1]);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };

    getCurrentUser();
  }, [agentId]);
  
  // Direct MicroSIP call function
  const openMicroSIP = (number: string) => {
    if (!number) return false;

    try {
      // Format the phone number
      let formattedNumber = number.replace(/\D/g, ""); // Remove non-numeric characters

      // Add South African format if needed
      if (formattedNumber.startsWith("0")) {
        // Keep the 0 prefix for MicroSIP
        console.log(`Using South African format with 0 prefix: ${formattedNumber}`);
      } else if (formattedNumber.startsWith("27")) {
        // Convert 27 prefix to 0
        formattedNumber = "0" + formattedNumber.substring(2);
        console.log(`Converted 27 prefix to 0: ${formattedNumber}`);
      }

      // Create the SIP URI for MicroSIP
      const sipDomain = "zimakosmartbusinesssolutions.sip.buzzboxcloud.com";
      const sipUri = `sip:${formattedNumber}@${sipDomain}`;

      console.log(`Opening MicroSIP with URI: ${sipUri}`);

      // Use a hidden anchor element to launch the protocol without navigating away
      try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = `callto:${formattedNumber}`;
        link.style.display = 'none';
        document.body.appendChild(link);

        // Click the link to trigger the protocol handler
        link.click();

        // Remove the link after clicking
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);

        return true;
      } catch (e) {
        console.log("Error with protocol handling:", e);
        return false;
      }
    } catch (error) {
      console.error('Error opening MicroSIP:', error);
      return false;
    }
  };

  // Initialize BuzzBox with MicroSIP config - only once when component mounts
  useEffect(() => {
    // Register callbacks for call state changes
    buzzBoxService.registerCallbacks(
      async (state) => {
        console.log(`Call state changed: ${state}`);
        setCallStatus(state);

        // Update call tracking status
        if (activeCallRecord) {
          if (state === 'connected') {
            setCallDuration(0);
            await callTrackingService.updateCallStatus(activeCallRecord.id, 'connected');
          } else if (state === 'ended' || state === 'idle') {
            const finalDuration = callDuration;
            setCallDuration(0);
            await callTrackingService.endCall(activeCallRecord.id, finalDuration);
            setActiveCallRecord(null);
            setCallStartTime(null);
          } else if (state === 'calling') {
            await callTrackingService.updateCallStatus(activeCallRecord.id, 'dialing');
          }
        }
      },
      () => setCallDuration(prev => prev + 1)
    );

    // Initialize BuzzBox with MicroSIP configuration
    buzzBoxService.initialize(
      'tshepangs@zimako.co.za', // API key
      '200', // Account ID
      null, // We already registered callbacks above
      null, // We already registered callbacks above
      false, // Not in test mode
      {
        useMicroSip: true, // Enable MicroSIP integration
        sipUsername: "200",
        sipPassword: "x4ZUA2T4bA",
        sipDomain: "zimakosmartbusinesssolutions.sip.buzzboxcloud.com:5080",
        sipProxy: ""
      }
    );

    return () => {
      // Clean up if needed
      if (callStatus === 'connected' || callStatus === 'calling') {
        buzzBoxService.hangup();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle making a call - wrapped in useCallback to prevent recreation on every render
  const handleCall = useCallback(async () => {
    if (!phoneNumber) return;

    try {
      setCallStatus('calling');
      setCallStartTime(new Date());

      // Start tracking the call in the database
      if (agentId && agentName) {
        const callRecord = await callTrackingService.startCall({
          agent_id: agentId,
          agent_name: agentName,
          customer_name: customerName || 'Unknown Customer',
          customer_phone: phoneNumber,
          customer_id: debtorId || undefined,
          call_type: 'outbound'
        });
        
        if (callRecord) {
          setActiveCallRecord(callRecord);
          console.log('Call tracking started:', callRecord);
        }
      }

      // Make the call using BuzzBox service's public call method
      // This will use MicroSIP because we initialized with useMicroSip: true
      await buzzBoxService.call(phoneNumber);
    } catch (error) {
      console.error('Error making call:', error);
      setCallStatus('failed');
      
      // End call tracking if it was started
      if (activeCallRecord) {
        await callTrackingService.endCall(activeCallRecord.id, 0);
        setActiveCallRecord(null);
      }
    }
  }, [phoneNumber, agentId, agentName, customerName, debtorId, activeCallRecord]); // Add dependencies

  // Set up automatic call duration timer when connected
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let dbUpdateTimer: NodeJS.Timeout | null = null;

    if (callStatus === 'connected') {
      // Start a timer to update call duration every second
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Update database every 10 seconds with current duration
      dbUpdateTimer = setInterval(async () => {
        if (activeCallRecord) {
          try {
            await callTrackingService.updateCallStatus(activeCallRecord.id, 'connected', callDuration);
          } catch (error) {
            console.error('Error updating call duration in database:', error);
          }
        }
      }, 10000); // Update database every 10 seconds
    }

    // Auto-detect call as connected after a delay when in 'calling' state
    if (callStatus === 'calling' && !isAutoConnectActive) {
      setIsAutoConnectActive(true); // Mark that we've started the auto-connect process
      const autoConnectTimer = setTimeout(async () => {
        console.log('Auto-detecting call as connected after delay');
        setCallStatus('connected');
        setIsAutoConnectActive(false); // Reset the flag after connecting
        
        // Update call status in database
        if (activeCallRecord) {
          try {
            await callTrackingService.updateCallStatus(activeCallRecord.id, 'connected', callDuration);
            console.log('Call status updated to connected in database');
          } catch (error) {
            console.error('Error updating call status:', error);
          }
        }
      }, 5000); // Assume call connects after 5 seconds

      // Clean up the timer
      return () => {
        clearTimeout(autoConnectTimer);
      };
    }

    // Clean up timers when component unmounts or call ends
    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (dbUpdateTimer) {
        clearInterval(dbUpdateTimer);
      }
    };
  }, [callStatus]); // Depend on callStatus to restart timer when status changes

  // Track if the initial call has been made to prevent auto-calling again
  const [initialCallMade, setInitialCallMade] = useState(false);
  
  // Make the call ONLY when the dialer first opens
  useEffect(() => {
    if (isOpen && phoneNumber && !initialCallMade) {
      handleCall();
      setInitialCallMade(true);
    }
  }, [isOpen, phoneNumber, initialCallMade, handleCall]);

  // Handle hanging up
  const handleHangup = async () => {
    // End the call through BuzzBox service
    buzzBoxService.hangup();

    // Update call status
    setCallStatus('ended');
    console.log('Call ended manually');

    // End call tracking if we have an active call record
    if (activeCallRecord) {
      try {
        await callTrackingService.endCall(activeCallRecord.id, callDuration);
        console.log('Call tracking ended:', activeCallRecord.id);
        setActiveCallRecord(null);
      } catch (error) {
        console.error('Error ending call tracking:', error);
      }
    }

    // Show wrap-up dialog immediately
    setShowWrapUpDialog(true);
    console.log('Opening wrap-up dialog:', showWrapUpDialog);

    // Add call to history or perform other end-of-call tasks here
    // (similar to the main dialer's handleEndCall function)
  };

  // Handle wrap-up dialog close
  const handleWrapUpComplete = async () => {
    try {
      // Get the current time for call end time
      const currentTime = new Date();

      // Calculate call start time based on duration
      const callStartTime = new Date(currentTime.getTime() - (callDuration * 1000));
      
      console.log(`Call wrapped up with outcome: ${wrapUpOutcome}`);
      if (wrapUpNotes) console.log(`Notes: ${wrapUpNotes}`);
      
      // Get current user info from localStorage
      let currentAgentId = "";
      let currentAgentName = "Unknown Agent";
      try {
        const storedUser = localStorage.getItem('zimako_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          currentAgentId = user.id;
          currentAgentName = user.name || user.email || 'Unknown Agent';
          setAgentId(currentAgentId);
          setAgentName(currentAgentName);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
      
      // If we have notes, save them to the Notes table
      if (wrapUpNotes && wrapUpNotes.trim() !== "") {
        try {
          // Get the customer ID from URL if we're on a customer page
          let customerId = '';
          try {
            // Try to extract customer ID from URL if we're on a customer page
            const url = window.location.pathname;
            const matches = url.match(/\/customers\/([^/]+)/);
            if (matches && matches[1]) {
              customerId = matches[1];
              console.log('Extracted customer ID from URL:', customerId);
            }
          } catch (error) {
            console.error('Error extracting customer ID from URL:', error);
          }
          
          // Import Supabase admin client to bypass RLS
          const { supabaseAdmin } = await import('@/lib/supabaseClient');
          
          // Use the current agent's ID from the component state
          let userId = agentId; // This is set in the useEffect at component mount
          
          console.log('Using current agent ID for note:', userId);
          
          // If somehow the agent ID is still not available, try to get it from localStorage
          if (!userId) {
            try {
              // Try zimako_user first (from the useEffect)
              const storedUser = localStorage.getItem('zimako_user');
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.id) {
                  userId = parsedUser.id;
                  console.log('Got agent ID from localStorage (zimako_user):', userId);
                }
              }
              
              // If still no ID, try other possible localStorage keys
              if (!userId) {
                const userString = localStorage.getItem('user');
                if (userString) {
                  const user = JSON.parse(userString);
                  userId = user.id;
                  console.log('Got agent ID from localStorage (user):', userId);
                }
              }
            } catch (error) {
              console.error('Error getting agent ID from localStorage:', error);
            }
          }
          
          // If still no user ID, use a valid agent ID as fallback
          if (!userId) {
            // Using TJ Marvin's ID as a last resort fallback
            userId = '7c92425c-f2f9-4a27-ade2-1f2fae932b5f'; // TJ Marvin's ID
            console.log('Using TJ Marvin ID as fallback - no agent ID available');
          }
          
          // Create a note record with the call wrap-up information
          const noteData = {
            id: crypto.randomUUID(),
            customer_id: customerId || (customerName ? customerName.split(' ')[0] : phoneNumber), // Use customer ID from URL, or name/phone as fallback
            content: `Call Outcome: ${wrapUpOutcome}\n\n${wrapUpNotes}`, // Combine outcome and notes in content
            created_by: userId, // Never null
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: 'contact', // Using 'contact' as the category for call notes
            is_important: false,
            is_private: false
          };
          
          console.log('Saving call note to database:', noteData);
          console.log('Using customer_id:', noteData.customer_id);
          
          // Save the note to the database using admin client to bypass RLS
          const { data, error } = await supabaseAdmin
            .from('notes')
            .insert(noteData)
            .select();
            
          if (error) {
            console.error('Error saving call note:', error);
            toast.error(`Failed to save call note: ${error.message}`);
          } else {
            console.log('Call note saved successfully with ID:', noteData.id);
            toast.success('Call note saved');
            
            // Force refresh account history if we're on a customer page
            try {
              // Dispatch a custom event that the customer profile page can listen for
              const refreshEvent = new CustomEvent('refreshAccountHistory', { 
                detail: { noteId: noteData.id, accountId: noteData.customer_id } 
              });
              window.dispatchEvent(refreshEvent);
              console.log('Dispatched refreshAccountHistory event');
            } catch (eventError) {
              console.error('Error dispatching refresh event:', eventError);
            }
          }
        } catch (noteError) {
          console.error('Error saving note:', noteError);
          toast.error(`Failed to save call note: ${noteError instanceof Error ? noteError.message : 'Unknown error'}`);
        }
      }
      
      // If callback is selected, show the callback dialog
      if (wrapUpOutcome === "Call Back") {
        // Set callback date from the wrap-up dialog
        if (callbackDate) {
          // Set default time to 12:00 if not provided
          setCallbackTime("12:00");
        } else {
          // Default to tomorrow at noon if no date selected
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setCallbackDate(tomorrow);
          setCallbackTime("12:00");
        }
        
        // Set callback notes from wrap-up notes
        setCallbackNotes(wrapUpNotes);
        
        // Close wrap-up dialog and open callback dialog
        setShowWrapUpDialog(false);
        setShowCallbackDialog(true);
        return;
      }
      
      // Close the wrap-up dialog
      setShowWrapUpDialog(false);
      
      // Reset all states
      setCallStatus('idle');
      setCallDuration(0);
      setWrapUpOutcome("No Answer");
      setWrapUpNotes("");
      setCallbackDate(undefined);
      setShowCallbackDatePicker(false);
    } catch (error) {
      console.error('Error completing wrap-up:', error);
      toast.error(`Error completing call wrap-up: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle creating a callback
  const handleCreateCallback = async () => {
    try {
      setIsSubmittingCallback(true);
      
      // Validate required fields
      if (!callbackDate) {
        toast.error("Please select a callback date");
        setIsSubmittingCallback(false);
        return;
      }
      
      if (!callbackTime) {
        toast.error("Please select a callback time");
        setIsSubmittingCallback(false);
        return;
      }
      
      // Get current user info if not already set
      let currentAgentId = agentId;
      let currentAgentName = agentName;
      
      if (!currentAgentId) {
        // Try to get user from localStorage
        const storedUser = localStorage.getItem('zimako_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user && user.id) {
              currentAgentId = user.id;
              currentAgentName = user.name || user.email || 'Unknown Agent';
              // Update state for future use
              setAgentId(currentAgentId);
              setAgentName(currentAgentName);
            } else {
              throw new Error("Invalid user data");
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
            // Don't return yet, try the Supabase session as a fallback
          }
        }
        
        // If we still don't have an agent ID, try to get it from the Supabase session
        if (!currentAgentId) {
          try {
            // Show loading toast
            toast.loading("Getting user information...");
            
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
              currentAgentId = data.session.user.id;
              currentAgentName = data.session.user.email || 'Unknown Agent';
              // Update state for future use
              setAgentId(currentAgentId);
              setAgentName(currentAgentName);
              toast.dismiss();
            } else {
              toast.dismiss();
              toast.error("Could not identify current user. Please log in again.");
              setIsSubmittingCallback(false);
              return;
            }
          } catch (error) {
            console.error("Error getting Supabase session:", error);
            toast.dismiss();
            toast.error("Could not identify current user. Please log in again.");
            setIsSubmittingCallback(false);
            return;
          }
        }
      }
      
      // Combine date and time
      const callbackDateTime = new Date(callbackDate);
      const [hours, minutes] = callbackTime.split(':').map(Number);
      callbackDateTime.setHours(hours, minutes, 0, 0);
      
      // Show loading toast
      toast.loading("Creating callback reminder...");
      
      // Create callback in database
      const result = await callbackService.createCallback({
        agent_id: currentAgentId,
        agent_name: currentAgentName,
        debtor_id: debtorId || "00000000-0000-0000-0000-000000000000", // Placeholder if no debtor ID
        phone_number: phoneNumber,
        callback_date: callbackDateTime,
        notes: callbackNotes,
        status: 'pending'
      });
      
      if (result.success) {
        toast.dismiss();
        toast.success("Callback reminder created successfully");
        
        // Close the callback dialog
        setShowCallbackDialog(false);
        
        // Reset all states
        setCallStatus('idle');
        setCallDuration(0);
        setWrapUpOutcome("No Answer");
        setWrapUpNotes("");
        setCallbackDate(undefined);
        setShowCallbackDatePicker(false);
        setCallbackNotes("");
        setCallbackTime("12:00");
        setCallbackReason("");
      } else {
        toast.dismiss();
        toast.error(`Failed to create callback: ${result.error}`);  
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Error creating callback: ${error.message || 'Unknown error'}`);
      console.error('Error creating callback:', error);
    } finally {
      setIsSubmittingCallback(false);
    }
  };

  // Handle toggling mute
  const handleToggleMute = async () => {
    try {
      await buzzBoxService.toggleMute(!isMuted);
      setIsMuted(!isMuted);
      toast.success(isMuted ? "Microphone unmuted" : "Microphone muted");
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error("Failed to toggle mute");
    }
  };

  // Handle copying phone number to clipboard
  const handleCopyNumber = () => {
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber)
        .then(() => toast.success("Phone number copied to clipboard"))
        .catch(() => toast.error("Failed to copy phone number"));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50 w-80 shadow-2xl"
        >
        <Card className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 overflow-hidden rounded-xl">
          {/* Header with gradient background */}
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 flex flex-row justify-between items-center space-y-0">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-white flex items-center">
                  {customerName || "Unknown"}
                </CardTitle>
                <p className="text-xs text-white/70 mt-0.5 flex items-center">
                  <Phone className="h-3 w-3 mr-1 inline" />
                  {phoneNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", isMinimized ? "rotate-180" : "")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Expandable content */}
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-4 text-center">
                {/* Call status badge */}
                <Badge
                  className={cn(
                    "mb-3 px-3 py-1 font-medium",
                    callStatus === 'connected' ? "bg-green-500/20 text-green-400 border-green-500/50" :
                    callStatus === 'calling' ? "bg-blue-500/20 text-blue-400 border-blue-500/50" :
                    callStatus === 'failed' ? "bg-red-500/20 text-red-400 border-red-500/50" :
                    callStatus === 'ended' ? "bg-amber-500/20 text-amber-400 border-amber-500/50" :
                    "bg-slate-500/20 text-slate-400 border-slate-500/50"
                  )}
                >
                  {callStatus === 'idle' && 'Ready'}
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'connected' && 'Connected'}
                  {callStatus === 'ended' && 'Call Ended'}
                  {callStatus === 'failed' && 'Call Failed'}
                </Badge>

                {/* Phone number with copy button */}
                <div className="flex items-center justify-center mb-3">
                  <div
                    className="flex items-center bg-slate-800/80 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-800"
                    onClick={handleCopyNumber}
                  >
                    <span className="text-slate-300 mr-2">{phoneNumber}</span>
                    <Copy className="h-3 w-3 text-slate-400" />
                  </div>
                </div>

                {/* Call duration */}
                {callStatus === 'connected' && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                      <div className="flex items-center text-green-400 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="text-xs">Call Duration</span>
                      </div>
                      <div className="text-2xl font-mono text-green-400">
                        {formatDuration(callDuration)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Volume control - only shown when connected */}
                {callStatus === 'connected' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 flex items-center">
                        <Volume2 className="h-3 w-3 mr-1" /> Volume
                      </span>
                      <span className="text-xs text-slate-400">{volume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
          
          {/* Footer with call controls */}
          <CardFooter 
            className={cn(
              "bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 p-3 flex justify-center space-x-2",
              isMinimized ? "rounded-b-xl" : ""
            )}
          >
            {/* Call button - shown when idle, ended or failed */}
            {(callStatus === 'idle' || callStatus === 'ended' || callStatus === 'failed') && (
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-md shadow-green-900/30"
                onClick={handleCall}
              >
                <Phone className="h-4 w-4 mr-2" />
                {callStatus === 'idle' ? 'Call' : 'Call Again'}
              </Button>
            )}
            
            {/* Mute button */}
            <Button 
              variant={isMuted ? "default" : "outline"}
              className={cn(
                isMuted 
                  ? "bg-amber-600 hover:bg-amber-700 text-white" 
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
              )}
              onClick={handleToggleMute}
              disabled={callStatus !== 'connected'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            {/* Hangup button */}
            <Button 
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-none shadow-md shadow-red-900/30"
              onClick={handleHangup}
              disabled={callStatus !== 'calling' && callStatus !== 'connected'}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
    
    {/* Wrap-up Dialog */}
    <Dialog 
      open={showWrapUpDialog} 
      onOpenChange={(open) => {
        console.log('Dialog open state changed to:', open);
        setShowWrapUpDialog(open);
      }}
    >
      <DialogContent className="bg-slate-900 border border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Call Wrap-Up</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-start gap-4">
            {/* Wrap-up Codes - Exact same as main dialer */}
            <div className="col-span-1">
              <Label htmlFor="outcome" className="text-slate-300">Call Outcome</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 mt-2 bg-slate-800/50 p-4 rounded-lg">
                {[
                  "Answering Machine",
                  "Account Settled",
                  "Call Back",
                  "Call Ended",
                  "Dead Air",
                  "Debtor Deceased",
                  "Diconnected Number",
                  "Do Not Call",
                  "Government Pensioner",
                  "Hang Up",
                  "Indigent Applicant",
                  "No Answer",
                  "Not Intrested",
                  "Paying Below Required Amount",
                  "Promise To Pay",
                  "PTP Callback",
                  "Query",
                  "Refuse To Pay",
                  "Sassa Pensioner",
                  "Spouse",
                  "Third Party",
                  "Trace",
                  "Unallocated Account",
                  "Unemployed",
                  "Wrong Number",
                  "Call Transferred",
                ].map((outcome) => (
                  <Button
                    key={outcome}
                    type="button"
                    variant={wrapUpOutcome === outcome ? "default" : "outline"}
                    className={`${
                      wrapUpOutcome === outcome
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    } text-xs h-auto py-2 flex items-center`}
                    onClick={() => {
                      setWrapUpOutcome(outcome);
                      if (outcome === "Call Back" || outcome === "PTP Callback") {
                        setShowCallbackDatePicker(true);
                      } else {
                        setShowCallbackDatePicker(false);
                      }
                    }}
                  >
                    {outcome === "Answering Machine" && (
                      <VoicemailIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Account Settled" && (
                      <CheckSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Call Back" && (
                      <Clock3 className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Call Ended" && (
                      <PhoneOff className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Dead Air" && (
                      <MicOff className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Debtor Deceased" && (
                      <Skull className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Diconnected Number" && (
                      <PhoneOff className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Do Not Call" && (
                      <Ban className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Government Pensioner" && (
                      <Shield className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Hang Up" && (
                      <PhoneOff className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Indigent Applicant" && (
                      <UserCog className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "No Answer" && (
                      <PhoneMissed className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Not Intrested" && (
                      <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Paying Below Required Amount" && (
                      <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Promise To Pay" && (
                      <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "PTP Callback" && (
                      <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Query" && (
                      <MessagesSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Refuse To Pay" && (
                      <XSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Sassa Pensioner" && (
                      <UserCheck className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Spouse" && (
                      <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Third Party" && (
                      <UserRound className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Trace" && (
                      <SearchIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Unallocated Account" && (
                      <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Unemployed" && (
                      <UserMinus className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Wrong Number" && (
                      <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome === "Call Transferred" && (
                      <PhoneForwarded className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {outcome}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Callback Date Picker - Only show if callback is selected */}
            {(wrapUpOutcome === "Call Back" || wrapUpOutcome === "PTP Callback") && showCallbackDatePicker && (
              <div className="col-span-1 bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-indigo-400 mb-3">Select Callback Date:</p>
                <div className="bg-slate-900 rounded-md p-2 border border-slate-700">
                  <Calendar
                    mode="single"
                    selected={callbackDate}
                    onSelect={(date) => setCallbackDate(date)}
                    className="bg-slate-900 text-white"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </div>
            )}
            
            {/* Notes Field */}
            <div className="col-span-1">
              <p className="text-sm font-medium text-indigo-400 mb-2">Notes:</p>
              <textarea
                value={wrapUpNotes}
                onChange={(e) => setWrapUpNotes(e.target.value)}
                className="w-full h-20 bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 text-sm"
                placeholder="Add any additional notes about the call..."
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleWrapUpComplete}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none"
          >
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Callback Dialog */}
    <Dialog 
      open={showCallbackDialog} 
      onOpenChange={(open) => {
        if (!open && !isSubmittingCallback) {
          setShowCallbackDialog(false);
        }
      }}
    >
      <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-3xl w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-400" />
            Schedule Callback
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card className="bg-blue-900/30 border border-blue-700/30 p-3">
            <CardDescription className="text-blue-300 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Schedule a callback reminder for this customer. You&apos;ll be notified when it&apos;s time to call them back.</span>
            </CardDescription>
          </Card>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-3">
              <Label htmlFor="callback-customer" className="text-slate-300 mb-2 block">Customer Information</Label>
              <div className="bg-slate-800 rounded-md p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-900/50 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-slate-200 text-lg font-medium">{customerName || "Unknown Customer"}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">{phoneNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 px-3 py-1 rounded-md border border-slate-700">
                    <span className="text-xs text-slate-400">Account ID:</span>
                    <span className="text-sm text-slate-300 ml-1 font-mono">{debtorId ? debtorId.substring(0, 8) + '...' : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="callback-date" className="text-slate-300 mb-2 block">Callback Date</Label>
              <div className="relative">
                <div className="bg-slate-800 rounded-md p-3 border border-slate-700">
                  <Calendar
                    mode="single"
                    selected={callbackDate}
                    onSelect={(date) => setCallbackDate(date)}
                    className="bg-slate-800 text-white"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </div>
            </div>
            
            <div className="col-span-1 space-y-4">
              <div>
                <Label htmlFor="callback-time" className="text-slate-300 mb-2 block">Callback Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="callback-time"
                    type="time"
                    value={callbackTime}
                    onChange={(e) => setCallbackTime(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-slate-200 pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="callback-reason" className="text-slate-300 mb-2 block">Reason (Optional)</Label>
                <div className="relative">
                  <Info className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="callback-reason"
                    value={callbackReason}
                    onChange={(e) => setCallbackReason(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-slate-200 pl-10"
                    placeholder="Brief reason for callback"
                  />
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-800/20 rounded-md p-3">
                <h4 className="text-blue-400 text-sm font-medium flex items-center gap-2 mb-2">
                  <BellRing className="h-4 w-4" />
                  Callback Reminder
                </h4>
                <p className="text-xs text-slate-300">You&apos;ll receive a notification when it&apos;s time for this callback.</p>
              </div>
            </div>
            
            <div className="col-span-3">
              <Label htmlFor="callback-notes" className="text-slate-300 mb-2 block">Notes</Label>
              <Textarea
                id="callback-notes"
                value={callbackNotes}
                onChange={(e) => setCallbackNotes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-200 min-h-[120px]"
                placeholder="Add any details about the callback..."
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCallbackDialog(false)}
            disabled={isSubmittingCallback}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCallback}
            disabled={isSubmittingCallback}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {isSubmittingCallback ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <BellRing className="h-4 w-4 mr-2" />
                Schedule Callback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
