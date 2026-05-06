import { PropsWithChildren, useCallback, useEffect, useState } from 'react';

type ToastItem = { id: number; message: string };

export default function ToastProvider({ children }: PropsWithChildren) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const push = useCallback((message: string) => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message }]);
        window.setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== id));
        }, 4200);
    }, []);

    useEffect(() => {
        const fn = (e: Event) => {
            const d = (e as CustomEvent<{ message?: string }>).detail;
            if (d?.message) push(d.message);
        };
        window.addEventListener('app-toast', fn as EventListener);
        return () => window.removeEventListener('app-toast', fn as EventListener);
    }, [push]);

    return (
        <>
            {children}
            <div
                className="pointer-events-none fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2"
                aria-live="polite"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="pointer-events-auto animate-[toastIn_0.35s_ease-out] rounded-sm border border-wa-accent/25 bg-wa-card px-4 py-3 text-sm font-medium text-wa-body shadow-lg shadow-black/40"
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </>
    );
}
