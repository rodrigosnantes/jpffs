import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ElementType;
    rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon: Icon, rightElement, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label className="text-sm font-medium text-gray-400">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {Icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <Icon size={18} />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "bg-surface border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-600 w-full",
                            "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50",
                            "transition-all duration-200",
                            Icon && "pl-10",
                            rightElement && "pr-10",
                            error && "border-secondary focus:border-secondary focus:ring-secondary",
                            className
                        )}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center justify-center">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && (
                    <span className="text-xs text-secondary">{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
