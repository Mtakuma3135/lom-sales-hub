import { Link } from '@inertiajs/react';
import NordicCard from '@/Components/UI/NordicCard';
import StatusBadge from '@/Components/StatusBadge';

export default function DashboardTileLink({
    title,
    description,
    href,
    badge,
    accent = false,
}: {
    title: string;
    description: string;
    href: string;
    badge?: { label: string; variant: 'success' | 'danger' | 'primary' | 'muted'; pulse?: boolean };
    accent?: boolean | string;
}) {
    void accent;
    return (
        <Link href={href} className="group block">
            <NordicCard elevate className="h-full p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mb-3 h-px w-10 bg-wa-accent/50 transition-colors group-hover:bg-wa-accent/70" />
                        <div className="truncate text-sm font-semibold text-wa-body">{title}</div>
                        <div className="mt-2 text-xs leading-relaxed text-wa-muted">{description}</div>
                    </div>
                    {badge ? (
                        <StatusBadge variant={badge.variant} pulse={badge.pulse}>
                            {badge.label}
                        </StatusBadge>
                    ) : null}
                </div>
                <div className="mt-5 h-px w-full bg-wa-accent/15 transition-colors group-hover:bg-wa-accent/30" />
            </NordicCard>
        </Link>
    );
}
