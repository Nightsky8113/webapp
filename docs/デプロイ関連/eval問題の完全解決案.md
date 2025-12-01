# eval()問題の完全解決案

Vercelでeval()が使用できない問題を解決するための完全なプランです。

## 🔍 問題点

1. **jQueryとLightbox2**: CDNから読み込まれるライブラリが内部的に`eval()`を使用
2. **CSPの`<meta>`タグ**: Viteのビルドで`<head>`の外に配置される可能性
3. **Vercelの制限**: `unsafe-eval`が許可されていない

## ✅ 解決策

### 1. jQueryとLightbox2を削除

**理由**:
- jQuery: eval()を使用している
- Lightbox2: jQueryに依存し、eval()を使用している

**代替案**: Vanilla JavaScriptで画像拡大機能を実装

---

### 2. Vanilla JSで画像拡大機能を実装

**実装内容**:
- モーダルオーバーレイ
- 画像の拡大表示
- クリックで閉じる
- ESCキーで閉じる
- **eval()を使用しない**

---

### 3. CSPの`<meta>`タグを削除

**理由**: Viteのビルドで`<head>`の外に配置される可能性がある

**代替案**: `vercel.json`のみでCSPを設定

---

## 📋 実装手順

1. ✅ Vanilla JSの画像拡大機能を作成
2. ✅ `index.html`からjQuery/Lightbox2のCDN読み込みを削除
3. ✅ CSPの`<meta>`タグを削除
4. ✅ Lightbox2の使用箇所を新しい実装に置き換え
5. ✅ すべてのコードをバグチェック
6. ✅ ビルドと動作確認

---

**最終更新**: 2025年1月



