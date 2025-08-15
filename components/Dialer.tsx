"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { MissedCallNotification } from "@/components/MissedCallNotification";

import { BuzzBoxConfig } from "@/components/BuzzBoxConfig";
import {
  AlertTriangle,
  CheckCircle,
  History,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Search as SearchIcon,
  User,
  Volume2,
  VolumeX,
  X,
  Minus,
  Clock3,
  CalendarIcon,
  ClipboardCheck,
  XCircle,
  ArrowUp,
  PhoneOffIcon,
  MessageSquare,
  MessagesSquare,
  CheckCircle2,
  Bell,
  BellRing,
  UserCheck,
  Shield,
  VoicemailIcon,
  CheckSquare,
  Skull,
  Ban,
  UserCog,
  ArrowDown,
  DollarSign,
  Calendar,
  XSquare,
  Users,
  UserRound,
  Briefcase,
  UserMinus,
  PhoneForwarded
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useDialer } from "@/contexts/DialerContext";
import { formatDuration } from "@/lib/utils";

// Import the CallState type from DialerContext
type CallState = "idle" | "calling" | "connected" | "ended" | "registered" | "failed" | "incoming" | "missed";
import { type CheckedState } from "@radix-ui/react-checkbox";
import { callWrapUpService } from "@/lib/call-wrap-up-service";
import { toast } from "sonner";

// Define debtor type based on the Supabase schema
type Debtor = {
  id: string;
  acc_number: string;
  name: string;
  surname_company_trust: string;
  cell_number: string;
  cell_number2?: string;
  home_tel?: string;
  work_tel?: string;
  outstanding_balance: number;
  account_status_description?: string;
  email_addr_1?: string;
  status?: string;
};

// Define pagination type
type Pagination = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "overdue":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "current":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
};

interface DialerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Dialer({ open, onOpenChange }: DialerProps) {
  // Import supabase client
  const { supabase } = require("@/lib/supabaseClient");

  // Pagination settings
  const PAGE_SIZE = 100; // Number of debtors per page
  // Add a CSS animation for the missed call notification
  useEffect(() => {
    // Add the animation to the stylesheet if it doesn't exist
    if (!document.getElementById("dialer-animations")) {
      const style = document.createElement("style");
      style.id = "dialer-animations";
      style.innerHTML = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Clean up the style element when component unmounts
      const styleElement = document.getElementById("dialer-animations");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [supabase]);

  // Get dialer state from context
  const {
    isMinimized,
    setIsMinimized,
    callState,
    setCallState,
    callDuration,
    setCallDuration,
    isMuted,
    setIsMuted,
    isSpeakerOn,
    setIsSpeakerOn,
    dialNumber,
    setDialNumber,
    callHistory,
    addCallToHistory,
    currentCustomer,
    setCurrentCustomer,
    initializeBuzzBox,
    isBuzzBoxInitialized,
    makeCall,
    endCall,
    acceptCall,
    rejectCall,
    callerInfo,
    missedCalls,
    markMissedCallAsRead,
    clearMissedCalls,
  } = useDialer();

  // Local state
  const [activeTab, setActiveTab] = useState<"dialer" | "search" | "history">(
    "dialer"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [filteredDebtors, setFilteredDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  // Manual dialer only - no auto-dialer

  const [showBuzzBoxConfig, setShowBuzzBoxConfig] = useState(false);
  const [useMicroSip, setUseMicroSip] = useState(false);
  const [formattedDuration, setFormattedDuration] = useState("00:00");
  const [showWrapUpDialog, setShowWrapUpDialog] = useState(false);
  const [wrapUpNotes, setWrapUpNotes] = useState("");
  const [wrapUpOutcome, setWrapUpOutcome] = useState<string>("Other");
  const [callbackDate, setCallbackDate] = useState<Date | undefined>(undefined);
  const [showCallbackDatePicker, setShowCallbackDatePicker] = useState(false);
  const [showMissedCallNotification, setShowMissedCallNotification] =
    useState(false);

  const router = useRouter();

  // Format call duration
  useEffect(() => {
    if (callDuration > 0) {
      setFormattedDuration(formatDuration(callDuration));
    } else {
      setFormattedDuration("00:00");
    }
  }, [callDuration]);

  // Show missed call notification when new missed calls come in
  useEffect(() => {
    if (missedCalls.length > 0 && missedCalls.some((call) => !call.read)) {
      setShowMissedCallNotification(true);
    }
  }, [missedCalls]);


  
  // Handle BuzzBox initialization
  const handleInitializeBuzzBox = useCallback(() => {
    if (!isBuzzBoxInitialized) {
      // IMPORTANT: BuzzBox credentials
      // These are the BuzzBox account credentials
      const apiKey = "tshepangs@zimako.co.za"; // Using email as API key
      const accountId = "200"; // This is the SIP account ID/extension
      const enableTestMode = false; // Disable test mode to use real calls
      
      // The email/password authentication is handled separately in the BuzzBox service

      // Pass BuzzBox API configuration
      initializeBuzzBox(apiKey, accountId, enableTestMode, {
        useMicroSip: true, // Enable MicroSIP integration
        sipUsername: "200",
        sipPassword: "x4ZUA2T4bA", // SIP password (still needed for configuration)
        sipDomain: "zimakosmartbusinesssolutions.sip.buzzboxcloud.com:5080",
        sipProxy: ""
      });
      
      // Set call state to registered to avoid the Call Failed message
      setCallState("registered");
      
      // Enable MicroSIP in the local state
      setUseMicroSip(true);

      console.log("BuzzBox initialized with real credentials and MicroSIP enabled");
    }
  }, [isBuzzBoxInitialized, initializeBuzzBox, setCallState, setUseMicroSip]);

  // Handle dialer input
  const handleDialerInput = (digit: string) => {
    setDialNumber(dialNumber + digit);
  };

  // Clear dialer input
  const clearDialerInput = () => {
    setDialNumber("");
  };

  // Set up automatic detection of call state changes for MicroSIP
  const setupCallStateDetection = (phoneNumber: string) => {
    // Simulate call answered after a reasonable time (8-12 seconds)
    // This is based on the assumption that if MicroSIP is still open after this time,
    // the call was likely answered
    const answerDetectionTime = 5000 + Math.random() * 7000; // Random time between 5-12 seconds
    
    const callAnsweredTimer = setTimeout(() => {
      // Check if we're still in the calling state
      if (callState === "calling") {
        // Get current call data
        const currentCallData = localStorage.getItem('currentCall');
        if (currentCallData) {
          const callData = JSON.parse(currentCallData);
          
          // Only proceed if this timer is for the current call
          if (callData.number === phoneNumber && callData.state === 'calling') {
            console.log('Auto-detecting call as answered based on duration');
            handleCallStateChange("connected");
            
            // Update call data in localStorage
            localStorage.setItem('currentCall', JSON.stringify({
              ...callData,
              state: 'connected',
              connectedTime: new Date().toISOString()
            }));
            
            // Start monitoring for call end
            setupCallEndDetection();
          }
        }
      }
    }, answerDetectionTime);
    
    // Clean up the timer if component unmounts
    return () => clearTimeout(callAnsweredTimer);
  };
  
  // Set up detection for call ending
  const setupCallEndDetection = () => {
    // Check for MicroSIP window closure or focus changes
    // This uses the document visibility API to detect when the user returns to our app
    const handleVisibilityChange = () => {
      if (!document.hidden && callState === "connected") {
        // User has returned to our app - check if enough time has passed to consider the call ended
        const currentCallData = localStorage.getItem('currentCall');
        if (currentCallData) {
          const callData = JSON.parse(currentCallData);
          const connectedTime = new Date(callData.connectedTime || callData.startTime);
          const now = new Date();
          const callDurationMs = now.getTime() - connectedTime.getTime();
          
          // If it's been more than 30 seconds since connected and user returns to our app,
          // it's likely they've finished the call in MicroSIP
          if (callDurationMs > 30000) {
            console.log('Auto-detecting call as ended based on user returning to app');
            handleCallStateChange("ended");
            localStorage.removeItem('currentCall');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        }
      }
    };
    
    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also set a maximum call duration after which we'll automatically end the call
    // This is a fallback in case the visibility events don't trigger
    const maxCallDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const callEndTimer = setTimeout(() => {
      if (callState === "connected") {
        console.log('Auto-detecting call as ended based on maximum duration');
        handleCallStateChange("ended");
        localStorage.removeItem('currentCall');
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    }, maxCallDuration);
    
    // Return cleanup function
    return () => {
      clearTimeout(callEndTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };
  
  // Function to directly open MicroSIP with a phone number
  const openMicroSIP = (phoneNumber: string) => {
    try {
      // Format the phone number
      let formattedNumber = phoneNumber.replace(/\D/g, ""); // Remove non-numeric characters
      
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
      
      // Update call state to 'calling'
      setCallState("calling");
      console.log("Call state updated to: calling");
      
      // Store the current call info in localStorage for auto-detection
      localStorage.setItem('currentCall', JSON.stringify({
        number: formattedNumber,
        startTime: new Date().toISOString(),
        state: 'calling'
      }));
      
      // Set up auto-detection of call state changes
      setupCallStateDetection(formattedNumber);
      
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

      return true;
    } catch (error) {
      console.error("Error opening MicroSIP:", error);
      setCallState("failed");
      return false;
    }
  };
  
  // Function to manually update call state when using MicroSIP
  const handleCallStateChange = (newState: CallState) => {
    console.log(`Manually changing call state to: ${newState}`);
    
    if (newState === "connected" && callState === "calling") {
      // Start the call timer when transitioning from calling to connected
      setCallState("connected");
      setCallDuration(0);
      console.log("Call connected, starting timer");
    } else if (newState === "ended") {
      // Handle call ending
      setCallState("ended");
      console.log("Call ended");
      
      // Show wrap-up dialog after a short delay
      setTimeout(() => {
        setShowWrapUpDialog(true);
      }, 500);
      
      // Add to call history if there's a current customer
      if (currentCustomer) {
        addCallToHistory({
          id: `call-${Date.now()}`,
          customerName: `${currentCustomer.name} ${currentCustomer.surname_company_trust || ''}`.trim(),
          customerPhone: currentCustomer.phone || currentCustomer.cell_number || '',
          timestamp: new Date(),
          direction: 'outgoing',
          status: 'completed',
          duration: callDuration
        });
      } else if (dialNumber) {
        // Add unknown customer to call history
        addCallToHistory({
          id: `call-${Date.now()}`,
          customerName: 'Unknown',
          customerPhone: dialNumber,
          timestamp: new Date(),
          direction: 'outgoing',
          status: 'completed',
          duration: callDuration
        });
      }
    } else {
      // For any other state changes
      setCallState(newState);
    }
  };
  
  // Handle call button click
  const handleCall = (customer?: any) => {
    if (customer) {
      setCurrentCustomer(customer);
      // Clean the phone number to remove any non-numeric characters
      const cleanPhoneNumber = customer.phone.replace(/\D/g, "");
      
      // Try to open MicroSIP directly first
      const microsipOpened = openMicroSIP(cleanPhoneNumber);
      
      // If MicroSIP didn't open, fall back to the regular makeCall function
      if (!microsipOpened) {
        makeCall(cleanPhoneNumber);
      }
    } else if (dialNumber) {
      // If no customer but we have a dial number, try to open MicroSIP directly
      const microsipOpened = openMicroSIP(dialNumber);
      
      // If MicroSIP didn't open, fall back to the regular makeCall function
      if (!microsipOpened) {
        makeCall(dialNumber);
      }
    }
  };

  // Handle end call button click
  const handleEndCall = () => {
    // End the call through BuzzBox service
    endCall();
    
    // If we're using MicroSIP and in a connected state, handle the wrap-up
    if (callState === "connected" && useMicroSip) {
      // Update call state to ended
      setCallState("ended");
      console.log("Call state updated to: ended");
      
      // Show wrap-up dialog after a short delay
      setTimeout(() => {
        setShowWrapUpDialog(true);
      }, 500);
      
      // Add to call history if there's a current customer
      if (currentCustomer) {
        addCallToHistory({
          id: `call-${Date.now()}`,
          customerName: `${currentCustomer.name} ${currentCustomer.surname_company_trust || ''}`.trim(),
          customerPhone: currentCustomer.phone || currentCustomer.cell_number || '',
          timestamp: new Date(),
          direction: 'outgoing',
          status: 'completed',
          duration: callDuration
        });
      } else if (dialNumber) {
        // Add unknown customer to call history
        addCallToHistory({
          id: `call-${Date.now()}`,
          customerName: 'Unknown',
          customerPhone: dialNumber,
          timestamp: new Date(),
          direction: 'outgoing',
          status: 'completed',
          duration: callDuration
        });
      }
    } else {
      // Show wrap-up dialog if it was a connected call
      if (callState === "connected") {
        setShowWrapUpDialog(true);
      } else {
        // Reset state if call wasn't connected
        setCallState("idle");
        setCallDuration(0);
      }
      setCallState("idle");
      setCallDuration(0);
    }
  };

  // Handle call wrap-up
  const handleWrapUp = async () => {
    try {
      // Get the current time for call end time
      const currentTime = new Date();

      // Calculate call start time based on duration
      const callStartTime = new Date(currentTime.getTime() - (callDuration * 1000));

      // Add call to local history first
      addCallToHistory({
        id: `call-${Date.now()}`,
        name: currentCustomer?.name || dialNumber,
        phone: currentCustomer?.phone || dialNumber,
        time: new Date(),
        duration: callDuration,
        outcome: wrapUpOutcome,
        notes: wrapUpNotes,
        callbackDate: callbackDate,
      });

      try {
        // Get the current user from Supabase auth
        const { data } = await supabase.auth.getSession();
        const userSession = data.session;
        const currentAgentId = userSession?.user?.id;

        if (currentAgentId) {
          // Record call wrap-up in Supabase database
          const wrapUpData: any = {
            agent_id: currentAgentId,
            phone_number: currentCustomer?.phone || dialNumber,
            call_start_time: callStartTime,
            call_end_time: currentTime,
            call_duration: callDuration,
            wrap_up_code: wrapUpOutcome,
            notes: wrapUpNotes || undefined,
            callback_date: callbackDate,
            call_direction: "outbound" as "outbound", // Type assertion to satisfy TypeScript
            call_status: "completed" as "completed", // Type assertion to satisfy TypeScript
          };
          
          // Always include debtor information if available
          if (currentCustomer?.id) {
            // If it's a UUID, use it directly
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentCustomer.id)) {
              wrapUpData.debtor_id = currentCustomer.id;
              wrapUpData.account_number = currentCustomer.id;
            } else {
              // For non-UUID IDs, store them as strings
              wrapUpData.debtor_id = null; // Avoid UUID validation error
              wrapUpData.account_number = currentCustomer.id.toString(); // Store as string in account_number
            }
            
            // Always include cell_number or phone if available
            if (currentCustomer.cell_number) {
              wrapUpData.phone_number = currentCustomer.cell_number;
            } else if (currentCustomer.phone) {
              wrapUpData.phone_number = currentCustomer.phone;
            }
          }

          // Record the call wrap-up
          const result = await callWrapUpService.recordCallWrapUp(wrapUpData);

          if (!result.success) {
            console.error("Failed to record call wrap-up in database:", result.error);
            toast.error("Failed to record call wrap-up", {
              description: result.error || "An unknown error occurred",
              duration: 5000,
            });
          } else {
            console.log("Call wrap-up recorded successfully in database");
            toast.success("Call wrap-up recorded successfully", {
              description: `Wrap-up code: ${wrapUpOutcome}`,
              duration: 3000,
            });
          }
        } else {
          console.error("No authenticated user found when trying to record call wrap-up");
          toast.error("Authentication Error", {
            description: "You must be logged in to record call wrap-ups",
            duration: 5000,
          });
        }
      } catch (authError) {
        console.error("Error with authentication when recording call wrap-up:", authError);
        toast.error("Authentication Error", {
          description: "There was a problem with your authentication. Please try logging in again.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error recording call wrap-up:", error);
    } finally {
      // Reset state regardless of success or failure
      setShowWrapUpDialog(false);
      setWrapUpNotes("");
      setWrapUpOutcome("Other");
      setCallbackDate(undefined);
      setShowCallbackDatePicker(false);
      setCallState("idle");
      setCallDuration(0);
    }
  };

  // Get total count of debtors
  const getDebtorCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("Debtors")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error getting debtor count:", error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error("Error in getDebtorCount:", err);
      return 0;
    }
  }, [supabase]);

  const fetchDebtors = useCallback(
    async (page: number = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get total count if we don't have it yet
        if (totalCount === 0) {
          const count = await getDebtorCount();
          setTotalCount(count);
          setPagination((prev) => ({
            ...prev,
            totalItems: count,
            totalPages: Math.ceil(count / PAGE_SIZE),
          }));
        }

        // Calculate range for this page
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Fetch debtors for current page
        const { data, error } = await supabase
          .from("Debtors")
          .select(
            "id, acc_number, name, surname_company_trust, cell_number, cell_number2, home_tel, work_tel, outstanding_balance, account_status_description, email_addr_1, status"
          )
          .order("outstanding_balance", { ascending: false })
          .range(from, to);

        if (error) {
          throw error;
        }

        // Update state with the fetched debtors
        setDebtors(data || []);
        setFilteredDebtors(data || []);
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
        }));

        console.log(`Loaded page ${page} with ${data?.length || 0} debtors`);
      } catch (err: any) {
        console.error("Error fetching debtors:", err);
        setError(err.message || "Failed to fetch debtors");
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, PAGE_SIZE, totalCount, getDebtorCount]
  );

  // Search debtors directly from Supabase
  const searchDebtorsFromServer = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) return; // Only search if query is at least 3 characters

      try {
        setIsLoading(true);
        setError(null);

        // Clean the query for search
        const searchQuery = query.toLowerCase().trim();

        // Use Supabase text search with ILIKE for partial matches
        const { data, error } = await supabase
          .from("Debtors")
          .select(
            "id, acc_number, name, surname_company_trust, cell_number, cell_number2, home_tel, work_tel, outstanding_balance, account_status_description, email_addr_1, status"
          )
          .or(
            `name.ilike.%${searchQuery}%,surname_company_trust.ilike.%${searchQuery}%,acc_number.ilike.%${searchQuery}%,cell_number.ilike.%${searchQuery}%,cell_number2.ilike.%${searchQuery}%,home_tel.ilike.%${searchQuery}%,work_tel.ilike.%${searchQuery}%`
          )
          .limit(100);

        if (error) {
          throw error;
        }

        // If we found results from the server, update the filtered list
        if (data && data.length > 0) {
          setFilteredDebtors(data);
        }
      } catch (err: any) {
        console.error("Error searching debtors from server:", err);
        // Don't show error for server-side search, just fall back to client-side filtering
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // Fetch debtors when the search tab becomes active
  useEffect(() => {
    if (open && activeTab === "search" && debtors.length === 0) {
      fetchDebtors(1); // Start with page 1
    }
  }, [open, activeTab, debtors.length, fetchDebtors]);

  // Handle search input
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredDebtors(debtors);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = debtors.filter((debtor) => {
      // Get the best available phone number
      const phoneNumber =
        debtor.cell_number ||
        debtor.cell_number2 ||
        debtor.home_tel ||
        debtor.work_tel ||
        "";
      // Combine name and surname for full name search
      const fullName = `${debtor.name || ""} ${
        debtor.surname_company_trust || ""
      }`.trim();

      return (
        fullName.toLowerCase().includes(lowerQuery) ||
        (debtor.acc_number || "").toLowerCase().includes(lowerQuery) ||
        phoneNumber.toLowerCase().includes(lowerQuery)
      );
    });

    setFilteredDebtors(filtered);

    // If we didn't find any matches locally and the query is at least 3 characters,
    // try searching directly from the server
    if (filtered.length === 0 && query.length >= 3) {
      searchDebtorsFromServer(query);
    }
  };

  // View customer profile
  const viewCustomerProfile = () => {
    if (currentCustomer) {
      // Use the id property which contains the account number (acc_number)
      // This was set when selecting a debtor from the list
      const accountNumber = currentCustomer.id;
      
      // Navigate to customer profile using the account number
      router.push(`/user/customers/${accountNumber}`);
      
      // Minimize the dialer when navigating to profile
      setIsMinimized(true);
    }
  };

  // Toggle BuzzBox configuration panel
  const toggleBuzzBoxConfig = () => {
    setShowBuzzBoxConfig(!showBuzzBoxConfig);
  };

  // Handle reject call button click
  const handleRejectCall = () => {
    rejectCall();
    // You might want to add additional logic here, like updating UI state
  };

  // Handle accept call button click
  const handleAcceptCall = () => {
    acceptCall();
    // You might want to add additional logic here, like updating UI state
  };

  // Simulation functionality has been removed as we're now using MicroSIP for real calls



  // Initialize BuzzBox on component mount
  useEffect(() => {
    if (open && !isBuzzBoxInitialized) {
      handleInitializeBuzzBox();
    }
  }, [open, isBuzzBoxInitialized, handleInitializeBuzzBox]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl bg-slate-900 text-slate-200 p-0 border-slate-700 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">Dialer</DialogTitle>
            <DialogDescription className="sr-only">Make and receive calls</DialogDescription>
          </DialogHeader>
          {/* Dialer Header with Tabs and Controls */}
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold">DCMS Dialer</h2>
              <Badge
                className={`ml-2 ${
                  callState === "registered"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {callState === "registered" ? "BuzzBox Ready" : "BuzzBox Initializing"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {missedCalls.length > 0 && (
                <div className="relative mr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => setShowMissedCallNotification(true)}
                  >
                    <PhoneMissed className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                      {missedCalls.filter((call) => !call.read).length}
                    </span>
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300"
                onClick={() => setIsMinimized(true)}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content - Side by Side Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - BuzzBox Config */}
            <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto bg-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  BuzzBox Configuration
                </h3>
                <Button
                  onClick={toggleBuzzBoxConfig}
                  variant="outline"
                  size="sm"
                  className="text-slate-300 hover:text-slate-100 hover:bg-indigo-700 border-indigo-600"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Configure BuzzBox
                </Button>
              </div>

              <div className="bg-slate-800/70 p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-300 mb-2">BuzzBox API Connection Status:</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isBuzzBoxInitialized ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  <p className="text-sm font-medium text-slate-200">
                    {isBuzzBoxInitialized ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {isBuzzBoxInitialized 
                    ? 'BuzzBox API is connected and ready to make calls directly.' 
                    : 'Configure your BuzzBox credentials to start making calls.'}
                </p>
                
                {/* BuzzBox API Configuration Info */}
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-indigo-400" />
                      <Label className="text-sm font-medium text-slate-200">BuzzBox API Configuration</Label>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p><span className="text-slate-300">API Key:</span> ••••••••••</p>
                    <p><span className="text-slate-300">Account ID:</span> ••••••••••</p>
                    <p><span className="text-slate-300">API URL:</span> buzzboxcloud.co.za</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[300px] pr-1">
                {showBuzzBoxConfig && <BuzzBoxConfig />}
              </div>
            </div>

            {/* Right Side - Dialer Interface */}
            <div className="w-2/3 flex flex-col">
              {/* Tabs */}
              <div className="border-b border-slate-700">
                <div className="flex">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === "dialer"
                        ? "text-indigo-400 border-b-2 border-indigo-400"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                    onClick={() => setActiveTab("dialer")}
                  >
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Dialer
                    </div>
                  </button>

                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === "search"
                        ? "text-indigo-400 border-b-2 border-indigo-400"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                    onClick={() => setActiveTab("search")}
                  >
                    <div className="flex items-center gap-1">
                      <SearchIcon className="h-4 w-4" />
                      Search
                    </div>
                  </button>

                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === "history"
                        ? "text-indigo-400 border-b-2 border-indigo-400"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                    onClick={() => setActiveTab("history")}
                  >
                    <div className="flex items-center gap-1">
                      <History className="h-4 w-4" />
                      History
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Dialer Tab Content */}
                  {activeTab === "dialer" && (
                    <div className="p-4">
                      {/* Current Customer Info (if available) */}
                      {currentCustomer && callState !== "incoming" && (
                        <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-slate-600">
                                <AvatarFallback className="bg-indigo-900 text-indigo-200">
                                  {currentCustomer.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium text-slate-200">
                                  {currentCustomer.name}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {currentCustomer.phone}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={getStatusBadge(currentCustomer.status || "unknown")}
                            >
                              {currentCustomer.status || "unknown"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Balance:</span>
                              <span className="font-medium text-slate-200">
                                {formatCurrency(currentCustomer.balance || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">ID:</span>
                              <span className="font-medium text-slate-200">
                                {currentCustomer.id}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700 text-slate-300 hover:bg-slate-700"
                              onClick={viewCustomerProfile}
                            >
                              <User className="h-3 w-3 mr-1" />
                              Profile
                            </Button>
                            {callState === "idle" && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleCall(currentCustomer)}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Call Status */}
                      <div className="mb-4 text-center">
                        {callState === "idle" && (
                          <p className="text-slate-400">
                            Enter a number or search for a customer
                          </p>
                        )}
                        {callState === "registered" && (
                          <p className="text-green-400">
                            BuzzBox Ready - Enter a number or search for a customer
                          </p>
                        )}
                        {callState === "calling" && (
                          <div className="animate-pulse">
                            <p className="text-indigo-400 font-medium">
                              Calling...
                            </p>
                            <p className="text-sm text-slate-400">
                              {dialNumber || currentCustomer?.phone || ""}
                            </p>
                          </div>
                        )}
                        {callState === "connected" && (
                          <div>
                            <p className="text-green-400 font-medium">
                              Connected
                            </p>
                            <p className="text-sm text-slate-400">
                              Duration: {formattedDuration}
                            </p>
                          </div>
                        )}
                        {callState === "ended" && (
                          <div>
                            <p className="text-red-400 font-medium">
                              Call Ended
                            </p>
                            <p className="text-sm text-slate-400">
                              Duration: {formattedDuration}
                            </p>
                          </div>
                        )}
                        {callState === "failed" && (
                          <div>
                            <p className="text-red-400 font-medium">
                              Call Failed
                            </p>
                            <p className="text-sm text-slate-400">
                              Please check that MicroSIP is running and connected
                            </p>
                          </div>
                        )}
                        {callState === "incoming" && (
                          <div>
                            <p className="text-indigo-400 font-medium animate-pulse">
                              Incoming Call
                            </p>
                            <p className="text-sm text-slate-400">
                              {callerInfo}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Phone Input and Dialer Pad - Always visible */}
                      <>
                          <div className="mb-4">
                            <Input
                              value={dialNumber}
                              onChange={(e) => setDialNumber(e.target.value)}
                              className="bg-slate-800 border-slate-700 text-slate-200"
                              placeholder="Enter phone number"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                              "1",
                              "2",
                              "3",
                              "4",
                              "5",
                              "6",
                              "7",
                              "8",
                              "9",
                              "*",
                              "0",
                              "#",
                            ].map((digit) => (
                              <Button
                                key={digit}
                                variant="outline"
                                className="h-12 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                onClick={() => handleDialerInput(digit)}
                              >
                                {digit}
                              </Button>
                            ))}
                          </div>

                          <div className="flex justify-between mb-4">
                            <Button
                              variant="outline"
                              className="border-slate-700 text-slate-300 hover:bg-slate-700"
                              onClick={clearDialerInput}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Clear
                            </Button>

                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleCall()}
                              disabled={!dialNumber}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                          </div>
                      </>

                      {/* Call Controls - Only show during active call */}
                      {(callState === "calling" ||
                        callState === "connected") && (
                        <div className="flex flex-col items-center">
                          <div className="mb-6">
                            {currentCustomer ? (
                              <Avatar className="h-20 w-20 border-2 border-indigo-600 mx-auto">
                                <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xl">
                                  {currentCustomer.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-20 w-20 rounded-full bg-indigo-900/50 border-2 border-indigo-600 flex items-center justify-center mx-auto">
                                <Phone className="h-8 w-8 text-indigo-300" />
                              </div>
                            )}
                          </div>
                          
                          {/* MicroSIP Manual Call State Controls */}
                          {useMicroSip && (
                            <div className="w-full max-w-xs mx-auto mb-4 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                              <p className="text-xs text-slate-400 mb-2 text-center">MicroSIP Call Status</p>
                              <div className="flex justify-between gap-2">
                                {callState === "calling" && (
                                  <Button 
                                    size="sm"
                                    variant="outline" 
                                    className="flex-1 bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
                                    onClick={() => handleCallStateChange("connected")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Call Answered
                                  </Button>
                                )}
                                {callState === "connected" && (
                                  <div className="flex-1 bg-green-600/20 border border-green-600/50 rounded-md p-1 text-center text-green-400 text-xs">
                                    <CheckCircle className="h-3 w-3 inline-block mr-1" />
                                    Call Connected
                                  </div>
                                )}
                                <Button 
                                  size="sm"
                                  variant="outline" 
                                  className="flex-1 bg-red-600/20 border-red-600 text-red-400 hover:bg-red-600/30"
                                  onClick={() => handleCallStateChange("ended")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Call Ended
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mx-auto mb-6">
                            <Button
                              variant="ghost"
                              className={`h-12 w-12 rounded-full mx-auto ${
                                isMuted
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                              onClick={() => setIsMuted(!isMuted)}
                            >
                              {isMuted ? (
                                <MicOff className="h-5 w-5" />
                              ) : (
                                <Mic className="h-5 w-5" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white mx-auto"
                              onClick={handleEndCall}
                            >
                              <PhoneOff className="h-6 w-6" />
                            </Button>

                            <Button
                              variant="ghost"
                              className={`h-12 w-12 rounded-full mx-auto ${
                                isSpeakerOn
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                            >
                              {isSpeakerOn ? (
                                <Volume2 className="h-5 w-5" />
                              ) : (
                                <VolumeX className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Incoming Call Controls */}
                      {callState === "incoming" && (
                        <div className="flex flex-col items-center">
                          <div className="mb-6">
                            <div className="relative mx-auto">
                              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                              <Avatar className="h-20 w-20 border-2 border-indigo-600 relative z-10">
                                <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xl">
                                  {callerInfo
                                    .split(" ")
                                    .map((name: string) => name[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>

                          <div className="flex gap-8 w-full max-w-xs mx-auto mb-6">
                            <Button
                              variant="ghost"
                              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white mx-auto"
                              onClick={handleRejectCall}
                            >
                              <PhoneOff className="h-6 w-6" />
                            </Button>

                            <Button
                              variant="ghost"
                              className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white mx-auto"
                              onClick={handleAcceptCall}
                            >
                              <PhoneCall className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* This is a manual dialer - auto-dialer functionality removed */}
                    </div>
                  )}

                  {/* Search Tab Content */}
                  {activeTab === "search" && (
                    <div className="p-4">
                      <div className="mb-4">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
                            placeholder="Search by name, ID or phone number..."
                            value={searchQuery}
                            onChange={(e) => handleSearchInput(e.target.value)}
                          />
                        </div>
                      </div>

                      <ScrollArea className="h-[400px] pr-4">
                        {isLoading ? (
                          <div className="text-center py-8 text-slate-400">
                            <div className="animate-spin h-8 w-8 border-t-2 border-indigo-500 rounded-full mx-auto mb-4"></div>
                            Loading debtors...
                          </div>
                        ) : error ? (
                          <div className="text-center py-8 text-red-400">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                            {error}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() =>
                                fetchDebtors(pagination.currentPage)
                              }
                            >
                              Retry
                            </Button>
                          </div>
                        ) : filteredDebtors.length > 0 ? (
                          <div className="space-y-3">
                            {filteredDebtors.map((debtor) => {
                              // Get the best available phone number
                              const phoneNumber =
                                debtor.cell_number ||
                                debtor.cell_number2 ||
                                debtor.home_tel ||
                                debtor.work_tel ||
                                "No phone";
                              // Combine name and surname for display
                              const fullName =
                                `${debtor.name || ""} ${
                                  debtor.surname_company_trust || ""
                                }`.trim() || "Unknown";
                              // Determine status for badge
                              const status =
                                debtor.account_status_description?.toLowerCase() ||
                                debtor.status?.toLowerCase() ||
                                "unknown";

                              return (
                                <div
                                  key={debtor.id}
                                  className="p-3 bg-slate-800 rounded-lg hover:bg-slate-750 cursor-pointer"
                                  onClick={() => {
                                    setCurrentCustomer({
                                      id: debtor.acc_number || debtor.id,
                                      name: fullName,
                                      phone: phoneNumber,
                                      balance: debtor.outstanding_balance || 0,
                                      status: status,
                                    });
                                    setDialNumber(phoneNumber);
                                    setActiveTab("dialer");
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 border border-slate-600">
                                        <AvatarFallback className="bg-indigo-900 text-indigo-200">
                                          {fullName
                                            .split(" ")
                                            .map((n) => n[0] || "")
                                            .join("")
                                            .substring(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h3 className="font-medium text-slate-200">
                                          {fullName}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                          {phoneNumber}
                                        </p>
                                        {debtor.email_addr_1 && (
                                          <p className="text-xs text-slate-500 truncate max-w-[180px]">
                                            {debtor.email_addr_1}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <Badge className={getStatusBadge(status)}>
                                      {status}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">
                                        Balance:
                                      </span>
                                      <span className="font-medium text-slate-200">
                                        {formatCurrency(
                                          debtor.outstanding_balance || 0
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">
                                        Acc #:
                                      </span>
                                      <span className="font-medium text-slate-200">
                                        {debtor.acc_number || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Create a customer object from debtor for the call handler
                                        const customer = {
                                          id: debtor.acc_number || debtor.id,
                                          name: fullName,
                                          phone: phoneNumber,
                                          balance:
                                            debtor.outstanding_balance || 0,
                                          status: status,
                                        };
                                        handleCall(customer);
                                        setActiveTab("dialer");
                                      }}
                                      disabled={
                                        !phoneNumber ||
                                        phoneNumber === "No phone"
                                      }
                                    >
                                      <Phone className="h-3 w-3 mr-1" />
                                      Call
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            {searchQuery ? (
                              <>
                                No debtors found matching your search.
                                <p className="mt-2 text-xs text-slate-500">
                                  Try using fewer or different search terms. The
                                  system will automatically try to search the
                                  database directly if no local matches are
                                  found.
                                </p>
                              </>
                            ) : (
                              <>
                                No debtors available.
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-4"
                                  onClick={() => fetchDebtors(1)}
                                >
                                  Load Debtors
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Pagination Controls */}
                        {!isLoading && !error && totalCount > 0 && (
                          <div className="flex items-center justify-between border-t border-slate-700 mt-4 pt-4">
                            <div className="text-xs text-slate-400">
                              Showing{" "}
                              {(pagination.currentPage - 1) *
                                pagination.pageSize +
                                1}{" "}
                              to{" "}
                              {Math.min(
                                pagination.currentPage * pagination.pageSize,
                                pagination.totalItems
                              )}{" "}
                              of {pagination.totalItems} debtors
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={pagination.currentPage === 1}
                                onClick={() => fetchDebtors(1)}
                              >
                                <span className="sr-only">First page</span>
                                <ArrowDown className="h-4 w-4 rotate-90" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={pagination.currentPage === 1}
                                onClick={() =>
                                  fetchDebtors(pagination.currentPage - 1)
                                }
                              >
                                <span className="sr-only">Previous page</span>
                                <ArrowDown className="h-4 w-4 -rotate-90" />
                              </Button>
                              <span className="text-xs text-slate-400 mx-2">
                                Page {pagination.currentPage} of{" "}
                                {pagination.totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={
                                  pagination.currentPage ===
                                  pagination.totalPages
                                }
                                onClick={() =>
                                  fetchDebtors(pagination.currentPage + 1)
                                }
                              >
                                <span className="sr-only">Next page</span>
                                <ArrowDown className="h-4 w-4 rotate-90" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={
                                  pagination.currentPage ===
                                  pagination.totalPages
                                }
                                onClick={() =>
                                  fetchDebtors(pagination.totalPages)
                                }
                              >
                                <span className="sr-only">Last page</span>
                                <ArrowDown className="h-4 w-4 -rotate-90" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}

                  {/* History Tab Content */}
                  {activeTab === "history" && (
                    <div className="p-4">
                      <ScrollArea className="h-[400px] pr-4">
                        {callHistory.length > 0 ? (
                          <div className="space-y-3">
                            {callHistory.map((call) => (
                              <div
                                key={call.id}
                                className="p-3 bg-slate-800 rounded-lg hover:bg-slate-750 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium text-slate-200">
                                      {call.name}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                      {call.phone}
                                    </p>
                                  </div>
                                  <Badge
                                    className={
                                      call.outcome === "PTP"
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : call.outcome === "No Answer"
                                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                                        : call.outcome === "Callback"
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                    }
                                  >
                                    {call.outcome}
                                  </Badge>
                                </div>
                                <div className="mt-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">
                                      Time:
                                    </span>
                                    <span className="font-medium text-slate-200">
                                      {format(call.time, "dd MMM yyyy HH:mm")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">
                                      Duration:
                                    </span>
                                    <span className="font-medium text-slate-200">
                                      {formatDuration(call.duration)}
                                    </span>
                                  </div>
                                  {call.notes && (
                                    <div className="mt-2">
                                      <span className="text-slate-400">
                                        Notes:
                                      </span>
                                      <p className="text-slate-300 mt-1 bg-slate-800/50 p-2 rounded">
                                        {call.notes}
                                      </p>
                                    </div>
                                  )}
                                  {call.callbackDate && (
                                    <div className="mt-2 flex justify-between">
                                      <span className="text-slate-400">
                                        Callback:
                                      </span>
                                      <span className="font-medium text-amber-300">
                                        {format(
                                          call.callbackDate,
                                          "dd MMM yyyy HH:mm"
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => {
                                      setDialNumber(call.phone);
                                      setActiveTab("dialer");
                                    }}
                                  >
                                    <PhoneCall className="h-3 w-3 mr-1" />
                                    Call Again
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            No call history available.
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Wrap-up Dialog */}
      <Dialog open={showWrapUpDialog} onOpenChange={setShowWrapUpDialog}>
        <DialogContent className="bg-slate-900 text-slate-200 border-slate-700 sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Call Wrap-up</DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete the call details before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="outcome">Call Outcome</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
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
                    onClick={() => setWrapUpOutcome(outcome as any)}
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
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
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

            {wrapUpOutcome === "Callback" && (
              <div className="space-y-2">
                <Label htmlFor="callback-date">Callback Date</Label>
                <Popover
                  open={showCallbackDatePicker}
                  onOpenChange={setShowCallbackDatePicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {callbackDate ? (
                        format(callbackDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 bg-slate-900 border-slate-700">
                    <CalendarComponent
                      mode="single"
                      selected={callbackDate}
                      onSelect={(date) => {
                        setCallbackDate(date);
                        setShowCallbackDatePicker(false);
                      }}
                      initialFocus
                      className="bg-slate-900 rounded-md"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium text-slate-200",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-400 hover:text-slate-200",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-slate-400 rounded-md w-8 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-slate-300 hover:bg-slate-700 hover:text-slate-100 rounded-md",
                        day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
                        day_today: "bg-slate-700 text-slate-100",
                        day_outside: "text-slate-600 opacity-50",
                        day_disabled: "text-slate-600 opacity-50",
                        day_range_middle: "aria-selected:bg-slate-700 aria-selected:text-slate-100",
                        day_hidden: "invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter call notes here..."
                className="bg-slate-800 border-slate-700 text-slate-200"
                value={wrapUpNotes}
                onChange={(e) => setWrapUpNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleWrapUp}
              disabled={(wrapUpOutcome === "Callback" && !callbackDate) || wrapUpOutcome === "Other"}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Complete Wrap-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missed Call Notification */}
      {showMissedCallNotification && (
        <MissedCallNotification
          missedCalls={missedCalls}
          onDismiss={(id) => {
            markMissedCallAsRead(id);
            // If all calls are dismissed/read, close the notification
            if (missedCalls.filter((call) => !call.read).length <= 1) {
              setShowMissedCallNotification(false);
            }
          }}
          onCallBack={(phoneNumber) => {
            setDialNumber(phoneNumber);
            setActiveTab("dialer");
            onOpenChange(true);
            setIsMinimized(false);
            setShowMissedCallNotification(false);
          }}
        />
      )}

      {/* Minimized Dialer - Active Call */}
      {open &&
        isMinimized &&
        (callState === "connected" || callState === "calling") && (
          <Card className="fixed top-4 right-4 w-64 shadow-lg border-slate-700 bg-slate-900 z-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      callState === "connected"
                        ? "bg-green-500"
                        : "bg-amber-500"
                    } animate-pulse`}
                  ></div>
                  <p className="text-sm font-medium text-slate-200">
                    {currentCustomer?.name ||
                      (callState === "calling"
                        ? `Calling ${dialNumber}`
                        : "Call in progress")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
                    onClick={() => setIsMinimized(false)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    onClick={handleEndCall}
                  >
                    <PhoneOffIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {callState === "connected"
                  ? `Duration: ${formattedDuration}`
                  : "Dialing..."}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Minimized Dialer - Incoming Call */}
      {open && isMinimized && callState === "incoming" && (
        <Card
          className="fixed top-4 right-4 w-80 shadow-lg border-indigo-700/50 bg-gradient-to-r from-slate-900 to-indigo-950 z-50 animate-pulse"
          style={{ animationDuration: "2s" }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <BellRing className="h-5 w-5 text-indigo-400 animate-bounce" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </div>
                <p className="text-sm font-medium text-indigo-300 animate-pulse">
                  Incoming Call
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
                onClick={() => setIsMinimized(false)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                  <Avatar className="h-10 w-10 border border-indigo-600/50 bg-indigo-900/50 relative z-10">
                    <AvatarFallback className="bg-indigo-900/50 text-indigo-200 text-xs">
                      {callerInfo
                        .split(" ")
                        .map((name: string) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {callerInfo}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center">
                    <PhoneIncoming className="h-3 w-3 mr-1 text-indigo-400" />{" "}
                    Incoming
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-transform hover:scale-110"
                  onClick={handleRejectCall}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 transition-transform hover:scale-110"
                  onClick={handleAcceptCall}
                >
                  <PhoneCall className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Using BuzzBox API directly for making calls */}
    </>
  );
}
