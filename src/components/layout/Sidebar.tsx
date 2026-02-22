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
    Settings,
    Menu,
    X,
    LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../lib/supabase';
// import { useAuthStore } from '../../store/useAuthStore';

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // const user = useAuthStore((state) => state.user);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Jogadores', path: '/players', icon: Users },
        { name: 'Chamada', path: '/attendance', icon: ClipboardList },
        { name: 'Sorteio', path: '/teams', icon: Shield },
        { name: 'Partidas', path: '/matches', icon: Calendar },
        { name: 'Temporadas', path: '/seasons', icon: CalendarRange },
        { name: 'Classificação', path: '/leaderboard', icon: Trophy },
        { name: 'Configurações', path: '/settings', icon: Settings },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // if (!user) return null; // Handled in Layout

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
                <div className="p-4 border-t border-white/5 space-y-2">
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                            isActive ? "bg-primary/10" : "hover:bg-white/5",
                            !isOpen && "justify-center"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/20">
                            RO
                        </div>
                        <div className={cn(
                            "transition-all duration-300 overflow-hidden",
                            !isOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}>
                            <p className="text-sm font-bold text-white truncate">Rodrigo</p>
                            <p className="text-[10px] text-primary truncate">Admin</p>
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
