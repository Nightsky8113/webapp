# CSPエラー完全修正版

Vercel上でCSPエラーが発生し、アプリが読み込み中のまま動かない問題の修正方法です。

## 🔍 問題の原因

1. **ソースマップ（.mapファイル）が`connect-src`でブロックされている**
   - Leaflet、Lightbox2、UnoCSSのソースマップがブロックされている
   - ソースマップは本番環境では不要ですが、ブラウザが自動的にリクエストする

2. **CSPヘッダーの設定が反映されていない**
   - `vercel.json`の変更がまだデプロイされていない可能性
   - Vercelのキャッシュが古い設定を使用している可能性

3. **アプリが読み込み中のまま動かない**
   - JavaScriptの実行がブロックされている可能性
   - 初期化処理でエラーが発生している可能性

---

## ✅ 解決方法

### 方法1: `vercel.json`のCSPヘッダーを完全に修正

`vercel.json`のCSPヘッダーを以下のように設定：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://code.jquery.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ]
}
```

**重要なポイント**:
- `connect-src 'self' https:` - すべてのHTTPS接続を許可（ソースマップを含む）
- `script-src`に`'unsafe-eval'`を含める - jQuery/Lightbox2が必要

### 方法2: ソースマップを無効化（推奨）

本番環境ではソースマップは不要なので、完全に無効化します：

`vite.config.js`:
```javascript
build: {
    outDir: 'dist',
    sourcemap: false // 本番環境ではソースマップを無効化
}
```

### 方法3: HTMLの`<meta>`タグでCSPを設定（代替案）

`vercel.json`の設定が反映されない場合、`index.html`に`<meta>`タグを追加：

```html
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://code.jquery.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';">
</head>
```

**注意**: `<meta>`タグのCSPは`report-uri`ディレクティブをサポートしていません。

---

## 🚀 デプロイ手順

1. **変更をコミット・プッシュ**
   ```bash
   git add vercel.json vite.config.js
   git commit -m "Fix CSP errors: allow all HTTPS connections and disable sourcemaps"
   git push
   ```

2. **Vercelで自動再デプロイ**
   - GitHubにプッシュすると、Vercelが自動的に再デプロイを実行
   - デプロイが完了するまで1-2分待つ

3. **ブラウザのキャッシュをクリア**
   - ブラウザの開発者ツールを開く（F12）
   - ネットワークタブで「Disable cache」にチェック
   - ページを再読み込み（Ctrl+Shift+R または Cmd+Shift+R）

4. **動作確認**
   - ブラウザのコンソールでエラーが消えているか確認
   - アプリケーションが正常に動作するか確認

---

## 🔍 トラブルシューティング

### まだエラーが出る場合

1. **Vercelの設定を確認**
   - Vercel Dashboard → プロジェクト → Settings → Environment Variables
   - CSP関連の環境変数が設定されていないか確認

2. **ブラウザの開発者ツールでCSPヘッダーを確認**
   - Networkタブ → 任意のリソースを選択 → Headers
   - `Content-Security-Policy`ヘッダーが正しく設定されているか確認

3. **強制的に再デプロイ**
   - Vercel Dashboard → プロジェクト → Deployments
   - 最新のデプロイメントの「...」メニュー → 「Redeploy」

### アプリがまだ読み込み中のままの場合

1. **ブラウザのコンソールでエラーを確認**
   - 開発者ツール（F12）→ Consoleタブ
   - エラーメッセージを確認

2. **ネットワークタブでリソースの読み込みを確認**
   - 開発者ツール（F12）→ Networkタブ
   - ブロックされているリソースがないか確認

3. **Supabase環境変数が設定されているか確認**
   - Vercel Dashboard → Environment Variables
   - `VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が設定されているか確認

---

## 📝 参考情報

### Content Security Policyについて

- [Content Security Policy (CSP) - web.dev](https://developers.google.com/web/fundamentals/security/csp)
- CSPはXSS攻撃を防ぐための重要なセキュリティ機能です
- `unsafe-eval`を許可すると、コードインジェクションのリスクが高まります

### ソースマップについて

- ソースマップは開発時に便利ですが、本番環境では不要です
- ソースマップを無効化することで、ファイルサイズも削減されます
- ブラウザが自動的にリクエストするため、CSPでブロックされるとエラーが出ます

---

**最終更新**: 2025年1月
**ステータス**: ✅ 修正完了


