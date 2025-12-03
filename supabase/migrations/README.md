# データベースマイグレーション

## マイグレーションファイル一覧

### 001_initial.sql
初期スキーマの作成
- テーブル定義（genres, stores, flyers, items, favorites, search_history）
- インデックス作成
- RLS（Row Level Security）ポリシー設定
- updated_at自動更新トリガー

### 002_update_store_summary.sql
店舗データの集計処理（最安価商品の自動計算）
- 店舗ごとの最安価商品を計算する関数
- 商品データ更新時に自動で店舗データを更新するトリガー
- 既存データに対する初期集計処理

### 003_storage_setup.sql
Supabase Storageポリシー設定（チラシ画像保存用）
- Storageバケット`flyer-images`のポリシー設定
- 公開読み取りポリシー
- アップロード・更新・削除ポリシー

**注意**: このマイグレーションを実行する前に、Supabase Dashboardで`flyer-images`バケットを作成する必要があります。

### 004_add_insert_policies.sql
INSERT/UPDATE権限の追加（店舗自動追加機能用）
- `stores`テーブルにINSERT/UPDATE権限を追加
- `flyers`テーブルにINSERT/UPDATE権限を追加
- `items`テーブルにINSERT/UPDATE権限を追加
- 位置情報から探した店舗をDBに自動追加する機能のために必要

### 005_add_delete_policies.sql
DELETE権限の追加（管理者向けデータ削除機能用）
- `stores`テーブルにDELETE権限を追加
- `flyers`テーブルにDELETE権限を追加
- `items`テーブルにDELETE権限を追加
- 使い方ページの「すべての店舗データを削除」機能を使用する場合に必要

## 実行順序

マイグレーションファイルは番号順に実行してください：

1. `001_initial.sql` - まずこれを実行
2. `002_update_store_summary.sql` - 次にこれを実行
3. `003_storage_setup.sql` - Storageバケット作成後に実行
4. `004_add_insert_policies.sql` - 店舗自動追加機能を使用する場合に実行
5. `005_add_delete_policies.sql` - 管理者向けデータ削除機能を使用する場合に実行

## Supabaseでの実行方法

### 方法1: Supabase Dashboard（推奨）

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. SQL Editorを開く
4. `001_initial.sql`の内容をコピーして実行
5. `002_update_store_summary.sql`の内容をコピーして実行
6. **Storageバケットを作成**（Storage設定が必要な場合）
   - Storage → New bucket → `flyer-images`を作成
   - 詳細は`STORAGE_SETUP_GUIDE.md`を参照
7. `003_storage_setup.sql`の内容をコピーして実行（Storageバケット作成後）
8. `004_add_insert_policies.sql`の内容をコピーして実行（店舗自動追加機能を使用する場合）
9. `005_add_delete_policies.sql`の内容をコピーして実行（管理者向けデータ削除機能を使用する場合）

### 方法2: Supabase CLI

```bash
# Supabase CLIをインストール（まだの場合）
npm install -g supabase

# ログイン
supabase login

# マイグレーションを適用
supabase db push
```

## 動作確認

### 1. 関数が正しく作成されたか確認

```sql
-- 関数一覧を確認
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%store%' OR routine_name LIKE '%summary%';

-- トリガー一覧を確認
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name LIKE '%store%' OR trigger_name LIKE '%summary%');
```

### 2. 自動集計が動作するか確認

```sql
-- 店舗1の現在のsummaryを確認
SELECT id, name, summary_best_item_name, summary_best_item_price, summary_best_item_id
FROM stores
WHERE id = 1;

-- 商品を追加して、自動で更新されるか確認
INSERT INTO items (flyer_id, name, genre_id, price)
VALUES (1, 'テスト商品', 1, 100);

-- 再度店舗1のsummaryを確認（最安価商品が更新されているはず）
SELECT id, name, summary_best_item_name, summary_best_item_price, summary_best_item_id
FROM stores
WHERE id = 1;
```

### 3. すべての店舗のsummaryが正しく計算されているか確認

```sql
-- 店舗ごとの最安価商品とsummaryを比較
SELECT 
  s.id AS store_id,
  s.name AS store_name,
  s.summary_best_item_name,
  s.summary_best_item_price,
  s.summary_best_item_id,
  i.id AS actual_cheapest_item_id,
  i.name AS actual_cheapest_item_name,
  i.price AS actual_cheapest_item_price
FROM stores s
LEFT JOIN flyers f ON f.store_id = s.id AND f.is_latest = TRUE
LEFT JOIN LATERAL (
  SELECT id, name, price
  FROM items
  WHERE flyer_id = f.id
  ORDER BY price ASC, id ASC
  LIMIT 1
) i ON TRUE
ORDER BY s.id;
```

## 実装内容の詳細

### 関数

#### `calculate_store_best_item(p_store_id INTEGER)`
店舗ごとの最安価商品を計算する関数

**戻り値**:
- `best_item_id`: 最安価商品のID
- `best_item_name`: 最安価商品の名前
- `best_item_price`: 最安価商品の価格

#### `update_store_summary(p_store_id INTEGER)`
指定された店舗のsummary_best_itemを更新する関数

### トリガー

#### `trigger_items_update_store_summary`
商品テーブル（items）に設定されたトリガー
- 商品が追加されたとき
- 商品が更新されたとき
- 商品が削除されたとき

→ 自動で関連する店舗のsummaryを更新

#### `trigger_flyers_update_store_summary`
チラシテーブル（flyers）に設定されたトリガー
- チラシが追加されたとき
- チラシの`is_latest`が変更されたとき
- チラシが削除されたとき

→ 自動で関連する店舗のsummaryを更新

## トラブルシューティング

### エラー: function does not exist
マイグレーションが正しく実行されていない可能性があります。
- マイグレーションファイルが正しい順序で実行されているか確認
- エラーメッセージを確認して、不足している関数やテーブルがないか確認

### summaryがNULLになっている
以下の可能性があります：
- 店舗に関連するチラシがない（`is_latest = TRUE`のチラシがない）
- チラシに関連する商品がない
- データがまだ投入されていない

### パフォーマンスの問題
大量のデータがある場合、トリガーの実行に時間がかかることがあります。
- インデックスが正しく設定されているか確認（`idx_items_flyer_id`, `idx_items_price`など）
- 不要なデータがないか確認

## 注意事項

- このマイグレーションは既存のデータを変更します（summary_best_itemの更新）
- 本番環境で実行する前に、必ずバックアップを取ってください
- トリガーは商品やチラシの更新時に自動実行されるため、パフォーマンスに影響を与える可能性があります
- 大量のデータ更新を行う場合は、一時的にトリガーを無効化することを検討してください

