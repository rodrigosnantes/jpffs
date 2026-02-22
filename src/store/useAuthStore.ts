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
    initialize: () => void;
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

    // Fetch the role from the profiles table — never throws, always resolves
    fetchRole: async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (!data) {
                // Profile row missing — create it with default role
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from('profiles').upsert({
                    id: userId,
                    email: user?.email ?? '',
                    role: 'user',
                });
                set({ role: 'user', isAdmin: false });
                return;
            }

            const role = (data.role ?? 'user') as UserRole;
            set({ role, isAdmin: role === 'admin' });
        } catch {
            // If profiles table is inaccessible, default safely to 'user'
            set({ role: 'user', isAdmin: false });
        }
    },

    // Initialize: use ONLY onAuthStateChange as source of truth.
    // Supabase fires INITIAL_SESSION immediately on subscribe,
    // so there's no need to call getSession() separately.
    initialize: () => {
        let lastUserId: string | null = null;

        supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null;
            set({ user: u, isLoading: false });

            if (u) {
                // Guard: skip fetchRole if it's the same user
                if (u.id !== lastUserId) {
                    lastUserId = u.id;
                    get().fetchRole(u.id); // fire-and-forget — don't await here
                }
            } else {
                lastUserId = null;
                set({ role: null, isAdmin: false });
            }
        });
    },

    // signIn: just authenticate — let onAuthStateChange handle state updates.
    // Never await fetchRole here; that would block the Login page.
    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ?? null };
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        set({ user: null, role: null, isAdmin: false });
        return { error };
    },
}));
