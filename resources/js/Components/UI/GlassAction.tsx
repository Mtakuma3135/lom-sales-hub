import { AnimatePresence, motion } from 'framer-motion';
import { PropsWithChildren, useEffect } from 'react';

/**
 * 詳細・確認用の半透明オーバーレイ（Nordic / light glass）
 */
export default function GlassAction({
    open,
    title,
    onClose,
    children,
    widthClassName = 'max-w-lg',
}: PropsWithChildren<{
    open: boolean;
    title?: string;
    onClose: () => void;
    widthClassName?: string;
}>) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                    <button
                        type="button"
                        aria-label="閉じる"
                        className="absolute inset-0 backdrop-blur-sm bg-stone-900/15"
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative z-10 w-full ${widthClassName} overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-nordic backdrop-blur-md`}
                    >
                        {title ? (
                            <div className="border-b border-stone-100/80 px-5 py-4">
                                <h2 className="text-sm font-semibold tracking-tight text-stone-800">{title}</h2>
                            </div>
                        ) : null}
                        <div className="max-h-[min(72vh,640px)] overflow-auto p-5 text-stone-700">{children}</div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
