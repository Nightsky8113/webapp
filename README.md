# 🛒 チラシ検索アプリ

近くのスーパーマーケットのチラシからお得な商品を検索できるWebアプリケーションです。

## 📋 概要

このアプリケーションは、ユーザーの位置情報を使って近くのスーパーマーケットのチラシから商品を検索できるサービスです。

### 主な機能

- 🔍 **商品から探す**: 商品名で検索またはジャンルから選択して商品を探す
- 📍 **位置情報から探す**: 現在地から近い順に店舗を表示
- 🗺️ **地図表示**: 店舗の位置を地図上で確認
- 🖼️ **チラシ画像表示**: 店舗のチラシ画像を拡大表示
- ❤️ **お気に入り機能**: お気に入りの店舗を保存
- 📤 **画像アップロード**: 管理者がチラシ画像をアップロード可能

## 🛠️ 技術スタック

### フロントエンド
- **Vite** - ビルドツール
- **UnoCSS** - CSS フレームワーク
- **Vanilla JavaScript** - フレームワークなしの純粋なJavaScript
- **Leaflet.js** - 地図表示
- **Lightbox2** - 画像拡大表示

### バックエンド
- **Supabase** - バックエンドサービス（PostgreSQL + Storage）
- **Overpass API** - 位置情報からの店舗検索（無料）

### デプロイ
- **Vercel** - フロントエンドデプロイ

## 📁 プロジェクト構成

```
webapp/
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   ├── pages/           # ページコンポーネント
│   ├── services/        # データサービス（Supabase接続）
│   ├── templates/       # HTMLテンプレート
│   ├── styles/          # CSSファイル
│   └── utils/           # ユーティリティ関数
├── supabase/
│   ├── migrations/      # データベースマイグレーション
│   └── seed.sql         # シードデータ
├── docs/
│   ├── 開発者向け/      # 開発者向けドキュメント
│   ├── 利用者向け/      # 利用者向けドキュメント
│   ├── API関連/         # API関連ドキュメント
│   ├── デプロイ関連/    # デプロイ関連ドキュメント
│   ├── 実装詳細/        # 実装詳細ドキュメント
│   └── セットアップ関連/ # セットアップ関連ドキュメント
├── dist/                # ビルド出力
├── README.md            # プロジェクト概要
├── SETUP_GUIDE.md       # セットアップガイド
├── DEPLOYMENT_GUIDE.md  # デプロイガイド
└── PROGRESS_REPORT.md   # 進捗レポート
```

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`ENV_EXAMPLE.txt`をコピーして`.env`ファイルを作成：

```bash
# Windows
copy ENV_EXAMPLE.txt .env

# Mac/Linux
cp ENV_EXAMPLE.txt .env
```

`.env`ファイルを編集して、Supabaseの認証情報を設定：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_STORE_SEARCH_API=overpass
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### 4. ビルド

```bash
npm run build
```

## 📚 ドキュメント

### 主要ドキュメント
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - 詳細なセットアップガイド
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - デプロイガイド
- **[PROGRESS_REPORT.md](PROGRESS_REPORT.md)** - プロジェクト進捗レポート

### 開発者向け
- **[docs/開発者向け/ソースコード構造ガイド_初心者向け.md](docs/開発者向け/ソースコード構造ガイド_初心者向け.md)** - ソースコード構造ガイド（初心者向け）
- **[docs/開発者向け/ソースコード構造ガイド_上級者向け.md](docs/開発者向け/ソースコード構造ガイド_上級者向け.md)** - ソースコード構造ガイド（上級者向け）

### 利用者向け
- **[docs/利用者向け/使い方ガイド.md](docs/利用者向け/使い方ガイド.md)** - チラシ検索アプリ 使い方ガイド

### 実装詳細
- **[docs/実装詳細/Supabase_Storage設定ガイド.md](docs/実装詳細/Supabase_Storage設定ガイド.md)** - Supabase Storage設定ガイド
- **[docs/実装詳細/画像アップロード機能の詳細.md](docs/実装詳細/画像アップロード機能の詳細.md)** - 画像アップロード機能の詳細
- **[docs/実装詳細/データ集計処理の詳細.md](docs/実装詳細/データ集計処理の詳細.md)** - データ集計処理の詳細
- **[docs/実装詳細/アップロードUI実装まとめ.md](docs/実装詳細/アップロードUI実装まとめ.md)** - アップロードUI実装まとめ

### API関連
- **[docs/API関連/API切り替え戦略.md](docs/API関連/API切り替え戦略.md)** - API切り替え戦略

### デプロイ関連
- **[docs/デプロイ関連/デプロイチェックリスト.md](docs/デプロイ関連/デプロイチェックリスト.md)** - デプロイチェックリスト

## 🔧 主要な機能

### データベース機能

- **自動集計処理**: 店舗ごとの最安価商品を自動計算（PostgreSQL関数・トリガー）
- **キャッシュ機能**: データ取得を5分間キャッシュ（パフォーマンス向上）
- **データ整合性**: データベース関数で自動的にデータを更新

### 画像アップロード機能

- **Supabase Storage統合**: チラシ画像をSupabase Storageに保存
- **データベース統合**: アップロードした画像URLを自動的にデータベースに保存
- **アップロードUI**: `/admin/upload` で管理者が画像をアップロード可能

### 位置情報機能

- **Overpass API統合**: 位置情報から近くのスーパーマーケットを検索
- **距離計算**: ユーザーの現在地からの距離を自動計算
- **地図表示**: Leaflet.jsで店舗の位置を地図上に表示

## 🗄️ データベース構造

### テーブル

- `genres` - 商品ジャンル
- `stores` - 店舗情報
- `flyers` - チラシ情報
- `items` - 商品情報

### 自動集計

- `stores.summary_best_item_name` - 最安価商品名（自動計算）
- `stores.summary_best_item_price` - 最安価商品価格（自動計算）
- `stores.summary_best_item_id` - 最安価商品ID（自動計算）

詳細は `supabase/migrations/README.md` を参照してください。

## 📊 実装進捗

**約90%完成**

- ✅ フロントエンド: 100%完了
- ✅ データベース: 100%完了
- ✅ 画像アップロード機能: 100%完了
- ✅ デプロイ準備: 100%完了
- ⏸️ 外部API統合: 未実装（コストがかかるため後回し）

詳細は [PROGRESS_REPORT.md](PROGRESS_REPORT.md) を参照してください。

## 🔐 セキュリティ

- HTMLエスケープ（XSS対策）
- 環境変数の適切な管理
- RLS（Row Level Security）設定
- 入力値の検証

## 📝 ライセンス

このプロジェクトのライセンス情報を記載してください。

## 🤝 コントリビューション

コントリビューションのガイドラインを記載してください。

