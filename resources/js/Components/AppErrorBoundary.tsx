import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { error: Error | null };

export default class AppErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[AppErrorBoundary]', error, info.componentStack);
    }

    render(): ReactNode {
        const { error } = this.state;
        if (!error) {
            return this.props.children;
        }

        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-wa-ink p-6 text-wa-body wa-body-track">
                <div className="max-w-md rounded-sm border border-wa-accent/25 bg-wa-card px-8 py-10 shadow-lg shadow-black/30">
                    <h1 className="text-lg font-semibold tracking-tight text-wa-body">画面の読み込みに失敗しました</h1>
                    <p className="mt-3 text-sm text-wa-muted">
                        一時的な不具合の可能性があります。ページを再読み込みするか、しばらくしてから再度お試しください。
                    </p>
                    {import.meta.env.DEV ? (
                        <pre className="mt-4 max-h-40 overflow-auto rounded border border-wa-accent/15 bg-wa-ink p-3 text-xs text-wa-muted">
                            {error.message}
                        </pre>
                    ) : null}
                    <button
                        type="button"
                        className="mt-6 w-full rounded-xl border border-wa-accent/30 bg-wa-ink px-4 py-3 text-sm font-semibold text-wa-body transition hover:border-wa-accent/50"
                        onClick={() => window.location.reload()}
                    >
                        再読み込み
                    </button>
                </div>
            </div>
        );
    }
}
