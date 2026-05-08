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

DB初期化（「実DBの値」で画面が動くことを再現できる seed つき）:

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

ログイン（seed作成）:

- **admin**: `admin@example.com` / `password`
- **staff（例）**: `user20001@example.com` / `password`

## 開発環境（MAMP / Sail切り替え）

詳細は `[docs/dev-environments.md](docs/dev-environments.md)` を参照してください。
