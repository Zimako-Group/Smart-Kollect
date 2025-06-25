import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface Reminder {
  id: string;
  title: string;
  details: string;
  accountNumber?: string;
  type: 'callback' | 'follow-up' | 'payment' | 'other';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  dueTime: string;
  isCompleted: boolean;
  createdBy: string;
  createdAt: string;
}

export interface RemindersState {
  reminders: Reminder[];
  todayReminders: number;
  todayCompletedReminders: number;
  weekReminders: number;
  monthReminders: number;
  remindersByType: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const initialState: RemindersState = {
  reminders: [],
  todayReminders: 0,
  todayCompletedReminders: 0,
  weekReminders: 0,
  monthReminders: 0,
  remindersByType: {
    callback: 0,
    'follow-up': 0,
    payment: 0,
    other: 0
  },
  loading: false,
  error: null
};

// Async thunk for fetching reminders
export const fetchReminders = createAsyncThunk(
  'reminders/fetchReminders',
  async (_, { rejectWithValue }) => {
    try {
      // This would be replaced with your actual API call
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock response - in real implementation, this would come from your API
      return { success: true, data: [] };
    } catch (error) {
      return rejectWithValue('Failed to fetch reminders');
    }
  }
);

export const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    setReminders: (state, action: PayloadAction<Reminder[]>) => {
      state.reminders = action.payload;
      
      // Calculate metrics
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      state.todayReminders = action.payload.filter(
        reminder => reminder.dueDate === today
      ).length;
      
      state.todayCompletedReminders = action.payload.filter(
        reminder => reminder.dueDate === today && reminder.isCompleted
      ).length;
      
      state.weekReminders = action.payload.filter(
        reminder => new Date(reminder.dueDate) >= startOfWeek && new Date(reminder.dueDate) <= now
      ).length;
      
      state.monthReminders = action.payload.filter(
        reminder => new Date(reminder.dueDate) >= startOfMonth && new Date(reminder.dueDate) <= now
      ).length;
      
      // Count reminders by type
      state.remindersByType = action.payload.reduce((acc, reminder) => {
        acc[reminder.type] = (acc[reminder.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
    addReminder: (state, action: PayloadAction<Reminder>) => {
      state.reminders.push(action.payload);
      
      // Update metrics
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      if (action.payload.dueDate === today) {
        state.todayReminders++;
      }
      
      if (new Date(action.payload.dueDate) >= startOfWeek && new Date(action.payload.dueDate) <= now) {
        state.weekReminders++;
      }
      
      if (new Date(action.payload.dueDate) >= startOfMonth && new Date(action.payload.dueDate) <= now) {
        state.monthReminders++;
      }
      
      // Update reminders by type
      state.remindersByType[action.payload.type] = (state.remindersByType[action.payload.type] || 0) + 1;
    },
    updateReminder: (state, action: PayloadAction<Partial<Reminder> & { id: string }>) => {
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload.id);
      if (index !== -1) {
        // If completion status is changing
        if (action.payload.isCompleted !== undefined && 
            action.payload.isCompleted !== state.reminders[index].isCompleted) {
          const today = new Date().toISOString().split('T')[0];
          if (state.reminders[index].dueDate === today) {
            if (action.payload.isCompleted) {
              state.todayCompletedReminders++;
            } else {
              state.todayCompletedReminders--;
            }
          }
        }
        
        // If type is changing
        if (action.payload.type && action.payload.type !== state.reminders[index].type) {
          state.remindersByType[state.reminders[index].type]--;
          state.remindersByType[action.payload.type] = (state.remindersByType[action.payload.type] || 0) + 1;
        }
        
        // Update the reminder
        state.reminders[index] = {
          ...state.reminders[index],
          ...action.payload
        };
      }
    },
    deleteReminder: (state, action: PayloadAction<string>) => {
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload);
      if (index !== -1) {
        const reminder = state.reminders[index];
        
        // Update metrics
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (reminder.dueDate === today) {
          state.todayReminders--;
          if (reminder.isCompleted) {
            state.todayCompletedReminders--;
          }
        }
        
        if (new Date(reminder.dueDate) >= startOfWeek && new Date(reminder.dueDate) <= now) {
          state.weekReminders--;
        }
        
        if (new Date(reminder.dueDate) >= startOfMonth && new Date(reminder.dueDate) <= now) {
          state.monthReminders--;
        }
        
        // Update reminders by type
        state.remindersByType[reminder.type]--;
        
        // Remove the reminder
        state.reminders.splice(index, 1);
      }
    },
    markReminderComplete: (state, action: PayloadAction<string>) => {
      const index = state.reminders.findIndex(reminder => reminder.id === action.payload);
      if (index !== -1 && !state.reminders[index].isCompleted) {
        state.reminders[index].isCompleted = true;
        
        // Update completion count for today's reminders
        const today = new Date().toISOString().split('T')[0];
        if (state.reminders[index].dueDate === today) {
          state.todayCompletedReminders++;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action: any) => {
        state.loading = false;
        if (action.payload.success) {
          const reminders = action.payload.data;
          state.reminders = reminders;
          
          // Calculate metrics
          const today = new Date().toISOString().split('T')[0];
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          state.todayReminders = reminders.filter(
            (reminder: Reminder) => reminder.dueDate === today
          ).length;
          
          state.todayCompletedReminders = reminders.filter(
            (reminder: Reminder) => reminder.dueDate === today && reminder.isCompleted
          ).length;
          
          state.weekReminders = reminders.filter(
            (reminder: Reminder) => new Date(reminder.dueDate) >= startOfWeek && new Date(reminder.dueDate) <= now
          ).length;
          
          state.monthReminders = reminders.filter(
            (reminder: Reminder) => new Date(reminder.dueDate) >= startOfMonth && new Date(reminder.dueDate) <= now
          ).length;
          
          // Count reminders by type
          state.remindersByType = reminders.reduce((acc: Record<string, number>, reminder: Reminder) => {
            acc[reminder.type] = (acc[reminder.type] || 0) + 1;
            return acc;
          }, {});
        }
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  markReminderComplete,
} = remindersSlice.actions;

export default remindersSlice.reducer;
