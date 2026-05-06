import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-xl border border-wa-accent/20 bg-wa-subtle px-4 py-2 text-xs font-semibold uppercase tracking-widest text-wa-body transition hover:border-wa-accent/35 hover:bg-wa-ink focus:outline-none focus:ring-1 focus:ring-wa-accent/40 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
