import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface Account {
  id: string;
  name: string;
  surname: string;
  id_Number: string;
  email: string;
  cellphone: string;
  home_tel: string;
  work_tel: string;
  fax_no: string;
  next_of_kin_name: string;
  next_of_kin_no: string;
  postal_addess: string;
  ro_ref: string;
  client_ref: string;
  easypay_ref: string;
  client: string;
  handover_date: string;
  handover_amount: number;
  employer: string;
  occupation: string;
  income: number;
  current_balance: number;
  original_amount: number;
  last_payment: string;
  last_payment_amount: number;
  days_since_last_payment: number;
  flags?: Array<{
    id: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    date: string;
    addedBy: string;
  }>;
  ptp?: {
    date: string;
    amount: number;
    isBroken: boolean;
    daysLate?: number;
  };
}

export interface AccountsState {
  allocatedAccounts: Account[];
  totalAccounts: number;
  totalValue: number;
  overdueAccounts: number;
  contactRate: number;
  loading: boolean;
  error: string | null;
  selectedAccount: Account | null;
}

const initialState: AccountsState = {
  allocatedAccounts: [],
  totalAccounts: 0,
  totalValue: 0,
  overdueAccounts: 0,
  contactRate: 0,
  loading: false,
  error: null,
  selectedAccount: null,
};

// Async thunk for fetching allocated accounts
export const fetchAllocatedAccounts = createAsyncThunk(
  'accounts/fetchAllocatedAccounts',
  async (_, { rejectWithValue }) => {
    try {
      // This would be replaced with your actual API call
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock response - in real implementation, this would come from your API
      return { success: true, data: [] };
    } catch (error) {
      return rejectWithValue('Failed to fetch allocated accounts');
    }
  }
);

export const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setAllocatedAccounts: (state, action: PayloadAction<Account[]>) => {
      state.allocatedAccounts = action.payload;
      state.totalAccounts = action.payload.length;
      state.totalValue = action.payload.reduce((sum, account) => sum + account.current_balance, 0);
      state.overdueAccounts = action.payload.filter(account => 
        account.ptp?.isBroken || 
        (account.last_payment && account.days_since_last_payment > 30)
      ).length;
    },
    setSelectedAccount: (state, action: PayloadAction<Account | null>) => {
      state.selectedAccount = action.payload;
    },
    updateAccount: (state, action: PayloadAction<Partial<Account> & { id: string }>) => {
      const index = state.allocatedAccounts.findIndex(account => account.id === action.payload.id);
      if (index !== -1) {
        state.allocatedAccounts[index] = {
          ...state.allocatedAccounts[index],
          ...action.payload
        };
      }
    },
    updateContactRate: (state, action: PayloadAction<number>) => {
      state.contactRate = action.payload;
    },
    markPTPResolved: (state, action: PayloadAction<string>) => {
      const index = state.allocatedAccounts.findIndex(account => account.id === action.payload);
      if (index !== -1 && state.allocatedAccounts[index].ptp) {
        state.allocatedAccounts[index] = {
          ...state.allocatedAccounts[index],
          ptp: {
            ...state.allocatedAccounts[index].ptp!,
            isBroken: false
          }
        };
      }
    },
    addFlag: (state, action: PayloadAction<{ accountId: string, flag: { id: string; type: string; priority: 'high' | 'medium' | 'low'; date: string; addedBy: string; } }>) => {
      const index = state.allocatedAccounts.findIndex(account => account.id === action.payload.accountId);
      if (index !== -1) {
        if (!state.allocatedAccounts[index].flags) {
          state.allocatedAccounts[index].flags = [];
        }
        state.allocatedAccounts[index].flags!.push(action.payload.flag);
      }
    },
    removeFlag: (state, action: PayloadAction<{ accountId: string, flagId: string }>) => {
      const index = state.allocatedAccounts.findIndex(account => account.id === action.payload.accountId);
      if (index !== -1 && state.allocatedAccounts[index].flags) {
        state.allocatedAccounts[index].flags = state.allocatedAccounts[index].flags!.filter(
          flag => flag.id !== action.payload.flagId
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllocatedAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllocatedAccounts.fulfilled, (state, action: any) => {
        state.loading = false;
        if (action.payload.success) {
          state.allocatedAccounts = action.payload.data;
          state.totalAccounts = action.payload.data.length;
          state.totalValue = action.payload.data.reduce(
            (sum: number, account: Account) => sum + account.current_balance, 0
          );
          state.overdueAccounts = action.payload.data.filter((account: Account) => 
            account.ptp?.isBroken || 
            (account.last_payment && account.days_since_last_payment > 30)
          ).length;
        }
      })
      .addCase(fetchAllocatedAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setAllocatedAccounts,
  setSelectedAccount,
  updateAccount,
  updateContactRate,
  markPTPResolved,
  addFlag,
  removeFlag,
} = accountsSlice.actions;

export default accountsSlice.reducer;
