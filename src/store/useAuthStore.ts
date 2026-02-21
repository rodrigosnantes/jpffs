import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,

    initialize: async () => {
        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        console.log(session);
        set({ user: session?.user || null, isLoading: false });

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ user: session?.user || null, isLoading: false });
        });
    },

    signIn: async (email, password) => {
        console.log(email, password)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return { error };

        set({ user: data.user, isLoading: false });
        return { error: null };
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        set({ user: null });
        return { error };
    }
}));
