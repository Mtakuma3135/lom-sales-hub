/** 右上トースト（ToastProvider が window イベントを購読） */
export function showAppToast(message: string): void {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message } }));
}
