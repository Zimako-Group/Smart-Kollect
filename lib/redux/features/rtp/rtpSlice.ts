import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

// Types
export interface RTPReason {
  id: string;
  reason: string;
  description: string;
}

export interface RTPRecord {
  id: string;
  customerId: string;
  customerName: string;
  reason: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'resolved' | 'escalated';
}

interface RTPState {
  isOpen: boolean;
  customer: {
    id: string;
    name: string;
    accountNumber: string;
  };
  formData: {
    reasonId: string;
    customReason: string;
    notes: string;
  };
  creating: boolean;
  createStatus: {
    success: boolean;
    error: string | null;
  };
  history: RTPRecord[];
  reasons: RTPReason[];
}

// Initial state
const initialState: RTPState = {
  isOpen: false,
  customer: {
    id: '',
    name: '',
    accountNumber: '',
  },
  formData: {
    reasonId: '',
    customReason: '',
    notes: '',
  },
  creating: false,
  createStatus: {
    success: false,
    error: null,
  },
  history: [],
  reasons: [
    {
      id: "financial-hardship",
      reason: "Financial Hardship",
      description: "Customer claims inability to pay due to financial difficulties"
    },
    {
      id: "disputes-debt",
      reason: "Disputes Debt",
      description: "Customer disputes the validity or amount of the debt"
    },
    {
      id: "service-complaint",
      reason: "Service Complaint",
      description: "Customer refuses to pay due to dissatisfaction with service"
    },
    {
      id: "awaiting-insurance",
      reason: "Awaiting Insurance",
      description: "Customer claims insurance will cover the debt"
    },
    {
      id: "bankruptcy",
      reason: "Bankruptcy",
      description: "Customer has filed or intends to file for bankruptcy"
    },
    {
      id: "legal-action",
      reason: "Legal Action",
      description: "Customer threatens legal action if pursued for payment"
    },
    {
      id: "custom",
      reason: "Other Reason",
      description: "Custom reason for refusal to pay"
    }
  ]
};

// Async thunk for creating RTP
export const createRTP = createAsyncThunk(
  'rtp/createRTP',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { rtp: RTPState };
      const { customer, formData } = state.rtp;
      
      // Get the selected reason text
      const reasonText = formData.reasonId === 'custom'
        ? formData.customReason
        : state.rtp.reasons.find(r => r.id === formData.reasonId)?.reason || 'Unknown';
      
      // Create a new RTP record
      const newRTP = {
        customer_id: customer.id,
        customer_name: customer.name,
        account_number: customer.accountNumber,
        reason: reasonText,
        notes: formData.notes,
        created_at: new Date().toISOString(),
        created_by: 'Current User', // This would be replaced with actual user info
        status: 'active'
      };
      
      // In a real implementation, you would save to your database
      // For now, we'll simulate a successful API call
      // const { data, error } = await supabase.from('rtp_records').insert(newRTP);
      
      // if (error) throw new Error(error.message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: `rtp-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        reason: reasonText,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
        status: 'active' as const
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create RTP record');
    }
  }
);

// Fetch RTP history for a customer
export const fetchRTPHistory = createAsyncThunk(
  'rtp/fetchRTPHistory',
  async (customerId: string, { rejectWithValue }) => {
    try {
      // In a real implementation, you would fetch from your database
      // const { data, error } = await supabase
      //   .from('rtp_records')
      //   .select('*')
      //   .eq('customer_id', customerId);
      
      // if (error) throw new Error(error.message);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      return [
        {
          id: 'rtp-1',
          customerId,
          customerName: 'Mock Customer',
          reason: 'Financial Hardship',
          notes: 'Customer claims recent job loss',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'Agent Smith',
          status: 'active' as const
        },
        {
          id: 'rtp-2',
          customerId,
          customerName: 'Mock Customer',
          reason: 'Disputes Debt',
          notes: 'Customer claims they already paid',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'Agent Johnson',
          status: 'resolved' as const
        }
      ];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch RTP history');
    }
  }
);

// Create the slice
const rtpSlice = createSlice({
  name: 'rtp',
  initialState,
  reducers: {
    openRTPInterface: (state, action: PayloadAction<{
      customerId: string;
      customerName: string;
      accountNumber: string;
    }>) => {
      state.isOpen = true;
      state.customer = {
        id: action.payload.customerId,
        name: action.payload.customerName,
        accountNumber: action.payload.accountNumber
      };
      state.createStatus = {
        success: false,
        error: null
      };
      // Reset form data
      state.formData = {
        reasonId: '',
        customReason: '',
        notes: ''
      };
    },
    closeRTPInterface: (state) => {
      state.isOpen = false;
    },
    setReasonId: (state, action: PayloadAction<string>) => {
      state.formData.reasonId = action.payload;
    },
    setCustomReason: (state, action: PayloadAction<string>) => {
      state.formData.customReason = action.payload;
    },
    setNotes: (state, action: PayloadAction<string>) => {
      state.formData.notes = action.payload;
    },
    resetForm: (state) => {
      state.formData = {
        reasonId: '',
        customReason: '',
        notes: ''
      };
      state.createStatus = {
        success: false,
        error: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle createRTP
      .addCase(createRTP.pending, (state) => {
        state.creating = true;
        state.createStatus = {
          success: false,
          error: null
        };
      })
      .addCase(createRTP.fulfilled, (state, action) => {
        state.creating = false;
        state.createStatus = {
          success: true,
          error: null
        };
        state.history.unshift(action.payload);
      })
      .addCase(createRTP.rejected, (state, action) => {
        state.creating = false;
        state.createStatus = {
          success: false,
          error: action.payload as string
        };
      })
      
      // Handle fetchRTPHistory
      .addCase(fetchRTPHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  }
});

// Export actions
export const {
  openRTPInterface,
  closeRTPInterface,
  setReasonId,
  setCustomReason,
  setNotes,
  resetForm
} = rtpSlice.actions;

// Export reducer
export default rtpSlice.reducer;
