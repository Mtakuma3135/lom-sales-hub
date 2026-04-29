import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

export default function NordicCard({
    children,
    className = '',
    elevate = true,
    ...rest
}: PropsWithChildren<{
    className?: string;
    /** 一覧内などでホバー浮きを抑えたいとき false */
    elevate?: boolean;
}> &
    Omit<React.ComponentPropsWithoutRef<typeof motion.div>, 'className' | 'children'>) {
    return (
        <motion.div
            className={`rounded-2xl border border-stone-200 border-t-white/80 bg-emerald-50/45 p-6 shadow-xl shadow-stone-900/10 ring-1 ring-stone-900/5 ${className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            {...rest}
            whileHover={
                elevate
                    ? {
                          y: -3,
                          boxShadow: '0 12px 36px rgb(28 25 23 / 0.07)',
                          transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                      }
                    : undefined
            }
        >
            {children}
        </motion.div>
    );
}
