# Google Gemini API 設定ガイド

OpenAI APIの代替として、Google Gemini APIを使用します。個人開発・テスト目的であれば、ほぼ無制限に無料で利用できます。

## ✅ メリット

- ✅ **ほぼ無制限の無料枠**（個人開発・テスト目的）
- ✅ **日本語対応**
- ✅ **構造化データの生成に適している**
- ✅ **APIキー取得が簡単**

---

## 🔑 APIキーの取得手順

### 1. Google AI Studioにアクセス

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでログイン

### 2. APIキーを作成

1. 左側のメニューから「Get API key」を選択
2. 「Create API key」をクリック
3. プロジェクトを選択（新規作成も可能）
4. APIキーが生成される
5. **重要**: APIキーをコピーして保存（一度しか表示されません）

### 3. 環境変数に設定

`.env`ファイルに追加：

```env
VITE_GOOGLE_GEMINI_API_KEY=AIzaSyC9atuKit-ppBJGilMU63solW3-2BZekOw
```

---

## 💰 料金（無料枠超過時）

### Gemini 1.5 Flash（推奨）

- 入力: **$0.075/1Mトークン**
- 出力: **$0.30/1Mトークン**

### Gemini 1.5 Pro

- 入力: **$1.25/1Mトークン**
- 出力: **$5.00/1Mトークン**

### コンテスト用途での見積もり

- 1チラシあたり: 約2,000-5,000トークン（入力）
- 120回の処理: 約240,000-600,000トークン
- **無料枠内で完全対応可能** ✅

---

## 🔒 セキュリティ注意事項

### 1. APIキーの管理

- APIキーは絶対に公開リポジトリにコミットしない
- `.env`ファイルは`.gitignore`に追加済み
- 本番環境ではVercelの環境変数を使用

### 2. APIキーの制限設定（推奨）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「APIとサービス」→「認証情報」を開く
3. APIキーを選択
4. 「アプリケーションの制限」を設定
   - 「HTTPリファラー（ウェブサイト）」を選択
   - 自分のドメインを追加（例: `https://your-domain.com/*`）
5. 「保存」をクリック

---

## 📝 本番環境での設定（Vercel）

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を追加：
   - `VITE_GOOGLE_GEMINI_API_KEY`
5. 「Save」をクリック
6. 変更を反映するために再デプロイ

---

## ✅ 動作確認

環境変数を設定したら、以下の手順で動作確認：

1. `.env`ファイルが正しく設定されているか確認
2. 開発サーバーを再起動（環境変数の変更を反映）
3. 管理者ページで画像をアップロード
4. 「OCR処理を実行する」にチェックを入れる
5. アップロード後にOCR処理が実行されるか確認

---

## 📚 参考リンク

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API ドキュメント](https://ai.google.dev/docs)
- [Gemini API 料金](https://ai.google.dev/pricing)

---

**最終更新**: 2025年1月
**ステータス**: ✅ 実装完了

