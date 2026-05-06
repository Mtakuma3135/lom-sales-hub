import { AnimatePresence, motion } from 'framer-motion';
import { PropsWithChildren, useEffect } from 'react';

/** 右スライドパネル（モダン和風） */
export default function DetailDrawer({
    open,
    title,
    onClose,
    children,
}: PropsWithChildren<{
    open: boolean;
    title: string;
    onClose: () => void;
}>) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    key="detail-drawer"
                    className="fixed inset-0 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-wa-ink/75 backdrop-blur-[2px]"
                        aria-label="閉じる"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-wa-accent/20 bg-wa-card"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between border-b border-wa-accent/20 px-5 py-4">
                            <div className="wa-body-track text-sm font-semibold text-wa-body">{title}</div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-xs font-semibold text-wa-muted transition hover:border-wa-accent/40 hover:text-wa-body"
                            >
                                閉じる
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto p-5 text-wa-body wa-body-track">{children}</div>
                    </motion.aside>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
