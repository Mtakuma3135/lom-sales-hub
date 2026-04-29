import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import NeonCard from '@/Components/NeonCard';

export default function Upload() {
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
        <AuthenticatedLayout header={<h2 className="text-sm font-black tracking-tight">CSV / UPLOAD</h2>}>
            <Head title="CSV取込（管理者）" />
            <div className="mx-auto max-w-6xl px-6 py-6 text-stone-800">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <NeonCard elevate={false}>
                        <div className="text-xs font-bold tracking-widest text-stone-500">DROPZONE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-stone-900">CSVをアップロード</div>

                        <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-emerald-200/80 bg-white/80 px-5 py-8 text-center shadow-sm transition hover:border-emerald-400/60 hover:bg-emerald-50/30">
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
                            <div className="text-sm font-black tracking-tight text-stone-900">クリックしてファイル選択</div>
                            <div className="mt-2 text-xs text-stone-500">.csv / 最大10MB</div>
                            <div className="mt-4 text-xs font-semibold text-emerald-700">{fileName ? fileName : '未選択'}</div>
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
                            className="mt-4 w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-3 py-3 text-sm font-black tracking-tight text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25 transition hover:from-emerald-500/95 hover:to-emerald-600/95 disabled:opacity-50"
                        >
                            {isUploading ? '取込中…' : '取込開始'}
                        </button>

                        {errorMessage ? (
                            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                                {errorMessage}
                            </div>
                        ) : null}
                    </NeonCard>

                    <div className="space-y-6 lg:col-span-2">
                        <NeonCard elevate={false}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-stone-500">PROGRESS</div>
                                    <div className="mt-1 text-lg font-black tracking-tight text-stone-900">進捗</div>
                                </div>
                                <div className="text-xs font-semibold text-emerald-700">{progress}%</div>
                            </div>

                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm transition-[width]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                {[
                                    { label: '総行数', value: totals.total ? totals.total.toLocaleString() : '—' },
                                    { label: '成功', value: totals.total ? totals.success.toLocaleString() : '—' },
                                    { label: '失敗', value: totals.total ? totals.failed.toLocaleString() : '—' },
                                ].map((k) => (
                                    <div key={k.label} className="rounded-xl border border-stone-200 bg-white/70 px-4 py-4 shadow-sm">
                                        <div className="text-[11px] font-bold tracking-widest text-stone-500">{k.label}</div>
                                        <div className="mt-1 text-xl font-black tracking-tighter text-stone-900">{k.value}</div>
                                    </div>
                                ))}
                            </div>
                        </NeonCard>

                        <NeonCard elevate={false}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-stone-500">UPLOAD HISTORY</div>
                                    <div className="mt-1 text-lg font-black tracking-tight text-stone-900">取込履歴</div>
                                </div>
                                <div className="text-xs text-stone-500">全 {history.length} 件</div>
                            </div>

                            <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-100/80 text-xs font-bold tracking-widest text-stone-600">
                                        <tr>
                                            <th className="px-4 py-3">FILE</th>
                                            <th className="px-4 py-3">SUCCESS</th>
                                            <th className="px-4 py-3">FAILED</th>
                                            <th className="px-4 py-3">AT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200 bg-white/60">
                                        {history.length ? (
                                            history.map((h) => (
                                                <tr key={h.id} className="hover:bg-emerald-50/30">
                                                    <td className="px-4 py-3 font-mono text-xs text-stone-800">{h.filename}</td>
                                                    <td className="px-4 py-3 text-stone-800">{h.success_count.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-stone-800">{h.failed_count.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-stone-600">{h.created_at}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="px-4 py-6 text-sm text-stone-500" colSpan={4}>
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
                                    <div className="text-xs font-bold tracking-widest text-stone-500">ERROR LOG</div>
                                    <div className="mt-1 text-lg font-black tracking-tight text-stone-900">エラー行</div>
                                </div>
                                <div className="text-xs text-stone-500">{errors.length} 件</div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {errors.map((e) => (
                                    <div key={e.row} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
                                        <div className="font-black tracking-tight text-rose-900">行 {e.row}</div>
                                        <div className="mt-1 text-xs text-rose-800">{e.message}</div>
                                    </div>
                                ))}
                            </div>
                        </NeonCard>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
