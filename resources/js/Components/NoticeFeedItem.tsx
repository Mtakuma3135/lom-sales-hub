import StatusBadge from '@/Components/StatusBadge';

export default function NoticeFeedItem({
    title,
    body,
    publishedAt,
    isPinned,
    isRead,
    onOpen,
}: {
    title: string;
    body?: string;
    publishedAt?: string;
    isPinned?: boolean;
    isRead?: boolean;
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
            className={[
                'group border border-wa-accent/20 bg-wa-ink px-4 py-4 transition-colors hover:border-wa-accent/35',
                isRead ? 'opacity-80' : '',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                        {isPinned ? <StatusBadge variant="primary" pulse>PIN</StatusBadge> : null}
                        {isRead ? <StatusBadge variant="muted">既読</StatusBadge> : null}
                        <div className="min-w-0 wa-wrap-anywhere text-sm font-semibold leading-snug text-wa-body">{title}</div>
                    </div>
                    {body ? (
                        <div className="wa-wrap-anywhere mt-2 whitespace-pre-wrap text-sm text-wa-muted">
                            {body}
                        </div>
                    ) : null}
                    {publishedAt ? <div className="mt-2 text-xs text-wa-muted">公開: {publishedAt}</div> : null}
                </div>
                <div className="shrink-0 rounded-sm border border-wa-accent/30 bg-wa-card px-3 py-1 text-[11px] font-semibold text-wa-accent">
                    開く
                </div>
            </div>
        </div>
    );
}
