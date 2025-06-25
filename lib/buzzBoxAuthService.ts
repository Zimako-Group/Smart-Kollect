// BuzzBox Authentication Service
// Handles JWT token management, authentication, and token renewal

interface AuthResponse {
  token: string;
  expires_in: number;
  token_type: string;
}

class BuzzBoxAuthService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;
  private apiUrl: string = 'https://buzzboxcloud.co.za/buzzbox-conductor';
  private cachedAuthHeader: Record<string, string> | null = null;
  private lastAuthAttempt: number = 0;
  private authInProgress: boolean = false;
  private authPromise: Promise<string | null> | null = null;
  
  // Store credentials
  private identity: string | null = null;
  private password: string | null = null;

  constructor() {
    // Try to load token from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      this.loadTokenFromStorage();
    }
  }

  // Initialize with credentials
  public initialize(identity: string, password: string, apiUrl?: string): void {
    this.identity = identity;
    this.password = password;
    
    if (apiUrl) {
      this.apiUrl = apiUrl;
    }
    
    // Check if we have a token and if it's still valid
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      // Token is still valid, schedule refresh
      this.scheduleTokenRefresh();
      console.log('BuzzBox Auth: Reusing existing token from initialization');
    }
    // Don't authenticate automatically - let getToken or getAuthHeader handle it when needed
  }

  // Authenticate and get a new token
  public async authenticate(): Promise<string | null> {
    // If authentication is already in progress, return the existing promise
    if (this.authInProgress && this.authPromise) {
      console.log('BuzzBox Auth: Authentication already in progress, reusing the same request');
      return this.authPromise;
    }
    
    // Prevent multiple authentication calls within a short time frame (2 seconds)
    const now = Date.now();
    if (now - this.lastAuthAttempt < 2000 && this.token) {
      console.log('BuzzBox Auth: Authentication throttled, reusing existing token');
      return this.token;
    }
    
    if (!this.identity || !this.password) {
      console.error('BuzzBox Auth: No credentials provided');
      return null;
    }
    
    // Set auth in progress flag and create a new promise
    this.authInProgress = true;
    this.lastAuthAttempt = now;
    
    // Create a new authentication promise
    this.authPromise = (async () => {
      try {
        // Clear any existing tokens first to avoid refresh_token_not_found errors
        this.clearToken();
        
        console.log('BuzzBox Auth: Authenticating with identity:', this.identity);
        
        // Log the full request details for debugging
        // Use the correct endpoint format according to BuzzBox documentation
        const requestUrl = `${this.apiUrl}/rest/v1/login`;
        const requestBody = {
          identity: this.identity,
          password: this.password,
        };
        
        console.log('BuzzBox Auth: Request URL:', requestUrl);
        console.log('BuzzBox Auth: Request body:', JSON.stringify({ identity: this.identity, password: '[REDACTED]' }));
        
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
  
        // Log the response status
        console.log('BuzzBox Auth: Response status:', response.status, response.statusText);
        
        // Get the response text regardless of status
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error('BuzzBox Auth: Authentication failed with status:', response.status);
          console.error('BuzzBox Auth: Response body:', responseText);
          throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${responseText}`);
        }
  
        // Try to parse the response as JSON
        let authData: any;
        try {
          authData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('BuzzBox Auth: Failed to parse authentication response as JSON:', responseText);
          throw new Error(`Failed to parse authentication response: ${parseError}`);
        }
        
        console.log('BuzzBox Auth: Raw response data:', JSON.stringify(authData));
        
        // The API seems to be returning a different format than expected
        // It returns an object with headerValue that contains the Bearer token
        if (authData.headerValue && typeof authData.headerValue === 'string' && authData.headerValue.startsWith('Bearer ')) {
          // Extract the token from the Bearer string
          const extractedToken = authData.headerValue.substring(7); // Remove 'Bearer ' prefix
          console.log('BuzzBox Auth: Extracted token from headerValue');
          
          // Create a compatible authData object
          authData = {
            token: extractedToken,
            expires_in: authData.expiresEpochSecs ? (authData.expiresEpochSecs - Math.floor(Date.now() / 1000)) : 3600,
            token_type: 'Bearer'
          };
        } else if (!authData.token) {
          console.error('BuzzBox Auth: No token in response:', authData);
          throw new Error('No token in authentication response');
        }
        
        // Save token and calculate expiry time (subtract 60 seconds for safety margin)
        this.token = authData.token;
        
        // Make sure expires_in is a valid number
        let expirySeconds = 3600; // Default to 1 hour if not provided
        if (authData.expires_in && typeof authData.expires_in === 'number' && !isNaN(authData.expires_in)) {
          expirySeconds = Math.max(300, authData.expires_in - 60); // Minimum 5 minutes
        }
        
        this.tokenExpiry = new Date(Date.now() + expirySeconds * 1000);
        
        // Save to localStorage if in browser
        this.saveTokenToStorage();
        
        // Schedule token refresh
        this.scheduleTokenRefresh();
        
        console.log(`BuzzBox Auth: Authentication successful, token expires in ${expirySeconds} seconds`);
        // Safe substring with null check to fix lint error
        if (this.token) {
          console.log('BuzzBox Auth: Token received (first 10 chars):', this.token.substring(0, 10) + '...');
        }
        
        return this.token;
      } catch (error) {
        console.error('BuzzBox Auth: Authentication error:', error);
        this.clearToken();
        return null;
      } finally {
        // Reset auth in progress flag
        this.authInProgress = false;
        this.authPromise = null;
      }
    })();
    
    return this.authPromise;
  }

  // Get the current token, refreshing if needed
  public async getToken(): Promise<string | null> {
    try {
      // If token exists and is not expired, return it without testing
      if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
        console.log('BuzzBox Auth: Using existing valid token, no need to authenticate');
        return this.token;
      }
      
      // If token is missing or expired, authenticate to get a new one
      if (!this.token || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
        console.log('BuzzBox Auth: Token missing or expired, authenticating...');
        return this.authenticate();
      }
      
      // We should never reach here, but just in case
      return this.token;
    } catch (error) {
      console.error('BuzzBox Auth: Error getting token:', error);
      // Clear any existing token and try a fresh authentication
      this.clearToken();
      return this.authenticate();
    }
  }

  // Schedule token refresh before expiry
  private scheduleTokenRefresh(): void {
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    // Don't schedule if we don't have a valid expiry
    if (!this.tokenExpiry) return;
    
    // Calculate time until refresh (75% of the way to expiry)
    const now = new Date();
    const expiryTime = this.tokenExpiry.getTime();
    const timeUntilExpiry = expiryTime - now.getTime();
    
    // If token is already expired or will expire very soon, don't schedule
    if (timeUntilExpiry <= 10000) { // 10 seconds or less
      console.log('BuzzBox Auth: Token is expired or expiring very soon, not scheduling refresh');
      return;
    }
    
    // Calculate refresh time (75% of the way to expiry)
    const refreshTime = Math.max(10000, Math.min(timeUntilExpiry * 0.75, 3600000)); // Between 10s and 1h
    
    // Schedule refresh
    this.refreshTimeout = setTimeout(() => {
      console.log('BuzzBox Auth: Refreshing token...');
      this.authenticate().catch(err => {
        console.error('BuzzBox Auth: Error refreshing token:', err);
        // If refresh fails, try again in 30 seconds, but only once
        setTimeout(() => this.authenticate(), 30000);
      });
    }, refreshTime);
    
    console.log(`BuzzBox Auth: Token refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
  }

  // Clear token and cancel refresh
  public clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
    this.cachedAuthHeader = null;
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    // Clear from localStorage if in browser
    if (typeof window !== 'undefined') {
      localStorage.removeItem('buzzBoxAuthToken');
      localStorage.removeItem('buzzBoxAuthExpiry');
    }
    
    console.log('BuzzBox Auth: Token cleared');
  }

  // Save token to localStorage
  private saveTokenToStorage(): void {
    if (typeof window !== 'undefined' && this.token && this.tokenExpiry) {
      localStorage.setItem('buzzBoxAuthToken', this.token);
      localStorage.setItem('buzzBoxAuthExpiry', this.tokenExpiry.toISOString());
    }
  }

  // Load token from localStorage
  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('buzzBoxAuthToken');
      const expiryStr = localStorage.getItem('buzzBoxAuthExpiry');
      
      if (token && expiryStr) {
        this.token = token;
        this.tokenExpiry = new Date(expiryStr);
        
        // If token is still valid, schedule refresh
        if (this.tokenExpiry > new Date()) {
          console.log('BuzzBox Auth: Loaded valid token from storage');
          this.scheduleTokenRefresh();
        } else {
          console.log('BuzzBox Auth: Loaded token from storage but it is expired');
          this.clearToken();
        }
      }
    }
  }

  // Get authorization header
  public async getAuthHeader(): Promise<Record<string, string> | null> {
    // Prevent multiple auth attempts within a short time frame (1 second)
    const now = Date.now();
    if (now - this.lastAuthAttempt < 1000) {
      console.log('BuzzBox Auth: Throttling auth requests - using cached header');
      return this.cachedAuthHeader;
    }
    
    // If we have a cached auth header and the token is still valid, return it
    if (this.cachedAuthHeader && this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      console.log('BuzzBox Auth: Using cached auth header');
      return this.cachedAuthHeader;
    }
    
    console.log('BuzzBox Auth: Getting fresh auth header');
    this.lastAuthAttempt = now;
    
    const token = await this.getToken();
    
    if (!token) {
      console.log('BuzzBox Auth: No token available for auth header');
      this.cachedAuthHeader = null;
      return null;
    }
    
    // Check if the token already has 'Bearer ' prefix
    const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    // Safe substring with null check to fix lint error
    console.log(`BuzzBox Auth: Created auth header with token (first 10 chars): ${token?.substring(0, 10) || ''}...`);
    
    // Cache the auth header
    this.cachedAuthHeader = {
      'Authorization': authValue
    };
    
    return this.cachedAuthHeader;
  }
}

// Create a singleton instance
export const buzzBoxAuthService = new BuzzBoxAuthService();

// Initialize with your credentials
export const initializeBuzzBoxAuth = (identity: string, password: string, apiUrl?: string): void => {
  buzzBoxAuthService.initialize(identity, password, apiUrl);
};
