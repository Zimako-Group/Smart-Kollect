import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { notesService } from '@/lib/services/notes-service';

export interface Note {
  id: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
  category: 'general' | 'payment' | 'contact' | 'legal' | 'other';
  isImportant: boolean;
  isPrivate: boolean;
}

export interface NotesState {
  isDialogOpen: boolean;
  selectedAccount: {
    id: string;
    name: string;
    accountNumber?: string;
  } | null;
  notes: Note[];
  activeCategory: 'all' | 'general' | 'payment' | 'contact' | 'legal' | 'other';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: NotesState = {
  isDialogOpen: false,
  selectedAccount: null,
  notes: [],
  activeCategory: 'all',
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

export const notesSlice = createSlice({
  name: 'notes',
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
    addNote: (state, action: PayloadAction<{
      content: string;
      createdBy: {
        id: string;
        name: string;
        avatar?: string;
        role?: string;
      };
      category: 'general' | 'payment' | 'contact' | 'legal' | 'other';
      isImportant: boolean;
      isPrivate: boolean;
    }>) => {
      const newNote: Note = {
        id: uuidv4(),
        content: action.payload.content,
        createdBy: action.payload.createdBy,
        createdAt: new Date().toISOString(),
        category: action.payload.category,
        isImportant: action.payload.isImportant,
        isPrivate: action.payload.isPrivate
      };
      
      state.notes.unshift(newNote); // Add to beginning of array
    },
    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(note => note.id !== action.payload);
    },
    editNote: (state, action: PayloadAction<{
      id: string;
      content: string;
      category: 'general' | 'payment' | 'contact' | 'legal' | 'other';
      isImportant: boolean;
      isPrivate: boolean;
    }>) => {
      const note = state.notes.find(n => n.id === action.payload.id);
      if (note) {
        note.content = action.payload.content;
        note.category = action.payload.category;
        note.isImportant = action.payload.isImportant;
        note.isPrivate = action.payload.isPrivate;
      }
    },
    setActiveCategory: (state, action: PayloadAction<'all' | 'general' | 'payment' | 'contact' | 'legal' | 'other'>) => {
      state.activeCategory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchNotes
      .addCase(fetchNotes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch notes';
      })
      // Handle createNote
      .addCase(createNote.fulfilled, (state, action) => {
        if (action.payload) {
          state.notes.unshift(action.payload);
        }
      })
      // Handle updateNote
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex(note => note.id === action.payload.id);
        if (index !== -1) {
          // Preserve createdBy and createdAt from the existing note
          const existingNote = state.notes[index];
          state.notes[index] = {
            ...existingNote,
            content: action.payload.content,
            category: action.payload.category,
            isImportant: action.payload.isImportant,
            isPrivate: action.payload.isPrivate
          };
        }
      })
      // Handle removeNote
      .addCase(removeNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(note => note.id !== action.payload);
      });
  }
});

// Async thunks for Supabase operations
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (customerId: string) => {
    return await notesService.getCustomerNotes(customerId);
  }
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData: {
    content: string;
    customerId: string;
    createdBy: {
      id: string;
      name: string;
      avatar?: string;
      role?: string;
    };
    category: 'general' | 'payment' | 'contact' | 'legal' | 'other';
    isImportant: boolean;
    isPrivate: boolean;
  }) => {
    return await notesService.addNote(noteData);
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async (noteData: {
    id: string;
    content: string;
    category: 'general' | 'payment' | 'contact' | 'legal' | 'other';
    isImportant: boolean;
    isPrivate: boolean;
  }) => {
    const success = await notesService.updateNote(noteData);
    if (success) {
      return noteData;
    }
    throw new Error('Failed to update note');
  }
);

export const removeNote = createAsyncThunk(
  'notes/removeNote',
  async (noteId: string) => {
    const success = await notesService.deleteNote(noteId);
    if (success) {
      return noteId;
    }
    throw new Error('Failed to delete note');
  }
);

export const { 
  openDialog, 
  closeDialog, 
  addNote, 
  deleteNote, 
  editNote, 
  setActiveCategory 
} = notesSlice.actions;

export default notesSlice.reducer;
