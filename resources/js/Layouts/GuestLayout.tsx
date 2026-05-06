import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-wa-ink p-6 text-wa-body wa-body-track">
            <div className="w-full max-w-md">
                <div className="rounded-sm border border-wa-accent/20 bg-wa-card px-8 py-12">
                    <div className="flex flex-col items-center">
                        <div className="grid h-12 w-12 place-items-center rounded-sm border border-wa-accent/30 bg-wa-ink text-wa-accent">
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

                        <div className="mt-5 text-center">
                            <div className="text-lg font-semibold text-wa-body">
                                営業ポータル<span className="text-wa-accent">.</span>
                            </div>
                            <div className="mt-1 text-xs font-medium text-wa-muted">Sales Activity Management System</div>
                        </div>
                    </div>

                    <div className="mt-8">{children}</div>

                    <div className="mt-8 border-t border-wa-accent/20 pt-5 text-xs text-wa-muted">
                        <div className="font-semibold text-wa-body">テストアカウント:</div>
                        <div className="mt-2">
                            管理者: <span className="wa-nums font-mono">12345</span> /{' '}
                            <span className="wa-nums font-mono">password</span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 text-center text-xs text-wa-muted">
                    <Link href="/">
                        <ApplicationLogo className="mx-auto h-8 w-8 fill-current text-wa-accent/40" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
