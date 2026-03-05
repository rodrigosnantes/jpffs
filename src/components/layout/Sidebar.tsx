import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Trophy,
    Shield,
    Calendar,
    ClipboardList,
    CalendarRange,
    Menu,
    X,
    LogOut,
    Palette,
    ShieldCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';

export const Sidebar = () => {
    const { isSidebarOpen: isOpen, setSidebarOpen: setIsOpen } = useStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { themeId, setTheme, themes } = useTheme();
    const [showThemes, setShowThemes] = useState(false);
    const { isAdmin, user, name } = useAuthStore();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Jogadores', path: '/players', icon: Users },
        { name: 'Partidas', path: '/matches', icon: Calendar },
        { name: 'Classificação', path: '/leaderboard', icon: Trophy },
        // ── Admin-only items ─────────────────────────────────────────────
        ...(isAdmin ? [
            { name: 'Chamada', path: '/attendance', icon: ClipboardList },
            { name: 'Sorteio', path: '/teams', icon: Shield },
            { name: 'Temporadas', path: '/seasons', icon: CalendarRange },
            { name: 'Painel Admin', path: '/admin', icon: ShieldCheck },
        ] : []),
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-surface rounded-lg border border-white/10"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-screen bg-surface border-r border-white/5 transition-all duration-300 z-40 flex flex-col",
                    isOpen ? "w-64" : "w-20",
                    // Mobile adjustments
                    "lg:translate-x-0",
                    isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo/Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                    <div className={cn("font-header font-bold text-primary transition-all overflow-hidden whitespace-nowrap",
                        isOpen ? "text-2xl" : "md:hidden" // Hide text when collapsed on desktop
                    )}>
                        JPFFS
                    </div>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="hidden lg:block p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)} // Close on mobile click
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={22} className="min-w-[22px]" />
                            <span className={cn(
                                "font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                                !isOpen && "hidden lg:hidden" // Hide text when collapsed
                            )}>
                                {item.name}
                            </span>

                            {/* Tooltip for collapsed state */}
                            {!isOpen && (
                                <div className="hidden lg:block absolute left-16 bg-surface border border-white/10 px-2 py-1 rounded text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    {item.name}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 space-y-1">
                    {/* Themes */}
                    <div className="relative">
                        <button
                            onClick={() => setShowThemes(v => !v)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                                !isOpen && 'justify-center',
                                showThemes ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <Palette size={20} className="min-w-[20px]" />
                            <span className={cn('text-sm font-medium whitespace-nowrap overflow-hidden transition-all', !isOpen && 'hidden')}>
                                Tema
                            </span>
                        </button>

                        {showThemes && (
                            <div className={cn(
                                'absolute bottom-full mb-2 bg-surface border border-white/10 rounded-xl p-3 shadow-xl z-50',
                                isOpen ? 'left-0 right-0' : 'left-14 w-48'
                            )}>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Escolher tema</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {themes.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => { setTheme(t.id); setShowThemes(false); }}
                                            className={cn(
                                                'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs',
                                                themeId === t.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                                            )}
                                        >
                                            <span className="text-lg">{t.emoji}</span>
                                            <span className="font-medium text-[10px]">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <NavLink
                        to="/profile"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                            isActive ? "bg-primary/10" : "hover:bg-white/5",
                            !isOpen && "justify-center"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/20">
                            {name ? name.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'U')}
                        </div>
                        <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            !isOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}>
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-white truncate">{name || user?.email?.split('@')[0] || 'Usuário'}</p>
                                {isAdmin && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-primary truncate">{isAdmin ? 'Administrador' : 'Usuário'}</p>
                        </div>
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-secondary hover:bg-secondary/10 transition-colors",
                            !isOpen && "justify-center"
                        )}>
                        <LogOut size={22} />
                        <span className={cn(!isOpen && "hidden")}>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

