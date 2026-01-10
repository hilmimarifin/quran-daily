import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Bookmark {
  id: string;
  user_id: string;
  name: string;
  surah_number: number;
  verse_number: number;
  created_at: string;
  updated_at: string;
}

interface BookmarkState {
  bookmarks: Bookmark[];
  loading: boolean;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  loading: false,
  fetchBookmarks: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bookmarks:', error);
    } else {
      set({ bookmarks: data || [] });
    }
    set({ loading: false });
  },
  addBookmark: async (bookmark) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ ...bookmark, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding bookmark:', error);
    } else if (data) {
      set((state) => ({ bookmarks: [data, ...state.bookmarks] }));
    }
  },
  updateBookmark: async (id, updates) => {
    const { error } = await supabase
      .from('bookmarks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating bookmark:', error);
    } else {
      set((state) => ({
        bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    }
  },
  deleteBookmark: async (id) => {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bookmark:', error);
    } else {
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      }));
    }
  },
}));
