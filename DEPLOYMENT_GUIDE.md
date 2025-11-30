# デプロイガイド

## 📋 デプロイ前の準備

### 1. 環境変数の確認

`.env.example`をコピーして`.env`ファイルを作成し、必要な環境変数を設定してください。

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集して、実際の値を設定
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 2. ビルドの確認

ローカルでビルドが成功することを確認してください。

```bash
npm run build
```

ビルドが成功すると、`dist`フォルダが作成されます。

---

## 🚀 Vercelへのデプロイ

### 方法1: Vercel Dashboardからデプロイ（推奨）

1. **Vercelにログイン**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン（推奨）

2. **プロジェクトをインポート**
   - 「Add New...」→「Project」
   - GitHubリポジトリを選択、またはGitHubにプッシュしてからインポート

3. **ビルド設定**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`（自動検出される）
   - Output Directory: `dist`（自動検出される）
   - Install Command: `npm install`（自動検出される）

4. **環境変数の設定**
   - Settings → Environment Variables
   - 以下の環境変数を追加：
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

5. **デプロイ**
   - 「Deploy」ボタンをクリック
   - デプロイが完了すると、URLが発行されます

### 方法2: Vercel CLIでデプロイ

```bash
# Vercel CLIをインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

### 環境変数の設定（CLI）

```bash
# 環境変数を設定
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 環境変数の確認
vercel env ls
```

---

## 🗄️ Supabase本番環境設定

### 1. Supabaseプロジェクトの作成

1. **Supabaseにログイン**
   - https://supabase.com にアクセス
   - アカウントを作成（無料）

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - プロジェクト名、データベースパスワードを設定
   - リージョンを選択（日本: ap-northeast-1）

3. **APIキーを取得**
   - Settings → API
   - `Project URL`をコピー → `VITE_SUPABASE_URL`に設定
   - `anon public`キーをコピー → `VITE_SUPABASE_ANON_KEY`に設定

### 2. マイグレーションの実行

#### 方法1: Supabase Dashboard（推奨）

1. **SQL Editorを開く**
   - Dashboard → SQL Editor

2. **マイグレーションファイルを実行**
   - `supabase/migrations/001_initial.sql`の内容をコピーして実行
   - 成功したら、`supabase/migrations/002_update_store_summary.sql`を実行

3. **実行結果を確認**
   - 「Success. No rows returned」と表示されれば成功

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

### 3. シードデータの投入（オプション）

サンプルデータを投入する場合：

1. **SQL Editorを開く**
   - Dashboard → SQL Editor

2. **シードファイルを実行**
   - `supabase/seed.sql`の内容をコピーして実行

### 4. RLS（Row Level Security）の確認

RLSは既にマイグレーションファイルで設定されていますが、確認してください：

1. **RLSが有効になっているか確認**
   - Dashboard → Authentication → Policies
   - 各テーブルで「Public read access」ポリシーが有効になっているか確認

2. **データが読み取れるか確認**
   ```sql
   -- テストクエリ
   SELECT * FROM stores LIMIT 5;
   SELECT * FROM genres LIMIT 5;
   ```

---

## 🔍 デプロイ後の確認

### 1. アプリケーションの動作確認

デプロイが完了したら、以下の項目を確認してください：

- ✅ ホームページが表示される
- ✅ 「商品から探す」「位置情報から探す」ボタンが動作する
- ✅ 店舗一覧が表示される
- ✅ 店舗詳細ページが表示される
- ✅ 地図が表示される（位置情報を許可した場合）

### 2. コンソールエラーの確認

ブラウザの開発者ツール（F12）を開いて、エラーがないか確認してください：

- ✅ 「✅ Supabase接続成功」が表示される
- ✅ エラーメッセージがない

### 3. 環境変数の確認

Vercel Dashboardで環境変数が正しく設定されているか確認してください：

- Settings → Environment Variables
- `VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が設定されているか

---

## 🔧 トラブルシューティング

### 問題1: ビルドエラー

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. `.env`ファイルが正しく作成されているか確認
2. 環境変数の値が正しいか確認（URLの末尾にスラッシュがないか）
3. Vercel Dashboardで環境変数が設定されているか確認

### 問題2: Supabase接続エラー

**原因**: APIキーが正しく設定されていない

**解決方法**:
1. Supabase DashboardでAPIキーを再確認
2. Vercel Dashboardで環境変数を再設定
3. デプロイを再実行

### 問題3: データが表示されない

**原因**: RLSポリシーが正しく設定されていない、またはデータが投入されていない

**解決方法**:
1. Supabase DashboardでRLSポリシーを確認
2. SQL Editorでデータが存在するか確認
3. 必要に応じてシードデータを投入

### 問題4: 地図が表示されない

**原因**: Leaflet.jsのCDNが読み込まれていない、または位置情報が許可されていない

**解決方法**:
1. `index.html`でLeaflet.jsのCDNが正しく読み込まれているか確認
2. ブラウザの位置情報許可を確認

---

## 📝 デプロイ後の作業

### 1. カスタムドメインの設定（オプション）

Vercel Dashboard → Settings → Domains からカスタムドメインを設定できます。

### 2. 環境変数の更新

環境変数を変更した場合は、Vercel Dashboardで再設定し、デプロイを再実行してください。

### 3. パフォーマンスモニタリング

Vercel Dashboard → Analytics でパフォーマンスを確認できます。

---

## 🔗 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)

