# eval()使用箇所の詳細調査結果

## 🔍 調査結果

### 1. インラインスクリプト内での発生

#### 発見された問題箇所（8箇所）

**`onclick`属性を使用している箇所**:

1. `src/main.js` (4箇所)
   - 27行目: `onclick="window.location.reload()"`
   - 84行目: `onclick="window.location.reload()"`
   - 123行目: `onclick="window.location.reload()"`
   - 152行目: `onclick="window.location.reload()"`

2. `src/router.js` (1箇所)
   - 198行目: `onclick="window.location.hash = '/home'"`

3. `src/pages/SearchResultsPage.js` (1箇所)
   - 88行目: `onclick="window.location.hash = '/store/${itemData.storeId}'"`

4. `src/pages/StoresPage.js` (1箇所)
   - 211行目: `onclick="window.location.hash = '/store/${store.id}'"`

5. `src/templates/components/search-result-item.html` (1箇所)
   - 24行目: `onclick="window.location.hash = '/store/${storeId}'"`

#### 問題点

- **`onclick`属性は文字列として評価されるため、厳格なCSPではブロックされる可能性がある**
- セキュリティ上の理由から、インラインイベントハンドラーは推奨されない
- **これがeval()エラーの原因の可能性がある**

---

### 2. サードパーティライブラリやフレームワーク内部での発生

#### Leaflet.js（CDNから読み込み）

- **場所**: `index.html` 17行目
- **URL**: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- **調査結果**: Leaflet.jsは通常`eval()`を使用しませんが、CDNから読み込むと問題が発生する可能性がある

#### その他のライブラリ

- **UnoCSS**: Viteプラグインとして使用（eval()を使用する可能性は低い）
- **Vite**: 開発環境でのHMR用に`eval()`を使用（本番環境では問題なし）
- **@vitejs/plugin-react**: Reactプラグイン（eval()を使用する可能性は低い）

---

## ✅ 修正が必要な箇所

### 優先度1: `onclick`属性の削除

すべての`onclick`属性を削除し、イベントリスナーに置き換える必要があります。

### 優先度2: Leaflet.jsの確認

Leaflet.jsがCDNから読み込まれているため、npmパッケージとしてインストールすることを検討する必要があります。

---

**最終更新**: 2025年1月
