# Instruction

このドキュメントは、LOM Sales Hub の運用・開発手順（セットアップ、規約、ルーティング、よくある落とし穴）をまとめたものです。

## 0. 前提
バックエンド：Laravel
フロントエンド：React + TypeScript
認証：Laravel Sanctum（SPA）
DB：MySQL

## 1. 実装ルール（最重要）
・1回の生成で「1機能のみ」実装すること
・Controller / Service / Request / Resource を必ず分離すること
・Controllerにロジックを書かない
・バリデーションは FormRequest に書く
・ビジネスロジックは Service に書く
・レスポンスは Resource で統一する
・DB操作は Service 内のみで行う
・命名規則を厳守する

## 2. ディレクトリ構成
App\Http\Controllers\Api
App\Http\Controllers\Api\Admin
App\Services
App\Http\Requests
App\Http\Resources
App\Models

## 3. 命名規則
Controller：xxxController
Service：xxxService
Request：xxxRequest
Resource：xxxResource

DB：スネークケース
JS：キャメルケース

## 4. Controllerメソッド
index：一覧取得
store：作成
show：詳細
update：更新
destroy：削除

## 5. ルーティング
Route::prefix('auth')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::get('/me', [MeController::class, 'me']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/sales/summary', [SalesController::class, 'summary']);
    Route::get('/sales/ranking', [SalesController::class, 'ranking']);
    Route::get('/sales/trend', [SalesController::class, 'trend']);

    Route::get('/lunch-breaks', [LunchBreakController::class, 'index']);
    Route::post('/lunch-breaks', [LunchBreakController::class, 'store']);
    Route::delete('/lunch-breaks/{id}', [LunchBreakController::class, 'destroy']);
    Route::post('/lunch-breaks/notify', [LunchBreakController::class, 'notify']);

    Route::get('/task-requests', [TaskRequestController::class, 'index']);
    Route::post('/task-requests', [TaskRequestController::class, 'store']);
    Route::patch('/task-requests/{id}', [TaskRequestController::class, 'update']);

    Route::get('/notices', [NoticeController::class, 'index']);
    Route::get('/notices/{id}', [NoticeController::class, 'show']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);

    Route::get('/mypage', [MypageController::class, 'index']);
    Route::patch('/mypage/password', [PasswordController::class, 'update']);
});

Route::middleware(['auth:sanctum'])->group(function () {

    // 管理者権限は Policy で制御する（role middleware は使わない）
    Route::apiResource('/users', Admin\UserController::class);

    Route::post('/csv/upload', [Admin\CsvController::class, 'upload']);

    Route::post('/notices', [Admin\NoticeController::class, 'store']);
    Route::patch('/notices/{id}', [Admin\NoticeController::class, 'update']);

    Route::patch('/products/{id}', [Admin\ProductController::class, 'update']);

    Route::get('/credentials', [Admin\CredentialController::class, 'index']);
    Route::patch('/credentials/{id}', [Admin\CredentialController::class, 'update']);
});

## 6. 実装順序
1. 認証
2. ユーザー管理
3. 昼休憩
4. KPI
5. CSV取込
6. 周知事項
7. 業務依頼
8. 商材
9. マイページ
10. 外部連携

## 7. Service設計ルール
・Controllerの1アクション = Serviceの1メソッド
・ControllerはServiceを呼ぶだけ
・DB操作はService内のみ
・Serviceは Model または Collection を返す

## 8. 認証
対象：
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

要件：
・bcryptでパスワード管理
・Sanctumトークン発行
・180分無操作で失効
・last_used_at を基準にミドルウェアで制御

## 9. ユーザー管理
・管理者のみ
・employee_code 一意
・role：admin / general
・is_activeで論理削除

## 10. 昼休憩
・30分単位（HH:00 / HH:30）
・同一ユーザー重複不可
・一般ユーザーは自分のみ操作
・管理者は全操作可能
・人数制限あり（例：3人）
・開始後は変更・削除不可

Chat通知：
・1日最大5回
・失敗時 success=false

## 11. KPI
contract_rate = ok / (ok + ng) × 100
・0除算は0
・Dense Rank

## 12. CSV取込（最重要）
トランザクション必須

フロー：
1. transaction開始
2. 対象月削除
3. INSERT
4. commit
5. rollback

## 13. 周知事項
・is_pinned対応
・published_at対応

## 14. 業務依頼
pending / in_progress / completed / rejected

## 15. 商材
一覧 / 詳細 / 更新

## 16. マイページ
・勤怠連携
・パスワード変更時トークン全失効

## 17. 外部連携
Google Chat：失敗時 success=false
GAS：Queue + リトライ
KING OF TIME：キャッシュ60分

## 18. 監査ログ（外部連携ログ）
- 管理者向けに監査ログ一覧を提供する
- `audit_logs` に req/res/status を保存（KOT/GAS）
- 画面: `/portal/admin/audit-logs`

## 19. APIレスポンス
{
  "data": {},
  "meta": {}
}

## 20. Resource
・必ず data / meta 形式
・collection使用

## 21. バリデーションエラー
{
  "message": "Validation failed",
  "errors": {
    "field": ["message"]
  }
}

## 22. 日付フォーマット
datetime：ISO8601
date：YYYY-MM-DD

## 23. ページネーション
paginate() 使用

## 24. 例外処理
・Serviceでtry-catch
・Log出力
・詳細は返さない

## 25. HTTPステータス
200 / 201 / 401 / 403 / 422 / 409 / 500

## 26. 禁止事項
・Controllerにロジックを書くな
・ControllerでDB操作するな
・バリデーションをControllerに書くな
・CSVでトランザクション無しは禁止

## 27. 出力形式
Controller / Service / Request / Resource / Model
※フルコードのみ

## 28. 実行開始
認証機能を実装してください

## 29. デザイン・ビジュアル規約（Nordic Clean + High-End Clean）
・ベースは Nordic Clean。背景は `stone-50` 系を維持し、ダーク全面塗りは原則禁止。
・単なるフラットデザインは禁止。カードは `border-t-white/80`（上部の光）と、少し強めの `shadow-xl` を組み合わせて、物理的な存在感を出すこと。
・カード面は「薄い単色」を基本とし、過剰な多色グラデーションは避けること（必要時のみごく弱い演出に限定）。
・境界線と文字コントラストは明確に。カード境界はシャープに、本文テキストは `stone-800` 以上で淡白さを排除すること。
・`emerald-600` は「面」ではなく「点」と「線」で使うこと。例：`border-l-4` のインジケーター、ドット、アイコンの微光彩（Glow）。
・ボタンや入力欄は、hover/focus 時に「内側から発光する」ような微細な Inner Glow を与え、触感のある高級スイッチ感を出すこと。
・詳細展開は瞬間表示ではなく、Framer Motion の `layoutId` を使った「カードの変形・連続遷移」を優先し、情報が流動的に入る体験にすること。
・ガラスモーフィズム（`backdrop-blur`）は補助的に使用し、可読性を損なう多用は禁止。
・Input/Textarea：通常時はクリーンな明色、focus時はコントラストと内側の光感を強める。
・KPI：サマリー・ランキング・トレンドを1画面に集約。個別メニューは作らない。

## 30. 特殊演出（ネオンタイマー）
・休憩スロット確定時、外周を走る1時間のネオンゲージを表示。
・1時間かけてゲージが減少し、残り5分で赤色点滅（Pulse）させる。
・終了時にフロントからAPI経由でGoogle Chatへ通知。

## 31. 業務フロー修正
・昼休憩：管理者がユーザーを複数選択して割り当てる形式（予約制ではない）。
・業務依頼：ステータス「完了」への変更と同時に、メイン一覧から非表示にする。