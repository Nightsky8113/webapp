# OCR処理機能 実装完了

Google Cloud Vision APIとOpenAI APIを使用したOCR処理機能を実装しました。

## ✅ 実装内容

### 1. Google Cloud Vision API統合（`src/services/visionService.js`）

**機能**:
- チラシ画像からテキストを抽出するOCR処理
- 画像URLからBase64に変換してAPIを呼び出す
- エラーハンドリングとログ出力

**主要な関数**:
- `extractTextFromImage(imageUrl)` - 画像からテキストを抽出

### 2. OpenAI API統合（`src/services/openAIService.js`）

**機能**:
- OCRで抽出したテキストを商品情報として構造化
- GPT-3.5 Turboを使用（コスト削減）
- 商品名、価格、説明、カテゴリを自動抽出

**主要な関数**:
- `structureOCRText(ocrText, storeId)` - テキストを商品情報として構造化

### 3. OCR処理統合サービス（`src/services/ocrService.js`）

**機能**:
- Vision APIとOpenAI APIを組み合わせて処理
- 抽出した商品情報をデータベースに自動保存
- OCR処理完了フラグを自動更新

**処理フロー**:
1. Google Cloud Vision APIでテキスト抽出
2. OpenAI APIでテキストを商品情報として構造化
3. 商品情報を`items`テーブルに保存
4. `flyers.ocr_done`フラグを`true`に更新

**主要な関数**:
- `processFlyerOCR(imageUrl, flyerId, storeId)` - OCR処理を実行

### 4. 管理者ページへの統合（`src/pages/AdminUploadPage.js`）

**機能**:
- 画像アップロード後にOCR処理を実行するオプション
- OCR処理の進行状況を表示
- 非同期で処理を実行（UIブロックなし）

**使用方法**:
1. 管理者ページで画像をアップロード
2. 「OCR処理を実行する」にチェックを入れる
3. アップロード後に自動的にOCR処理が開始される
4. 処理完了後、商品情報がデータベースに保存される

---

## 🎯 使用方法

### 1. 環境変数の設定

`.env`ファイルに以下の環境変数を設定：

```env
VITE_GOOGLE_CLOUD_VISION_API_KEY=your-api-key
VITE_OPENAI_API_KEY=your-api-key
```

詳細は `docs/API関連/環境変数設定ガイド.md` を参照してください。

### 2. OCR処理の実行

#### 方法1: 管理者ページから実行（推奨）

1. 管理者ページ（`/admin/upload`）にアクセス
2. 店舗を選択
3. 画像ファイルを選択
4. 「OCR処理を実行する」にチェックを入れる
5. 「アップロード」をクリック
6. アップロード完了後、自動的にOCR処理が開始される

#### 方法2: プログラムから実行

```javascript
import { processFlyerOCR } from './services/ocrService.js';

const result = await processFlyerOCR(
    'https://example.com/flyer.jpg', // 画像URL
    1, // チラシID
    1  // 店舗ID
);

if (result.success) {
    console.log('OCR処理完了:', result.items);
} else {
    console.error('エラー:', result.error);
}
```

---

## 💰 コスト見積もり

### コンテスト用途（3か月間）

| API | 使用量 | 無料枠 | 超過分 | 合計 |
|-----|--------|--------|--------|------|
| **Google Cloud Vision API** | 120回 | $300クレジット内 | - | **$0** |
| **OpenAI API** | 120回 | $5クレジット内（1か月） | $0.40 | **$0.40** |
| **合計** | - | - | - | **$0.40（約60円）** |

詳細は `docs/API関連/コンテスト用API無料枠確認.md` を参照してください。

---

## 📊 データフロー

```
1. ユーザーが画像をアップロード
   ↓
2. 画像がSupabase Storageに保存される
   ↓
3. flyersテーブルにチラシ情報が保存される（ocr_done = false）
   ↓
4. OCR処理が開始される（ユーザーがオプション選択時）
   ↓
5. Google Cloud Vision APIでテキスト抽出
   ↓
6. OpenAI APIでテキストを商品情報として構造化
   ↓
7. itemsテーブルに商品情報が保存される
   ↓
8. flyers.ocr_doneがtrueに更新される
```

---

## 🚨 注意点

### 1. APIキーの管理

- APIキーは絶対に公開リポジトリにコミットしない
- `.env`ファイルは`.gitignore`に追加済み
- 本番環境ではVercelの環境変数を使用

### 2. 使用量の監視

- Google Cloud Consoleで使用量を確認
- OpenAI Dashboardで使用量を確認
- 異常な使用量がないか定期的にチェック

### 3. エラーハンドリング

- APIキーが設定されていない場合は、エラーメッセージを表示
- OCR処理が失敗した場合は、エラーメッセージを表示
- データベース保存が失敗した場合も、抽出した商品情報は返される

### 4. 処理時間

- OCR処理には1-2分かかる場合がある
- 非同期で処理されるため、UIがブロックされない
- 処理中は進行状況を表示

---

## 🔧 今後の改善案

### 1. バックエンド処理への移行

現在はクライアント側で処理していますが、将来的にはSupabase Edge Functionsに移行することを推奨します。

**メリット**:
- APIキーをクライアントに公開しない
- 処理の負荷をサーバー側に分散
- エラー処理の改善

### 2. 使用量監視機能

- 使用量をデータベースに記録
- 無料枠に近づいたら警告を表示
- 使用量ダッシュボードを作成

### 3. OCR処理の再実行機能

- 既存のチラシに対してOCR処理を再実行できる機能
- 処理結果を比較できる機能

---

## 📝 関連ファイル

- `src/services/visionService.js` - Google Cloud Vision API統合
- `src/services/openAIService.js` - OpenAI API統合
- `src/services/ocrService.js` - OCR処理統合サービス
- `src/pages/AdminUploadPage.js` - 管理者ページ（OCR処理統合）
- `src/templates/pages/admin-upload-page.html` - 管理者ページテンプレート
- `docs/API関連/環境変数設定ガイド.md` - 環境変数設定ガイド
- `docs/API関連/コンテスト用API無料枠確認.md` - 無料枠確認結果

---

## ✅ 動作確認

実装後、以下の手順で動作確認：

1. ✅ 環境変数を設定
2. ✅ 開発サーバーを再起動
3. ✅ 管理者ページで画像をアップロード
4. ✅ 「OCR処理を実行する」にチェック
5. ✅ OCR処理が正常に実行されるか確認
6. ✅ 商品情報がデータベースに保存されるか確認

---

**実装完了日**: 2025年1月
**ステータス**: ✅ 実装完了（環境変数設定が必要）






