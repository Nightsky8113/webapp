# CSPエラー修正方法

Vercel上で「Content Security Policy blocks the use of 'eval'」エラーが発生した場合の修正方法です。

## 🔍 問題の原因

1. **jQuery/Lightbox2**: 外部CDNから読み込まれるライブラリがeval()を使用している可能性
2. **Viteの開発ビルド**: 一部のプラグインがeval()を使用する場合がある
3. **VercelのデフォルトCSP**: 厳しいCSPが設定されている場合がある

## ✅ 解決方法

### 方法1: vercel.jsonにCSPヘッダーを追加（実装済み）

`vercel.json`に以下の設定を追加しました：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://code.jquery.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://router.project-osrm.org https://vision.googleapis.com https://api.openai.com https://*.supabase.storage; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ]
}
```

**注意**: `unsafe-eval`を許可していますが、これはセキュリティリスクがあります。コンテスト用途のため、一時的な対応として使用します。

### 方法2: Vercelの環境変数でCSPを無効化（推奨しない）

Vercelの環境変数でCSPを無効化することもできますが、セキュリティ上の理由から推奨しません。

### 方法3: ライブラリをnpmパッケージとしてインストール（将来的な改善）

将来的には、jQueryやLightbox2をnpmパッケージとしてインストールし、Viteでバンドルすることで、より安全な方法で使用できます。

```bash
npm install jquery lightbox2
```

ただし、これは大きな変更になるため、現時点では対応しません。

## 🚀 デプロイ後の確認

1. **Vercelに再デプロイ**
   - 変更をコミット・プッシュ
   - Vercelが自動的に再デプロイを実行

2. **動作確認**
   - ブラウザのコンソールでエラーが消えているか確認
   - アプリケーションが正常に動作するか確認

3. **CSPヘッダーの確認**
   - ブラウザの開発者ツール → Network
   - 任意のリソースを選択 → Headers → `Content-Security-Policy`を確認

## ⚠️ 注意事項

1. **`unsafe-eval`の使用**
   - セキュリティリスクがあるため、本番環境ではできるだけ避けるべき
   - コンテスト用途のため、一時的な対応として使用

2. **今後の改善**
   - jQuery/Lightbox2をnpmパッケージとしてインストール
   - Viteでバンドルして、CSPをより厳格にする

## 📝 関連ファイル

- `vercel.json` - Vercel設定ファイル（CSPヘッダー追加済み）
- `vite.config.js` - Vite設定ファイル
- `index.html` - HTMLファイル（外部ライブラリの読み込み）

---

**最終更新**: 2025年1月
**ステータス**: ✅ 修正済み（vercel.jsonにCSPヘッダー追加）





