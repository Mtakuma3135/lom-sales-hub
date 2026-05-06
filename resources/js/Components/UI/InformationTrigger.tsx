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
        <div className="rounded-sm border border-wa-accent/20 bg-wa-ink">
            <button
                type="button"
                id={`${id}-trigger`}
                aria-expanded={open}
                aria-controls={`${id}-panel`}
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-wa-body wa-body-track transition-colors hover:bg-wa-subtle/60"
            >
                <span>{label}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-wa-accent"
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
                        className="overflow-hidden border-t border-wa-accent/20"
                    >
                        <div className="px-4 py-4 text-sm leading-relaxed text-wa-muted wa-body-track">{children}</div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
