import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
            .catch(() => {
                // 履歴が取れなくても画面自体は動かす
            });
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
            <div className="mx-auto max-w-6xl px-6 py-6 text-slate-100">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* DropZone */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                        <div className="text-xs font-bold tracking-widest text-white/60">DROPZONE</div>
                        <div className="mt-2 text-sm font-black tracking-tight text-white">CSVをアップロード</div>

                        <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-[#0b1020]/55 px-5 py-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_0_26px_rgba(168,85,247,0.14)] transition">
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
                            <div className="text-sm font-black tracking-tight text-white">
                                クリックしてファイル選択
                            </div>
                            <div className="mt-2 text-xs text-white/45">
                                .csv / 最大10MB
                            </div>
                            <div className="mt-4 text-xs font-semibold text-cyan-200/80">
                                {fileName ? fileName : '未選択'}
                            </div>
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
                            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 px-3 py-3 text-sm font-black tracking-tight text-[#0b1020] shadow-[0_0_22px_rgba(34,211,238,0.22)] hover:brightness-110 disabled:opacity-50"
                        >
                            {isUploading ? '取込中…' : '取込開始'}
                        </button>

                        {errorMessage ? (
                            <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100/80">
                                {errorMessage}
                            </div>
                        ) : null}
                    </div>

                    {/* Progress / Result */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-white/60">PROGRESS</div>
                                    <div className="mt-1 text-lg font-black tracking-tight text-white">進捗</div>
                                </div>
                                <div className="text-xs font-semibold text-cyan-200/80">{progress}%</div>
                            </div>

                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                {[
                                    { label: '総行数', value: totals.total ? totals.total.toLocaleString() : '—' },
                                    { label: '成功', value: totals.total ? totals.success.toLocaleString() : '—' },
                                    { label: '失敗', value: totals.total ? totals.failed.toLocaleString() : '—' },
                                ].map((k) => (
                                    <div key={k.label} className="rounded-2xl border border-white/10 bg-[#0b1020]/55 px-4 py-4">
                                        <div className="text-[11px] font-bold tracking-widest text-white/55">{k.label}</div>
                                        <div className="mt-1 text-xl font-black tracking-tighter text-white">{k.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-white/60">UPLOAD HISTORY</div>
                                    <div className="mt-1 text-lg font-black tracking-tight text-white">取込履歴</div>
                                </div>
                                <div className="text-xs text-white/45">全 {history.length} 件</div>
                            </div>

                            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-xs font-bold tracking-widest text-white/55">
                                        <tr>
                                            <th className="px-4 py-3">FILE</th>
                                            <th className="px-4 py-3">SUCCESS</th>
                                            <th className="px-4 py-3">FAILED</th>
                                            <th className="px-4 py-3">AT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 bg-[#0b1020]/35">
                                        {history.length ? (
                                            history.map((h) => (
                                                <tr key={h.id} className="hover:bg-white/5">
                                                    <td className="px-4 py-3 font-mono text-xs text-white/80">{h.filename}</td>
                                                    <td className="px-4 py-3 text-white/80">{h.success_count.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-white/80">{h.failed_count.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-white/55">{h.created_at}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="px-4 py-6 text-sm text-white/40" colSpan={4}>
                                                    履歴がありません
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold tracking-widest text-white/60">ERROR LOG</div>
                                    <div className="mt-1 text-lg font-black tracking-tight text-white">エラー行</div>
                                </div>
                                <div className="text-xs text-white/45">{errors.length} 件</div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {errors.map((e) => (
                                    <div key={e.row} className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm">
                                        <div className="font-black tracking-tight text-rose-100">行 {e.row}</div>
                                        <div className="mt-1 text-xs text-rose-100/70">{e.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

