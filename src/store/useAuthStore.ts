import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/actions/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    try {
      // Check server session first
      const user = await getUser();
      if (user) {
        set({ user, loading: false });
      } else {
        // Fallback to client check (e.g. after initial load)
        const { data: { user: clientUser } } = await supabase.auth.getUser();
        set({ user: clientUser ?? null, loading: false });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, loading: false });
      });
    } catch (error) {
      console.error('Error checking user:', error);
      set({ loading: false });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
