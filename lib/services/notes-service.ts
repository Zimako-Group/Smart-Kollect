// lib/services/notes-service.ts
import { supabase, supabaseAdmin, getSupabaseAdminClient } from '@/lib/supabaseClient';
import { Note } from '@/lib/redux/features/notes/notesSlice';
import { v4 as uuidv4 } from 'uuid';

// Define the database note type
export interface DbNote {
  id: string;
  content: string;
  customer_id: string;
  created_by: string;
  created_at: string;
  category: string;
  is_important: boolean;
  is_private: boolean;
}

// Notes service for Supabase operations
export const notesService = {
  /**
   * Get notes for a specific customer
   */
  async getCustomerNotes(customerId: string): Promise<Note[]> {
    // Get a fresh admin client to ensure we have the latest service role key
    const adminClient = getSupabaseAdminClient();
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      // Use admin client to bypass RLS if needed
      const { data: notesData, error } = await adminClient
        .from('notes')
        .select(`
          id,
          content,
          created_at,
          category,
          is_important,
          is_private,
          created_by
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching notes:', error);
        return [];
      }
      
      // Fetch profiles separately
      const userIds = notesData.map((note: any) => note.created_by);
      const { data: profilesData, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Create a map of profiles by id for easy lookup
      const profilesMap = (profilesData || []).reduce((map: any, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {});

      if (error) {
        console.error('Error fetching notes:', error);
        return [];
      }

      // Transform database notes to application notes
      return notesData.map((item: any) => {
        const profile = profilesMap[item.created_by];
        return {
          id: item.id,
          content: item.content,
          createdAt: item.created_at,
          category: item.category,
          isImportant: item.is_important,
          isPrivate: item.is_private,
          createdBy: {
            id: item.created_by,
            name: profile ? profile.full_name : 'Unknown User',
            avatar: profile ? profile.avatar_url : undefined,
            role: profile ? profile.role : 'agent'
          }
        };
      });
    } catch (error) {
      console.error('Error in getCustomerNotes:', error);
      return [];
    }
  },

  /**
   * Add a new note
   */
  async addNote(note: {
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
  }): Promise<Note | null> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      const newNote = {
        id: uuidv4(),
        content: note.content,
        customer_id: note.customerId,
        created_by: note.createdBy.id,
        created_at: new Date().toISOString(),
        category: note.category,
        is_important: note.isImportant,
        is_private: note.isPrivate
      };

      const { data, error } = await adminClient
        .from('notes')
        .insert(newNote)
        .select(`
          id,
          content,
          created_at,
          category,
          is_important,
          is_private,
          created_by
        `)
        .single();
        
      if (error) {
        console.error('Error adding note:', error);
        return null;
      }
      
      // Fetch the profile separately
      const { data: profileData, error: profileError } = await adminClient
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('id', data.created_by)
        .single();

      if (error) {
        console.error('Error adding note:', error);
        return null;
      }

      // Return the created note in application format
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      return {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        category: data.category,
        isImportant: data.is_important,
        isPrivate: data.is_private,
        createdBy: {
          id: data.created_by,
          name: profileData ? profileData.full_name : 'Unknown User',
          avatar: profileData ? profileData.avatar_url : undefined,
          role: profileData ? profileData.role : 'agent'
        }
      };
    } catch (error) {
      console.error('Error in addNote:', error);
      return null;
    }
  },

  /**
   * Update an existing note
   */
  async updateNote(note: {
    id: string;
    content: string;
    category: 'general' | 'payment' | 'contact' | 'legal' | 'other';
    isImportant: boolean;
    isPrivate: boolean;
  }): Promise<boolean> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      const { error } = await adminClient
        .from('notes')
        .update({
          content: note.content,
          category: note.category,
          is_important: note.isImportant,
          is_private: note.isPrivate
        })
        .eq('id', note.id);

      if (error) {
        console.error('Error updating note:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateNote:', error);
      return false;
    }
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      // Get a fresh admin client to ensure we have the latest service role key
      const adminClient = getSupabaseAdminClient();
      const { error } = await adminClient
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNote:', error);
      return false;
    }
  }
};
