# 残りの実装項目まとめ

## 📋 実装済み項目

### フロントエンド
- ✅ 全ページ実装（HomePage, GenrePage, StoresPage, GenreStoresPage, StoreDetailPage, SearchResultsPage）
- ✅ HTML/CSS/JavaScript分離構造
- ✅ テンプレートシステム
- ✅ ルーティング
- ✅ 地図表示（Leaflet.js）
- ✅ 画像拡大表示（Lightbox2）
- ✅ お気に入り機能（LocalStorage）

### データサービス
- ✅ Supabase接続（環境変数未設定時のフォールバック対応）
- ✅ データ取得サービス（5分キャッシュ機能付き）
- ✅ データベーススキーマ定義
- ✅ モックデータ（JSON形式）

### ユーティリティ
- ✅ 距離計算（Haversine公式）
- ✅ 位置情報取得
- ✅ 地図操作
- ✅ 検索・フィルタリング
- ✅ お気に入り管理

---

## 🚧 未実装・部分実装の項目

### 1. 外部API統合 ⚠️ **重要**

#### 1.1 Google Maps Directions API
- **目的**: 店舗から最寄り駅までの徒歩時間を計算
- **現在の状態**: `summary_walk_minutes`はデータベースに保存されているが、自動計算機能なし
- **実装が必要な内容**:
  - [ ] APIキーの設定（環境変数）
  - [ ] `src/services/directionsApi.js`の作成
  - [ ] 徒歩時間計算関数の実装
  - [ ] 定期バッチ処理での`summary_walk_minutes`更新
- **参考実装例**:
```javascript
// src/services/directionsApi.js
export async function getWalkingTime(origin, destination) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=walking&key=${API_KEY}`
  );
  // 徒歩時間を分単位で返す
}
```

#### 1.2 Google Cloud Vision API
- **目的**: チラシ画像からOCRで文字を抽出
- **現在の状態**: `ocr_done`フラグは存在するが、OCR処理機能なし
- **実装が必要な内容**:
  - [ ] APIキーの設定（環境変数）
  - [ ] `src/services/visionApi.js`の作成
  - [ ] OCR処理関数の実装
  - [ ] バッチ処理でのOCR実行
- **注意**: クライアント側から直接呼び出すとAPIキーが露出するため、バックエンドAPI経由が推奨

#### 1.3 OpenAI API
- **目的**: OCR結果を構造化して商品情報（商品名、価格、ジャンル）を抽出
- **現在の状態**: 未実装
- **実装が必要な内容**:
  - [ ] APIキーの設定（環境変数）
  - [ ] `src/services/openaiApi.js`の作成
  - [ ] プロンプトテンプレートの設計
  - [ ] JSON構造化処理の実装
- **注意**: クライアント側から直接呼び出すとAPIキーが露出するため、バックエンドAPI経由が推奨

---

### 2. バックエンド処理・データ更新 🔄

#### 2.1 チラシ画像のOCR処理パイプライン
- **実装が必要な内容**:
  - [ ] 新しいチラシ画像がアップロードされたときのトリガー処理
  - [ ] Vision APIでのOCR実行
  - [ ] OpenAI APIでの構造化処理
  - [ ] 商品情報のデータベース保存
  - [ ] `ocr_done`フラグの更新

#### 2.2 店舗データの集計処理
- **実装が必要な内容**:
  - [ ] `summary_best_item_name`の自動計算（最安価商品）
  - [ ] `summary_best_item_price`の自動計算
  - [ ] `summary_best_item_id`の自動計算
  - [ ] 定期的な集計処理（CronジョブまたはSupabase Edge Functions）

#### 2.3 徒歩時間の自動更新
- **実装が必要な内容**:
  - [ ] Directions APIを使った徒歩時間計算
  - [ ] `summary_walk_minutes`の定期更新
  - [ ] 新規店舗追加時の自動計算

#### 2.4 チラシ画像アップロード機能
- **実装が必要な内容**:
  - [ ] 画像アップロードUI（管理者用）
  - [ ] Supabase Storageへの画像アップロード
  - [ ] サムネイル生成
  - [ ] 画像URLのデータベース保存

---

### 3. バックエンドAPI（Vercel Serverless Functions推奨） 🌐

#### 3.1 OCR処理エンドポイント
- **実装が必要な内容**:
  - [ ] `api/ocr/process.ts`の作成
  - [ ] Vision API呼び出し
  - [ ] OpenAI API呼び出し
  - [ ] データベース更新
  - [ ] エラーハンドリング

#### 3.2 徒歩時間計算エンドポイント
- **実装が必要な内容**:
  - [ ] `api/directions/calculate.ts`の作成
  - [ ] Directions API呼び出し
  - [ ] データベース更新

#### 3.3 データ集計エンドポイント
- **実装が必要な内容**:
  - [ ] `api/aggregate/summary.ts`の作成
  - [ ] 商品データの集計処理
  - [ ] データベース更新

---

### 4. 環境設定・デプロイ 🔧

#### 4.1 環境変数の設定
- **実装が必要な内容**:
  - [ ] `.env.example`ファイルの作成
  - [ ] 以下の環境変数の設定:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `GOOGLE_MAPS_API_KEY`（バックエンド用）
    - `GOOGLE_CLOUD_VISION_API_KEY`（バックエンド用）
    - `OPENAI_API_KEY`（バックエンド用）
  - [ ] Vercel環境変数の設定

#### 4.2 Vercelデプロイ設定
- **実装が必要な内容**:
  - [ ] `vercel.json`の設定（必要に応じて）
  - [ ] ビルドコマンドの確認
  - [ ] 環境変数の設定
  - [ ] ドメイン設定

#### 4.3 Supabase本番環境設定
- **実装が必要な内容**:
  - [ ] 本番環境のSupabaseプロジェクト作成
  - [ ] マイグレーションの実行
  - [ ] シードデータの投入
  - [ ] RLS（Row Level Security）ポリシーの確認

---

### 5. データベース機能拡張 💾

#### 5.1 ストレージバケット設定
- **実装が必要な内容**:
  - [ ] Supabase Storageバケットの作成（`flyer-images`など）
  - [ ] 公開読み取りポリシーの設定
  - [ ] アップロード権限の設定

#### 5.2 データベース関数・トリガー
- **実装が必要な内容**:
  - [ ] 商品価格更新時の`summary_best_item`自動更新トリガー
  - [ ] 新規チラシ追加時の自動処理（Supabase Edge Functions）

#### 5.3 インデックスの最適化
- **実装が必要な内容**:
  - [ ] 検索パフォーマンスの確認
  - [ ] 必要に応じてインデックスの追加

---

### 6. テスト・品質保証 🧪

#### 6.1 ユニットテスト
- **実装が必要な内容**:
  - [ ] ユーティリティ関数のテスト
  - [ ] データサービス関数のテスト
  - [ ] テストフレームワークの導入（Jest、Vitestなど）

#### 6.2 統合テスト
- **実装が必要な内容**:
  - [ ] APIエンドポイントのテスト
  - [ ] データベース操作のテスト
  - [ ] E2Eテスト（Playwright、Cypressなど）

#### 6.3 パフォーマンステスト
- **実装が必要な内容**:
  - [ ] ページロード速度の測定
  - [ ] APIレスポンス時間の測定
  - [ ] データベースクエリの最適化

---

### 7. ドキュメント 📚

#### 7.1 APIドキュメント
- **実装が必要な内容**:
  - [ ] バックエンドAPIのエンドポイント一覧
  - [ ] リクエスト/レスポンスの仕様
  - [ ] 認証方法の説明

#### 7.2 開発者向けドキュメント
- **実装が必要な内容**:
  - [ ] セットアップ手順
  - [ ] 環境変数の説明
  - [ ] 開発ワークフロー
  - [ ] デプロイ手順

#### 7.3 運用マニュアル
- **実装が必要な内容**:
  - [ ] チラシ画像のアップロード手順
  - [ ] データ更新手順
  - [ ] エラー対応手順

---

## 🎯 優先度の高い項目

### 最優先（MVP実装に必要）
1. **環境変数の設定** - 本番環境で動作させるために必須
2. **Vercelデプロイ設定** - 本番環境へのデプロイ
3. **Supabase本番環境設定** - データベースの本番環境

### 高優先度（基本機能を完成させるために必要）
4. **Google Maps Directions API統合** - 徒歩時間の自動計算
5. **店舗データの集計処理** - `summary_best_item`の自動計算
6. **バックエンドAPIの基本構造** - OCR処理の基盤

### 中優先度（機能拡張）
7. **OCR処理パイプライン** - チラシ画像から商品情報を自動抽出
8. **画像アップロード機能** - 新しいチラシを追加できるように

### 低優先度（品質向上）
9. **テストの実装** - 品質保証
10. **ドキュメント整備** - 保守性向上

---

## 📝 実装時の注意事項

### セキュリティ
- ⚠️ **APIキーの保護**: クライアント側から直接外部APIを呼び出すとAPIキーが露出します。必ずバックエンドAPI経由で呼び出してください。
- ⚠️ **環境変数の管理**: `.env`ファイルをGitにコミットしないよう注意してください（`.gitignore`に含まれています）。

### コスト管理
- 💰 **API使用量の監視**: Google Maps、Vision API、OpenAI APIは使用量に応じて課金されます。無料枠を超えないよう注意してください。
- 💰 **キャッシュの活用**: 同じデータを何度も取得しないよう、キャッシュ機能を活用してください（現在5分キャッシュ実装済み）。

### パフォーマンス
- ⚡ **非同期処理**: OCR処理など時間がかかる処理は非同期で実行し、ユーザー体験を損なわないようにしてください。
- ⚡ **バッチ処理**: 大量のデータを処理する場合は、バッチ処理を検討してください。

---

## 🔗 参考リンク

- [Google Maps Directions API](https://developers.google.com/maps/documentation/directions)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

