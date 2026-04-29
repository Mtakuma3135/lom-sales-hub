import { PropsWithChildren } from 'react';

/** ヘッダー固定色・行ホバー統一のテーブルラッパ */
export function ModernTable({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return (
        <div className={`modern-table-wrap overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
            <table className="modern-table w-full border-collapse text-left text-sm text-slate-700">{children}</table>
        </div>
    );
}
