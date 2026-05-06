import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-sm border border-red-500/40 bg-red-900/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-300 transition hover:border-red-400/50 hover:bg-red-900/55 focus:outline-none focus:ring-1 focus:ring-red-500/50 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
