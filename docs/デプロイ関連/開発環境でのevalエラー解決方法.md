# 開発環境でのevalエラー解決方法

## 🔍 問題

`npm run dev`を実行すると、以下のエラーが表示される：

```
Content Security Policy of your site blocks the use of 'eval' in JavaScript
```

## 原因

**Viteの開発サーバー**がホットリロード（HMR: Hot Module Replacement）機能のために内部的に`eval()`を使用しています。これは開発環境では正常な動作です。

## ✅ 解決方法

### 方法1: 開発環境でCSPを緩める（推奨）

開発環境でのみCSPを緩めるように設定します。

#### `vite.config.js`にCSP設定を追加

```javascript
export default defineConfig({
    plugins: [
        react(), 
        UnoCSS()
    ],
    server: {
        port: 3000,
        open: true,
        // 開発環境でのCSPを設定（ViteのHMR用にunsafe-evalを許可）
        headers: {
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: ws: wss:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';"
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: false
    }
});
```

**注意点**:
- `ws: wss:`を追加（ViteのHMR用WebSocket接続）
- `unsafe-eval`を許可（開発環境のみ）
- 本番環境では`vercel.json`のCSPが適用されるため、開発環境でのみ有効

### 方法2: CSPを完全に無効化（開発環境のみ）

開発環境でのみCSPを無効化します：

```javascript
server: {
    port: 3000,
    open: true,
    headers: {
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    }
}
```

**注意**: セキュリティ上の理由から、本番環境では使用しないでください。

---

## 📋 実装のポイント

1. **開発環境と本番環境でCSPを分ける**
   - 開発環境: `vite.config.js`でCSPを設定（`unsafe-eval`を許可）
   - 本番環境: `vercel.json`でCSPを設定（`unsafe-eval`を許可しない）

2. **ViteのHMRのために必要な設定**
   - `unsafe-eval`: ViteのHMRが使用
   - `ws: wss:`: WebSocket接続（HMR用）

---

**最終更新**: 2025年1月



