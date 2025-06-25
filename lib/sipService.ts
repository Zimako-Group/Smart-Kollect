import { UserAgent, Inviter, SessionState, Session, InvitationAcceptOptions, Invitation } from "sip.js";

// SIP account configuration interface
export interface SipConfig {
  sipAddress: string;
  username: string;
  password?: string;
  domain: string;
  wsServer: string;
  transport: string;
}

// BuzzBox/MicroSIP configuration
const buzzBoxSipConfig: SipConfig = {
  sipAddress: 'sip:200@zimakosmartbusinesssolutions.sip.buzzboxcloud.com', 
  username: '200',
  password: 'x4ZUA2T4bA',
  domain: 'zimakosmartbusinesssolutions.sip.buzzboxcloud.com:5080',
  wsServer: 'wss://zimakosmartbusinesssolutions.sip.buzzboxcloud.com:5080/ws',
  transport: 'tls',
};

// Default SIP configuration - using BuzzBox/MicroSIP
const sipConfig: SipConfig = buzzBoxSipConfig;

class SipService {
  private userAgent: UserAgent | null = null;
  private session: Session | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private onCallStateChange: ((state: string, caller?: string) => void) | null = null;
  private onCallDurationUpdate: (() => void) | null = null;
  private callTimer: NodeJS.Timeout | null = null;
  private testMode: boolean = false;
  private incomingSession: Invitation | null = null;

  constructor() {
    // Create audio elements for remote audio and ringtone
    if (typeof window !== 'undefined') {
      // Remote audio for the call
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.autoplay = true;
      document.body.appendChild(this.remoteAudio);
      
      // Ringtone for incoming calls
      this.ringtoneAudio = document.createElement('audio');
      this.ringtoneAudio.src = '/sounds/incoming-call.mp3';
      this.ringtoneAudio.loop = true;
      document.body.appendChild(this.ringtoneAudio);
    }
  }

  // Initialize SIP user agent
  public initialize(
    password: string,
    onCallStateChange: (state: string, caller?: string) => void,
    onCallDurationUpdate: () => void,
    enableTestMode: boolean = false,
    customConfig?: SipConfig
  ): boolean {
    try {
      this.testMode = enableTestMode;
      this.onCallStateChange = onCallStateChange;
      this.onCallDurationUpdate = onCallDurationUpdate;

      // If test mode is enabled, simulate a successful connection
      if (this.testMode) {
        console.log('SIP service initialized in test mode');
        this.onCallStateChange?.('registered');
        return true;
      }

      if (!this.userAgent && typeof window !== 'undefined') {
        // Use custom config if provided, otherwise use the default sipConfig
        const config = customConfig || sipConfig;
        
        // Create UserAgent
        this.userAgent = new UserAgent({
          uri: UserAgent.makeURI(config.sipAddress),
          transportOptions: {
            server: config.wsServer
          },
          authorizationUsername: config.username,
          authorizationPassword: password,
          displayName: 'DCMS Agent',
        });

        // Set up user agent delegates for handling events
        this.userAgent.delegate = {
          onConnect: () => {
            console.log('WebSocket connected');
          },
          onDisconnect: (error) => {
            console.log('WebSocket disconnected', error);
            this.onCallStateChange?.('failed');
          },
          onInvite: (invitation) => {
            // Handle incoming call
            console.log('Incoming call received');
            
            // Get caller ID information
            const caller = invitation.remoteIdentity.uri.user || 'Unknown';
            const displayName = invitation.remoteIdentity.displayName || caller;
            
            // Store the incoming session
            this.incomingSession = invitation;
            
            // Play ringtone
            this.ringtoneAudio?.play().catch(err => console.error('Error playing ringtone:', err));
            
            // Notify about incoming call
            this.onCallStateChange?.('incoming', displayName);
            
            // Set up session state change handlers
            invitation.stateChange.addListener((state) => {
              switch (state) {
                case SessionState.Established:
                  this.session = invitation;
                  this.onCallStateChange?.('connected', displayName);
                  this.startCallTimer();
                  break;
                case SessionState.Terminated:
                  this.incomingSession = null;
                  if (this.session === invitation) {
                    this.session = null;
                    this.onCallStateChange?.('ended');
                    this.stopCallTimer();
                  }
                  break;
              }
            });
          }
        };

        // Start the user agent
        this.userAgent.start()
          .then(() => {
            console.log('SIP user agent started successfully');
            this.onCallStateChange?.('registered');
          })
          .catch((error) => {
            console.error('Failed to start SIP user agent:', error);
            this.onCallStateChange?.('failed');
          });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing SIP service:', error);
      return false;
    }
  }

  // Make an outgoing call
  public call(phoneNumber: string): void {
    // In test mode, simulate a call
    if (this.testMode) {
      console.log(`Test mode: Simulating call to ${phoneNumber}`);
      this.onCallStateChange?.('calling');
      
      // Simulate connecting after 2 seconds
      setTimeout(() => {
        this.onCallStateChange?.('connected');
        this.startCallTimer();
      }, 2000);
      
      return;
    }

    if (!this.userAgent) {
      console.error('SIP user agent not initialized');
      this.onCallStateChange?.('failed');
      return;
    }

    try {
      // Format phone number for SIP call
      // Remove any non-digit characters
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // For South African numbers, ensure they're in international format
      let formattedNumber = cleanNumber;
      if (cleanNumber.startsWith('0')) {
        // Replace leading 0 with country code 27
        formattedNumber = `27${cleanNumber.substring(1)}`;
      }

      // Create SIP URI
      const target = `sip:${formattedNumber}@${sipConfig.domain}`;
      
      // Create an Inviter (outgoing call)
      const targetURI = UserAgent.makeURI(target);
      if (!targetURI) {
        throw new Error(`Failed to create URI from ${target}`);
      }
      
      const inviter = new Inviter(this.userAgent, targetURI);
      
      // Set up media handling
      const mediaConstraints = {
        audio: true,
        video: false
      };
      
      // Set up session state change handlers
      inviter.stateChange.addListener((state) => {
        switch (state) {
          case SessionState.Establishing:
            this.onCallStateChange?.('calling');
            break;
          case SessionState.Established:
            this.onCallStateChange?.('connected');
            this.startCallTimer();
            break;
          case SessionState.Terminated:
            this.onCallStateChange?.('ended');
            this.stopCallTimer();
            break;
        }
      });
      
      // Start the call
      this.session = inviter;
      this.onCallStateChange?.('calling');
      
      // Send the INVITE request
      inviter.invite({
        requestDelegate: {
          onAccept: () => {
            console.log('Call accepted');
          },
          onReject: () => {
            console.log('Call rejected');
            this.onCallStateChange?.('ended');
          }
        }
      })
      .catch((error) => {
        console.error('Call failed:', error);
        this.onCallStateChange?.('failed');
      });
    } catch (error) {
      console.error('Error making call:', error);
      this.onCallStateChange?.('failed');
    }
  }

  // End the current call
  public hangup(): void {
    // In test mode, simulate ending a call
    if (this.testMode) {
      console.log('Test mode: Simulating call end');
      this.stopCallTimer();
      this.onCallStateChange?.('ended');
      return;
    }

    if (this.session) {
      try {
        this.session.bye();
        this.stopCallTimer();
        this.session = null;
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
  }

  // Toggle mute state
  public toggleMute(mute: boolean): void {
    // In test mode, just log the action
    if (this.testMode) {
      console.log(`Test mode: ${mute ? 'Muting' : 'Unmuting'} call`);
      return;
    }

    if (this.session) {
      try {
        // Access the session's media tracks directly
        const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
        if (sessionDescriptionHandler && 'peerConnection' in sessionDescriptionHandler) {
          const pc = (sessionDescriptionHandler as any).peerConnection as RTCPeerConnection;
          if (pc) {
            pc.getSenders().forEach((sender) => {
              if (sender.track && sender.track.kind === 'audio') {
                sender.track.enabled = !mute;
              }
            });
          }
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  }

    // Accept an incoming call
  public acceptIncomingCall(): void {
    // Stop ringtone
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
    }
    
    // In test mode, simulate accepting a call
    if (this.testMode) {
      console.log('Test mode: Simulating accepting incoming call');
      this.onCallStateChange?.('connected', 'Test Caller');
      this.startCallTimer();
      return;
    }

    if (this.incomingSession) {
      try {
        const options: InvitationAcceptOptions = {
          sessionDescriptionHandlerOptions: {
            constraints: {
              audio: true,
              video: false
            }
          }
        };

        this.incomingSession.accept(options)
          .then(() => {
            this.session = this.incomingSession;
            console.log('Incoming call accepted');
          })
          .catch((error: Error) => {
            console.error('Error accepting incoming call:', error);
            this.onCallStateChange?.('failed');
          });
      } catch (error) {
        console.error('Error accepting incoming call:', error);
        this.onCallStateChange?.('failed');
      }
    }
  }

  // Reject an incoming call
  public rejectIncomingCall(): void {
    // Stop ringtone
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
    }
    
    // In test mode, simulate rejecting a call
    if (this.testMode) {
      console.log('Test mode: Simulating rejecting incoming call');
      this.onCallStateChange?.('idle');
      return;
    }

    if (this.incomingSession) {
      try {
        this.incomingSession.reject()
          .then(() => {
            console.log('Incoming call rejected');
            this.incomingSession = null;
            this.onCallStateChange?.('idle');
          })
          .catch((error: Error) => {
            console.error('Error rejecting incoming call:', error);
          });
      } catch (error) {
        console.error('Error rejecting incoming call:', error);
      }
    }
  }

  // Simulate an incoming call (for testing)
  public simulateIncomingCall(callerName: string = 'Test Caller'): void {
    if (this.testMode) {
      console.log(`Test mode: Simulating incoming call from ${callerName}`);
      
      // Play ringtone
      this.ringtoneAudio?.play().catch(err => console.error('Error playing ringtone:', err));
      
      this.onCallStateChange?.('incoming', callerName);
    }
  }

  // Disconnect SIP session
  public disconnect(): void {
    // In test mode, just reset state
    if (this.testMode) {
      console.log('Test mode: Disconnecting SIP service');
      this.stopCallTimer();
      this.testMode = false;
      return;
    }

    // First end any active call
    if (this.session) {
      try {
        this.session.bye();
      } catch (error) {
        console.error('Error ending active call during disconnect:', error);
      }
      this.session = null;
    }

    // Then stop the user agent
    if (this.userAgent) {
      this.stopCallTimer();
      this.userAgent.stop()
        .then(() => {
          console.log('SIP user agent stopped');
        })
        .catch((error) => {
          console.error('Error stopping SIP user agent:', error);
        });
      this.userAgent = null;
    }

    // Clean up audio elements
    if (typeof document !== 'undefined') {
      if (this.remoteAudio) {
        // Check if the element is actually a child of document.body before removing
        if (this.remoteAudio.parentNode === document.body) {
          document.body.removeChild(this.remoteAudio);
        }
        this.remoteAudio = null;
      }
      
      if (this.ringtoneAudio) {
        this.ringtoneAudio.pause();
        // Check if the element is actually a child of document.body before removing
        if (this.ringtoneAudio.parentNode === document.body) {
          document.body.removeChild(this.ringtoneAudio);
        }
        this.ringtoneAudio = null;
      }
    }
  }

  // Start call timer
  private startCallTimer(): void {
    this.callTimer = setInterval(() => {
      this.onCallDurationUpdate?.();
    }, 1000);
  }

  // Stop call timer
  private stopCallTimer(): void {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }
}

// Create a singleton instance
export const sipService = new SipService();
