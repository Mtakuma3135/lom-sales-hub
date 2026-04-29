import { PropsWithChildren } from 'react';

/** 白基調カード（NeonCard と同用途・名称を用途に合わせて使い分け可） */
export default function CleanCard({
    children,
    className = '',
}: PropsWithChildren<{
    className?: string;
}>) {
    return <div className={`clean-card ${className}`}>{children}</div>;
}
