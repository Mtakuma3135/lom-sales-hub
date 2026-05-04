import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-stone-700">
            <div className="w-full max-w-md">
                <div className="rounded-3xl border border-stone-100 bg-white px-8 py-10 shadow-nordic">
                    <div className="flex flex-col items-center">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-stone-900/10 ring-1 ring-emerald-500/25">
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
                                <path d="M4 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M20 21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>

                        <div className="mt-4 text-center">
                            <div className="text-lg font-semibold tracking-tight text-stone-800">
                                営業ポータル<span className="text-emerald-600">.</span>
                            </div>
                            <div className="mt-1 text-xs font-medium text-stone-500">
                                Sales Activity Management System
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">{children}</div>

                    <div className="mt-8 border-t border-stone-100 pt-4 text-xs text-stone-500">
                        <div className="font-semibold text-stone-700">テストアカウント:</div>
                        <div className="mt-1">
                            管理者: <span className="font-mono">12345</span> /{' '}
                            <span className="font-mono">password</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-stone-400">
                    <Link href="/">
                        <ApplicationLogo className="mx-auto h-8 w-8 fill-current text-stone-300" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
