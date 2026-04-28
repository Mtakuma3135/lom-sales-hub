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

確認:

```bash
./vendor/bin/sail artisan route:list
./vendor/bin/sail test
```
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


