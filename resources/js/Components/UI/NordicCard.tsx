import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

/** モダン和風カード（墨・銅ライン）。影・過度な丸みなし */
export default function NordicCard({
    children,
    className = '',
    elevate = true,
    ...rest
}: PropsWithChildren<{
    className?: string;
    /** ホバーで縁取りをわずかに強める */
    elevate?: boolean;
}> &
    Omit<React.ComponentPropsWithoutRef<typeof motion.div>, 'className' | 'children'>) {
    return (
        <motion.div
            className={`rounded-sm border border-wa-accent/25 bg-wa-card p-6 text-wa-body wa-body-track transition-colors ${
                elevate ? 'hover:border-wa-accent/40' : ''
            } ${className}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}
