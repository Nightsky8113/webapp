# eval()完全削除完了報告

## ✅ 実施した修正

### 1. インラインスクリプト（onclick属性）の削除

**削除した箇所（8箇所）**:

1. ✅ `src/main.js` (4箇所)
   - タイムアウト時の再読み込みボタン → ID追加 + イベントリスナー
   - 初期化失敗時の再読み込みボタン → ID追加 + イベントリスナー
   - グローバルエラー時の再読み込みボタン → ID追加 + イベントリスナー
   - Promise拒否時の再読み込みボタン → ID追加 + イベントリスナー

2. ✅ `src/router.js` (1箇所)
   - ページ描画エラー時の「ホームに戻る」ボタン → ID追加 + イベントリスナー

3. ✅ `src/pages/SearchResultsPage.js` (1箇所)
   - フォールバックHTML内の「店舗を見る」ボタン → `data-store-id`属性 + イベントリスナー

4. ✅ `src/pages/StoresPage.js` (1箇所)
   - 地図ポップアップ内の「詳細を見る」ボタン → `data-store-id`属性 + イベントリスナー（ポップアップが開いたときに追加）

5. ✅ `src/templates/components/search-result-item.html` (1箇所)
   - 「店舗を見る」ボタン → `data-store-id`属性 + イベントリスナー（`attachSearchResultsPageEvents`で追加）

### 2. イベントリスナーの追加

すべての`onclick`属性を削除し、以下の方法でイベントリスナーを追加：

- **通常のボタン**: DOM要素に直接イベントリスナーを追加
- **動的に生成されるボタン**: イベントデリゲーションまたは、生成後にイベントリスナーを追加
- **Leafletポップアップ内のボタン**: `popupopen`イベントで、ポップアップが開いたときにイベントリスナーを追加

---

## 🔍 確認結果

### eval()の使用箇所
- ✅ **0箇所** - すべての`onclick`属性を削除
- ✅ `eval()`の直接使用: なし
- ✅ `new Function()`の使用: なし
- ✅ 文字列形式の`setTimeout`/`setInterval`: なし

### サードパーティライブラリ

1. **Leaflet.js** (CDNから読み込み)
   - **場所**: `index.html` 17行目
   - **状態**: 引き続きCDNから読み込み
   - **調査結果**: Leaflet.jsは通常`eval()`を使用しませんが、CDNから読み込む場合は、CSPで許可する必要があります

2. **UnoCSS**
   - Viteプラグインとして使用
   - `eval()`を使用する可能性は低い

3. **Vite**
   - 開発環境でのHMR用に`eval()`を使用（開発環境のみ）
   - 本番環境では問題なし

---

## 📋 変更されたファイル

### 修正したファイル
- ✅ `src/main.js` - すべての`onclick`属性を削除し、イベントリスナーに置き換え
- ✅ `src/router.js` - `onclick`属性を削除し、イベントリスナーに置き換え
- ✅ `src/pages/SearchResultsPage.js` - `onclick`属性を削除し、イベントリスナーに置き換え
- ✅ `src/pages/StoresPage.js` - Leafletポップアップ内の`onclick`属性を削除
- ✅ `src/templates/components/search-result-item.html` - `onclick`属性を削除し、`data-store-id`属性に変更
- ✅ `src/utils/map.js` - Leafletポップアップが開いたときにイベントリスナーを追加する機能を追加

---

## ⚠️ 注意点

### Leaflet.jsについて

Leaflet.jsはCDNから読み込まれていますが、通常`eval()`を使用しません。ただし、厳格なCSP環境では問題が発生する可能性があります。

**将来的な改善案**:
- Leaflet.jsをnpmパッケージとしてインストールし、Viteでバンドルする
- これにより、CSPの制限をより緩和できる可能性がある

---

## ✅ 確認済み

- ✅ すべての`onclick`属性を削除
- ✅ イベントリスナーに置き換え
- ✅ `eval()`の直接使用: なし
- ✅ `new Function()`の使用: なし
- ✅ 文字列形式の`setTimeout`/`setInterval`: なし

---

**最終更新**: 2025年1月
**ステータス**: ✅ 完了






