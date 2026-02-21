import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    disabled,
    ...props
}) => {
    const variants = {
        primary: "bg-primary text-background hover:bg-yellow-400 font-bold",
        secondary: "bg-surface border border-white/10 text-white hover:bg-white/5",
        danger: "bg-secondary text-white hover:bg-red-600",
        ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button
            className={cn(
                sizes[size],
                "rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};
