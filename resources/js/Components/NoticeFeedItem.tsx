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
                'group cursor-pointer border border-wa-accent/20 bg-wa-ink px-4 py-4 transition-colors hover:border-wa-accent/35',
                isRead ? 'opacity-80' : '',
            ].join(' ')}
        >
            <div className="flex gap-3">
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
                            className="rounded-lg border border-wa-accent/30 bg-wa-card px-2.5 py-1.5 text-[10px] font-black tracking-tight text-wa-body transition hover:border-wa-accent/50 disabled:cursor-wait disabled:opacity-40"
                        >
                            {readToggleBusy ? '…' : '既読⇔未読'}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
