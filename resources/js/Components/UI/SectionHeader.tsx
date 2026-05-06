import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { PropsWithChildren, ReactNode } from 'react';

export default function SectionHeader({
    eyebrow,
    title,
    meta,
    action,
}: PropsWithChildren<{
    eyebrow: string;
    title: string;
    meta?: ReactNode;
    action?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' };
}>) {
    const variant = action?.variant ?? 'secondary';
    const Button = variant === 'primary' ? PrimaryButton : SecondaryButton;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
                <div className="text-xs font-bold tracking-widest text-wa-muted">{eyebrow}</div>
                <div className="mt-1 text-sm font-black tracking-tight text-wa-body">{title}</div>
            </div>
            <div className="flex items-center gap-3">
                {meta ? <div className="text-[10px] text-wa-muted">{meta}</div> : null}
                {action ? (
                    <Button onClick={action.onClick} type="button" className="px-4 py-2">
                        {action.label}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

