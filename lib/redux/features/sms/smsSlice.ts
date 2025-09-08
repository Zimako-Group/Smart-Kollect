import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { SmsHistoryService } from '../../../services/sms-history-service';

// Helper function for client-side phone number validation
const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-numeric characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it's a valid South African number (supports multiple formats)
  const saNumberRegex = /^(\+27|27|0)[0-9]{9}$/;
  return saNumberRegex.test(cleaned);
};

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: 'payment' | 'reminder' | 'legal' | 'custom';
}

export interface SMSHistory {
  id: string;
  timestamp: number;
  recipientPhone: string;
  recipientName: string;
  message: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  accountNumber: string;
}

export interface SMSState {
  isOpen: boolean;
  recipientPhone: string;
  recipientName: string;
  accountNumber: string;
  message: string;
  templates: SMSTemplate[];
  selectedTemplate: string | null;
  showTemplates: boolean;
  sending: boolean;
  sendSuccess: boolean | null;
  error: string | null;
  smsHistory: SMSHistory[];
  customerSmsHistory: Record<string, SMSHistory[]>;
  charactersLeft: number;
  isMessageTooLong: boolean;
  maxSmsLength: number;
  historyLoading: boolean;
}

const initialState: SMSState = {
  isOpen: false,
  recipientPhone: '',
  recipientName: '',
  accountNumber: '',
  message: '',
  templates: [
    {      id: "t1",
      name: "Payment Reminder",
      content: "Dear {name}, this is a friendly reminder that your payment of {amount} is due on {dueDate}. Please contact us if you need assistance.",
      category: "payment",
    },
    {
      id: "t2",
      name: "Payment Confirmation",
      content: "Dear {name}, we have received your payment of {amount}. Thank you for your prompt payment.",
      category: "payment",
    },
    {
      id: "t3",
      name: "Late Payment Notice",
      content: "Dear {name}, your account is now overdue. Please make a payment of {amount} as soon as possible to avoid additional fees.",
      category: "reminder",
    },
    {
      id: "t4",
      name: "Legal Action Warning",
      content: "Dear {name}, your account is seriously overdue. Legal action may be taken if payment of {amount} is not received within 7 days.",
      category: "legal",
    }
  ],
  selectedTemplate: null,
  showTemplates: false,
  sending: false,
  sendSuccess: null,
  error: null,
  smsHistory: [],
  customerSmsHistory: {}, 
  charactersLeft: 160,
  isMessageTooLong: false,
  maxSmsLength: 160,
  historyLoading: false,
};

export const sendSMS = createAsyncThunk(
  'sms/sendSMS',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { sms: SMSState };
      const { recipientPhone, message, recipientName, accountNumber } = state.sms;
      
      if (!recipientPhone || !message.trim()) {
        return rejectWithValue('Recipient phone number and message are required');
      }
      
      if (!accountNumber) {
        return rejectWithValue('Account number is required to store SMS history');
      }
      
      // Log the SMS sending attempt
      console.log('Sending SMS via API:', { 
        to: recipientPhone, 
        message: message.substring(0, 50) + '...', 
        accountNumber 
      });
      
      // Call the server-side SMS API instead of direct service
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientPhone,
          recipientName,
          message,
          accountNumber
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('SMS API response:', result);
      
      const historyEntry: SMSHistory = result.historyEntry || {
        id: result.result?.eventId?.toString() || Date.now().toString(),
        timestamp: Date.now(),
        recipientPhone,
        recipientName,
        message,
        status: 'sent',
        accountNumber
      };
      
      return { success: true, historyEntry };
    } catch (error) {
      console.error('SMS sending error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send SMS');
    }
  }
);

export const loadSmsHistoryForAccount = createAsyncThunk(
  'sms/loadSmsHistoryForAccount',
  async (accountNumber: string, { rejectWithValue }) => {
    try {
      console.log(`Loading SMS history for account: ${accountNumber}`);
      
      if (!accountNumber) {
        return rejectWithValue('Account number is required');
      }
      
      // Use the correct function name that matches the SMS history service
      const history = await SmsHistoryService.loadSmsHistoryForAccount(accountNumber);
      console.log(`Loaded ${history.length} SMS messages for account ${accountNumber}`);
      return { accountNumber, history };
    } catch (error) {
      console.error('Error loading SMS history:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load SMS history');
    }
  }
);

export const updateSmsStatusAsync = createAsyncThunk(
  'sms/updateSmsStatusAsync',
  async (payload: { messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed' }, { rejectWithValue }) => {
    try {
      const { messageId, status } = payload;
      const success = await SmsHistoryService.updateSmsStatus(messageId, status);
      
      if (!success) {
        return rejectWithValue('Failed to update SMS status');
      }
      
      return payload;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update SMS status');
    }
  }
);

export const smsSlice = createSlice({
  name: 'sms',
  initialState,
  reducers: {
    openSMSInterface: (state, action: PayloadAction<{
      recipientPhone: string;
      recipientName: string;
      accountNumber?: string;
    }>) => {
      // Format and validate the phone number for MyMobileAPI
      let formattedPhone = '';
      if (action.payload.recipientPhone) {
        // Clean the phone number (remove any non-digit characters except the leading +)
        formattedPhone = action.payload.recipientPhone.replace(/[^\d+]/g, '');
        
        // Format for MyMobileAPI (no + prefix, but with country code)
        if (formattedPhone && formattedPhone.startsWith('+27')) {
          // Remove the + prefix for MyMobileAPI
          formattedPhone = formattedPhone.substring(1);
        } else if (formattedPhone && formattedPhone.startsWith('0')) {
          // Convert local format (0xxxxxxxxx) to international (27xxxxxxxxx)
          formattedPhone = '27' + formattedPhone.substring(1);
        } else if (formattedPhone && !formattedPhone.startsWith('27') && formattedPhone.length >= 9) {
          // If it's likely a South African number without country code
          if (/^[6-8]/.test(formattedPhone)) {
            formattedPhone = '27' + formattedPhone;
          }
        }
      }
      
      state.isOpen = true;
      state.recipientPhone = formattedPhone || action.payload.recipientPhone; // Fallback to original if formatting fails
      state.recipientName = action.payload.recipientName;
      state.accountNumber = action.payload.accountNumber || '';
      state.message = '';
      state.selectedTemplate = null;
      state.sendSuccess = null;
      state.error = null;
      state.charactersLeft = state.maxSmsLength;
      state.isMessageTooLong = false;
    },
    closeSMSInterface: (state) => {
      state.isOpen = false;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
      state.charactersLeft = state.maxSmsLength - action.payload.length;
      state.isMessageTooLong = action.payload.length > state.maxSmsLength;
    },
    insertPlaceholder: (state, action: PayloadAction<string>) => {
      state.message += `{${action.payload}}`;
      state.charactersLeft = state.maxSmsLength - state.message.length;
      state.isMessageTooLong = state.message.length > state.maxSmsLength;
    },
    applyTemplate: (state, action: PayloadAction<string>) => {
      const templateId = action.payload;
      const template = state.templates.find(t => t.id === templateId);
      
      if (template) {
        let content = template.content;
        
        if (state.recipientName) {
          content = content.replace(/{name}/g, state.recipientName);
        }
        
        state.message = content;
        state.selectedTemplate = templateId;
        state.charactersLeft = state.maxSmsLength - content.length;
        state.isMessageTooLong = content.length > state.maxSmsLength;
      }
    },
    clearTemplate: (state) => {
      state.selectedTemplate = null;
    },
    toggleTemplates: (state) => {
      state.showTemplates = !state.showTemplates;
    },
    addTemplate: (state, action: PayloadAction<Omit<SMSTemplate, 'id'>>) => {
      const newTemplate = {
        ...action.payload,
        id: Date.now().toString()
      };
      
      state.templates.push(newTemplate);
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },
    resetSMSState: (state) => {
      state.isOpen = false;
      state.recipientPhone = '';
      state.recipientName = '';
      state.accountNumber = '';
      state.message = '';
      state.selectedTemplate = null;
      state.showTemplates = false;
      state.sending = false;
      state.sendSuccess = null;
      state.error = null;
      state.charactersLeft = 160;
      state.isMessageTooLong = false;
    },
    updateSmsStatus: (state, action: PayloadAction<{
      id: string;
      status: 'sent' | 'delivered' | 'read' | 'failed';
      accountNumber: string;
    }>) => {
      const { id, status, accountNumber } = action.payload;
      
      const historyIndex = state.smsHistory.findIndex(item => item.id === id);
      if (historyIndex !== -1) {
        state.smsHistory[historyIndex].status = status;
      }
      
      if (accountNumber && state.customerSmsHistory[accountNumber]) {
        const customerHistoryIndex = state.customerSmsHistory[accountNumber].findIndex(item => item.id === id);
        if (customerHistoryIndex !== -1) {
          state.customerSmsHistory[accountNumber][customerHistoryIndex].status = status;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendSMS.pending, (state) => {
        state.sending = true;
        state.sendSuccess = null;
        state.error = null;
      })
      .addCase(sendSMS.fulfilled, (state, action) => {
        state.sending = false;
        state.sendSuccess = true;
        
        const { historyEntry } = action.payload as { historyEntry: SMSHistory };
        
        state.smsHistory.unshift(historyEntry);
        
        if (historyEntry.accountNumber) {
          if (!state.customerSmsHistory[historyEntry.accountNumber]) {
            state.customerSmsHistory[historyEntry.accountNumber] = [];
          }
          state.customerSmsHistory[historyEntry.accountNumber].unshift(historyEntry);
        }
        
        state.message = '';
        state.selectedTemplate = null;
        state.isOpen = false;
        state.charactersLeft = 160;
        state.isMessageTooLong = false;
      })
      .addCase(sendSMS.rejected, (state, action) => {
        state.sending = false;
        state.sendSuccess = false;
        state.error = action.payload as string;
        
        const newHistoryEntry: SMSHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          recipientPhone: state.recipientPhone,
          recipientName: state.recipientName,
          message: state.message,
          status: 'failed',
          accountNumber: state.accountNumber
        };
        
        state.smsHistory.unshift(newHistoryEntry);
        
        if (state.accountNumber) {
          if (!state.customerSmsHistory[state.accountNumber]) {
            state.customerSmsHistory[state.accountNumber] = [];
          }
          state.customerSmsHistory[state.accountNumber].unshift(newHistoryEntry);
          
          SmsHistoryService.saveSmsToHistory(newHistoryEntry);
        }
      })
      
      .addCase(loadSmsHistoryForAccount.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(loadSmsHistoryForAccount.fulfilled, (state, action) => {
        state.historyLoading = false;
        const { accountNumber, history } = action.payload;
        
        if (accountNumber) {
          state.customerSmsHistory[accountNumber] = history;
        }
      })
      .addCase(loadSmsHistoryForAccount.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateSmsStatusAsync.fulfilled, (state, action) => {
        const { messageId, status } = action.payload;
        
      });
  }
});

export const {
  openSMSInterface,
  closeSMSInterface,
  setMessage,
  insertPlaceholder,
  applyTemplate,
  clearTemplate,
  toggleTemplates,
  addTemplate,
  deleteTemplate,
  resetSMSState,
  updateSmsStatus
} = smsSlice.actions;

export const selectSMS = (state: RootState) => state.sms;

export default smsSlice.reducer;
