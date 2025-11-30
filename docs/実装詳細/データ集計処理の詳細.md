# 店舗データの集計処理実装完了

## ✅ 実装完了

店舗データの集計処理を実装しました。商品データから自動的に最安価商品を計算し、店舗データの`summary_best_item_name`、`summary_best_item_price`、`summary_best_item_id`を更新します。

## 📋 実装内容

### 1. PostgreSQL関数

#### `calculate_store_best_item(p_store_id INTEGER)`
- 店舗ごとの最安価商品を計算
- 最新チラシ（`is_latest = TRUE`）の商品から最安価商品を取得
- 価格が同じ場合はIDが小さいものを優先

#### `update_store_summary(p_store_id INTEGER)`
- 指定された店舗の`summary_best_item`を更新
- チラシや商品が存在しない場合はNULLに設定

### 2. 自動更新トリガー

#### 商品テーブル（items）のトリガー
- 商品が追加・更新・削除されたときに自動で関連店舗のsummaryを更新

#### チラシテーブル（flyers）のトリガー
- チラシが追加・削除されたとき
- `is_latest`フラグが変更されたとき
- 自動で関連店舗のsummaryを更新

### 3. 初期データの集計

- 既存データに対して集計処理を実行
- すべての店舗のsummaryを自動計算

## 🎯 メリット

### 1. 完全自動化
- 商品データが更新されると自動で店舗データも更新
- 手動での集計処理が不要

### 2. リアルタイム更新
- 商品の追加・更新・削除時に即座に反映
- 常に最新の最安価商品を表示

### 3. コスト0円
- 外部API不要
- PostgreSQL標準機能のみで実装
- Supabase無料枠内で動作

### 4. パフォーマンス
- データベース内で完結
- インデックスを活用した高速な計算

## 📝 使用方法

### マイグレーションの実行

Supabase DashboardでSQL Editorを開き、以下を実行：

```sql
-- 1. 最初に001_initial.sqlを実行（まだの場合）
-- 2. 次に002_update_store_summary.sqlを実行
```

### 動作確認

```sql
-- 店舗1のsummaryを確認
SELECT id, name, summary_best_item_name, summary_best_item_price, summary_best_item_id
FROM stores
WHERE id = 1;

-- 新しい商品を追加
INSERT INTO items (flyer_id, name, genre_id, price)
VALUES (1, '新商品', 1, 50);

-- summaryが自動更新されているか確認
SELECT id, name, summary_best_item_name, summary_best_item_price, summary_best_item_id
FROM stores
WHERE id = 1;
```

## 🔄 動作フロー

1. **商品データが更新される**（追加・更新・削除）
   ↓
2. **トリガーが発火**（`trigger_items_update_store_summary`）
   ↓
3. **関連する店舗IDを取得**（商品 → チラシ → 店舗）
   ↓
4. **`update_store_summary()`関数を実行**
   ↓
5. **最安価商品を計算**（`calculate_store_best_item()`）
   ↓
6. **店舗データを更新**（`summary_best_item_*`フィールド）

## 📊 データ構造

```
stores (店舗)
  ↓
flyers (チラシ) [is_latest = TRUE のもの]
  ↓
items (商品) [価格でソート、最安価を取得]
  ↓
summary_best_item_name/price/id
```

## ⚠️ 注意事項

### パフォーマンス
- 大量のデータがある場合、トリガーの実行に時間がかかることがあります
- インデックス（`idx_items_flyer_id`, `idx_items_price`）が設定されていることを確認

### データ整合性
- チラシが存在しない店舗は`summary_best_item_*`がNULLになります
- 商品が存在しないチラシも同様にNULLになります

### 本番環境での実行
- 本番環境で実行する前に、必ずバックアップを取ってください
- マイグレーション実行時に既存データが更新されます

## 🔍 トラブルシューティング

### summaryがNULLになる場合
1. 店舗に関連するチラシがあるか確認
2. チラシの`is_latest`が`TRUE`になっているか確認
3. チラシに関連する商品があるか確認

### トリガーが動作しない場合
1. トリガーが正しく作成されているか確認
2. マイグレーションが正しく実行されているか確認
3. PostgreSQLのログを確認

## 📚 関連ファイル

- `supabase/migrations/002_update_store_summary.sql` - マイグレーションファイル
- `supabase/migrations/README.md` - マイグレーションの使用方法

## 🎉 次のステップ

1. **お気に入り機能のSupabase連携** - LocalStorageからSupabaseへ移行
2. **検索履歴のSupabase連携** - LocalStorageからSupabaseへ移行
3. **環境変数設定ファイル** - `.env.example`の作成

