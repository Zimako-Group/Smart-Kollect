"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { testSipRegistration, makeTestCall, checkServerConnectivity } from "@/lib/sipTest";
import { UserAgent } from "sip.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react";

export default function SipTestPage() {
  const [status, setStatus] = useState<string>("Not connected");
  const [logs, setLogs] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [userAgent, setUserAgent] = useState<UserAgent | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<string>("");
  
  // Telnyx SIP credentials
  const [sipUsername, setSipUsername] = useState<string>("");
  const [sipPassword, setSipPassword] = useState<string>("");
  const [sipRealm, setSipRealm] = useState<string>("sip.telnyx.com");

  // Custom logging function that updates the UI
  const log = (message: string) => {
    console.log(message);
    setLogs((prevLogs) => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Override console.log and console.error to capture SIP.js logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prevLogs => [...prevLogs, `ERROR ${new Date().toLocaleTimeString()}: ${message}`]);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  // Get network information
  useEffect(() => {
    const getNetworkInfo = () => {
      try {
        const connection = (navigator as any).connection || 
                          (navigator as any).mozConnection || 
                          (navigator as any).webkitConnection;
        
        if (connection) {
          setNetworkInfo(`
            Connection Type: ${connection.type || 'unknown'}
            Effective Type: ${connection.effectiveType || 'unknown'}
            Downlink: ${connection.downlink || 'unknown'} Mbps
            RTT: ${connection.rtt || 'unknown'} ms
          `);
        } else {
          setNetworkInfo("Network information API not available");
        }
      } catch (error) {
        setNetworkInfo(`Error getting network info: ${error}`);
      }
    };

    getNetworkInfo();
  }, []);

  // Validate SIP credentials
  const validateCredentials = (): boolean => {
    if (!sipUsername) {
      log("❌ SIP Username is required");
      return false;
    }
    if (!sipPassword) {
      log("❌ SIP Password is required");
      return false;
    }
    if (!sipRealm) {
      log("❌ SIP Realm is required");
      return false;
    }
    return true;
  };

  // Handle SIP registration
  const handleRegister = async () => {
    if (!validateCredentials()) return;
    
    try {
      setIsRegistering(true);
      setStatus("Connecting...");
      log(`Attempting to register with Telnyx SIP server (${sipRealm})...`);
      
      const agent = await testSipRegistration(sipUsername, sipPassword, sipRealm);
      setUserAgent(agent);
      setStatus("Connected");
      log("✅ SIP Registration successful!");
    } catch (error) {
      setStatus("Connection failed");
      log(`❌ SIP Registration failed: ${error}`);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle making a call
  const handleCall = async () => {
    if (!userAgent) {
      log("❌ You must register first before making a call");
      return;
    }

    if (!phoneNumber) {
      log("❌ Please enter a phone number to call");
      return;
    }

    try {
      setIsCalling(true);
      log(`Calling ${phoneNumber}...`);
      
      const inviter = await makeTestCall(userAgent, phoneNumber, sipRealm);
      log("✅ Call initiated successfully!");
      
      // Set up a timer to automatically end the call after 30 seconds
      setTimeout(() => {
        try {
          inviter.bye();
          log("Call ended automatically after 30 seconds");
        } catch (error) {
          log(`Error ending call: ${error}`);
        }
      }, 30000);
    } catch (error) {
      log(`❌ Call failed: ${error}`);
    } finally {
      setIsCalling(false);
    }
  };

  // Handle disconnecting
  const handleDisconnect = async () => {
    if (userAgent) {
      try {
        await userAgent.stop();
        setUserAgent(null);
        setStatus("Not connected");
        log("Disconnected from SIP server");
      } catch (error) {
        log(`Error disconnecting: ${error}`);
      }
    }
  };

  // Handle connectivity check
  const handleConnectivityCheck = async () => {
    try {
      setIsCheckingConnectivity(true);
      log("Checking Telnyx server connectivity...");
      await checkServerConnectivity();
      log("Connectivity check completed");
    } catch (error) {
      log(`Error during connectivity check: ${error}`);
    } finally {
      setIsCheckingConnectivity(false);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    log("Logs cleared");
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Telnyx SIP Test Page</h1>
      
      <Alert className="mb-4 bg-blue-900/30 border-blue-800">
        <InfoIcon className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          This page tests SIP registration with Telnyx using WebRTC. Enter your Telnyx SIP credentials to begin.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="connection" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="mb-6 grid gap-4">
            <div>
              <Label htmlFor="sipUsername" className="text-slate-400 mb-1 block">SIP Username</Label>
              <Input
                id="sipUsername"
                value={sipUsername}
                onChange={(e) => setSipUsername(e.target.value)}
                placeholder="Enter your SIP username"
                className="bg-slate-700 border-slate-600 text-slate-200"
                disabled={status === "Connected"}
              />
            </div>
            
            <div>
              <Label htmlFor="sipPassword" className="text-slate-400 mb-1 block">SIP Password</Label>
              <Input
                id="sipPassword"
                type="password"
                value={sipPassword}
                onChange={(e) => setSipPassword(e.target.value)}
                placeholder="Enter your SIP password"
                className="bg-slate-700 border-slate-600 text-slate-200"
                disabled={status === "Connected"}
              />
            </div>
            
            <div>
              <Label htmlFor="sipRealm" className="text-slate-400 mb-1 block">SIP Realm</Label>
              <Input
                id="sipRealm"
                value={sipRealm}
                onChange={(e) => setSipRealm(e.target.value)}
                placeholder="sip.telnyx.com"
                className="bg-slate-700 border-slate-600 text-slate-200"
                disabled={status === "Connected"}
              />
              <p className="text-xs text-slate-400 mt-1">
                Default: sip.telnyx.com (change only if using a different Telnyx region)
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status === "Connected" ? "bg-green-500" : 
                status === "Connecting..." ? "bg-yellow-500" : 
                "bg-red-500"
              }`}></div>
              <span className="text-slate-200">Status: {status}</span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleRegister} 
                disabled={isRegistering || status === "Connected"}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isRegistering ? "Connecting..." : "Register SIP"}
              </Button>
              
              <Button 
                onClick={handleDisconnect} 
                disabled={status !== "Connected"}
                variant="destructive"
              >
                Disconnect
              </Button>
              
              <Button
                onClick={handleConnectivityCheck}
                disabled={isCheckingConnectivity}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                {isCheckingConnectivity ? "Checking..." : "Check Server Connectivity"}
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <Label htmlFor="phoneNumber" className="text-slate-400 mb-1 block">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number (e.g., +27123456789)"
                className="bg-slate-700 border-slate-600 text-slate-200"
                disabled={status !== "Connected"}
              />
              <Button 
                onClick={handleCall} 
                disabled={isCalling || status !== "Connected" || !phoneNumber}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCalling ? "Calling..." : "Call"}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Format: Include country code with + prefix (e.g., +27123456789)
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="diagnostics" className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Network Information</h3>
          <pre className="bg-slate-900 p-3 rounded text-xs text-slate-300 mb-4 whitespace-pre-wrap">
            {networkInfo || "Loading network information..."}
          </pre>
          
          <h3 className="text-lg font-semibold mb-2 text-slate-200">WebRTC Diagnostics</h3>
          <div className="bg-slate-900 p-3 rounded text-xs text-slate-300 mb-4">
            <p>WebRTC API Available: {typeof RTCPeerConnection !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
            <p>WebSocket API Available: {typeof WebSocket !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
            <p>User Media API Available: {typeof navigator.mediaDevices !== 'undefined' && typeof navigator.mediaDevices.getUserMedia !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Telnyx SIP Information</h3>
          <div className="bg-slate-900 p-3 rounded text-sm text-slate-300 mb-4">
            <p>Telnyx provides WebRTC-compatible SIP trunking that can be used for making and receiving calls directly from web browsers.</p>
            <p className="mt-2">To use this test page, you'll need:</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>A Telnyx account with SIP credentials</li>
              <li>A Telnyx phone number or SIP trunk</li>
              <li>Proper firewall settings to allow WebSocket connections</li>
            </ul>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Troubleshooting Tips</h3>
          <ul className="bg-slate-900 p-3 rounded text-sm text-slate-300 list-disc list-inside space-y-1">
            <li>Ensure your network allows WebSocket connections</li>
            <li>Check if your browser supports WebRTC</li>
            <li>Try disabling any VPN or proxy services</li>
            <li>Verify that your Telnyx account credentials are correct</li>
            <li>Ensure your Telnyx account is active and properly configured</li>
            <li>Check if outbound calling is enabled for your Telnyx account</li>
          </ul>
        </TabsContent>
      </Tabs>
      
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-200">SIP Logs</h2>
          <Button 
            onClick={clearLogs} 
            variant="outline" 
            size="sm"
            className="border-slate-600 text-slate-300"
          >
            Clear Logs
          </Button>
        </div>
        <div className="bg-slate-900 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-slate-400">No logs yet. Enter your Telnyx SIP credentials and click "Register SIP" to begin.</p>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  log.includes("ERROR") ? "text-red-400" : 
                  log.includes("✅") ? "text-green-400" : 
                  log.includes("❌") ? "text-red-400" : 
                  log.includes("📨") ? "text-yellow-400" : 
                  "text-slate-300"
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
