import { motion } from 'framer-motion';
import { type MouseEventHandler, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClass: Record<Variant, string> = {
    primary:
        'border border-wa-accent/45 bg-wa-accent text-wa-ink shadow-sm ring-1 ring-wa-accent/30 transition hover:border-wa-accent hover:bg-wa-accent/90',
    secondary:
        'border border-wa-accent/25 bg-wa-ink text-wa-body shadow-sm ring-1 ring-wa-accent/10 hover:border-wa-accent/40 hover:bg-wa-card',
    ghost:
        'border border-wa-accent/20 bg-transparent text-wa-accent ring-1 ring-wa-accent/15 hover:bg-wa-ink',
};

export default function SemanticButton({
    children,
    className = '',
    variant = 'primary',
    type = 'button',
    disabled = false,
    onClick,
}: PropsWithChildren<{
    className?: string;
    variant?: Variant;
    type?: 'button' | 'submit';
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}>) {
    return (
        <motion.button
            type={type}
            disabled={disabled}
            onClick={onClick}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`inline-flex items-center justify-center rounded-sm px-4 py-3 text-sm font-semibold tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-45 ${variantClass[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
}
