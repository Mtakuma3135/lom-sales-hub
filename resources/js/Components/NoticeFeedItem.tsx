import StatusBadge from '@/Components/StatusBadge';

export default function NoticeFeedItem({
    title,
    body,
    publishedAt,
    isPinned,
    isRead,
    onOpen,
    onToggleRead,
    readToggleBusy,
}: {
    title: string;
    body?: string;
    publishedAt?: string;
    isPinned?: boolean;
    isRead?: boolean;
    onOpen: () => void;
    /** 一覧のみ: 既読⇔未読（クリックは行の onOpen に伝播しない） */
    onToggleRead?: () => void;
    readToggleBusy?: boolean;
}) {
    return (
        <div
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                onOpen();
            }}
            className={[
                'group cursor-pointer border px-4 py-4 transition-colors',
                isRead
                    ? 'border-teal-500/45 bg-gradient-to-br from-teal-950/35 via-wa-ink to-wa-ink hover:border-teal-400/55'
                    : 'border-wa-accent/20 bg-wa-ink hover:border-wa-accent/35',
            ].join(' ')}
        >
            <div className="flex gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                        {isPinned ? <StatusBadge variant="primary" pulse className="bg-wa-accent/20 text-wa-accent border-wa-accent/40">PIN</StatusBadge> : null}
                        <div
                            className={[
                                'min-w-0 wa-wrap-anywhere text-sm font-semibold leading-snug',
                                isRead ? 'text-teal-50/95' : 'text-wa-body',
                            ].join(' ')}
                        >
                            {title}
                        </div>
                    </div>
                    {body ? (
                        <div className="wa-wrap-anywhere mt-2 whitespace-pre-wrap text-sm text-wa-muted">
                            {body}
                        </div>
                    ) : null}
                    {publishedAt ? <div className="mt-2 text-xs text-wa-muted">公開: {publishedAt}</div> : null}
                </div>
                {onToggleRead ? (
                    <div className="shrink-0 self-start pt-0.5">
                        <button
                            type="button"
                            disabled={readToggleBusy}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleRead();
                            }}
                            aria-label={isRead ? '未読に戻す' : '既読にする'}
                            className={[
                                'rounded-lg border px-2.5 py-1.5 text-[10px] font-black tracking-tight transition disabled:cursor-wait disabled:opacity-40',
                                isRead
                                    ? 'border-teal-500/45 bg-teal-950/50 text-teal-100 hover:border-teal-400/60 hover:bg-teal-900/55'
                                    : 'border-amber-400/35 bg-amber-950/25 text-amber-100/95 hover:border-amber-400/55 hover:bg-amber-950/40',
                            ].join(' ')}
                        >
                            {readToggleBusy ? '…' : isRead ? '既読' : '未読'}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
