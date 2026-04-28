import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

// ゲストレイアウト（指示書準拠）
export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-[#0b1020] text-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full bg-gradient-to-br from-purple-500/35 to-cyan-400/20 blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 h-[440px] w-[440px] rounded-full bg-gradient-to-br from-cyan-400/25 to-fuchsia-500/20 blur-3xl" />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_50px_rgba(0,0,0,0.55)] backdrop-blur-md px-8 py-10">
                    <div className="flex flex-col items-center">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 text-[#0b1020] shadow-[0_0_18px_rgba(34,211,238,0.35)]">
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10 8l4 4-4 4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M4 12h10"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M20 21V3"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>

                        <div className="mt-4 text-center">
                            <div className="text-lg font-black tracking-tighter text-white">
                                営業ポータル<span className="text-cyan-300">.</span>
                            </div>
                            <div className="mt-1 text-xs font-semibold text-white/55">
                                Sales Activity Management System
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">{children}</div>

                    <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/55">
                        <div className="font-black tracking-tight text-white/70">
                            テストアカウント:
                        </div>
                        <div className="mt-1">
                            管理者: <span className="font-mono">12345</span> /{' '}
                            <span className="font-mono">password</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-white/35">
                    <Link href="/">
                        <ApplicationLogo className="mx-auto h-8 w-8 fill-current text-white/25" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
