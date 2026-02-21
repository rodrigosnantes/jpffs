import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                "bg-surface border border-white/5 rounded-xl shadow-lg p-6 backdrop-blur-sm",
                "hover:border-white/10 transition-colors duration-200",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
