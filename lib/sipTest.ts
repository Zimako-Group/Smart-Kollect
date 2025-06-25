import { UserAgent } from "sip.js";

// Function to test SIP registration
export async function testSipRegistration(username: string, password: string, sipRealm: string) {
  // Array of server configurations to try for Telnyx
  const serverConfigs = [
    { server: "wss://sip.telnyx.com:443", description: "Telnyx WSS on port 443" },
    { server: "wss://sip.telnyx.com", description: "Telnyx WSS with default port" },
    { server: "wss://sip-us.telnyx.com:443", description: "Telnyx US WSS on port 443" },
    { server: "wss://sip-eu.telnyx.com:443", description: "Telnyx EU WSS on port 443" },
    { 
      server: "wss://sip.telnyx.com:443", 
      description: "Telnyx WSS with explicit transport param",
      contactParams: { transport: "wss" }
    }
  ];

  // Format SIP URI for Telnyx
  const sipUri = `sip:${username}@${sipRealm}`;
  console.log(`Starting SIP registration tests with Telnyx using ${sipUri}...`);
  
  // Try each server configuration
  for (const config of serverConfigs) {
    try {
      console.log(`Attempting to register with Telnyx SIP server using ${config.description}: ${config.server}`);
      
      const userAgent = new UserAgent({
        uri: UserAgent.makeURI(sipUri),
        transportOptions: {
          server: config.server,
          connectionTimeout: 15
        },
        authorizationUsername: username,
        authorizationPassword: password,
        logLevel: "debug",
        contactParams: config.contactParams || { transport: "ws" },
        // Add additional configuration options
        hackViaTcp: true, // Try forcing TCP for Via header
        hackIpInContact: true, // Add IP to contact header
        reconnectionAttempts: 3, // Try reconnecting a few times
        reconnectionDelay: 2 // Shorter delay between attempts
      });

      // Add connection event handlers with more detailed logging
      userAgent.transport.onConnect = () => {
        console.log(`✅ Connected to ${config.server} successfully!`);
      };

      userAgent.transport.onDisconnect = (error) => {
        console.log(`❌ Disconnected from ${config.server}:`, error ? JSON.stringify(error) : "No error details");
      };

      userAgent.transport.onMessage = (message) => {
        console.log(`📨 Received message from server: ${message.substring(0, 100)}...`);
      };

      // Create a timeout promise to avoid hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000);
      });

      // Start the user agent with timeout
      const startPromise = userAgent.start();
      await Promise.race([startPromise, timeoutPromise]);
      
      // Check if user agent is connected
      if (userAgent.isConnected()) {
        console.log(`✅ SIP Registered with Telnyx successfully using ${config.description}!`);
        
        // Return the successful user agent
        return userAgent;
      } else {
        throw new Error("User agent started but not connected");
      }
    } catch (error) {
      console.error(`❌ SIP Registration failed with ${config.description}:`, error);
      // Continue to the next configuration
    }
  }

  // If we get here, all configurations failed
  console.error("❌ All SIP registration attempts failed");
  
  // Try to get more information about the Telnyx server
  try {
    console.log("Attempting to fetch server information...");
    const response = await fetch("https://sip.telnyx.com", { 
      method: "HEAD",
      mode: "no-cors" 
    });
    console.log("Server response status:", response.status);
  } catch (error) {
    console.error("Failed to fetch server information:", error);
  }
  
  throw new Error("Failed to register with any Telnyx SIP server configuration");
}

// Function to make a test call
export async function makeTestCall(userAgent: UserAgent, phoneNumber: string, sipRealm: string) {
  try {
    console.log(`Attempting to call ${phoneNumber}...`);
    
    // Import needed only when function is called
    const { Inviter } = await import("sip.js");
    
    // Format the target URI for Telnyx
    // For Telnyx, the format is typically: sip:+[country_code][number]@sip.telnyx.com
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const target = UserAgent.makeURI(`sip:${formattedNumber}@${sipRealm}`);
    
    if (!target) {
      throw new Error("Failed to create target URI");
    }
    
    // Create an inviter for the call
    const inviter = new Inviter(userAgent, target);
    
    // Add event handlers for call state changes
    inviter.stateChange.addListener((state) => {
      console.log(`Call state changed to: ${state}`);
    });
    
    // Send the INVITE to start the call
    await inviter.invite();
    console.log("✅ Call initiated successfully!");
    
    return inviter;
  } catch (error) {
    console.error("❌ Call failed:", error);
    throw error;
  }
}

// Function to check if the Telnyx server is reachable
export async function checkServerConnectivity() {
  const servers = [
    "sip.telnyx.com",
    "sip-us.telnyx.com",
    "sip-eu.telnyx.com",
    "api.telnyx.com"
  ];
  
  console.log("Checking Telnyx server connectivity...");
  
  for (const server of servers) {
    try {
      console.log(`Testing connectivity to ${server}...`);
      const response = await fetch(`https://${server}`, { 
        method: "HEAD",
        mode: "no-cors" 
      });
      console.log(`✅ Server ${server} is reachable, status: ${response.status}`);
    } catch (error) {
      console.error(`❌ Server ${server} is not reachable:`, error);
    }
  }
}
