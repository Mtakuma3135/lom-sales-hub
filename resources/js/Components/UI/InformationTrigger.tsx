import { AnimatePresence, motion } from 'framer-motion';
import { PropsWithChildren, useId, useState } from 'react';

/**
 * クリックで詳細がスライドイン（アコーディオン風）
 */
export default function InformationTrigger({
    label,
    children,
    defaultOpen = false,
}: PropsWithChildren<{
    label: string;
    defaultOpen?: boolean;
}>) {
    const id = useId();
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-xl border border-emerald-100/70 bg-white/70">
            <button
                type="button"
                id={`${id}-trigger`}
                aria-expanded={open}
                aria-controls={`${id}-panel`}
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-stone-700 transition-colors hover:bg-white/90"
            >
                <span>{label}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-emerald-600"
                    aria-hidden
                >
                    ▼
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        id={`${id}-panel`}
                        role="region"
                        aria-labelledby={`${id}-trigger`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-stone-100"
                    >
                        <div className="px-4 py-4 text-sm leading-relaxed text-stone-600">{children}</div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
