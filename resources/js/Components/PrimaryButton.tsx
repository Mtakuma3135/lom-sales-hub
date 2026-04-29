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
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 transition duration-200 ease-out hover:from-emerald-500/95 hover:to-emerald-600/95 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_0_16px_rgba(110,231,183,0.24),0_12px_24px_rgba(28,25,23,0.16)] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-40 ${
                    disabled ? 'pointer-events-none' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
