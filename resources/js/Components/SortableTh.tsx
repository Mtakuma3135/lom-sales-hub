import { type ReactNode } from 'react';

export type SortDir = 'asc' | 'desc';

export function nextDir(current: SortDir | null | undefined): SortDir {
    return current === 'asc' ? 'desc' : 'asc';
}

export function SortableTh({
    label,
    active,
    dir,
    onToggle,
    className = '',
    align = 'left',
}: {
    label: ReactNode;
    active: boolean;
    dir: SortDir;
    onToggle: () => void;
    className?: string;
    align?: 'left' | 'center' | 'right';
}) {
    const aria = typeof label === 'string' ? label : undefined;
    const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

    return (
        <th className={className}>
            <button
                type="button"
                onClick={onToggle}
                className={`group inline-flex w-full items-center gap-2 ${justify} select-none`}
                aria-label={aria ? `${aria} を並び替え` : undefined}
            >
                <span>{label}</span>
                {active ? (
                    <span className="text-[10px] font-black tracking-tight text-wa-accent">
                        {dir === 'asc' ? '▲' : '▼'}
                    </span>
                ) : (
                    <span
                        aria-hidden
                        className="w-0 overflow-hidden text-[10px] font-black tracking-tight text-wa-muted/60 transition-all group-hover:w-3 group-hover:text-wa-muted"
                    >
                        ▲
                    </span>
                )}
            </button>
        </th>
    );
}

