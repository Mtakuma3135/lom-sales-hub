import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

/**
 * 5173 が埋まっているときは `.env` の `VITE_PORT=5174` 等に揃える（CSP の localhost 許可と一致）。
 *
 * CORS: ページのオリジン（`APP_URL` 例: http://localhost）と Vite（http://localhost:5173）は別オリジン。
 * laravel-vite-plugin は `server.origin` だけを CORS に使うと Allow-Origin がアプリと一致せずブロックされるため、
 * `server.cors.origin` に **APP_URL と Vite の origin の両方**を明示する。
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devPort = Number(env.VITE_PORT || process.env.VITE_PORT || 5173);
    const appUrl = (env.APP_URL || 'http://localhost').replace(/\/$/, '');
    const viteOrigin = `http://localhost:${devPort}`;

    const corsOrigins = Array.from(
        new Set([
            appUrl,
            viteOrigin,
            `http://127.0.0.1:${devPort}`,
            'http://localhost',
            'http://127.0.0.1',
        ]),
    );

    return {
        /*
         * IPv6 ループバックで待受。Chrome の CSP は script-src に `http://[::1]:…` を載せられない（無視される）。
         * public/hot は `server.origin`（localhost:port）に揃える。
         */
        server: {
            // Docker環境では 0.0.0.0 (すべてのインターフェース) で待機する必要があります
            host: '0.0.0.0', 
            port: devPort,
            strictPort: true,
            // origin を指定するとパスが固定されすぎる場合があるため、一旦コメントアウト推奨
            // origin: viteOrigin, 
            hmr: {
                // ブラウザ（Mac側）からは localhost でアクセスするのでここは OK
                host: 'localhost', 
                port: devPort,
            },
            cors: {
                origin: corsOrigins,
            },
        },
        plugins: [
            laravel({
                input: 'resources/js/app.tsx',
                refresh: true,
            }),
            react(),
        ],
    };
});
