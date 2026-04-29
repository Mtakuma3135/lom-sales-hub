import { AnimatePresence, motion } from 'framer-motion';
import { PropsWithChildren, useEffect } from 'react';

/** 右スライドパネル（Nordic / light glass） */
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
                        className="absolute inset-0 backdrop-blur-sm bg-stone-900/20"
                        aria-label="閉じる"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-emerald-100/60 border-t border-t-white/80 bg-emerald-50/55 shadow-xl shadow-stone-900/12 backdrop-blur-md"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                            <div className="text-sm font-semibold tracking-tight text-stone-800">{title}</div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50"
                            >
                                閉じる
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto p-5 text-stone-700">{children}</div>
                    </motion.aside>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
