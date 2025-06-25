import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PerformanceMetrics {
  collectionRate: number;
  casesResolved: number;
  customerSatisfaction: number;
}

export interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  performance: PerformanceMetrics;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  role: null,
  isAuthenticated: false,
  performance: {
    collectionRate: 0,
    casesResolved: 0,
    customerSatisfaction: 0
  },
  loading: false,
  error: null
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Omit<UserState, 'loading' | 'error' | 'isAuthenticated' | 'performance'>>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    updatePerformance: (state, action: PayloadAction<Partial<PerformanceMetrics>>) => {
      state.performance = {
        ...state.performance,
        ...action.payload
      };
    },
    logout: (state) => {
      state.id = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.isAuthenticated = false;
      state.performance = {
        collectionRate: 0,
        casesResolved: 0,
        customerSatisfaction: 0
      };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setUser,
  setAuthenticated,
  updatePerformance,
  logout,
  setLoading,
  setError
} = userSlice.actions;

export default userSlice.reducer;
