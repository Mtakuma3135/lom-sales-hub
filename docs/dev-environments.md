## 開発環境の切り替え（MAMP / Sail）

このプロジェクトは **MAMP** と **Laravel Sail（Docker）** の両方で動かせます。
ただし `.env` のDB設定が混ざると 500 になりやすいので、用途別に分けて運用します。

### Sail（推奨 / `http://localhost`）

- **URL**: `http://localhost`
- **DB**: Dockerの `mysql` サービス（`.env` の `DB_HOST=mysql`）

起動:

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan optimize:clear
```

DB初期化（seed込み）:

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

ログイン（seed作成）:

- admin: `admin@example.com` / `password`
- staff（例）: `user20001@example.com` / `password`

確認:

```bash
./vendor/bin/sail artisan route:list
./vendor/bin/sail test
```

### KOT（打刻）の確認

- ポータルUIの打刻ボタンは **web-session** の `POST /portal/api/mypage/kot/punch` を叩きます。
- 処理結果は **監査ログ**（`/portal/admin/audit-logs`）に記録されます（integration=`kot`）。
- `KOT_API_TOKEN` 未設定の local 開発では、監査ログの `meta.mode=mock` が付与される想定です（実通信とは区別）。
### MAMP（`http://localhost:8888`）

- **URL**: `http://localhost:8888`
- **DB**: ローカルMySQL（例: `127.0.0.1`）

MAMPで動かすときは、`.env.mamp` を使う想定です。

切り替え（例）:

```bash
cp .env.mamp .env
php artisan optimize:clear
```

※ MAMP運用時は、DB/セッション/キャッシュを **file/sync** に寄せてあります（`.env.mamp` 参照）。

### Content Security Policy と Vite

`bootstrap/app.php` で **全 Web 応答**に `Content-Security-Policy` が付きます（`AddContentSecurityPolicyHeaders`）。

| 状況 | 挙動 |
|------|------|
| `APP_DEBUG=true` | `script-src` に Vite 用の `http://127.0.0.1` / `http://localhost`（5173・5174）と `'unsafe-eval'` が追加される。`connect-src` に対応する `ws://` も追加。 |
| `APP_DEBUG=false` | 上記の開発用オリジンと `'unsafe-eval'` は **付かない**（本番向け）。 |
| 別ホストの API を叩く | `.env` の `CSP_CONNECT_SRC_EXTRA`（カンマ区切りのオリジン）。 |
| 既定以外の Vite ポート | `VITE_PORT` を `.env` に書き、`vite.config.js` の `strictPort: true` と一致させる。追加が必要なら `CSP_VITE_DEV_EXTRA`。 |

**Chromium の制約**: CSP のソースリストに **`http://[::1]:ポート` は無効**として無視される。そのため Vite の待受は IPv6（`::1`）でも、**ブラウザが読み込む URL は `http://localhost:…`** に揃える（`vite.config.js` の `server.origin`）。

**CORS（白画面の典型）**: ページのオリジンが `APP_URL`（例 `http://localhost`）で Vite が `http://localhost:5173` のとき、**別オリジン**のため Vite の応答に **`Access-Control-Allow-Origin: http://localhost`（実際のページ元）** が含まれる必要がある。`server.origin` だけを CORS に使うと `http://localhost:5173` だけになり **Console に CORS 違反**が出る。`vite.config.js` の `server.cors.origin` に `APP_URL` と Vite の origin の両方を載せる。

**トラブルシュート**

1. 画面が真っ白・Console に CSP 違反 → `public/hot` を削除して `npm run dev` を再起動。  
2. ポート競合 → `VITE_PORT` を変更し、CSP に載る `localhost:そのポート` と一致させる（5173/5174 は既定で許可済み）。  
3. 本番では **`npm run build`** の静的ファイルのみを読み、Vite サーバーは動かさない。


