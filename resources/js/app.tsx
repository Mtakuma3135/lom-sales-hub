import '../css/app.css';
import './bootstrap';

import AppErrorBoundary from '@/Components/AppErrorBoundary';
import ToastProvider from '@/Components/ToastProvider';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        if (!el) {
            console.error('[Inertia] Root element (#app) not found. Check @inertia in app.blade.php.');
            return;
        }

        const root = createRoot(el);

        root.render(
            <AppErrorBoundary>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </AppErrorBoundary>,
        );
    },
    progress: {
        color: '#2563eb',
    },
});
