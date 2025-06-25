import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { flagsService } from '@/lib/services/flags-service';

export interface Flag {
  id: string;
  accountId: string;
  accountName: string;
  accountNumber?: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  dateAdded: string;
  addedBy: string;
  addedById?: string;
  notes?: string;
  isResolved: boolean;
  dateResolved?: string;
  resolvedBy?: string;
  resolvedById?: string;
}

export interface FlagsState {
  flags: Flag[];
  totalFlags: number;
  highPriorityFlags: number;
  mediumPriorityFlags: number;
  lowPriorityFlags: number;
  flagsByType: Record<string, number>;
  flagsByAge: {
    lessThan7Days: number;
    between7And14Days: number;
    between14And30Days: number;
    moreThan30Days: number;
  };
  loading: boolean;
  error: string | null;
  isDialogOpen: boolean;
  selectedAccount: {
    id: string;
    name: string;
    accountNumber?: string;
  } | null;
}

const initialState: FlagsState = {
  flags: [],
  totalFlags: 0,
  highPriorityFlags: 0,
  mediumPriorityFlags: 0,
  lowPriorityFlags: 0,
  flagsByType: {},
  flagsByAge: {
    lessThan7Days: 0,
    between7And14Days: 0,
    between14And30Days: 0,
    moreThan30Days: 0,
  },
  loading: false,
  error: null,
  isDialogOpen: false,
  selectedAccount: null
};

// Async thunk for fetching flags for a specific customer
export const fetchCustomerFlags = createAsyncThunk(
  'flags/fetchCustomerFlags',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const flags = await flagsService.getCustomerFlags(customerId);
      return flags;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch flags');
    }
  }
);

// Async thunk for adding a flag
export const createFlag = createAsyncThunk(
  'flags/createFlag',
  async (flagData: {
    accountId: string;
    accountName: string;
    accountNumber?: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    notes: string;
    addedById: string;
    addedBy: string;
  }, { rejectWithValue }) => {
    try {
      const newFlag = await flagsService.addFlag(flagData);
      if (!newFlag) {
        throw new Error('Failed to add flag');
      }
      return newFlag;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add flag');
    }
  }
);

// Async thunk for resolving a flag
export const markFlagResolved = createAsyncThunk(
  'flags/markFlagResolved',
  async ({ flagId, resolvedById, resolvedBy }: { flagId: string, resolvedById: string, resolvedBy: string }, { rejectWithValue }) => {
    try {
      const success = await flagsService.resolveFlag(flagId, resolvedById, resolvedBy);
      if (!success) {
        throw new Error('Failed to resolve flag');
      }
      return { flagId, resolvedById, resolvedBy, resolvedAt: new Date().toISOString() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve flag');
    }
  }
);

// Async thunk for deleting a flag
export const removeFlag = createAsyncThunk(
  'flags/removeFlag',
  async (flagId: string, { rejectWithValue }) => {
    try {
      const success = await flagsService.deleteFlag(flagId);
      if (!success) {
        throw new Error('Failed to delete flag');
      }
      return flagId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete flag');
    }
  }
);

export const flagsSlice = createSlice({
  name: 'flags',
  initialState,
  reducers: {
    setFlags: (state, action: PayloadAction<Flag[]>) => {
      state.flags = action.payload;
      
      // Calculate metrics
      state.totalFlags = action.payload.filter(flag => !flag.isResolved).length;
      state.highPriorityFlags = action.payload.filter(flag => flag.priority === 'high' && !flag.isResolved).length;
      state.mediumPriorityFlags = action.payload.filter(flag => flag.priority === 'medium' && !flag.isResolved).length;
      state.lowPriorityFlags = action.payload.filter(flag => flag.priority === 'low' && !flag.isResolved).length;
      
      // Count flags by type
      state.flagsByType = action.payload
        .filter(flag => !flag.isResolved)
        .reduce((acc, flag) => {
          acc[flag.type] = (acc[flag.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      // Calculate age distribution
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 14);
      
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const activeFlags = action.payload.filter(flag => !flag.isResolved);
      
      state.flagsByAge = {
        lessThan7Days: activeFlags.filter(flag => new Date(flag.dateAdded) >= sevenDaysAgo).length,
        between7And14Days: activeFlags.filter(flag => 
          new Date(flag.dateAdded) < sevenDaysAgo && 
          new Date(flag.dateAdded) >= fourteenDaysAgo
        ).length,
        between14And30Days: activeFlags.filter(flag => 
          new Date(flag.dateAdded) < fourteenDaysAgo && 
          new Date(flag.dateAdded) >= thirtyDaysAgo
        ).length,
        moreThan30Days: activeFlags.filter(flag => new Date(flag.dateAdded) < thirtyDaysAgo).length,
      };
    },
    addFlag: (state, action: PayloadAction<Flag>) => {
      state.flags.push(action.payload);
      
      // Update metrics
      if (!action.payload.isResolved) {
        state.totalFlags++;
        
        if (action.payload.priority === 'high') {
          state.highPriorityFlags++;
        } else if (action.payload.priority === 'medium') {
          state.mediumPriorityFlags++;
        } else if (action.payload.priority === 'low') {
          state.lowPriorityFlags++;
        }
        
        // Update flags by type
        state.flagsByType[action.payload.type] = (state.flagsByType[action.payload.type] || 0) + 1;
        
        // Update age distribution
        state.flagsByAge.lessThan7Days++;
      }
    },
    updateFlag: (state, action: PayloadAction<Partial<Flag> & { id: string }>) => {
      const index = state.flags.findIndex(flag => flag.id === action.payload.id);
      if (index !== -1) {
        const oldFlag = state.flags[index];
        const wasResolved = oldFlag.isResolved;
        const newIsResolved = action.payload.isResolved !== undefined ? action.payload.isResolved : wasResolved;
        
        // Handle resolution status change
        if (!wasResolved && newIsResolved) {
          // Flag is being resolved
          state.totalFlags--;
          
          if (oldFlag.priority === 'high') {
            state.highPriorityFlags--;
          } else if (oldFlag.priority === 'medium') {
            state.mediumPriorityFlags--;
          } else if (oldFlag.priority === 'low') {
            state.lowPriorityFlags--;
          }
          
          // Update flags by type
          state.flagsByType[oldFlag.type]--;
          
          // Update age distribution
          const now = new Date();
          const dateAdded = new Date(oldFlag.dateAdded);
          const daysDiff = Math.floor((now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 7) {
            state.flagsByAge.lessThan7Days--;
          } else if (daysDiff < 14) {
            state.flagsByAge.between7And14Days--;
          } else if (daysDiff < 30) {
            state.flagsByAge.between14And30Days--;
          } else {
            state.flagsByAge.moreThan30Days--;
          }
        } else if (wasResolved && !newIsResolved) {
          // Flag is being un-resolved
          state.totalFlags++;
          
          if (oldFlag.priority === 'high') {
            state.highPriorityFlags++;
          } else if (oldFlag.priority === 'medium') {
            state.mediumPriorityFlags++;
          } else if (oldFlag.priority === 'low') {
            state.lowPriorityFlags++;
          }
          
          // Update flags by type
          state.flagsByType[oldFlag.type] = (state.flagsByType[oldFlag.type] || 0) + 1;
          
          // Update age distribution
          const now = new Date();
          const dateAdded = new Date(oldFlag.dateAdded);
          const daysDiff = Math.floor((now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 7) {
            state.flagsByAge.lessThan7Days++;
          } else if (daysDiff < 14) {
            state.flagsByAge.between7And14Days++;
          } else if (daysDiff < 30) {
            state.flagsByAge.between14And30Days++;
          } else {
            state.flagsByAge.moreThan30Days++;
          }
        }
        
        // Priority change for active flag
        if (!wasResolved && !newIsResolved && action.payload.priority && action.payload.priority !== oldFlag.priority) {
          if (oldFlag.priority === 'high') {
            state.highPriorityFlags--;
          } else if (oldFlag.priority === 'medium') {
            state.mediumPriorityFlags--;
          } else if (oldFlag.priority === 'low') {
            state.lowPriorityFlags--;
          }
          
          if (action.payload.priority === 'high') {
            state.highPriorityFlags++;
          } else if (action.payload.priority === 'medium') {
            state.mediumPriorityFlags++;
          } else if (action.payload.priority === 'low') {
            state.lowPriorityFlags++;
          }
        }
        
        // Type change for active flag
        if (!wasResolved && !newIsResolved && action.payload.type && action.payload.type !== oldFlag.type) {
          state.flagsByType[oldFlag.type]--;
          state.flagsByType[action.payload.type] = (state.flagsByType[action.payload.type] || 0) + 1;
        }
        
        // Update the flag
        state.flags[index] = {
          ...oldFlag,
          ...action.payload
        };
      }
    },
    deleteFlag: (state, action: PayloadAction<string>) => {
      const index = state.flags.findIndex(flag => flag.id === action.payload);
      if (index !== -1) {
        const flag = state.flags[index];
        
        // Update metrics if flag was active
        if (!flag.isResolved) {
          state.totalFlags--;
          
          if (flag.priority === 'high') {
            state.highPriorityFlags--;
          } else if (flag.priority === 'medium') {
            state.mediumPriorityFlags--;
          } else if (flag.priority === 'low') {
            state.lowPriorityFlags--;
          }
          
          // Update flags by type
          state.flagsByType[flag.type]--;
          
          // Update age distribution
          const now = new Date();
          const dateAdded = new Date(flag.dateAdded);
          const daysDiff = Math.floor((now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 7) {
            state.flagsByAge.lessThan7Days--;
          } else if (daysDiff < 14) {
            state.flagsByAge.between7And14Days--;
          } else if (daysDiff < 30) {
            state.flagsByAge.between14And30Days--;
          } else {
            state.flagsByAge.moreThan30Days--;
          }
        }
        
        // Remove the flag
        state.flags.splice(index, 1);
      }
    },
    resolveFlag: (state, action: PayloadAction<string>) => {
      const index = state.flags.findIndex(flag => flag.id === action.payload);
      if (index !== -1 && !state.flags[index].isResolved) {
        const flag = state.flags[index];
        
        // Update metrics
        state.totalFlags--;
        
        if (flag.priority === 'high') {
          state.highPriorityFlags--;
        } else if (flag.priority === 'medium') {
          state.mediumPriorityFlags--;
        } else if (flag.priority === 'low') {
          state.lowPriorityFlags--;
        }
        
        // Update flags by type
        state.flagsByType[flag.type]--;
        
        // Update age distribution
        const now = new Date();
        const dateAdded = new Date(flag.dateAdded);
        const daysDiff = Math.floor((now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 7) {
          state.flagsByAge.lessThan7Days--;
        } else if (daysDiff < 14) {
          state.flagsByAge.between7And14Days--;
        } else if (daysDiff < 30) {
          state.flagsByAge.between14And30Days--;
        } else {
          state.flagsByAge.moreThan30Days--;
        }
        
        // Mark as resolved
        state.flags[index].isResolved = true;
      }
    },
    openDialog: (state, action: PayloadAction<{ customerId: string; customerName: string; accountNumber?: string }>) => {
      state.isDialogOpen = true;
      state.selectedAccount = {
        id: action.payload.customerId,
        name: action.payload.customerName,
        accountNumber: action.payload.accountNumber
      };
    },
    closeDialog: (state) => {
      state.isDialogOpen = false;
      state.selectedAccount = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCustomerFlags
      .addCase(fetchCustomerFlags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerFlags.fulfilled, (state, action) => {
        state.loading = false;
        const flags = action.payload;
        
        // Set flags
        state.flags = flags;
        
        // Calculate metrics
        state.totalFlags = flags.filter(flag => !flag.isResolved).length;
        state.highPriorityFlags = flags.filter(flag => flag.priority === 'high' && !flag.isResolved).length;
        state.mediumPriorityFlags = flags.filter(flag => flag.priority === 'medium' && !flag.isResolved).length;
        state.lowPriorityFlags = flags.filter(flag => flag.priority === 'low' && !flag.isResolved).length;
        
        // Count flags by type
        state.flagsByType = flags
          .filter(flag => !flag.isResolved)
          .reduce((acc, flag) => {
            acc[flag.type] = (acc[flag.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        
        // Calculate age distribution
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(now.getDate() - 14);
        
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const activeFlags = flags.filter(flag => !flag.isResolved);
        
        state.flagsByAge = {
          lessThan7Days: activeFlags.filter(flag => new Date(flag.dateAdded) >= sevenDaysAgo).length,
          between7And14Days: activeFlags.filter(flag => 
            new Date(flag.dateAdded) < sevenDaysAgo && 
            new Date(flag.dateAdded) >= fourteenDaysAgo
          ).length,
          between14And30Days: activeFlags.filter(flag => 
            new Date(flag.dateAdded) < fourteenDaysAgo && 
            new Date(flag.dateAdded) >= thirtyDaysAgo
          ).length,
          moreThan30Days: activeFlags.filter(flag => new Date(flag.dateAdded) < thirtyDaysAgo).length,
        };
      })
      .addCase(fetchCustomerFlags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle createFlag
      .addCase(createFlag.fulfilled, (state, action) => {
        if (action.payload) {
          state.flags.unshift(action.payload);
          
          // Update metrics if flag is not resolved
          if (!action.payload.isResolved) {
            state.totalFlags++;
            
            if (action.payload.priority === 'high') {
              state.highPriorityFlags++;
            } else if (action.payload.priority === 'medium') {
              state.mediumPriorityFlags++;
            } else if (action.payload.priority === 'low') {
              state.lowPriorityFlags++;
            }
            
            // Update flags by type
            state.flagsByType[action.payload.type] = (state.flagsByType[action.payload.type] || 0) + 1;
            
            // Update age distribution (new flag is always less than 7 days)
            state.flagsByAge.lessThan7Days++;
          }
        }
      })
      
      // Handle markFlagResolved
      .addCase(markFlagResolved.fulfilled, (state, action) => {
        const { flagId, resolvedById, resolvedBy, resolvedAt } = action.payload;
        const index = state.flags.findIndex(flag => flag.id === flagId);
        
        if (index !== -1) {
          const flag = state.flags[index];
          
          // Update metrics if flag was not already resolved
          if (!flag.isResolved) {
            state.totalFlags--;
            
            if (flag.priority === 'high') {
              state.highPriorityFlags--;
            } else if (flag.priority === 'medium') {
              state.mediumPriorityFlags--;
            } else if (flag.priority === 'low') {
              state.lowPriorityFlags--;
            }
            
            // Update flags by type
            if (state.flagsByType[flag.type] > 0) {
              state.flagsByType[flag.type]--;
            }
            
            // Update age distribution
            const now = new Date();
            const dateAdded = new Date(flag.dateAdded);
            const daysDiff = Math.floor((now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 7) {
              state.flagsByAge.lessThan7Days--;
            } else if (daysDiff < 14) {
              state.flagsByAge.between7And14Days--;
            } else if (daysDiff < 30) {
              state.flagsByAge.between14And30Days--;
            } else {
              state.flagsByAge.moreThan30Days--;
            }
          }
          
          // Mark as resolved
          state.flags[index].isResolved = true;
          state.flags[index].dateResolved = resolvedAt;
          state.flags[index].resolvedBy = resolvedBy;
          state.flags[index].resolvedById = resolvedById;
        }
      })
      
      // Handle removeFlag
      .addCase(removeFlag.fulfilled, (state, action) => {
        const flagId = action.payload;
        const index = state.flags.findIndex(flag => flag.id === flagId);
        
        if (index !== -1) {
          const flag = state.flags[index];
          
          // Update metrics if flag was not resolved
          if (!flag.isResolved) {
            state.totalFlags--;
            
            if (flag.priority === 'high') {
              state.highPriorityFlags--;
            } else if (flag.priority === 'medium') {
              state.mediumPriorityFlags--;
            } else if (flag.priority === 'low') {
              state.lowPriorityFlags--;
            }
            
            // Update flags by type
            if (state.flagsByType[flag.type] > 0) {
              state.flagsByType[flag.type]--;
            }
            
            // Update age distribution
            const now = new Date();
            const dateAdded = new Date(flag.dateAdded);
            const daysDiff = Math.floor((now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 7) {
              state.flagsByAge.lessThan7Days--;
            } else if (daysDiff < 14) {
              state.flagsByAge.between7And14Days--;
            } else if (daysDiff < 30) {
              state.flagsByAge.between14And30Days--;
            } else {
              state.flagsByAge.moreThan30Days--;
            }
          }
          
          // Remove the flag
          state.flags.splice(index, 1);
        }
      });
  },
});

export const {
  setFlags,
  addFlag,
  updateFlag,
  deleteFlag,
  resolveFlag,
  openDialog,
  closeDialog
} = flagsSlice.actions;

// Async thunks are already exported when defined above

export default flagsSlice.reducer;
