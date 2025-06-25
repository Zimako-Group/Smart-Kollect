import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    type: 'image' | 'file' | 'audio';
    url: string;
    name: string;
    size?: string;
  }>;
}

export interface ChatState {
  isDialogOpen: boolean;
  selectedAccount: {
    id: string;
    name: string;
    accountNumber?: string;
  } | null;
  messages: Message[];
  activeConversation: string | null; // Can be 'team' or agent ID
}

const initialState: ChatState = {
  isDialogOpen: false,
  selectedAccount: null,
  messages: [],
  activeConversation: 'team' // Default to team chat
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    openDialog: (state, action: PayloadAction<{
      accountId: string;
      accountName: string;
      accountNumber?: string;
    }>) => {
      state.isDialogOpen = true;
      state.selectedAccount = {
        id: action.payload.accountId,
        name: action.payload.accountName,
        accountNumber: action.payload.accountNumber
      };
    },
    closeDialog: (state) => {
      state.isDialogOpen = false;
    },
    sendMessage: (state, action: PayloadAction<{
      content: string;
      sender: {
        id: string;
        name: string;
        avatar?: string;
        role?: string;
      };
      attachments?: Message['attachments'];
    }>) => {
      const newMessage: Message = {
        id: uuidv4(),
        content: action.payload.content,
        sender: action.payload.sender,
        timestamp: new Date().toISOString(),
        status: 'sent',
        attachments: action.payload.attachments
      };
      
      state.messages.push(newMessage);
    },
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: string;
      status: 'sent' | 'delivered' | 'read';
    }>) => {
      const message = state.messages.find(m => m.id === action.payload.messageId);
      if (message) {
        message.status = action.payload.status;
      }
    },
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversation = action.payload;
    }
  }
});

export const { openDialog, closeDialog, sendMessage, updateMessageStatus, setActiveConversation } = chatSlice.actions;

export default chatSlice.reducer;
