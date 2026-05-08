import NeonCard from '@/Components/NeonCard';
import { useEffect, useMemo, useState } from 'react';

/** KPI（売上記録）用 CSV 取り込み — 元 Admin/Csv/Upload と同一 UI */
export default function CsvUploadPanel() {
    const [fileName, setFileName] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [result, setResult] = useState<{
        upload_id: number;
        filename: string;
        success_count: number;
        failed_count: number;
        errors: { row: number; message: string }[];
    } | null>(null);
    const [history, setHistory] = useState<
        { id: number; filename: string; success_count: number; failed_count: number; created_at: string }[]
    >([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const api = useMemo(() => {
        return {
            uploads: () => fetch(route('portal.api.csv.uploads'), { headers: { Accept: 'application/json' } }),
            upload: (file: File) => {
                const fd = new FormData();
                fd.append('file', file);
                return fetch(route('portal.api.csv.upload'), {
                    method: 'POST',
                    body: fd,
                    headers: { Accept: 'application/json' },
                });
            },
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        api.uploads()
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as unknown;
                const list = Array.isArray(json) ? json : [];
                if (mounted) setHistory(list as any);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, [api]);

    const errors = result?.errors ?? [];
    const totals = useMemo(() => {
        if (!result) return { total: 0, success: 0, failed: 0 };
        return {
            total: result.success_count + result.failed_count,
            success: result.success_count,
            failed: result.failed_count,
        };
    }, [result]);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <NeonCard elevate={false}>
                <div className="text-xs font-bold tracking-widest text-wa-muted">DROPZONE</div>
                <div className="mt-2 text-sm font-black tracking-tight text-wa-body">CSVをアップロード</div>
                <p className="mt-2 text-xs text-wa-muted">
                    アップロードしたデータは案件・KPIの集計に反映されます。
                </p>

                <label className="mt-4 block cursor-pointer rounded-sm border border-dashed border-wa-accent/35 bg-wa-ink px-5 py-8 text-center transition hover:border-wa-accent/55 hover:bg-wa-card">
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            setUploadFile(f ?? null);
                            setFileName(f ? f.name : null);
                            setProgress(0);
                            setResult(null);
                            setErrorMessage(null);
                        }}
                    />
                    <div className="text-sm font-black tracking-tight text-wa-body">クリックしてファイル選択</div>
                    <div className="mt-2 text-xs text-wa-muted">.csv / 最大10MB</div>
                    <div className="mt-4 text-xs font-semibold text-wa-accent">{fileName ? fileName : '未選択'}</div>
                </label>

                <button
                    type="button"
                    disabled={!uploadFile || isUploading}
                    onClick={async () => {
                        if (!uploadFile) return;
                        setIsUploading(true);
                        setErrorMessage(null);
                        setProgress(8);
                        try {
                            const res = await api.upload(uploadFile);
                            if (!res.ok) {
                                setProgress(0);
                                throw new Error(`HTTP ${res.status}`);
                            }
                            setProgress(72);
                            const json = (await res.json()) as any;
                            setResult(json);
                            setProgress(100);

                            const hisRes = await api.uploads();
                            if (hisRes.ok) {
                                const hisJson = await hisRes.json();
                                setHistory(Array.isArray(hisJson) ? (hisJson as any) : []);
                            }
                        } catch {
                            setErrorMessage('アップロードに失敗しました。再度送信してください。');
                        } finally {
                            setIsUploading(false);
                        }
                    }}
                    className="mt-4 w-full rounded-sm border border-wa-accent/45 bg-wa-accent px-3 py-3 text-sm font-black tracking-tight text-wa-ink shadow-sm ring-1 ring-wa-accent/30 transition hover:bg-wa-accent/90 disabled:opacity-50"
                >
                    {isUploading ? '取込中…' : '取込開始'}
                </button>

                {errorMessage ? (
                    <div className="mt-3 rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-xs text-red-300">
                        {errorMessage}
                    </div>
                ) : null}
            </NeonCard>

            <div className="space-y-6 lg:col-span-2">
                <NeonCard elevate={false}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">PROGRESS</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-wa-body">進捗</div>
                        </div>
                        <div className="text-xs font-semibold text-wa-accent">{progress}%</div>
                    </div>

                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-wa-subtle">
                        <div
                            className="h-full bg-gradient-to-r from-wa-accent to-teal-500 shadow-sm transition-[width]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                            { label: '総行数', value: totals.total ? totals.total.toLocaleString() : '—' },
                            { label: '成功', value: totals.total ? totals.success.toLocaleString() : '—' },
                            { label: '失敗', value: totals.total ? totals.failed.toLocaleString() : '—' },
                        ].map((k) => (
                            <div key={k.label} className="rounded-sm border border-wa-accent/20 bg-wa-ink px-4 py-4">
                                <div className="text-[11px] font-bold tracking-widest text-wa-muted">{k.label}</div>
                                <div className="mt-1 text-xl font-black tracking-tighter text-wa-body">{k.value}</div>
                            </div>
                        ))}
                    </div>
                </NeonCard>

                <NeonCard elevate={false}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">UPLOAD HISTORY</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-wa-body">取込履歴</div>
                        </div>
                        <div className="text-xs text-wa-muted">全 {history.length} 件</div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-sm border border-wa-accent/20">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-wa-card text-xs font-bold tracking-widest text-wa-muted">
                                <tr>
                                    <th className="px-4 py-3">FILE</th>
                                    <th className="px-4 py-3">SUCCESS</th>
                                    <th className="px-4 py-3">FAILED</th>
                                    <th className="px-4 py-3">AT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-wa-accent/15 bg-wa-ink">
                                {history.length ? (
                                    history.map((h) => (
                                        <tr key={h.id} className="transition-colors hover:bg-wa-card/80">
                                            <td className="px-4 py-3 font-mono text-xs text-wa-body">{h.filename}</td>
                                            <td className="px-4 py-3 text-wa-body">{h.success_count.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-wa-body">{h.failed_count.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-wa-muted">{h.created_at}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-wa-muted" colSpan={4}>
                                            履歴がありません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>

                <NeonCard elevate={false}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold tracking-widest text-wa-muted">ERROR LOG</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-wa-body">エラー行</div>
                        </div>
                        <div className="text-xs text-wa-muted">{errors.length} 件</div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {errors.map((e) => (
                            <div key={e.row} className="rounded-sm border border-red-500/35 bg-wa-ink px-4 py-3 text-sm">
                                <div className="font-black tracking-tight text-red-300">行 {e.row}</div>
                                <div className="mt-1 text-xs text-red-300/85">{e.message}</div>
                            </div>
                        ))}
                    </div>
                </NeonCard>
            </div>
        </div>
    );
}
