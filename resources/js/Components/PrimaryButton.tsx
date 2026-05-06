import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-sm border border-wa-accent/45 bg-wa-accent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-wa-ink transition hover:border-wa-accent hover:bg-wa-accent/90 focus:outline-none focus:ring-1 focus:ring-wa-accent/50 disabled:opacity-40 ${
                    disabled ? 'pointer-events-none' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
