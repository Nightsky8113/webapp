# eval()制限の回避方法

Vercelでは`eval()`が制限されているため、外部ライブラリ（jQuery/Lightbox2）が内部的に`eval()`を使用している場合に問題が発生します。

## 🔍 問題の原因

1. **jQuery/Lightbox2**: CDNから読み込まれるライブラリが内部的に`eval()`を使用
2. **VercelのCSP制限**: `unsafe-eval`を許可しても、一部の環境では制限される場合がある

## ✅ 解決方法

### 方法1: ライブラリをnpmパッケージとしてインストール（推奨）

jQueryやLightbox2をnpmパッケージとしてインストールし、Viteでバンドルすることで、`eval()`を使用しないビルド済みバージョンを使用できます。

---

## 📋 実装計画

### ステップ1: npmパッケージをインストール

```bash
npm install jquery lightbox2 leaflet
```

### ステップ2: インポート方法を変更

`index.html`からCDN読み込みを削除し、JavaScriptからインポート：

```javascript
import jQuery from 'jquery';
import lightbox from 'lightbox2';
import L from 'leaflet';
```

### ステップ3: グローバルに設定

```javascript
window.$ = window.jQuery = jQuery;
window.lightbox = lightbox;
window.L = L;
```

---

**注意**: これは大きな変更になるため、実装前に確認が必要です。

現在のコード内では直接的な`eval()`の使用はありませんが、外部ライブラリが原因の可能性が高いです。

---

**最終更新**: 2025年1月

