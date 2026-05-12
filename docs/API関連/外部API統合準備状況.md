# 外部API統合 - 準備状況まとめ

## 📊 実装状況

### ✅ コード実装: 100%完了

以下のサービスが実装済みです：

1. **Google Cloud Vision API統合** (`src/services/visionService.js`)
   - ✅ OCR処理の実装完了
   - ✅ エラーハンドリング実装済み
   - ✅ 画像サイズチェック（20MB制限）
   - ✅ 日本語優先設定
   - ✅ APIキー未設定時の適切なエラーメッセージ

2. **Google Gemini API統合** (`src/services/geminiService.js`)
   - ✅ テキスト構造化処理の実装完了
   - ✅ エラーハンドリング実装済み
   - ✅ JSON解析の改善
   - ✅ プロンプト最適化
   - ✅ APIキー未設定時の適切なエラーメッセージ

3. **OCR処理統合サービス** (`src/services/ocrService.js`)
   - ✅ Vision APIとGemini APIの統合完了
   - ✅ データベース保存機能
   - ✅ OCRステータス更新機能

4. **管理者ページへの統合** (`src/pages/AdminUploadPage.js`)
   - ✅ OCR処理オプションのUI実装完了
   - ✅ 処理状況の表示
   - ✅ エラーハンドリング

---

## 🔑 環境変数設定

### 必要な環境変数

以下の2つの環境変数を設定するだけで、OCR処理機能が有効化されます：

1. `VITE_GOOGLE_CLOUD_VISION_API_KEY` - Google Cloud Vision APIキー
2. `VITE_GOOGLE_GEMINI_API_KEY` - Google Gemini APIキー

### 設定方法

#### 開発環境

`.env`ファイルに追加：

```env
VITE_GOOGLE_CLOUD_VISION_API_KEY=your-api-key-here
VITE_GOOGLE_GEMINI_API_KEY=your-api-key-here
```

**重要**: 開発サーバーを再起動して環境変数の変更を反映してください。

#### 本番環境（Vercel）

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を追加：
   - `VITE_GOOGLE_CLOUD_VISION_API_KEY`
   - `VITE_GOOGLE_GEMINI_API_KEY`
5. 「Save」をクリック
6. 変更を反映するために再デプロイ

---

## 🚀 有効化方法

### 手順1: APIキーの取得

#### Google Cloud Vision APIキー
詳細手順: [docs/API関連/環境変数設定ガイド.md](環境変数設定ガイド.md)

1. [Google Cloud Platform](https://cloud.google.com/)でアカウント作成
2. プロジェクトを作成
3. Cloud Vision APIを有効化
4. APIキーを作成

#### Google Gemini APIキー
詳細手順: [docs/API関連/Gemini API設定ガイド.md](Gemini API設定ガイド.md)

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでログイン
3. APIキーを作成

### 手順2: 環境変数の設定

`.env`ファイルまたはVercelの環境変数に設定

### 手順3: 動作確認

1. 開発サーバーを再起動（環境変数の変更を反映）
2. 管理者ページ（`/admin/upload`）にアクセス
3. 画像をアップロード
4. 「OCR処理を実行する」にチェックを入れる
5. アップロード後にOCR処理が実行されることを確認

---

## 💰 無料枠について

### Google Cloud Vision API

- ✅ **初回登録時に$300の無料クレジット**（90日間有効）
- ✅ **毎月1,000リクエストまで無料**（月額無料枠）
- ✅ **コンテスト用途（120回程度）なら完全無料で運用可能**

### Google Gemini API

- ✅ **個人開発・テスト目的でほぼ無制限に無料**
- ✅ **1分あたり15リクエスト、1日あたり1,500リクエストまで無料**
- ✅ **コンテスト用途なら完全無料で運用可能**

詳細は [docs/API関連/コンテスト用API無料枠確認.md](コンテスト用API無料枠確認.md) を参照してください。

---

## 🔒 セキュリティ設定

### CSP（Content Security Policy）

`vercel.json`に以下のドメインが既に追加されています：

- ✅ `https://vision.googleapis.com` - Google Cloud Vision API
- ✅ `https://generativelanguage.googleapis.com` - Google Gemini API

### APIキーの制限設定（推奨）

#### Google Cloud Vision API

1. [Google Cloud Console](https://console.cloud.google.com/)にログイン
2. 「APIとサービス」→「認証情報」を開く
3. APIキーを選択
4. 「アプリケーションの制限」: 「HTTPリファラー（ウェブサイト）」を設定
5. 「リファラー」: 自分のドメインを追加（例: `https://your-domain.com/*`）

#### Google Gemini API

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. APIキーの設定ページで使用量上限を確認
3. 必要に応じて使用量上限を設定

---

## 📋 動作確認チェックリスト

### 準備段階

- [ ] Google Cloud Platformアカウント作成
- [ ] Cloud Vision APIを有効化
- [ ] Vision APIキーを取得
- [ ] Google AI StudioでGemini APIキーを取得
- [ ] `.env`ファイルに環境変数を設定（開発環境）
- [ ] 開発サーバーを再起動

### 動作確認

- [ ] 管理者ページにアクセスできる
- [ ] 画像をアップロードできる
- [ ] OCR処理オプションが表示される
- [ ] OCR処理を実行できる
- [ ] OCR処理の進行状況が表示される
- [ ] OCR処理が完了する
- [ ] 商品情報がデータベースに保存される

### エラーハンドリング確認

- [ ] APIキーが未設定の場合、適切なエラーメッセージが表示される
- [ ] 画像が大きすぎる場合、エラーメッセージが表示される
- [ ] OCR処理が失敗した場合、エラーメッセージが表示される

---

## 🔧 トラブルシューティング

### 問題: APIキーが設定されているのに動作しない

**確認事項**:
1. `.env`ファイルがプロジェクトルートに正しく配置されているか
2. 環境変数名が正確か（`VITE_`プレフィックスが必要）
3. 開発サーバーを再起動したか
4. 本番環境の場合は、Vercelの環境変数を確認

### 問題: OCR処理が失敗する

**確認事項**:
1. APIキーが有効か
2. APIキーの制限設定を確認（HTTPリファラー制限など）
3. 画像URLが公開アクセス可能か（Supabase Storageのパブリックバケット設定）
4. 画像サイズが20MB以下か
5. コンソールのエラーメッセージを確認

### 問題: 商品情報が抽出されない

**確認事項**:
1. 画像の品質（テキストが読めるか）
2. 画像の向き（横向きの場合は回転が必要な場合がある）
3. Gemini APIのレスポンスを確認
4. OCR処理のログを確認

---

## 📚 参考ドキュメント

- **[環境変数設定ガイド.md](環境変数設定ガイド.md)** - 詳細な環境変数設定手順
- **[Gemini API設定ガイド.md](Gemini API設定ガイド.md)** - Gemini APIの詳細設定
- **[コンテスト用API無料枠確認.md](コンテスト用API無料枠確認.md)** - 無料枠の詳細情報
- **[OCR処理実装完了.md](../実装詳細/OCR処理実装完了.md)** - OCR処理の実装詳細

---

## ✅ まとめ

### 実装状況

- ✅ **コード実装**: 100%完了
- ✅ **ドキュメント**: 完了
- ✅ **CSP設定**: 完了
- ⏸️ **環境変数設定**: ユーザーが設定する必要あり

### 有効化までの手順

1. ✅ APIキーを取得（Google Cloud Platform、Google AI Studio）
2. ✅ 環境変数を設定（`.env`またはVercel）
3. ✅ 開発サーバーを再起動
4. ✅ 動作確認

### 無料枠での運用

- ✅ **Google Cloud Vision API**: $300無料クレジット + 月額1,000リクエスト無料
- ✅ **Google Gemini API**: 個人開発・テスト目的でほぼ無制限に無料
- ✅ **コンテスト用途**: 完全無料で運用可能

---

**最終更新**: 2025年1月
**ステータス**: ✅ 準備完了 - 環境変数設定のみで有効化可能




