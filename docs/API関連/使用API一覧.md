# 使用API一覧

このドキュメントでは、アプリケーションで使用しているすべての外部API、サービス、ライブラリをまとめています。

## 📊 概要

| カテゴリ | サービス名 | 用途 | 必須/任意 | 料金 |
|---------|-----------|------|----------|------|
| データベース | Supabase | データベース・ストレージ | 必須 | 無料枠あり |
| OCR | Google Cloud Vision API | 画像からのテキスト抽出 | 任意 | 無料枠あり |
| AI | Google Gemini API | テキスト構造化 | 任意 | 無料枠あり |
| 店舗検索 | Overpass API | 近くの店舗検索 | 必須 | 完全無料 |
| ルーティング | OSRM | 徒歩時間計算 | 必須 | 完全無料 |
| 地図 | OpenStreetMap | 地図タイル | 必須 | 完全無料 |
| 地図ライブラリ | Leaflet.js | 地図表示 | 必須 | オープンソース |

---

## 🔑 必須API（アプリの基本機能に必要）

### 1. Supabase API

**用途**: データベース（PostgreSQL）とストレージ（画像保存）

**実装ファイル**: 
- `src/services/supabase.js`
- `src/services/dataService.js`
- `src/services/storageService.js`

**環境変数**:
- `VITE_SUPABASE_URL` - SupabaseプロジェクトのURL
- `VITE_SUPABASE_ANON_KEY` - Supabase公開キー

**APIエンドポイント**:
- データベース: `https://{project-id}.supabase.co/rest/v1/`
- ストレージ: `https://{project-id}.supabase.co/storage/v1/`

**無料枠**:
- データベース: 500MB
- ストレージ: 1GB
- APIリクエスト: 月間50,000リクエスト

**詳細**: 
- [Supabase公式サイト](https://supabase.com/)
- `docs/実装詳細/Supabase_Storage設定ガイド.md`

---

### 2. Overpass API

**用途**: OpenStreetMapから近くのスーパーマーケットを検索

**実装ファイル**: `src/services/overpassApi.js`

**APIエンドポイント**: 
```
https://overpass-api.de/api/interpreter
```

**特徴**:
- 完全無料
- APIキー不要
- 30分間のキャッシュ機能でAPI呼び出し回数を削減

**検索条件**:
- `shop=supermarket` タグを持つ店舗を検索
- 指定された半径（デフォルト2km）内の店舗を取得

**詳細**: Overpass APIはOpenStreetMapのデータをクエリするためのAPIです。

---

### 3. OSRM (Open Source Routing Machine)

**用途**: 店舗までの徒歩時間を計算

**実装ファイル**: `src/services/walkingTimeService.js`

**APIエンドポイント**:
```
https://router.project-osrm.org/route/v1/walking/{lng1},{lat1};{lng2},{lat2}?overview=false&steps=false
```

**特徴**:
- 完全無料
- APIキー不要
- 公開インスタンスを使用

**詳細**: OSRMはOpenStreetMapのデータを使用してルーティングを行うオープンソースプロジェクトです。

---

### 4. OpenStreetMap（地図タイル）

**用途**: 地図の表示

**実装ファイル**: 
- `src/utils/map.js`
- `src/pages/StoreDetailPage.js`

**タイルURL**:
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

**特徴**:
- 完全無料
- APIキー不要

**詳細**: OpenStreetMapはオープンデータの地図サービスです。タイルマップを提供しています。

---

### 5. Leaflet.js

**用途**: 地図表示ライブラリ

**実装**: CDN経由で読み込み（`index.html`）

**バージョン**: 1.9.4

**CDN**:
- CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
- JS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

**特徴**:
- オープンソース（BSD 2-Clause License）
- 軽量で高速
- モバイル対応

**詳細**: [Leaflet公式サイト](https://leafletjs.com/)

---

## 🎯 任意API（OCR処理機能用）

### 6. Google Cloud Vision API

**用途**: チラシ画像からテキストを抽出（OCR処理）

**実装ファイル**: `src/services/visionService.js`

**環境変数**:
- `VITE_GOOGLE_CLOUD_VISION_API_KEY` - Google Cloud Vision APIキー

**APIエンドポイント**:
```
https://vision.googleapis.com/v1/images:annotate?key={apiKey}
```

**無料枠**:
- 毎月1,000リクエストまで無料
- $300の無料クレジット（90日間）
- コンテスト用途なら完全無料で運用可能

**制限事項**:
- 画像サイズ: 20MB以下
- 日本語優先設定あり

**詳細**: 
- `docs/API関連/Google Cloud Vision APIキー取得手順.md`
- `docs/API関連/環境変数設定ガイド.md`

---

### 7. Google Gemini API

**用途**: OCRで抽出したテキストを商品情報として構造化

**実装ファイル**: `src/services/geminiService.js`

**環境変数**:
- `VITE_GOOGLE_GEMINI_API_KEY` - Google Gemini APIキー

**APIエンドポイント**:
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

**使用モデル**: `gemini-2.0-flash`

**無料枠**:
- 個人開発・テスト目的でほぼ無制限に無料
- レート制限: 1分15リクエスト、1日1,500リクエストまで
- コンテスト用途なら完全無料で運用可能

**詳細**: 
- `docs/API関連/Gemini API設定ガイド.md`
- `docs/API関連/Gemini API使用量確認方法.md`
- `docs/API関連/環境変数設定ガイド.md`

---

## 🔄 API統合フロー

### OCR処理フロー

1. **画像アップロード** → Supabase Storageに保存
2. **Vision API** → 画像からテキストを抽出（OCR）
3. **Gemini API** → 抽出したテキストを商品情報として構造化
4. **データベース保存** → Supabaseデータベースに商品情報を保存

詳細: `docs/API関連/外部API統合準備状況.md`

---

## 📦 使用ライブラリ（CDN経由）

### Leaflet.js
- **バージョン**: 1.9.4
- **用途**: 地図表示
- **ライセンス**: BSD 2-Clause License

---

## 🔒 セキュリティ・CSP設定

すべてのAPI呼び出しはContent Security Policy (CSP)で許可されています。

**CSP設定ファイル**: `vercel.json`

**許可されているドメイン**:
- `https://*.supabase.co` - Supabase
- `https://overpass-api.de` - Overpass API
- `https://router.project-osrm.org` - OSRM
- `https://vision.googleapis.com` - Google Cloud Vision API
- `https://generativelanguage.googleapis.com` - Google Gemini API
- `https://*.tile.openstreetmap.org` - OpenStreetMapタイル
- `https://unpkg.com` - Leaflet CDN

詳細: `vercel.json`を参照

---

## 💰 料金まとめ

| サービス | 無料枠 | 備考 |
|---------|--------|------|
| Supabase | 500MB DB + 1GB Storage | コンテスト用途なら十分 |
| Overpass API | 完全無料 | 制限なし |
| OSRM | 完全無料 | 公開インスタンス使用 |
| OpenStreetMap | 完全無料 | 制限なし |
| Google Cloud Vision API | 1,000リクエスト/月 + $300クレジット | コンテスト用途なら十分 |
| Google Gemini API | ほぼ無制限（個人開発） | コンテスト用途なら十分 |

**結論**: コンテスト用途であれば、すべての機能を完全無料で利用可能です。

---

## 📚 関連ドキュメント

### セットアップ
- `docs/API関連/環境変数設定ガイド.md` - 環境変数の設定方法
- `docs/API関連/外部API統合準備状況.md` - API統合の実装状況

### APIキー取得
- `docs/API関連/Google Cloud Vision APIキー取得手順.md`
- `docs/API関連/Gemini API設定ガイド.md`

### トラブルシューティング
- `docs/API関連/APIキー制限設定のトラブルシューティング.md`
- `docs/API関連/Gemini API使用量確認方法.md`

### 実装詳細
- `docs/実装詳細/画像アップロード機能の詳細.md`
- `docs/実装詳細/OCR結果確認機能の実装.md`
- `docs/実装詳細/ジャンル分け機能の実装.md`

---

**最終更新**: 2025年1月



