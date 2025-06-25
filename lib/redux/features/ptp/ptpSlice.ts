import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createPTP as createPTPService, getPTPHistory, PTP } from '@/lib/ptp-service';
import { supabase } from '@/lib/supabaseClient';

// Define types for PTP state
export interface PTPArrangement {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string; // ISO date string
  paymentMethod: string;
  notes: string;
  status: 'pending' | 'paid' | 'defaulted';
  createdAt: string; // ISO date string
  createdBy: string;
}

export interface PTPState {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  accountNumber: string;
  amount: string;
  date: string | null;
  paymentMethod: string;
  notes: string;
  creating: boolean;
  createSuccess: boolean | null;
  error: string | null;
  ptpHistory: PTPArrangement[];
  loadingHistory: boolean;
}

// Initial state
const initialState: PTPState = {
  isOpen: false,
  customerId: '',
  customerName: '',
  accountNumber: '',
  amount: '',
  date: null,
  paymentMethod: 'bank_transfer',
  notes: '',
  creating: false,
  createSuccess: null,
  error: null,
  ptpHistory: [],
  loadingHistory: false
};

// Async thunk for fetching PTP history
export const fetchPTPHistory = createAsyncThunk(
  'ptp/fetchPTPHistory',
  async (debtorId: string, { rejectWithValue }) => {
    try {
      const ptpHistory = await getPTPHistory(debtorId);
      
      // Transform the data to match our frontend model
      return ptpHistory.map(ptp => ({
        id: ptp.id,
        customerId: ptp.debtor_id,
        customerName: '', // We'll need to fetch this separately or pass it in
        amount: ptp.amount,
        date: ptp.date,
        paymentMethod: ptp.payment_method,
        notes: ptp.notes || '',
        status: ptp.status,
        createdAt: ptp.created_at,
        createdBy: ptp.created_by
      }));
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for creating a PTP arrangement
export const createPTP = createAsyncThunk(
  'ptp/createPTP',
  async (userId: string | null = null, { getState, rejectWithValue }) => {
    const state = getState() as { ptp: PTPState };
    const { customerId, customerName, accountNumber, amount, date, paymentMethod, notes } = state.ptp;
    
    if (!customerId || !amount || !date || !paymentMethod) {
      return rejectWithValue('Missing required fields');
    }
    
    try {
      // Create a mutable variable for the user ID
      let userIdToUse = userId;
      
      // Log the passed userId parameter
      console.log('User ID passed to createPTP thunk:', userIdToUse);
      
      // If no userId was passed, try to get it from localStorage where it's stored by AuthContext
      if (!userIdToUse) {
        console.log('No user ID passed, trying to get it from localStorage');
        
        // First try the zimako_user in localStorage (set by AuthContext)
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('zimako_user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser && parsedUser.id) {
                userIdToUse = parsedUser.id;
                console.log('Found user ID in localStorage (zimako_user):', userIdToUse);
              }
            } catch (error) {
              console.error('Error parsing user from localStorage:', error);
            }
          }
        }
        
        // If still no user ID, try to get it from the session
        if (!userIdToUse) {
          console.log('No user ID in localStorage, trying session');
          const { data } = await supabase.auth.getSession();
          const sessionUserId = data.session?.user?.id;
          
          if (sessionUserId) {
            userIdToUse = sessionUserId;
            console.log('Got user ID from session:', userIdToUse);
          }
        }
      }
      
      // Create PTP in Supabase with the current user's UUID
      const ptpData = await createPTPService({
        debtor_id: customerId,
        amount: parseFloat(amount),
        date,
        payment_method: paymentMethod,
        notes: notes || undefined,
        created_by: userIdToUse // Use the user ID we determined
      });
      
      // Transform to our frontend model
      return {
        id: ptpData.id,
        customerId: ptpData.debtor_id,
        customerName, // Use the name we already have
        amount: ptpData.amount,
        date: ptpData.date,
        paymentMethod: ptpData.payment_method,
        notes: ptpData.notes || '',
        status: ptpData.status,
        createdAt: ptpData.created_at,
        createdBy: ptpData.created_by
      };
    } catch (error: any) {
      console.error('Error creating PTP:', error);
      return rejectWithValue(error.message || 'Failed to create PTP');
    }
  }
);

// Create the PTP slice
const ptpSlice = createSlice({
  name: 'ptp',
  initialState,
  reducers: {
    openPTPInterface: (state, action: PayloadAction<{
      customerId: string;
      customerName: string;
      accountNumber: string;
    }>) => {
      state.isOpen = true;
      state.customerId = action.payload.customerId;
      state.customerName = action.payload.customerName;
      state.accountNumber = action.payload.accountNumber;
      // Reset form fields
      state.amount = '';
      state.date = null;
      state.paymentMethod = 'bank_transfer';
      state.notes = '';
      state.createSuccess = null;
      state.error = null;
    },
    closePTPInterface: (state) => {
      state.isOpen = false;
      // Keep customer info for history purposes
      state.createSuccess = null;
      state.error = null;
    },
    setAmount: (state, action: PayloadAction<string>) => {
      state.amount = action.payload;
    },
    setDate: (state, action: PayloadAction<string | null>) => {
      state.date = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },
    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    resetPTPForm: (state) => {
      state.amount = '';
      state.date = null;
      state.paymentMethod = 'bank_transfer';
      state.notes = '';
      state.createSuccess = null;
      state.error = null;
    },
    setPTPHistory: (state, action: PayloadAction<PTPArrangement[]>) => {
      state.ptpHistory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle createPTP
      .addCase(createPTP.pending, (state) => {
        state.creating = true;
        state.createSuccess = null;
        state.error = null;
      })
      .addCase(createPTP.fulfilled, (state, action) => {
        state.creating = false;
        state.createSuccess = true;
        state.error = null;
        // Add the new PTP to history
        state.ptpHistory.unshift(action.payload);
      })
      .addCase(createPTP.rejected, (state, action) => {
        state.creating = false;
        state.createSuccess = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchPTPHistory
      .addCase(fetchPTPHistory.pending, (state) => {
        state.loadingHistory = true;
        state.error = null;
      })
      .addCase(fetchPTPHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.ptpHistory = action.payload;
      })
      .addCase(fetchPTPHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const {
  openPTPInterface,
  closePTPInterface,
  setAmount,
  setDate,
  setPaymentMethod,
  setNotes,
  resetPTPForm,
  setPTPHistory
} = ptpSlice.actions;

// Selectors
export const selectPTP = (state: { ptp: PTPState }) => ({
  isOpen: () => state.ptp.isOpen,
  customer: () => ({
    id: state.ptp.customerId,
    name: state.ptp.customerName,
    accountNumber: state.ptp.accountNumber
  }),
  formData: () => ({
    amount: state.ptp.amount,
    date: state.ptp.date,
    paymentMethod: state.ptp.paymentMethod,
    notes: state.ptp.notes
  }),
  creating: () => state.ptp.creating,
  createStatus: () => ({
    success: state.ptp.createSuccess,
    error: state.ptp.error
  }),
  history: () => state.ptp.ptpHistory,
  loadingHistory: () => state.ptp.loadingHistory
});

export default ptpSlice.reducer;
