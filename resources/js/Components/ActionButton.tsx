import { PropsWithChildren, useRef } from 'react';

export default function ActionButton({
    children,
    className = '',
    onClick,
    type = 'button',
    disabled = false,
}: PropsWithChildren<{
    className?: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
}>) {
    const ref = useRef<HTMLButtonElement | null>(null);

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled}
            onClick={(e) => {
                const el = ref.current;
                if (el && !disabled) {
                    const r = el.getBoundingClientRect();
                    const x = e.clientX - r.left;
                    const y = e.clientY - r.top;
                    el.style.setProperty('--ripple-x', `${x}px`);
                    el.style.setProperty('--ripple-y', `${y}px`);
                    el.classList.remove('ripple');
                    // force reflow
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    el.offsetHeight;
                    el.classList.add('ripple');
                }
                onClick?.();
            }}
            className={`action-button ${className}`}
        >
            <span className="relative z-10">{children}</span>
            <span aria-hidden className="action-button__ripple" />
        </button>
    );
}

