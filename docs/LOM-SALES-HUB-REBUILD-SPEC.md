# LOM Sales Hub — ゼロから完全再現 指示書（単一ファイル版）

**用途**: Claude Code 等へ **このファイル全文を 1 回コピペ**して依頼する。  
**方針（③）**: 画面・API・DB に加え、`config/lom.php` / `.env.example` と**実装の齟齬をゼロ**にし、本番で危ない穴は**仕様としてコードで強制**する。

---

## 0. プロダクト概要

**名称**: LOM Sales Hub（UI 表記: LOM.Hub / Sales Operating System）  
**目的**: 営業オペの周知・案件 KPI・業務依頼・昼休憩・商材情報・マイページ（日次タスク・打刻）・管理者向け（ユーザー / ID・パス / CSV / Discord ログ / 監査）を **1 ポータル**に集約する社内向け Web アプリ。

---

## 1. 技術スタック（厳守）

| 領域 | 指定 |
|------|------|
| PHP | **^8.3**（composer platform 例: 8.3.14） |
| Laravel | **^13** |
| フロント | React **18**, TypeScript **5**, Vite **8**, `@vitejs/plugin-react` |
| ハイブリッド UI | **Inertia.js v2**（`inertiajs/inertia-laravel`, `@inertiajs/react`） |
| ルート名（JS） | **Ziggy**（Blade `@routes`） |
| スタイル | Tailwind **3**, `@tailwindcss/forms` |
| 認証 | **セッション（Web）** + **Laravel Sanctum**（Personal Access Token） |
| DB | **MySQL**（Sail 想定: `DB_HOST=mysql`） |
| キュー / キャッシュ / セッション | 原則 **database** |
| テスト | **Pest 4** + `pest-plugin-laravel` |
| 開発起動 | `composer dev`: `concurrently` で `php artisan serve` + `queue:listen` + `pail` + `npm run dev` |

**Composer（例）**: `inertiajs/inertia-laravel`, `laravel/sanctum`, `laravel/tinker`, `tightenco/ziggy`；dev に `laravel/breeze`, `laravel/sail`, `pestphp/pest` 等。  
**npm（例）**: `@headlessui/react`, `@inertiajs/react`, `framer-motion`, `recharts`, `laravel-vite-plugin`, `tailwindcss`, `autoprefixer`, `postcss`, `typescript`, `concurrently`。

---

## 2. ロケール・タイムゾーン

- `APP_TIMEZONE=Asia/Tokyo`
- `APP_LOCALE=ja`, `APP_FALLBACK_LOCALE=ja`, `APP_FAKER_LOCALE=ja_JP`
- **`lang/ja` と `lang/en`**: 少なくとも `auth.php`, `pagination.php`, `passwords.php`, `validation.php`

---

## 3. 環境変数・設定（`.env.example` と実装の単一の真実）

### 3.1 `config/lom.php`（必須: コードで強制）

次は **すべて `env()` から読み、ミドルウェアまたはコントローラで必ず効かせる**。`config` にだけ存在して未使用は **不合格**。

| キー | 意味 | 強制の仕方（指示） |
|------|------|-------------------|
| `registration_enabled` | `/register` の可否（本番はデフォルト false 想定） | guest の register に **Middleware**。無効時 **404 または 403**。`RegisteredUserController@store` でも二重チェック。 |
| `kot_mock_endpoint_enabled` | `POST /portal/mock/kot/punch` | **無効時は 404/403**。本番はデフォルト false。 |
| `force_https` | URL を https に | `AppServiceProvider` 等で `URL::forceScheme('https')`。 |
| `admin_allowed_ips` | 管理者 Web の IP 許可（IPv4 / CIDR カンマ区切り） | **空なら無効**。非空時、`role=admin` の **web ガード**で不一致なら **403**。`TRUSTED_PROXIES` 設定下の信頼済み IP を使う旨を README に記載。 |
| `enforce_admin_two_factor` | 管理者 TOTP 必須 | **true 時、admin が 2FA 未完了ならポータル到達前にブロック**しセットアップへ誘導。 |
| `internal_policy_version` | 社内規程バージョン | ユーザー作成・更新で **同意日時・バージョン**を保存するフローと一致。 |
| `csp_connect_src_extra` | CSP `connect-src` 追加 | 別オリジン API を叩く場合、**CSP 生成箇所**と一致。 |

**補足（実装済み・ズレ防止）: `APP_URL` と Vite の CORS**

- Laravel の画面は **`APP_URL` のオリジン**（例: `http://localhost`＝ポート 80、MAMP なら `http://localhost:8888`）。Vite は **`http://localhost:5173` 等の別オリジン**。`<script src="http://localhost:5173/@vite/client">` は **クロスオリジン**になり、Vite 側の `Access-Control-Allow-Origin` が **`APP_URL` と一致している必要**がある。
- `laravel-vite-plugin` は `server.origin` のみを CORS に使うと **`http://localhost:5173` だけ**になり、`APP_URL` が `http://localhost` のとき **CORS でブロックされ白画面**になる。対策: `vite.config.js` の `server.cors.origin` に **`APP_URL`（`loadEnv`）と Vite の `server.origin` の両方**を含める（README / `docs/dev-environments.md` と実装を一致）。
- **CSP**（`AddContentSecurityPolicyHeaders`）は `script-src` に Vite 用ホストを足す件と **独立**に扱う。CSP を通しても CORS で落ちることがある。

### 3.2 `config/services.php`

- **Discord**: `DISCORD_WEBHOOK_URL`、未設定時 **`GOOGLE_CHAT_WEBHOOK_URL` フォールバック**。
- **KOT**: `KOT_MOCK_URL`, `KOT_API_URL`, `KOT_API_TOKEN`（実装のキー名に合わせる）。
- **GAS**: `GAS_DUMMY_URL`, `GAS_AUDIT_LOG_URL`, `GAS_CREDENTIALS_URL`, `GAS_LUNCH_SCHEDULE_URL`, `GAS_SIGNING_SECRET` — 本番で URL あり・secret なしは **拒否**（`config/lom.php` の `gas_reject_unsigned_outbound`、既定は production で true）。README にも明記。

### 3.3 Sanctum 期限と API 2FA（ズレ禁止）

**どちらかに統一し、もう一方を追随**:

1. **Sanctum トークン**: リポジトリに **`config/sanctum.php` を含める**。**絶対期限**は任意（`SANCTUM_ABSOLUTE_EXPIRATION_MINUTES`、未設定なら無期限）。**無操作での失効**は `UpdateLastUsedAt` が **`SANCTUM_API_IDLE_MINUTES`（`config/lom.php` の `sanctum_api_idle_minutes`）** で処理し、README と一致させる。
2. **API 管理者 2FA**: `.env.example` に `login_ticket` + `POST /api/auth/login/two-factor` 等があるなら **そのルートとレスポンスを実装**。実装しないなら **該当コメントを削除**し「単段ログインでトークン発行」と明記。

---

## 4. `bootstrap/app.php`

- `withRouting`: `web`, `api`, `console`, **health `/up`**
- `withSchedule`: **毎分** `lunch:alert-not-started`
- `withMiddleware`: `TRUSTED_PROXIES` 非空なら `trustProxies`（`X-Forwarded-*` + AWS ELB ヘッダ）；Web に **Inertia 共有** + プリロード用 Link ヘッダを append

---

## 5. `AppServiceProvider`

- `Vite::prefetch(concurrency: 3)`（または同等）
- `lom.force_https` 時 `URL::forceScheme('https')`
- `Event::listen`: `CsvImportCompleted`, `LunchBreakScheduleUpdated`, `KotPunchRecorded` → 各 Discord キュー用リスナ

---

## 6. 認証・認可

### 6.1 Web

- ログイン: **`employee_code` + `password`**（FormRequest で validation）
- `Auth::attempt` に `employee_code` を使用
- レート制限、`auth.failed` / `auth.throttle`（日本語 lang）

### 6.2 Sanctum API

- `POST /api/auth/login`: 社員番号・パスワード、`is_active` チェック → `UserResource` + `meta.token`, `meta.token_type: Bearer`
- `auth:sanctum` + **`UpdateLastUsedAt`**: **DB の PersonalAccessToken のみ** `last_used_at` 更新；**規定時間無操作でトークン削除し 401**（分は **`SANCTUM_API_IDLE_MINUTES`** / `config/lom.php` の `sanctum_api_idle_minutes` と README で一致）

### 6.3 Policies + Gates（`AuthServiceProvider`）

- **Policy**: User, LunchBreak, Product, Notice, CsvUpload, Credential, SalesRecord, DiscordNotificationLog, AuditLog
- **Gate（TaskRequest）**:
  - `taskRequest.updateStatus`, `taskRequest.updateFields`: **admin または `to_user_id`**
  - `taskRequest.delete`, `taskRequest.restore`: **admin または `from_user_id` / `to_user_id`**

### 6.4 Inertia 共有 `auth.can`

`Gate::allows('viewAny', ...)` で: **`admin_users`, `admin_csv`, `admin_credentials`, `admin_discord_notifications`, `admin_audit_logs`**

**フロント**: `PageProps` / レイアウトの `Can` 型に **`admin_csv` を含め**、`Sales/Summary.tsx` の CSV タブ条件と一致。

---

## 7. ルーティング

### 7.1 ゲスト

- `GET /` → 認証済みなら **`route('home')`（`/portal`）**、否则 **`login`**
- Breeze: login, register, password reset, email verify, profile

### 7.2 認証後 — プレフィックス **`/portal`**

**Inertia ページ（route name は同等であること）**:

| パス（例） | name | 内容 |
|------------|------|------|
| `/portal` | `home` | ダッシュボード（周知・昼休憩・KPI・個人 KPI・タスク） |
| `/portal/lunch-breaks` | `lunch-breaks.*` | 予約 CRUD、アサイン、grid-sync、complete |
| `/portal/sales` | `sales.summary` | タブ: KPI / ranking / trend / csv（`?tab=`） |
| `/portal/sales/records` | `sales.records` | 明細 |
| `/portal/notices` | `notices.index` | 周知 |
| `/portal/notices/drafts` | `notices.drafts` | 下書き |
| `/portal/products` | `products.index` | 商材一覧 |
| `/portal/products/{id}` | `products.show` | 商材詳細 |
| `/portal/tasks` | `task-requests.*` | 依頼 CRUD + **restore** |
| `/portal/mypage` | `mypage.index` | 日次タスク、KOT、パスワード |
| `/portal/csv` | `admin.csv.upload` | CSV は KPI タブへ誘導する redirect 可 |
| `/portal/credentials` | `admin.credentials.index` | ID/パス |
| `/portal/discord-notifications` | `admin.discord-notifications.index` | Discord ログ |
| `/portal/admin/users` | `admin.users.*` | ユーザー管理 |
| `/portal/admin/audit-logs` | `admin.audit-logs.*` | 監査ログ resource index/show |

**旧 URL 互換**: `/home`, `/mypage`, `/task-requests`, `/notices`, `/products`, `/lunch-breaks`, `/sales/summary`, `/admin/users`, `/admin/csv/upload`, `/admin/credentials` 等 → **`/portal/*` へ `Route::redirect`**。

### 7.3 ポータル内 JSON API（Web セッション）

昼休憩: `status`, `start`, `stop`, `reset`  
日次タスク: status PATCH、template store/destroy  
CSV: uploads GET、upload POST  
credentials: index/store/sync-from-gas/update  
discord-notifications: index/show/retry  
departments: index  
sales records、notices（index/show/**read**）、products index/show  
notices/products の管理系 POST/PATCH/DELETE  
mypage: **POST kot/punch**  
**mock kot punch**: `kot_mock_endpoint_enabled` が true のときのみ有効

### 7.4 `routes/api.php`（Sanctum）

- `POST /api/auth/login`（＋3.3 で選んだ 2FA フロー）
- `auth:sanctum` + `UpdateLastUsedAt`: logout, me, sales records, notices, products, task-requests（CRUD+restore）, mypage、管理者 users/credentials/csv/notices/products — **Web と同じ Policy/Gate**

---

## 8. ドメインロジック（振る舞い）

| コンポーネント | 指示 |
|----------------|------|
| **LunchBreakService** | 定員・レーン・タイムテーブル帯は**コード定数**どおり。`lane` 列が無い DB では取得後に**仮想 lane**。Discord、GAS lunch sync、セッション上のアクティブ休憩。 |
| **スケジュール** | `lunch:alert-not-started` 毎分 → 未スタートユーザー **Discord アラート**（`DiscordPayloadFactory::lunchBreakNotStartedAlert` 相当の文面） |
| **TaskRequestService** | 管理者は全件、一般は from/to のみ。ホームは未完了優先ソート。作成時 Discord。 |
| **SalesService / CsvImportService** | KPI・ランキング・トレンド集計。CSV 検証・取込・`csv_uploads` / `sales_records`。完了イベント **CsvImportCompleted** → Discord。 |
| **NoticeService / NoticeResource** | 公開・下書き・ピン。**notice_reads** で既読 `POST .../read`。 |
| **KotService / SendKotPunchJob** | `KOT_API_TOKEN` 空: 監査 skipped + イベント skipped。トークンあり: King of Time API（実装のエンドポイントどおり）。**HTTP 422** は重複打刻として success 扱い + duplicate イベント。リトライ付き Job。 |
| **Discord** | `SendDiscordNotification` ジョブ、Webhook POST、リトライ、`discord_notification_logs` 更新。 |
| **GasWebhookService** | JSON POST、**HMAC `X-LOM-Signature`**、監査ログ。URL 解決ルールを README に記載。 |
| **Credential** | `value` は **レガシ互換暗号化カスト**（クラス名は実装に合わせる）。 |
| **Audit** | `AuditLoggable` で integration / event_type / status / payload / related を統一。 |

**Discord 文面パターン（`DiscordPayloadFactory` 相当）**: 休憩アサイン、休憩終了、昼休憩テーブル更新、KOT 打刻（success/duplicate/skipped）、休憩未スタートアラート、業務依頼作成、CSV 取込完了、手動テスト。

---

## 9. データベース（マイグレーション集合）

依存順で作成:

1. users（Breeze）→ `employee_code` unique, `role`, `is_active` → `department_id` → email nullable → **2FA 列**（Breeze）→ `internal_policy_*`
2. password_reset_tokens, sessions（DB セッション）
3. cache, jobs（標準）
4. personal_access_tokens
5. departments
6. products
7. notices
8. credentials
9. csv_uploads
10. sales_records（初期列 → csv_upload_id, department_id, store_name, sales_amount, customer_count, スキーマ柔軟化の alter があれば含める）
11. discord_notification_logs（parent_id）
12. audit_logs（mode 等）
13. lunch_breaks（lane 追加マイグレ）
14. lunch_break_actives（finished_at）
15. daily_task_templates, daily_task_entries
16. task_requests（**soft deletes / deleted_at**）
17. **notice_reads**

**シード**: `DepartmentSeeder`, `DummyUsersSeeder`, 管理者（例: `employee_code=12345`, `admin@example.com`, `password`, `role=admin`）、`TaskRequestSeeder`, `DailyTaskSeeder`、商材・周知・Credential・売上（多日）・CsvUpload サンプル等 — **README のログイン手順と一致**。

---

## 10. フロントエンド

- **エントリ**: `resources/js/app.tsx` — `ToastProvider` でラップ、Inertia + `import.meta.glob('./Pages/**/*.tsx')`
- **レイアウト**: `AuthenticatedLayout` — 左ナビ、`auth.can` で管理者リンク制御
- **Tailwind**（`tailwind.config.js`）: 色 `wa-ink`, `wa-card`, `wa-accent`, `wa-subtle`, `wa-body`, `wa-muted`；フォント **Inter + Noto Sans JP**；`shadow-nordic` 等
- **Blade**: `resources/views/app.blade.php` — `@routes`, `@viteReactRefresh`, `@vite(['resources/js/app.tsx', 'resources/js/Pages/'.$page['component'].'.tsx'])`, `@inertiaHead`；Bunny Fonts
- **TS パス**: `@/` → `resources/js/`
- **主要ページ**: `Home/Index`, `LunchBreaks/Index`, `Sales/Summary|Ranking|Trend|Records`, `TaskRequests/Index`, `Notices/Index`, `Notices/Drafts`, `Products/Index`, `Products/Show`, `Mypage/Index`, `Admin/Users/Index`, `Admin/Credentials/Index`, `Admin/DiscordNotifications/Index`, `Admin/AuditLogs/*`, `Auth/*`, `Profile/Edit`, `Error`

**部品例**: `BreakRunner`, `LiveBreakTimer`, `CsvUploadPanel`, `NoticeFeedItem`, `ModernTable`, Recharts, framer-motion。

---

## 11. README に書くこと

- Sail / MAMP の起動、`migrate:fresh --seed`、**seed ログイン**（admin / staff 例）
- **キュー worker** が必要な機能（Discord/KOT ジョブ等）
- `TRUSTED_PROXIES` / `FORCE_HTTPS` / 本番チェックリスト
- `composer dev` の使い方

---

## 12. 完了定義（DoD）

- [ ] `php artisan test` グリーン
- [ ] `migrate:fresh --seed` 後、README のアカウントで主要画面がデータ付きで表示
- [ ] **§3.1 の各 `lom.*` がコードで強制**されている（テストで可）
- [ ] **§3.3** の Sanctum / 2FA 記述と実装が一致（片方削除の場合は README に理由）
- [ ] Discord Webhook 未設定でも **未捕捉例外で落ちない**
- [ ] キュー前提機能は README に明記

---

## 13. 付録 A — 完全実装向け（仕様書補足・コード準拠）

本付録は **現行リポジトリの実装**を正として、別実装・再生成時に迷いやすい点を固定する。

### 13.1 カテゴリ別サマリ

| カテゴリ | 本仕様書（§1〜12）の状態 | 本付録で固定する内容 |
|----------|-------------------------|----------------------|
| DB / データ構造 | 概要のみ | `sales_records` 全カラム、CSV ヘッダ別名、暗号化・昼休憩定数 |
| 外部連携 | 概要のみ | KOT URL/ボディ、GAS イベント別 JSON、Discord はプレーン `content` のみ |
| UI / フロント | 画面一覧のみ | 売上チャート種別・軸、バリデーション表示の慣習 |
| 認証フロー | 「Sanctum/2FA は統一」と記載 | **API: 単段ログイン**（`POST /api/auth/login`）。**Web 管理者**: `enforce_admin_two_factor` 時に **`/portal/two-factor/setup`** で TOTP（`pragmarx/google2fa`）。Sanctum は **`config/sanctum.php` + アイドル失効（`SANCTUM_API_IDLE_MINUTES`）** |
| 運用・環境 | README レベル | 本番構成・IP 帯・secret 生成は **インフラ/運用の決定事項**として記載 |

### 13.2 `sales_records` — 全カラムと CSV マッピング

**テーブル列（マイグレーション合成）**

| カラム | 型・制約 | 備考 |
|--------|-----------|------|
| `id` | bigint PK | |
| `csv_upload_id` | nullable FK → `csv_uploads` | 取込行 |
| `csv_row_number` | unsigned int nullable | 元 CSV の行番号（ヘッダ=1 想定の次行から） |
| `department_id` | nullable FK → `departments` | アップロード実行者の部署を入れる実装 |
| `staff_name` | string | 必須（CSV から） |
| `store_name` | string（デフォルト空可） | |
| `sales_amount` | unsigned int | |
| `customer_count` | unsigned int | |
| `status` | enum `ok` / `ng` | `inferCsvStatus` で正規化 |
| `date` | date | `YYYY-MM-DD` |
| `raw` | json nullable | **ヘッダ名 → セル値** の連想配列（将来列変更のバックアップ） |
| `product_name` | string nullable | |
| `contract_type` | string nullable | |
| `channel` | string nullable | |
| `result` | string nullable | |
| `created_at`, `updated_at` | timestamp | |

**CSV: 列の順序は不問（ヘッダ名でマップ）**。`CsvImportService::buildHeaderMap` 後、以下の **いずれかの別名** で列を解決する（実装参照）。

| 論理列 | 受け入れるヘッダ例（抜粋） |
|--------|------------------------------|
| 日付 | `date`, `日付` |
| 担当者 | `staff_name`, `担当者`, `スタッフ` |
| 店舗 | `store_name`, `店舗名`, `店名` |
| 売上額 | `sales_amount`, `売上額`, `売上` |ƒ
| 客数 | `customer_count`, `客数` |
| 商材 | `product_name`, `商材`, `商品` |
| 契約種別 | `contract_type`, `契約種別` |
| チャネル | `channel`, `流入`, `チャネル` |
| ステータス | `status`, `ステータス`, `判定`, `合否` |
| 結果 | `result`, `結果`, `成約` |

**バリデーション**: 日付が `^\d{4}-\d{2}-\d{2}$` でない行・担当者空行は **errors に追加してスキップ**（他行は取込継続）。

### 13.3 `credentials.value` — 「レガシ互換暗号化」仕様

クラス: `App\Casts\LegacyCompatibleEncryptedString`

- **書き込み（set）**: **`null` は DB に `null` を書く**（列が NOT NULL の場合はマイグレーションで nullable にするか、§14 実装メモのとおり **空文字を暗号化して保存**する運用に合わせる。現リポジトリの `credentials.value` は NOT NULL 対策で **空も `Crypt::encryptString('')` 相当で保存**する実装がある）。
- **それ以外**は **`Crypt::encryptString()`**（Laravel の `encrypted` キャストと同等のペイロード形式）。
- **読み取り（get）**: `Crypt::decryptString()` を試す。**失敗したら生文字列をそのまま返す**（過去の平文行を落とさない）。
- アプリキー `APP_KEY` を変えると復号不能になる点は README で注意。

### 13.4 昼休憩 `LunchBreakService` — 定数（コード正）

| 定数 | 値 | 意味 |
|------|-----|------|
| `CAPACITY_PER_SLOT` | **5** | 同一開始・終了スロットの最大人数 |
| `LANES` | **5** | レーン数（DB `lane` 列または仮想レーン） |
| `TIMETABLE_DAY_START` | **`11:00`** | グリッド表示開始 |
| `TIMETABLE_DAY_END` | **`15:00`** | グリッド終端（この時刻の直前まで行生成） |
| グリッド行刻み | **30 分** | `timetableRowMetas`: 11:00–11:30, …, 14:30–15:00 の行メタ |
| 予約の開始時刻ルール | **`HH:00` または `HH:30` のみ** | `assertTimeSlotRule` |
| 1 予約の長さ | **60 分** | `store` / `assign` 等で `addMinutes(60)`（アクティブ休憩の `duration_minutes` 既定も 60） |

**DB制約**: `lunch_breaks` は `user_id` + `date` **unique**（1 日 1 予約）。

### 13.5 外部連携 — KOT

**実 API（`SendKotPunchJob`）**

- **メソッド**: `POST`
- **URL**: `https://api.kingtime.jp/v1/daily-workings/timerecord`（コード固定）
- **認証**: `Authorization: Bearer {KOT_API_TOKEN}`（`config('services.kot.api_token')`）
- **JSON ボディ**（キー名はそのまま）:
  - `employeeCode`: ユーザーの `employee_code`
  - `workingDate`: `Y-m-d`（打刻日）
  - `time`: `H:i`（打刻時刻）
- **422**: **重複打刻**として成功扱い・監査 success・Discord は duplicate メッセージ。
- **トークン未設定**: 実 API は呼ばず、監査 `skipped`、イベント `skipped`。

**モック（`KotService::simulatePunch`）**: `KOT_MOCK_URL` が空なら **`route('portal.mock.kot.punch')`** に POST（`kind`, `at` 等 — モック側は緩い）。本番でのモック有効は `lom.kot_mock_endpoint_enabled` で制御する仕様（§3.1）。

### 13.6 外部連携 — GAS（URL 用途・ペイロード概要）

すべて **`GasWebhookService::post` / `sendSignedPost`** 経由。共通: ボディに可能なら `timestamp`（unix）, `sent_at`（ISO8601）。**署名**: `GAS_SIGNING_SECRET` が非空のとき  
`X-LOM-Timestamp`, `X-LOM-Nonce`（UUID）, `X-LOM-Signature` = `hash_hmac('sha256', "{timestamp}.{nonce}.{raw_json_body}", secret)`, `X-LOM-Signature-Alg: hmac-sha256`、かつ URL に `?signature=urlencode(secret)` を付与しうる。

**本番の拒否**: `config/lom.gas_reject_unsigned_outbound` が true（既定は `APP_ENV=production`）のとき、解決後の GAS URL が非空なのに **`GAS_SIGNING_SECRET` が空**なら **HTTP を送らず失敗**（監査のみ）。`GAS_REJECT_UNSIGNED_OUTBOUND` で上書き可。

| 用途 | 主に使う env の URL | `event` または audit event | ボディの要点 |
|------|---------------------|---------------------------|--------------|
| CSV 取込サマリ転送 | `GAS_DUMMY_URL`（`SendCsvToGasJob`） | audit: `csv_upload_summary` | `upload_id`, `filename`, `success_count`, `failed_count`, `sent_at`, `timestamp` |
| 昼休憩表同期 | `GAS_LUNCH_SCHEDULE_URL` なければ dummy | `lunch_schedule_sync` | `date`, `rows`, `lanes`（`timetableGrid` の結果） |
| Credential Pull | `GAS_CREDENTIALS_URL` なければ dummy | **`credentials_pull`** | GAS 側が返す JSON の `rows` / `credentials` / `data` 配列を解釈。要素は `service_name` or `label`, `login_id`, `password` or `value`, `is_password`, `visible` or `visible_on_credentials_page` |
| Credential Push | 同上 | **`credentials_update`** | `credential_id`, `service_name`, `login_id`, `password`（平文のまま送る — **HTTPS 前提**）, `is_password`, `timestamp`, `sent_at` |
| 手動 Discord テスト等 | `GAS_AUDIT_LOG_URL` 優先 | 呼び出し元依存 | `routes/console.php` の `discord:test` 参照 |

**GAS 側の契約**: 上記以外の細かいスキーマは **Google Apps Script の実装がソースオブトゥルース**。Laravel 側は上記キーを維持すること。

### 13.7 外部連携 — Discord

- Webhook へ POST する JSON は **`discord_notification_logs.payload`** に保存される形が正。
- **`DiscordPayloadFactory` はすべて `{ "content": "<プレーンテキスト>" }` のみ**。Embed・色・username override は **現行未使用**（追加するなら別仕様化）。

### 13.8 UI / フロント — KPI・案件のグラフ（`Sales/Summary.tsx`）

- **ライブラリ**: Recharts
- **チャート種類**: **`ComposedChart`**（複合）
- **X 軸**: `dataKey="label"`（週次ラベル — バックエンドが供する `trend[].label`）
- **Y 軸左（`yAxisId="left"`）**: **件数**（整数のみ `allowDecimals: false`）。系列: **`Line` の `ok`**, **`Line` の `ng`**
- **Y 軸右（`yAxisId="right"`）**: **成約率 `rate`**（`domain={[0, 100]}`, `tickFormatter` で `%`）
- **計算式（UI 文言）**: 成約率 = OK ÷ (OK + NG) × 100、分母 0 は 0 扱い

**バリデーションエラー表示の慣習**: Breeze/Inertia 流儀 — **FormRequest** の `errors` をページ props 経由で受け、フィールド下に **`InputError`** 相当、グローバルは **フラッシュ / toast**（`ToastProvider`）を既存に合わせる。API は **422 JSON** + `message` / `errors` オブジェクトで揃えるとフロントが楽。

### 13.9 認証フロー — Sanctum と 2FA（現行の事実と推奨）

**事実（本リポジトリ）**

- **API ログイン**: `POST /api/auth/login` のみ — **TOTP 二段階なし**でトークン発行（`AuthService::login`）。
- **`pragmarx/google2fa`**: **Web 管理者の TOTP 登録**（`/portal/two-factor/setup`）で使用。API ログインでは未使用。
- **User**: `two_factor_secret`（encrypted cast）, `two_factor_recovery_hashes`, `two_factor_confirmed_at`, `hasTwoFactorEnabled()` は **モデルに存在**。
- **`config/lom.enforce_admin_two_factor`**: **ミドルウェア配線済み**（未完了時はセットアップへリダイレクト）。API 管理者の TOTP は **未実装**（`.env.example` の login_ticket 記述は将来用／削除方針は §3.3 に従う）。
- **Sanctum**: **`config/sanctum.php` をリポジトリに含む**。無操作失効は `SANCTUM_API_IDLE_MINUTES`（`UpdateLastUsedAt`）。

**再実装時の決め方（どちらかに統一）**

1. **シンプル路線**: API/Web とも **2FA なし**。`.env.example` から `login_ticket` / `two-factor` の記述を削除。`pragmarx/google2fa` を外してもよい。
2. **本番路線**: Breeze の Web 2FA + **`enforce_admin_two_factor`** をミドルウェアで強制。API 管理者は **`login_ticket` + TOTP 検証**でトークン発行。TOTP 実装に **`pragmarx/google2fa`** を使用してよい。

### 13.10 運用・環境（リポジトリ外・決定が必要なもの）

| 項目 | 仕様書に書けること |
|------|-------------------|
| 本番サーバー構成 | **非固定**。Sail は開発用。Render 等は `docs/render-deployment.md` を参照し、**実環境の URL・DB・ワーカー台数は運用が決定**する。 |
| `admin_allowed_ips` の具体値 | **会社の出口 IP / VPN CIDR** を運用が登録。リポジトリには **例とプレースホルダのみ**（実 IP をコミットしない）。 |
| `GAS_SIGNING_SECRET` | **32byte 以上のランダム**推奨（例: `openssl rand -hex 32`）。**GAS の `doPost` 側と Laravel の `.env` で同一文字列**を共有。ローテ時は両方同時更新。 |

---

## 14. 実装メモ（2026-05 改修・本リポジトリ反映済み）

以下は **指示書の §7〜13 の範囲を変えず**、運用上の要望に合わせてコードへ取り込んだ差分の要約である（詳細は Git 履歴を正とする）。

| 領域 | 内容 |
|------|------|
| **共有アラート** | `HandleInertiaRequests` が `portalAlerts`（`lunch_not_started_count`, `unread_notices_count`, `server_time`）を全 Inertia ページへ共有。`AuthenticatedLayout` のヘッダーに **昼休憩 未開始 N 名**・**未読周知 N 件** のバッジ（各リンク付き）と **現在の時刻**（サーバー時刻オフセット付き）を表示。 |
| **昼休憩タイマー** | DB `lunch_break_actives.paused_at` を追加。**ストップ**は一時停止（担当者・枠は維持）、**リセット**は同一担当で枠の計測のみ初期化。ホーム・昼休憩ページに **現在時刻** を強調表示。 |
| **ID / パス（Credential）** | 新規行で `value` が空でも保存できるよう、`LegacyCompatibleEncryptedString` の **set が null を書かず**空文字を暗号化して保存（`credentials.value` NOT NULL 対策）。GAS 取り込み失敗時もローカル行は残る。 |
| **業務依頼** | 作成時の **本文（body）は任意**（`TaskRequestStoreRequest` / API 版も nullable）。 |
| **ホーム・タスク欄** | 業務依頼は **関係する依頼を全ステータス表示**（最大 50 件・未完了を上にソート）。**責タスク（当日）** を `dailyTasks` props で併記。 |
| **Discord 通知ログ** | UI を **外部連携の監査ログ**（`Admin/AuditLogs/Index`）に寄せ、`NordicCard`・テーブル密度・`StatusBadge` / `JsonCodeBlock` を使用。 |
| **商材詳細（管理者）** | **META カード内**にトークスクリプト・マニュアル URL をまとめ、**保存ボタンをカード下部**に配置（一括 PATCH）。 |
| **ナビ** | サイドバーはアイコン付きフラット一覧。売上サマリ表記は **KPI・案件** に統一（セクション見出しはユーザー要望により省略済みの版あり）。 |
| **その他** | マイページのショートカット削除、ユーザー無効化・Discord フィルタ文言等。 |

---

## 15. Claude Code 依頼文（このブロックもコピペ可）

```
LOM Sales Hub をゼロから実装する。スタック: Laravel13, PHP8.3, Inertia2+React18+TS, Vite8, Tailwind3, MySQL, Sanctum, Ziggy, Pest。

【最優先】config/lom.php の registration_enabled, kot_mock_endpoint_enabled, admin_allowed_ips, enforce_admin_two_factor をミドルウェアまたはコントローラで必ず強制する。config のみで未使用は不合格。

【整合】.env.example の `SANCTUM_API_IDLE_MINUTES` / `config/sanctum.php` と API 2FA（login_ticket / two-factor）の記述は、実装するかコメントを削除するかのどちらかに統一し、README に真実を1行で書く。

【機能】このドキュメントの §7〜§10 を欠落なく実装。イベント・ジョブ・Discord・GAS・KOT・昼休憩スケジュール・監査ログの流れを維持。

【フロント】HandleInertiaRequests の auth.can と PageProps / AuthenticatedLayout / Sales/Summary の admin_csv を型と挙動で一致。

【詳細仕様】DB 列・CSV ヘッダ・昼休憩定数・KOT/GAS/Discord の契約は **§13 付録 A** を正とする。

【完了】§12 DoD をすべて満たす。
```

---

## 16. 1 ファイルに格納する方法

1. **リポジトリ内**: 本ドキュメントを `docs/LOM-SALES-HUB-REBUILD-SPEC.md` として保存（本ファイル）。  
2. **依頼時**: エディタでこのファイルを開き **全選択 → コピー → Claude Code に 1 回ペースト**（**§13 付録 A** まで含める）。  
3. **別の置き場**: 同じ内容を Notion / Google Doc / gist に貼ってもよい（**単一ファイル全文**が原則）。

---

**ファイルパス**: `docs/LOM-SALES-HUB-REBUILD-SPEC.md`
