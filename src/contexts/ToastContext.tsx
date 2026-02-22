import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

export type ToastType = 'goal' | 'owngoal' | 'yellow' | 'red' | 'assist' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    subtitle?: string;
    team?: 'A' | 'B';
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

// ─── Provider ───────────────────────────────────────────────────────────────

const TOAST_DURATION = 5000; // ms

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const timer = timers.current.get(id);
        if (timer) { clearTimeout(timer); timers.current.delete(id); }
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [{ ...toast, id }, ...prev].slice(0, 5)); // max 5 toasts
        const timer = setTimeout(() => removeToast(id), TOAST_DURATION);
        timers.current.set(id, timer);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};
