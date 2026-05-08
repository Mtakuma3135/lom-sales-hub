## Agent Prompt: 85点→120点 改善指示書（KOT証明 + 保守性）

あなたはこのリポジトリ（Laravel + Inertia React + Tailwind）の実装担当です。
この指示書に沿って「実数値で動く証明力」と「ロジック矛盾の排除」を行ってください。

### 絶対ルール
- **モックで“成功”に見せかけない**。localでモックを許可しても、UI/監査ログ/証明モードで必ず区別する。
- **状態の真実はサーバー**（API/DB）。UIはそれを正にする。
- **同じ情報は単一ソース**で決める（connected判定などを二重実装しない）。
- **安全なホワイトリスト方式**（sortキー等は許可リスト以外を受けない）。
- 既存のUXを壊さない（レイアウト崩れ・コンテンツはみ出し禁止）。
- Git: 新しいブランチは作らず、現ブランチで作業。

---

## ゴール
- local mock が混じっても、運用者が誤解しない。
- 「実通信/実処理が起きた」ことを UI で証明できる（一次ソースは監査ログ）。
- 将来の改修で壊れやすい“二重実装”を整理する。

---

## 実装チケット（優先順）

### T1（P0）KOT: 実通信とlocal mockを混ぜない（証明力）
**現状課題**: `KOT_API_TOKEN` 未設定でも監査ログが success になり得て、証明が曖昧。

**実装**:
- `SendKotPunchJob` の no-token 分岐の監査ログ方針を決めて反映。
- 必ず `meta.mode='mock'` と `meta.reason='no_token'` を付与。

**ここは選択**（どちらかを採用して実装）:
- **A（推奨）**: `status='skipped'`（または `status='mock'`）に変更。success扱いにしない。
- **B**: `status='success'` は維持。ただし「証明モード」や集計では `meta.mode=mock` を必ず除外。

### T2（P0）Mypage: integrationsのKOT接続状態の矛盾を解消
**現状課題**: integrations上のKOTが常にconnectedになり得て `kot_status.connected` と矛盾。

**実装**:
- KOTの接続状態は **単一ソース**（推奨: `services.kot.api_token` または `kot_status.connected`）で決める。
- integrations配列のKOT表示もその値に一致させる。

### T3（P1）監査ログ一覧: mockを確実に見分ける
**現状課題**: 一覧propsに `meta` が無いと `meta.mode` バッジが出ない可能性。

**実装案（いずれか）**:
- **案A**: 監査ログの一覧レスポンスに `meta`（少なくとも `mode`）を含める。
- **案B（堅牢）**: `audit_logs` に `mode` 列（nullable）を追加し、書込み時に保存。一覧はその列で判断。

### T4（P1）Productsソート: 二重実装を1本化（将来バグ予防）
**現状課題**: `applySearch()` と `toggleSort()` が似た責務で壊れやすい。

**実装**:
- `runSearch({ q, category, activeOnly, sort, dir })` のような関数を1本用意し、そこからのみ `router.get` を呼ぶ。
- `applySearch/toggleSort` は `runSearch` 呼び出しに統一。

### T5（P2）クライアントソートもURL同期（運用再現性）
**対象候補**: Users / Sales Summary Ranking など

**実装**:
- `?sort=&dir=` をURLに反映し、初期表示で読み取って state を復元する。
- フルリロード不要（`history.replaceState` などでOK）。

### T6（P2）attendance=null の意味を分離（未連携/未取得/失敗）
**現状課題**: null が複数の意味を持ち、運用で原因切り分けが難しい。

**実装**:
- `attendance.state` を導入（例: `not_connected | not_fetched | ok | has_error | error`）。
- UIの表示文言も state に合わせて分岐。

---

## 受け入れ条件（Done定義）
- local mockが **成功に見えない**（UI/監査ログ/証明モードで区別できる）。
- MypageのKOT表示が **矛盾しない**（integrations と kot_status が一致）。
- 監査ログ一覧で mock が **確実に判別できる**。
- Products検索/ソートが **1つの関数**に集約され、改修で壊れにくい。
- 可能ならソート状態がURLで再現できる（運用ツールとして共有できる）。

---

## 仕上げ（提出物）
- 何を変えたか（チケット単位の要約）
- 最短テスト手順（画面/URL/操作）
- 残課題/リスク（あれば）
