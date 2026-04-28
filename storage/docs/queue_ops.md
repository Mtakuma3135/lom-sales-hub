## Queue 運用手順（Sail / Supervisor）

このドキュメントは **Discord通知などの非同期Job** を本番運用するための手順です。

### 前提

- Laravel Sail を使用（`./vendor/bin/sail`）
- `QUEUE_CONNECTION=database` を想定
- ワーカー常駐が必要（`queue:work` を止めない）

---

## 1. 起動（開発・検証）

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --force
./vendor/bin/sail artisan queue:work --queue=default --sleep=1 --tries=3
```

---

## 2. 失敗ジョブ確認・再実行

### failed_jobs を確認

```bash
./vendor/bin/sail artisan queue:failed
```

### 特定IDを再実行

```bash
./vendor/bin/sail artisan queue:retry <id>
```

### 全件再実行（注意）

```bash
./vendor/bin/sail artisan queue:retry all
```

### 失敗ジョブ削除

```bash
./vendor/bin/sail artisan queue:forget <id>
./vendor/bin/sail artisan queue:flush
```

---

## 3. Discord通知の再送（監査ログベース）

監査ログ `discord_notification_logs` の **FAILED/PENDING** を新規ログとして再投入します。

```bash
./vendor/bin/sail artisan discord:retry-failed --limit=50
```

---

## 4. Supervisor 設定例（参考）

本番では `queue:work` を Supervisor などで常駐させます。

例（概念、環境に合わせてパス等を調整）:

```ini
[program:lom-sales-hub-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work --sleep=1 --tries=3 --timeout=90
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/supervisor/queue.log
stopwaitsecs=3600
```

---

## 5. トラブルシュート

- **Discord Webhook URL未設定**: `DISCORD_WEBHOOK_URL` を設定（未設定なら Job はスキップしてログに記録）
- **failed_jobs が増える**: ネットワーク/URL/レート制限/ペイロードを確認し、再送は `discord:retry-failed` を使用

