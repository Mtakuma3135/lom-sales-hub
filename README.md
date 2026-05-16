# LOM.Hub — "あの情報、どこだっけ？" をゼロにする、営業チームの社内ポータル

## はじめに

**LOM.Hub** は、営業チームが日々使う情報・操作をすべて 1 つの画面に集約した社内 Web ポータルです。

KPI の確認、昼休憩の予約、業務依頼、周知の閲覧、商材情報の参照——これらをバラバラのツールを行き来せず、**`/portal` にアクセスするだけで完結**させることを目指して開発しました。

Laravel 13 + React（Inertia.js）によるフルスタック構成で、Discord や King of Time（勤怠管理）との外部連携も実装しています。

---
## 開発背景

チームに入ったばかりのころ、毎朝の情報収集だけで時間を消費していることに気づきました。

- 今日の周知は **Discord** を確認
- 昼休憩の空き状況は **スプレッドシート** を開く
- 業務依頼は **チャット** を探す
- 勤怠打刻は **KOT** に別ログイン

ツールをまたぐたびに集中が途切れ、「どこに何があるか」を把握するだけで消耗していました。

**「営業本来の仕事に集中できる環境を、自分で作ろう」** と思い立ったのが開発のきっかけです。チームの運用フローを自分なりに整理し、ゼロから設計・実装しました。使ってもらえるものを作りたかったので、実際にチームの声を聞きながら機能を積み上げています。

---

## サービス概要

**LOM.Hub（LOM Sales Hub）** は、営業チームが毎日使う情報・操作を一箇所にまとめた社内 Web ポータルです。

- 周知の確認・KPI の閲覧・昼休憩の管理・業務依頼・商材情報参照をすべて `/portal` から完結
- Laravel + Inertia.js（React）によるハイブリッド構成で、SPA のような快適な操作感を実現
- Discord / KOT（King of Time）と連携し、打刻・通知を自動化

---
## デモ操作動画
https://github.com/user-attachments/assets/7baed61c-ec19-41d4-be1b-c0c4e56f100f

---

## 使用技術

### バックエンド
| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| PHP | 8.3 | 型安全性と Fiber サポートが充実した最新安定版 |
| Laravel | 13 | Service 層・Policy・Gate によるクリーンな責務分離が実現できるため |
| Laravel Sanctum | - | Web セッションと API トークンを統一的に扱えるため |
| Pest | 4 | Laravel との統合が優れ、テストが記述しやすいため |

### フロントエンド
| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| React | 18 | コンポーネント単位の状態管理と再利用性の高さ |
| TypeScript | 5 | 実行時エラーをコンパイル時に検出し、保守性を高めるため |
| Inertia.js | v2 | SPA の快適さを保ちながら Laravel のルーティング・認証をそのまま使えるため |
| Tailwind CSS | 3 | ユーティリティファーストで一貫したデザインを効率よく実装できるため |
| Vite | 8 | HMR が高速で開発体験が向上するため |

### インフラ・外部連携
| 技術・サービス | 用途 |
|---------------|------|
| Render（Docker） | 本番ホスティング・自動デプロイ |
| PostgreSQL | 本番 DB（Render 提供） |
| MySQL | ローカル開発 DB（MAMP） |
| GitHub Actions | CI（ビルド・テスト自動実行） |
| Discord Webhook | 各種イベント通知の自動送信 |
| King of Time API | 打刻連携（KOT） |
| Google Apps Script | CSV データ連携・監査ログ |

---

## 主な機能

### ダッシュボード（ホーム）
- 未読周知・本日の昼休憩状況・個人 KPI・未完了業務依頼をワンビューで確認

### 昼休憩管理
- タイムテーブル形式でレーン（席）ごとに予約・アサイン
- **リアルタイムタイマー**: 開始・一時停止・リセット操作とともに残り時間をリアルタイム表示
- 休憩完了時に Discord へ自動通知

### 売上 KPI・CSV 取込
- 個人・チーム別 KPI / ランキング / トレンドグラフ（Recharts）
- CSV アップロードで売上データを一括取込、取込完了を Discord 通知

### 業務依頼（TaskRequest）
- 依頼の作成・進捗ステータス管理・ソフトデリート＆復元
- 依頼受信時に宛先ユーザーへ Discord 通知

### 周知管理（Notice）
- ピン留め・下書き保存・既読管理

### 商材情報
- 商材一覧・詳細ページ（管理者が CRUD）

### マイページ
- 日次タスク（テンプレート登録・チェック）
- KOT 打刻（API 連携 or モック）
- Discord 個人 Webhook・KOT トークンの連携設定

### 管理者機能
- ユーザー管理（作成・編集・有効/無効）
- ID/パス管理（暗号化保存・GAS 同期）
- Discord 通知ログ閲覧・リトライ
- 監査ログ（操作履歴）

---

## こだわったポイント

### 1. Service 層による責務分離（Fat Controller / Fat Component の防止）
Controller は HTTP の入出力のみを担当し、ビジネスロジックはすべて `app/Services/` に集約しています。
また Inertia.js の特性を活かし、React コンポーネントは表示のみに専念させ、ロジックを混在させない設計にしています。

### 2. Inertia.js によるハイブリッド UI
フルページリロードなしの SPA 的な操作感を、Laravel のルーティング・認証・バリデーションをそのまま使いながら実現しています。
API を別途設計する必要がなく、開発速度と保守性を両立できました。

### 3. Discord 通知の設計
全体 Webhook（環境変数）と個人 Webhook（ユーザー設定）を `DiscordWebhookResolver` クラスで一元管理し、  
「個人 → 全体」の優先順位で送信先を自動解決しています。
送信履歴は `discord_notification_logs` テーブルに記録し、失敗時は管理画面からリトライ可能です。

### 4. リアルタイムタイマーの実装
昼休憩タイマーは WebSocket を使わず、セッションと DB の状態から経過時間を計算して表示しています。
一時停止した期間を `paused_at` で記録し、再開時に `started_at` を補正することで正確な残り時間を実現しました。

---

## ER 図

<!-- ![ER図](docs/screenshots/er.png) -->

主要テーブルの関係:

```
users
  ├─< lunch_breaks（昼休憩予約）
  ├─< lunch_break_actives（タイマー実績）
  ├─< task_requests（業務依頼 from/to）
  ├─< sales_records（売上明細）
  ├─< notice_reads（既読管理）
  ├─< daily_task_templates（日次タスクテンプレート）
  └─< discord_notification_logs（通知ログ）

csv_uploads
  └─< sales_records

notices（周知）
products（商材）
credentials（ID/パス 暗号化）
audit_logs（監査ログ）
departments（部署）
```

---

## 詰まったポイントと解決策

### CORS × CSP × Vite の三重構造
ローカル開発で Laravel（`localhost:8888`）と Vite（`localhost:5173`）がクロスオリジンになり、CORS エラーと Content-Security-Policy が同時に発生しました。

`vite.config.js` の `server.cors.origin` に `APP_URL` と Vite の URL の両方を含め、CSP ミドルウェアにも Vite ホストを追加することで解消しました。CORS だけ直しても CSP で弾かれる、という順番を理解するまでに時間がかかりました。

### 昼休憩タイマーの一時停止補正
一時停止中の経過時間が再開後も加算され続けるバグがありました。  
`paused_at` の記録タイミングと `started_at` の補正式（一時停止期間分だけ `started_at` を後ろにずらす）を整理することで解決しました。

---

## 環境構築（ローカル）

詳細は [`docs/dev-environments.md`](docs/dev-environments.md) を参照してください。

```bash
git clone https://github.com/Mtakuma3135/lom-sales-hub.git
cd lom-sales-hub
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate --seed
composer dev   # サーバー・キュー・Vite を同時起動
```

ログイン（シード後）:
- **管理者**: `admin@example.com` / `password`

---

## テスト

```bash
php artisan test
```

GitHub Actions により、プッシュ・PR 時に自動でビルドとテストが実行されます。

---

## 本番環境（デモ）

🔗 **https://lom-sales-hub.onrender.com**

ログイン情報（デモ用管理者アカウント）:
- **社員番号**: `12345`
- **パスワード**: `password`

---

> **⚠️ 無料プランのため、以下の点にご注意ください**
>
> **初回アクセス・長時間放置後は起動に時間がかかります**
> Render の無料プランはアクセスがない時間が続くとサーバーが自動的にスリープします。
> アクセス後、画面が表示されるまで **30〜60 秒程度** かかる場合があります。
> 読み込み中のまましばらくお待ちいただくと、正常に表示されます。
>
> **長時間操作しないとセッションが切れることがあります**
> しばらく放置した後に操作するとログイン画面に戻る場合があります。
> その際は再度ログインしてください。
>
> **データはリセットされる場合があります**
> デモ環境のデータは予告なくリセットされることがあります。

`feature/miisako` ブランチへのプッシュで Render への自動デプロイが走ります。
