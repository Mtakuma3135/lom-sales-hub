import { PropsWithChildren } from 'react';

/** ヘッダー固定色・行ホバー統一のテーブルラッパ */
export function ModernTable({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={`modern-table-wrap overflow-x-auto rounded-sm border border-wa-accent/20 bg-wa-card ${className}`}
        >
            <table className="modern-table w-full border-collapse text-left text-sm text-wa-body">{children}</table>
        </div>
    );
}
