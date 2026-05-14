# LOM Sales Hub（社内ポータル）

Laravel + Inertia（React）で構築された、営業オペレーション向け社内ポータルです。

## 推奨の動かし方（Sail / Docker）

- **URL**: `http://localhost`
- **DB**: Docker MySQL（`DB_HOST=mysql`）

起動:

```bash
./vendor/bin/sail up -d
npm install
npm run dev
```

DB初期化（seed つきで主要画面にデータが載る状態を再現）:

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

ログイン（seed 作成例）:

- **admin**: `admin@example.com` / `password`
- **staff（例）**: `user20001@example.com` / `password`

## `composer dev`（ローカル一括起動）

`composer.json` の `dev` スクリプトで、**HTTP サーバー・キュー worker・ログ（pail）・Vite** を同時に起動します。

```bash
composer dev
```

Discord 通知・KOT 打刻ジョブ・CSV 取込後の GAS 転送など、**キュー worker が動いていないと完了しない処理**があります。上記 `composer dev` か、別ターミナルで `php artisan queue:listen` を常時立ててください。

## 本番・セキュリティ運用メモ（指示書 §11 相当）

- **`TRUSTED_PROXIES`**: リバースプロキシ背後では必須。`X-Forwarded-Proto` 等を信頼する CIDR / IP をカンマ区切りで設定（`config/lom.php` の `admin_allowed_ips` と併用）。
- **`FORCE_HTTPS`**: 本番では `true` 推奨（TLS 終端と整合）。
- **`ADMIN_ALLOWED_IPS`**: 非空時、**管理者の Web セッション**は許可 IP のみ（一般ユーザーは対象外）。
- **`ENFORCE_ADMIN_2FA`**: `true` のとき管理者は `/portal/two-factor/setup` で TOTP を登録するまでポータルに入れません（API の Sanctum は別経路・現状は単段ログイン。詳細は `docs/LOM-SALES-HUB-REBUILD-SPEC.md` §3.3 / 付録 13.9）。
- **`SANCTUM_API_IDLE_MINUTES`**: API の Personal Access Token を「最終利用から何分無操作で失効」させるか（`UpdateLastUsedAt`）。`config/sanctum.php` の絶対期限（`SANCTUM_ABSOLUTE_EXPIRATION_MINUTES`）とは別。
- **（移行）** 旧 `.env` の `SANCTUM_TOKEN_EXPIRATION_MINUTES` は未使用。**無操作失効は `SANCTUM_API_IDLE_MINUTES` のみ**が実効です。
- **GAS**: `APP_ENV=production` では、GAS 向け URL が設定されているのに **`GAS_SIGNING_SECRET` が空**のとき **送信を拒否**します（`config/lom.php` の `gas_reject_unsigned_outbound`）。開発のみ緩めたい場合は `.env.example` の `GAS_REJECT_UNSIGNED_OUTBOUND` コメント参照。

## 開発環境（MAMP / Sail 切り替え）

詳細は [`docs/dev-environments.md`](docs/dev-environments.md) を参照してください。

## フロント（Vite）と CSP

`APP_DEBUG=true` のとき、ブラウザには **Content-Security-Policy** が付きます。`npm run dev` で **別オリジンの Vite** を読むため、次を守ると詰まりません。

- **`vite.config.js`**: 開発サーバーは `::1` で待受、`public/hot` は `http://localhost:ポート`（`server.origin`）。Chromium は CSP に `http://[::1]:…` を書けないため、この形に揃えています。**`APP_URL`（例 `http://localhost`）と Vite は別オリジン**のため、`server.cors.origin` に **`APP_URL` と Vite の URL の両方**を含めています（CORS だけで白画面になるのを防ぐ）。
- **`VITE_PORT`**: 既定 5173。ポートが埋まっているときは `.env` の `VITE_PORT`（例: `5174`）を実際の Vite に合わせる（`.env.example` 参照）。
- **`public/hot`**: URL が古いまま残ると白画面や読み込み失敗の原因になることがあります。`npm run dev` をやり直す前に削除して問題ありません。

詳細は [`docs/dev-environments.md`](docs/dev-environments.md) の「Content Security Policy と Vite」を参照してください。

## CI（GitHub Actions）

プッシュ・PR 時に **`npm run build`** と **`php artisan test`** が走ります（`.github/workflows/ci.yml`）。

## テスト

```bash
php artisan test
```
