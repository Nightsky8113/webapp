# デプロイガイド

## 📋 現在の状況

✅ **準備完了**
- ビルドが成功する（確認済み）
- デプロイチェックリスト作成済み
- デプロイ手順書作成済み
- マイグレーションファイル準備済み

---

## 📋 デプロイ前の準備

### 1. 環境変数の確認

`ENV_EXAMPLE.txt`をコピーして`.env`ファイルを作成し、必要な環境変数を設定してください。

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

## 🚀 デプロイ手順（順番に進めてください）

### Step 1: Supabaseプロジェクトの作成 ⭐️ **最初にこれを実行**

1. **Supabaseにアクセス**
   - https://supabase.com/dashboard にアクセス
   - アカウントがない場合は作成（無料）

2. **新しいプロジェクトを作成**
   - 「New Project」ボタンをクリック
   - 以下の情報を入力：
     ```
     Organization: （既存のものを選択、または新規作成）
     Project Name: flyer-search-app（お好みの名前）
     Database Password: （強力なパスワードを設定・必ず保存してください）
     Region: ap-northeast-1（東京）を推奨
     ```
   - 「Create new project」をクリック
   - **2-3分待つ**（プロジェクトが作成されるまで）

3. **APIキーを取得**
   - プロジェクトが作成されたら、左メニューから「Settings」→「API」をクリック
   - `Project URL`をコピー（例：`https://xxxxxxxxxxxxx.supabase.co`）
   - `anon public`キーをコピー（長い文字列）

4. **環境変数を設定（ローカル）**
   - プロジェクトルートに`.env`ファイルを作成（まだの場合）
   - 以下の内容を記入：
     ```env
     VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - 実際の値に置き換えてください

---

### Step 2: Supabaseデータベースのセットアップ

1. **SQL Editorを開く**
   - Supabase Dashboardの左メニューから「SQL Editor」をクリック

2. **最初のマイグレーションを実行**
   - 「New query」をクリック
   - `supabase/migrations/001_initial.sql`ファイルを開く
   - ファイルの内容をすべてコピー
   - SQL Editorに貼り付けて「Run」ボタンをクリック
   - **「Success. No rows returned」**と表示されれば成功

3. **集計処理マイグレーションを実行**
   - 再度「New query」をクリック
   - `supabase/migrations/002_update_store_summary.sql`ファイルを開く
   - ファイルの内容をすべてコピー
   - SQL Editorに貼り付けて「Run」ボタンをクリック
   - **「Success. No rows returned」**と表示されれば成功

4. **シードデータを投入（オプション）**
   - 再度「New query」をクリック
   - `supabase/seed.sql`ファイルを開く
   - ファイルの内容をすべてコピー
   - SQL Editorに貼り付けて「Run」ボタンをクリック
   - 成功メッセージを確認

5. **データの確認**
   - SQL Editorで以下のクエリを実行してデータが存在するか確認：
     ```sql
     SELECT COUNT(*) FROM stores;
     SELECT COUNT(*) FROM genres;
     SELECT COUNT(*) FROM flyers;
     SELECT COUNT(*) FROM items;
     ```

---

### Step 3: ローカル環境での動作確認

1. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

2. **ブラウザで確認**
   - `http://localhost:3000` を開く
   - ブラウザの開発者ツール（F12）を開く
   - コンソールで「✅ Supabase接続成功」が表示されることを確認
   - エラーがないことを確認

3. **各ページの動作確認**
   - ホームページが表示される
   - 店舗データが表示される
   - 地図が表示される（位置情報を許可した場合）

---

### Step 4: Vercelへのデプロイ

#### 方法A: Vercel Dashboardからデプロイ（推奨）⭐️

1. **Vercelにログイン**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン（推奨）

2. **プロジェクトをインポート**
   - 「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択（コードをプッシュ済みの場合）
   - または、「Import Git Repository」でリポジトリを追加
   - **注意**: コードをGitHubにプッシュしていない場合は、先にGitHubにプッシュしてください

3. **プロジェクト設定**
   - **Framework Preset**: `Vite`（自動検出される）
   - **Root Directory**: `.`（そのまま）
   - **Build Command**: `npm run build`（自動検出される）
   - **Output Directory**: `dist`（自動検出される）
   - **Install Command**: `npm install`（自動検出される）

4. **環境変数を設定** ⚠️ **重要**
   - スクロールして「Environment Variables」セクションを開く
   - 以下の環境変数を追加：
     ```
     Name: VITE_SUPABASE_URL
     Value: https://xxxxxxxxxxxxx.supabase.co（実際のURL）
     Environment: Production, Preview, Development（すべてにチェック）
     ```
   - もう一つ追加：
     ```
     Name: VITE_SUPABASE_ANON_KEY
     Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（実際のキー）
     Environment: Production, Preview, Development（すべてにチェック）
     ```

5. **デプロイを実行**
   - 「Deploy」ボタンをクリック
   - デプロイが完了するまで1-2分待つ

6. **デプロイURLを確認**
   - デプロイが完了すると、URLが発行されます
   - 例：`https://your-app-name.vercel.app`

---

#### 方法B: Vercel CLIでデプロイ

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

1. **デプロイされたURLにアクセス**
   - Vercel Dashboardで発行されたURLを開く

2. **動作確認**
   - ✅ ホームページが表示される
   - ✅ ブラウザのコンソール（F12）でエラーがない
   - ✅ 「✅ Supabase接続成功」が表示される（またはダミークライアントの警告が出ない）
   - ✅ 店舗データが表示される
   - ✅ 地図が表示される（位置情報を許可した場合）

3. **各ページの動作確認**
   - `/home` - ホームページ
   - `/genre` - ジャンルページ
   - `/stores` - 店舗一覧ページ（位置情報が必要）
   - `/store/:storeId` - 店舗詳細ページ
   - `/search` - 検索結果ページ

---

## 🔧 トラブルシューティング

### 問題1: Supabase接続エラー

**原因**: APIキーが正しく設定されていない

**解決方法**:
1. Supabase DashboardでAPIキーを再確認
2. Vercel Dashboardで環境変数を再設定
3. デプロイを再実行

### 問題2: データが表示されない

**症状**: ページは表示されるが、店舗や商品が表示されない

**解決方法**:
1. Supabase Dashboard → Table Editor でデータが存在するか確認
2. SQL Editorでデータを確認：
   ```sql
   SELECT * FROM stores LIMIT 5;
   ```
3. ブラウザのコンソールでエラーを確認

---

### 問題3: ページが404エラーになる

**症状**: ページをリロードすると404エラーになる

**解決方法**:
1. `vercel.json`に`rewrites`設定があるか確認（既に設定済み）
2. Vercel Dashboard → Settings → General で設定を確認

---

## 📝 次のステップ

デプロイが完了したら、次は以下を検討できます：

1. **Supabase Storage設定** - 画像アップロード機能
2. **テストフレームワーク導入** - 品質保証
3. **カスタムドメイン設定** - 独自ドメインを使用

---

## 📚 参考ドキュメント

- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - 詳細なチェックリスト
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - セットアップガイド
- [supabase/migrations/README.md](./supabase/migrations/README.md) - マイグレーションガイド

---

## 💡 重要な注意事項

1. **データベースパスワードは必ず保存してください** - 後で再取得できません
2. **環境変数は機密情報です** - `.env`ファイルはGitにコミットしないでください（`.gitignore`に含まれています）
3. **Vercelの環境変数は各環境（Production, Preview, Development）に設定する必要があります**
4. **デプロイ後は必ず動作確認を行ってください**

---

## 🔗 外部リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)

