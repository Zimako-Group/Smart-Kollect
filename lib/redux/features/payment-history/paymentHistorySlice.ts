import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaymentHistoryState {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  accountNumber: string;
}

const initialState: PaymentHistoryState = {
  isOpen: false,
  customerId: '',
  customerName: '',
  accountNumber: ''
};

export const paymentHistorySlice = createSlice({
  name: 'paymentHistory',
  initialState,
  reducers: {
    openDialog: (state, action: PayloadAction<{
      customerId: string;
      customerName: string;
      accountNumber: string;
    }>) => {
      state.isOpen = true;
      state.customerId = action.payload.customerId;
      state.customerName = action.payload.customerName;
      state.accountNumber = action.payload.accountNumber;
    },
    closeDialog: (state) => {
      state.isOpen = false;
    }
  }
});

export const { openDialog, closeDialog } = paymentHistorySlice.actions;

export default paymentHistorySlice.reducer;
