import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setSession: (session) => set({ 
        session, 
        user: session?.user || null 
      }),
      clearSession: () => set({ 
        session: null, 
        user: null 
      }),
    }),
    { name: 'forexelite-auth' }
  )
);
