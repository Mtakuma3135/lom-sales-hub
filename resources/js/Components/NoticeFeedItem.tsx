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
            className="group border border-wa-accent/20 bg-wa-ink px-4 py-4 transition-colors hover:border-wa-accent/35"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {isPinned ? <StatusBadge variant="primary" pulse>PIN</StatusBadge> : null}
                        <div className="truncate text-sm font-semibold text-wa-body">{title}</div>
                    </div>
                    {body ? <div className="mt-2 line-clamp-2 text-sm text-wa-muted">{body}</div> : null}
                    {publishedAt ? <div className="mt-2 text-xs text-wa-muted">公開: {publishedAt}</div> : null}
                </div>
                <div className="shrink-0 rounded-sm border border-wa-accent/30 bg-wa-card px-3 py-1 text-[11px] font-semibold text-wa-accent">
                    開く
                </div>
            </div>
        </div>
    );
}
