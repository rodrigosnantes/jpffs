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
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        set({ user, isLoading: false });
        if (user) await get().fetchRole(user.id);

        supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null;
            set({ user: u, isLoading: false });
            if (u) await get().fetchRole(u.id);
            else set({ role: null, isAdmin: false });
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
