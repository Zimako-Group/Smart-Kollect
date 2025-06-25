import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import dialerReducer from './features/dialer/dialerSlice';
import accountsReducer from './features/accounts/accountsSlice';
import userReducer from './features/user/userSlice';
import remindersReducer from './features/reminders/remindersSlice';
import flagsReducer from './features/flags/flagsSlice';
import emailReducer from './features/email/emailSlice';
import smsReducer from './features/sms/smsSlice';
import ptpReducer from './features/ptp/ptpSlice';
import rtpReducer from './features/rtp/rtpSlice';
import chatReducer from './features/chat/chatSlice';
import notesReducer from './features/notes/notesSlice';
import paymentHistoryReducer from './features/payment-history/paymentHistorySlice';

export const store = configureStore({
  reducer: {
    dialer: dialerReducer,
    user: userReducer,
    accounts: accountsReducer,
    reminders: remindersReducer,
    flags: flagsReducer,
    email: emailReducer,
    sms: smsReducer,
    ptp: ptpReducer,
    rtp: rtpReducer,
    chat: chatReducer,
    notes: notesReducer,
    paymentHistory: paymentHistoryReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
