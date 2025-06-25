import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
  content?: File;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface EmailState {
  isOpen: boolean;
  recipientEmail: string;
  recipientName: string;
  accountNumber: string;
  subject: string;
  message: string;
  ccEmails: string[];
  attachments: EmailAttachment[];
  templates: EmailTemplate[];
  showTemplates: boolean;
  sending: boolean;
  sendSuccess: boolean | null;
  error: string | null;
  emailHistory: Array<{
    id: string;
    timestamp: number;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    message: string;
    attachments: EmailAttachment[];
    status: 'sent' | 'failed';
  }>;
}

const initialState: EmailState = {
  isOpen: false,
  recipientEmail: '',
  recipientName: '',
  accountNumber: 'N/A',
  subject: '',
  message: '',
  ccEmails: [],
  attachments: [],
  templates: [
    { 
      id: "1", 
      name: "Payment Reminder", 
      subject: "Payment Reminder: Account #{{accountNumber}}", 
      body: "Dear {{recipientName}},\n\nThis is a friendly reminder that your payment for account #{{accountNumber}} is due soon.\n\nPlease contact us if you have any questions.\n\nBest regards,\nZimako Collections Team" 
    },
    { 
      id: "2", 
      name: "Payment Confirmation", 
      subject: "Payment Confirmation: Account #{{accountNumber}}", 
      body: "Dear {{recipientName}},\n\nWe have received your payment for account #{{accountNumber}}. Thank you for your prompt attention to this matter.\n\nBest regards,\nZimako Collections Team" 
    },
    { 
      id: "3", 
      name: "Settlement Offer", 
      subject: "Settlement Offer: Account #{{accountNumber}}", 
      body: "Dear {{recipientName}},\n\nWe would like to offer you a settlement option for your account #{{accountNumber}}.\n\nPlease contact us to discuss the details.\n\nBest regards,\nZimako Collections Team" 
    }
  ],
  showTemplates: false,
  sending: false,
  sendSuccess: null,
  error: null,
  emailHistory: []
};

// Async thunk for sending emails
export const sendEmail = createAsyncThunk(
  'email/sendEmail',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { email: EmailState };
      const { 
        recipientEmail, 
        recipientName, 
        accountNumber,
        subject, 
        message, 
        ccEmails, 
        attachments 
      } = state.email;

      // Import dynamically to avoid SSR issues
      const { prepareEmailData, sendEmailApi } = await import('@/lib/email-service');

      // Prepare the email data with proper attachment handling
      const emailData = await prepareEmailData(
        recipientEmail,
        recipientName,
        subject,
        message,
        ccEmails,
        attachments,
        accountNumber
      );

      // Send the email using our service
      const data = await sendEmailApi(emailData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send email');
    }
  }
);

export const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    openEmailInterface: (state, action: PayloadAction<{
      recipientEmail: string;
      recipientName: string;
      accountNumber?: string;
    }>) => {
      state.isOpen = true;
      state.recipientEmail = action.payload.recipientEmail;
      state.recipientName = action.payload.recipientName;
      state.accountNumber = action.payload.accountNumber || 'N/A';
      state.subject = '';
      state.message = '';
      state.ccEmails = [];
      state.attachments = [];
      state.showTemplates = false;
      state.sending = false;
      state.sendSuccess = null;
      state.error = null;
    },
    closeEmailInterface: (state) => {
      state.isOpen = false;
    },
    setSubject: (state, action: PayloadAction<string>) => {
      state.subject = action.payload;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    addCcEmail: (state, action: PayloadAction<string>) => {
      if (!state.ccEmails.includes(action.payload)) {
        state.ccEmails.push(action.payload);
      }
    },
    removeCcEmail: (state, action: PayloadAction<string>) => {
      state.ccEmails = state.ccEmails.filter(email => email !== action.payload);
    },
    addAttachment: (state, action: PayloadAction<EmailAttachment>) => {
      state.attachments.push(action.payload);
    },
    removeAttachment: (state, action: PayloadAction<string>) => {
      state.attachments = state.attachments.filter(attachment => attachment.name !== action.payload);
    },
    toggleTemplates: (state) => {
      state.showTemplates = !state.showTemplates;
    },
    applyTemplate: (state, action: PayloadAction<string>) => {
      const template = state.templates.find(t => t.id === action.payload);
      if (template) {
        // Replace placeholders with actual values
        const processedSubject = template.subject
          .replace(/{{recipientName}}/g, state.recipientName)
          .replace(/{{accountNumber}}/g, state.accountNumber);
        
        const processedBody = template.body
          .replace(/{{recipientName}}/g, state.recipientName)
          .replace(/{{accountNumber}}/g, state.accountNumber);
        
        state.subject = processedSubject;
        state.message = processedBody;
        state.showTemplates = false;
      }
    },
    addTemplate: (state, action: PayloadAction<Omit<EmailTemplate, 'id'>>) => {
      const newId = (state.templates.length + 1).toString();
      state.templates.push({
        id: newId,
        ...action.payload
      });
    },
    removeTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(template => template.id !== action.payload);
    },
    resetEmailState: (state) => {
      state.subject = '';
      state.message = '';
      state.ccEmails = [];
      state.attachments = [];
      state.showTemplates = false;
      state.sending = false;
      state.sendSuccess = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendEmail.pending, (state) => {
        state.sending = true;
        state.sendSuccess = null;
        state.error = null;
      })
      .addCase(sendEmail.fulfilled, (state) => {
        state.sending = false;
        state.sendSuccess = true;
        
        // Add to email history
        state.emailHistory.unshift({
          id: Date.now().toString(),
          timestamp: Date.now(),
          recipientEmail: state.recipientEmail,
          recipientName: state.recipientName,
          subject: state.subject,
          message: state.message,
          attachments: state.attachments,
          status: 'sent'
        });
        
        // Reset form
        state.subject = '';
        state.message = '';
        state.ccEmails = [];
        state.attachments = [];
        state.isOpen = false;
      })
      .addCase(sendEmail.rejected, (state, action) => {
        state.sending = false;
        state.sendSuccess = false;
        state.error = action.payload as string;
        
        // Add to email history with failed status
        state.emailHistory.unshift({
          id: Date.now().toString(),
          timestamp: Date.now(),
          recipientEmail: state.recipientEmail,
          recipientName: state.recipientName,
          subject: state.subject,
          message: state.message,
          attachments: state.attachments,
          status: 'failed'
        });
      });
  }
});

export const {
  openEmailInterface,
  closeEmailInterface,
  setSubject,
  setMessage,
  addCcEmail,
  removeCcEmail,
  addAttachment,
  removeAttachment,
  toggleTemplates,
  applyTemplate,
  addTemplate,
  removeTemplate,
  resetEmailState
} = emailSlice.actions;

export default emailSlice.reducer;
