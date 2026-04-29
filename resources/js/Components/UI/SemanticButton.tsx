import { motion } from 'framer-motion';
import { type MouseEventHandler, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClass: Record<Variant, string> = {
    primary:
        'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 hover:from-emerald-500/95 hover:to-emerald-600/95',
    secondary:
        'bg-white text-stone-700 shadow-sm shadow-stone-900/5 ring-1 ring-stone-200 hover:bg-stone-50',
    ghost: 'bg-transparent text-emerald-700 ring-1 ring-emerald-200/80 hover:bg-emerald-50',
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
            className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-45 ${variantClass[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
}
