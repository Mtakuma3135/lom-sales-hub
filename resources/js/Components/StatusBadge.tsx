type Variant = 'success' | 'danger' | 'warning' | 'primary' | 'muted';

const styles: Record<Variant, string> = {
    success: 'neon-badge neon-badge--success',
    danger: 'neon-badge neon-badge--danger',
    warning: 'neon-badge neon-badge--warning',
    primary: 'neon-badge neon-badge--primary',
    muted: 'neon-badge neon-badge--muted',
};

export default function StatusBadge({
    children,
    variant,
    pulse = false,
    className = '',
}: {
    children: string;
    variant: Variant;
    pulse?: boolean;
    className?: string;
}) {
    return <span className={`${styles[variant]} ${pulse ? 'animate-pulse' : ''} ${className}`}>{children}</span>;
}

