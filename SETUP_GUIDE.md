# セットアップガイド

## 📦 初回セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd webapp
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`ENV_EXAMPLE.txt`をコピーして`.env`ファイルを作成します：

```bash
# Windows
copy ENV_EXAMPLE.txt .env

# Mac/Linux
cp ENV_EXAMPLE.txt .env
```

`.env`ファイルを編集して、実際の値を設定してください：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

---

## 🗄️ Supabaseのセットアップ

### 1. Supabaseプロジェクトの作成

1. https://supabase.com にアクセス
2. アカウントを作成（無料）
3. 「New Project」をクリック
4. プロジェクト名、データベースパスワード、リージョンを設定
5. プロジェクトが作成されるまで待つ（数分かかります）

### 2. APIキーの取得

1. Supabase Dashboard → Settings → API
2. `Project URL`をコピー → `.env`の`VITE_SUPABASE_URL`に設定
3. `anon public`キーをコピー → `.env`の`VITE_SUPABASE_ANON_KEY`に設定

### 3. マイグレーションの実行

#### 方法1: Supabase Dashboard（推奨）

1. Dashboard → SQL Editorを開く
2. `supabase/migrations/001_initial.sql`の内容をコピーして実行
3. 成功したら、`supabase/migrations/002_update_store_summary.sql`を実行

#### 方法2: Supabase CLI

```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref your-project-ref

# マイグレーションを適用
supabase db push
```

### 4. シードデータの投入（オプション）

サンプルデータを投入する場合：

1. SQL Editorを開く
2. `supabase/seed.sql`の内容をコピーして実行

---

## ✅ 動作確認

### 開発環境での確認

1. 開発サーバーを起動: `npm run dev`
2. ブラウザで `http://localhost:3000` を開く
3. コンソール（F12）を開いて、エラーがないか確認
4. 「✅ Supabase接続成功」が表示されることを確認

### 確認項目

- ✅ ホームページが表示される
- ✅ 「商品から探す」「位置情報から探す」ボタンが表示される
- ✅ 今日更新されたチラシセクションが表示される
- ✅ 店舗一覧が表示される（位置情報を許可した場合）
- ✅ 店舗詳細ページが表示される
- ✅ 地図が表示される

---

## 🚀 本番環境へのデプロイ

詳細は `DEPLOYMENT_GUIDE.md` を参照してください。

---

## 🔧 トラブルシューティング

### 問題1: 環境変数が読み込まれない

**原因**: `.env`ファイルが正しく作成されていない、または値が間違っている

**解決方法**:
1. `.env`ファイルがプロジェクトルートに存在するか確認
2. 環境変数の値が正しいか確認（URLの末尾にスラッシュがないか）
3. 開発サーバーを再起動

### 問題2: Supabase接続エラー

**原因**: APIキーが正しく設定されていない

**解決方法**:
1. Supabase DashboardでAPIキーを再確認
2. `.env`ファイルの値を再確認
3. 開発サーバーを再起動

### 問題3: データが表示されない

**原因**: マイグレーションが実行されていない、またはデータが投入されていない

**解決方法**:
1. マイグレーションが正しく実行されているか確認
2. SQL Editorでデータが存在するか確認
3. 必要に応じてシードデータを投入

---

## 📚 関連ドキュメント

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - デプロイガイド
- [FREE_IMPLEMENTATION_PLAN.md](./FREE_IMPLEMENTATION_PLAN.md) - 無料で実装できる項目
- [AGGREGATION_IMPLEMENTATION.md](./AGGREGATION_IMPLEMENTATION.md) - 集計処理の実装詳細




