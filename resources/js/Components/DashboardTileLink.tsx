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
    /** Nordic では未使用（互換のため残置） */
    accent?: boolean | string;
}) {
    void accent;
    return (
        <Link href={href} className="group block transition-transform duration-200 ease-out hover:scale-[1.02]">
            <NordicCard elevate className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mb-2 h-1 w-8 rounded-full bg-emerald-600/90 shadow-[0_0_10px_rgba(16,185,129,0.35)]" />
                        <div className="truncate text-sm font-semibold tracking-tight text-stone-800">{title}</div>
                        <div className="mt-1 text-xs leading-relaxed text-stone-500">{description}</div>
                    </div>
                    {badge ? (
                        <StatusBadge variant={badge.variant} pulse={badge.pulse}>
                            {badge.label}
                        </StatusBadge>
                    ) : null}
                </div>
                <div className="mt-4 h-px w-full bg-stone-200 transition-colors duration-300 group-hover:bg-emerald-200" />
            </NordicCard>
        </Link>
    );
}
