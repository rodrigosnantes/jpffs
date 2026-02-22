import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Theme Definitions ────────────────────────────────────────────────────────

export type ThemeId =
    | 'dark'
    | 'light'
    | 'midnight'
    | 'forest'
    | 'sunset'
    | 'ocean';

export interface ThemeDef {
    id: ThemeId;
    label: string;
    emoji: string;
    vars: {
        '--color-background': string;
        '--color-surface': string;
        '--color-primary': string;
        '--color-secondary': string;
        '--color-text': string;
        '--color-muted': string;
    };
}

export const THEMES: ThemeDef[] = [
    {
        id: 'dark',
        label: 'Dark',
        emoji: '⚫',
        vars: {
            '--color-background': '#050608',
            '--color-surface': '#121212',
            '--color-primary': '#FFD700',
            '--color-secondary': '#FF4B4B',
            '--color-text': '#F5F7FA',
            '--color-muted': '#6b7280',
        },
    },
    {
        id: 'light',
        label: 'Light',
        emoji: '⚪',
        vars: {
            '--color-background': '#f1f5f9',
            '--color-surface': '#ffffff',
            '--color-primary': '#2563eb',
            '--color-secondary': '#ef4444',
            '--color-text': '#0f172a',
            '--color-muted': '#64748b',
        },
    },
    {
        id: 'midnight',
        label: 'Midnight',
        emoji: '🟣',
        vars: {
            '--color-background': '#07050f',
            '--color-surface': '#120e22',
            '--color-primary': '#a855f7',
            '--color-secondary': '#f43f5e',
            '--color-text': '#f1f0f9',
            '--color-muted': '#7c6f9e',
        },
    },
    {
        id: 'forest',
        label: 'Forest',
        emoji: '🟢',
        vars: {
            '--color-background': '#050e07',
            '--color-surface': '#0d1f10',
            '--color-primary': '#22c55e',
            '--color-secondary': '#f59e0b',
            '--color-text': '#ecfdf5',
            '--color-muted': '#4b7a59',
        },
    },
    {
        id: 'sunset',
        label: 'Sunset',
        emoji: '🟠',
        vars: {
            '--color-background': '#0f0805',
            '--color-surface': '#1e1008',
            '--color-primary': '#f97316',
            '--color-secondary': '#ec4899',
            '--color-text': '#fff7ed',
            '--color-muted': '#7c5a3d',
        },
    },
    {
        id: 'ocean',
        label: 'Ocean',
        emoji: '🔵',
        vars: {
            '--color-background': '#020c18',
            '--color-surface': '#061828',
            '--color-primary': '#38bdf8',
            '--color-secondary': '#818cf8',
            '--color-text': '#e0f2fe',
            '--color-muted': '#3a6a8a',
        },
    },
];

// ─── Context ───────────────────────────────────────────────────────────────────

interface ThemeCtx {
    themeId: ThemeId;
    setTheme: (id: ThemeId) => void;
    themes: ThemeDef[];
}

const ThemeContext = createContext<ThemeCtx>({
    themeId: 'dark',
    setTheme: () => { },
    themes: THEMES,
});

export const useTheme = () => useContext(ThemeContext);

// ─── Provider ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'jpffs-theme';

const applyTheme = (theme: ThemeDef) => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, val]) => {
        root.style.setProperty(key, val);
    });
    // Light mode: remove 'dark' class; dark-variants: keep 'dark' for Tailwind dark:* classes
    if (theme.id === 'light') {
        root.classList.remove('dark');
    } else {
        root.classList.add('dark');
    }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeId, setThemeId] = useState<ThemeId>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return (saved as ThemeId) ?? 'dark';
    });

    useEffect(() => {
        const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, themeId);
    }, [themeId]);

    return (
        <ThemeContext.Provider value={{ themeId, setTheme: setThemeId, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};
