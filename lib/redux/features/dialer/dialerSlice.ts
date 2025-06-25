import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CallInfo {
  customerId?: string;
  customerName?: string;
  phoneNumber: string;
  accountId?: string;
}

export interface CallWrapUp {
  notes: string;
  outcome: string;
  callbackDate?: string;
  callbackTime?: string;
}

export interface DialerState {
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'dialer' | 'search' | 'history';
  callState: 'idle' | 'calling' | 'connected' | 'ended';
  callInfo: CallInfo | null;
  callStartTime: number | null;
  callDuration: number;
  callWrapUp: CallWrapUp | null;
  isAutoDialerEnabled: boolean;
  callHistory: Array<{
    id: string;
    timestamp: number;
    duration: number;
    callInfo: CallInfo;
    outcome?: string;
  }>;
}

const initialState: DialerState = {
  isOpen: false,
  isMinimized: false,
  activeTab: 'dialer',
  callState: 'idle',
  callInfo: null,
  callStartTime: null,
  callDuration: 0,
  callWrapUp: null,
  isAutoDialerEnabled: false,
  callHistory: [],
};

export const dialerSlice = createSlice({
  name: 'dialer',
  initialState,
  reducers: {
    openDialer: (state) => {
      state.isOpen = true;
      state.isMinimized = false;
    },
    closeDialer: (state) => {
      if (state.callState !== 'connected') {
        state.isOpen = false;
      }
    },
    minimizeDialer: (state) => {
      state.isMinimized = true;
    },
    maximizeDialer: (state) => {
      state.isMinimized = false;
    },
    setActiveTab: (state, action: PayloadAction<DialerState['activeTab']>) => {
      state.activeTab = action.payload;
    },
    startCall: (state, action: PayloadAction<CallInfo>) => {
      state.callState = 'calling';
      state.callInfo = action.payload;
      state.isOpen = true;
      state.isMinimized = false;
      state.callWrapUp = null;
    },
    connectCall: (state) => {
      state.callState = 'connected';
      state.callStartTime = Date.now();
    },
    endCall: (state) => {
      state.callState = 'ended';
      if (state.callStartTime) {
        state.callDuration = Math.floor((Date.now() - state.callStartTime) / 1000);
        
        // Add to call history
        if (state.callInfo) {
          state.callHistory.unshift({
            id: Date.now().toString(),
            timestamp: Date.now(),
            duration: state.callDuration,
            callInfo: state.callInfo,
          });
        }
      }
    },
    resetDialer: (state) => {
      state.callState = 'idle';
      state.callInfo = null;
      state.callStartTime = null;
      state.callDuration = 0;
      state.callWrapUp = null;
    },
    updateCallWrapUp: (state, action: PayloadAction<Partial<CallWrapUp>>) => {
      state.callWrapUp = {
        ...(state.callWrapUp || { notes: '', outcome: '' }),
        ...action.payload
      };
      
      // Update the outcome in call history if available
      if (state.callHistory.length > 0 && action.payload.outcome) {
        state.callHistory[0].outcome = action.payload.outcome;
      }
    },
    toggleAutoDialer: (state) => {
      state.isAutoDialerEnabled = !state.isAutoDialerEnabled;
    },
  },
});

export const {
  openDialer,
  closeDialer,
  minimizeDialer,
  maximizeDialer,
  setActiveTab,
  startCall,
  connectCall,
  endCall,
  resetDialer,
  updateCallWrapUp,
  toggleAutoDialer,
} = dialerSlice.actions;

export default dialerSlice.reducer;
