import StatusBadge from '@/Components/StatusBadge';

export default function NoticeFeedItem({
    title,
    body,
    publishedAt,
    isPinned,
    onOpen,
}: {
    title: string;
    body?: string;
    publishedAt?: string;
    isPinned?: boolean;
    onOpen: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                onOpen();
            }}
            className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white/75 px-4 py-4 shadow-sm transition-all duration-200 hover:border-emerald-200/80 hover:shadow-nordic"
        >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-r from-emerald-400/5 via-transparent to-teal-400/5" />
            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {isPinned ? <StatusBadge variant="primary" pulse>PIN</StatusBadge> : null}
                        <div className="truncate text-sm font-black tracking-tight text-stone-900">{title}</div>
                    </div>
                    {body ? <div className="mt-2 line-clamp-2 text-sm text-stone-600">{body}</div> : null}
                    {publishedAt ? <div className="mt-2 text-xs text-stone-500">公開: {publishedAt}</div> : null}
                </div>
                <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-100">
                    開く
                </div>
            </div>
        </div>
    );
}

