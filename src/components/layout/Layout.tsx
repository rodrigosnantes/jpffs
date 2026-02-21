import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/cn';

interface LayoutProps {
    children: React.ReactNode;
}

import { useAuthStore } from '../../store/useAuthStore';

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="min-h-screen bg-background text-text flex">
            {user && <Sidebar />}
            <main className={cn(
                "flex-1 transition-all duration-300 min-h-screen",
                user && "lg:pl-20"
            )}>

                <div className={cn(
                    "w-full",
                    user ? "lg:pl-64 p-8" : "p-0"
                )}>
                    {children}
                </div>
            </main>
        </div>
    );
};
