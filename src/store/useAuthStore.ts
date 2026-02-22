import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';

interface AuthState {
    user: User | null;
    role: UserRole | null;
    isLoading: boolean;
    isAdmin: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    fetchRole: (userId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    role: null,
    isLoading: true,
    isAdmin: false,

    fetchRole: async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();
        const role = (data?.role ?? 'user') as UserRole;
        set({ role, isAdmin: role === 'admin' });
    },

    initialize: async () => {
        // Use ONLY onAuthStateChange as source of truth.
        // Supabase fires INITIAL_SESSION immediately on subscribe,
        // so there's no need to call getSession() separately.
        let lastUserId: string | null = null;

        supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null;
            set({ user: u, isLoading: false });

            if (u) {
                // Guard: skip fetchRole if it's the same user (avoids double-call on token refresh)
                if (u.id !== lastUserId) {
                    lastUserId = u.id;
                    await get().fetchRole(u.id);
                }
            } else {
                lastUserId = null;
                set({ role: null, isAdmin: false });
            }
        });
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };
        set({ user: data.user, isLoading: false });
        if (data.user) await get().fetchRole(data.user.id);
        return { error: null };
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        set({ user: null, role: null, isAdmin: false });
        return { error };
    },
}));
