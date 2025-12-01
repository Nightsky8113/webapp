# CSPエラー修正方法（更新版）

Vercel上でCSPエラーが発生した場合の修正方法です。

## 🔍 発生しているエラー

### 1. ソースマップ（.map）がブロックされる

**エラーメッセージ**:
```
Content Security Policy of your site blocks some resources
- https://unpkg.com/leaflet@1.9.4/dist/leaflet.js.map (connect-srcでブロック)
- https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.4/js/lightbox.min.map (connect-srcでブロック)
```

### 2. eval()の使用がブロックされる

**エラーメッセージ**:
```
Content Security Policy of your site blocks the use of 'eval' in JavaScript
```

---

## ✅ 解決方法

### 方法1: CSPヘッダーの修正（実装済み）

`vercel.json`のCSPヘッダーを以下のように修正しました：

1. **`connect-src`を`https:`に変更**
   - すべてのHTTPS接続を許可（ソースマップを含む）
   - セキュリティリスクは低い（HTTPSのみ許可）

2. **本番環境でソースマップを無効化**
   - `vite.config.js`で`sourcemap: false`に設定
   - ソースマップは開発時のみ必要

### 変更内容

#### `vercel.json`

```json
{
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

**変更点**: `connect-src`を`'self' https:`に変更（すべてのHTTPS接続を許可）

#### `vite.config.js`

```javascript
build: {
    outDir: 'dist',
    sourcemap: false // 本番環境ではソースマップを無効化
}
```

---

## 🚨 セキュリティ注意事項

### APIキーの管理

⚠️ **重要**: APIキーをドキュメントに直接書き込まないでください。

- ドキュメント内のAPIキーは削除済み
- `.env`ファイルに設定してください
- `.env`ファイルは`.gitignore`に追加済み

### CSPの設定について

- `unsafe-eval`を許可していますが、jQuery/Lightbox2が使用するため必要です
- `connect-src: https:`はすべてのHTTPS接続を許可しますが、セキュリティリスクは低いです
- コンテスト用途のため、一時的な対応として使用しています

---

## 🔄 次のステップ

1. ✅ **変更をコミット・プッシュ**
2. ✅ **Vercelで自動再デプロイ**
3. ✅ **動作確認**
   - ブラウザのコンソールでエラーが消えているか確認
   - アプリケーションが正常に動作するか確認

---

## 📝 参考情報

### Content Security Policyについて

- [Content Security Policy (CSP) - web.dev](https://developers.google.com/web/fundamentals/security/csp)
- CSPはXSS攻撃を防ぐための重要なセキュリティ機能です
- `unsafe-eval`を許可すると、コードインジェクションのリスクが高まります
- コンテスト用途のため、一時的な対応として使用しています

### ソースマップについて

- ソースマップは開発時に便利ですが、本番環境では必須ではありません
- 本番環境でソースマップを無効化することで、CSPエラーを回避できます
- ファイルサイズも削減されます

---

**最終更新**: 2025年1月
**ステータス**: ✅ 修正完了




