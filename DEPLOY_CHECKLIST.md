# 本番環境デプロイチェックリスト

## 📋 デプロイ前チェックリスト

### ✅ 必須確認項目

#### 1. コードの準備
- [ ] ビルドが成功する（`npm run build`）
- [ ] 開発サーバーで正常に動作する（`npm run dev`）
- [ ] 主要なページが正常に表示される
- [ ] コンソールエラーがない

#### 2. 環境変数の準備
- [ ] `.env`ファイルを作成済み
- [ ] `VITE_SUPABASE_URL`が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY`が設定されている
- [ ] `ENV_EXAMPLE.txt`を参考に設定

#### 3. Supabaseの準備
- [ ] Supabaseアカウントを作成済み
- [ ] 新しいプロジェクトを作成する準備ができている
- [ ] プロジェクト名を決めている
- [ ] データベースパスワードを決めている

#### 4. Vercelの準備
- [ ] Vercelアカウントを作成済み（または作成する準備ができている）
- [ ] GitHubリポジトリにコードをプッシュ済み（推奨）
  - または、ローカルからデプロイする準備ができている

---

## 🚀 デプロイ手順

### Step 1: Supabaseプロジェクトの作成

1. **Supabaseにアクセス**
   - https://supabase.com にアクセス
   - アカウントがない場合は作成

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - 以下の情報を入力：
     - **Organization**: 既存のOrganizationを選択、または新規作成
     - **Project Name**: 例）`flyer-search-app` または `チラシ検索アプリ`
     - **Database Password**: 強力なパスワードを設定（必ず保存してください）
     - **Region**: `ap-northeast-1`（東京）を推奨
   - 「Create new project」をクリック

3. **プロジェクトの作成を待つ**
   - プロジェクトが作成されるまで2-3分かかります
   - 「Project is ready」と表示されたら次のステップへ

4. **APIキーを取得**
   - Settings → API を開く
   - `Project URL`をコピー → `.env`の`VITE_SUPABASE_URL`に設定
   - `anon public`キーをコピー → `.env`の`VITE_SUPABASE_ANON_KEY`に設定

---

### Step 2: Supabaseデータベースのセットアップ

1. **SQL Editorを開く**
   - Dashboard → SQL Editor

2. **マイグレーションを実行**
   - `supabase/migrations/001_initial.sql`の内容をコピー
   - SQL Editorに貼り付けて「Run」をクリック
   - 成功メッセージを確認

3. **集計処理マイグレーションを実行**
   - `supabase/migrations/002_update_store_summary.sql`の内容をコピー
   - SQL Editorに貼り付けて「Run」をクリック
   - 成功メッセージを確認

4. **シードデータを投入（オプション）**
   - `supabase/seed.sql`の内容をコピー
   - SQL Editorに貼り付けて「Run」をクリック
   - 成功メッセージを確認

5. **データの確認**
   ```sql
   -- データが正しく投入されているか確認
   SELECT COUNT(*) FROM stores;
   SELECT COUNT(*) FROM genres;
   SELECT COUNT(*) FROM flyers;
   SELECT COUNT(*) FROM items;
   ```

---

### Step 3: ローカル環境での動作確認

1. **環境変数を設定**
   - `.env`ファイルにSupabaseの情報を設定
   - 開発サーバーを再起動

2. **動作確認**
   ```bash
   npm run dev
   ```
   - ブラウザで `http://localhost:3000` を開く
   - コンソールで「✅ Supabase接続成功」が表示されることを確認
   - 各ページが正常に表示されることを確認

---

### Step 4: Vercelへのデプロイ

#### 方法1: Vercel Dashboardからデプロイ（推奨）

1. **Vercelにログイン**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン（推奨）

2. **プロジェクトをインポート**
   - 「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択
   - または、「Import Git Repository」でリポジトリを追加

3. **プロジェクト設定**
   - **Framework Preset**: `Vite`（自動検出される）
   - **Root Directory**: `.`（そのまま）
   - **Build Command**: `npm run build`（自動検出される）
   - **Output Directory**: `dist`（自動検出される）
   - **Install Command**: `npm install`（自動検出される）

4. **環境変数を設定**
   - 「Environment Variables」セクションを開く
   - 以下の環境変数を追加：
     ```
     VITE_SUPABASE_URL = https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY = your-anon-key-here
     ```
   - **注意**: 各環境（Production, Preview, Development）に設定する

5. **デプロイを実行**
   - 「Deploy」ボタンをクリック
   - デプロイが完了するまで待つ（1-2分）

6. **デプロイURLを確認**
   - デプロイが完了すると、URLが発行されます
   - 例）`https://your-app-name.vercel.app`

---

#### 方法2: Vercel CLIでデプロイ

1. **Vercel CLIをインストール**
   ```bash
   npm install -g vercel
   ```

2. **ログイン**
   ```bash
   vercel login
   ```

3. **デプロイ**
   ```bash
   vercel
   ```
   - 初回はいくつか質問されます：
     - Set up and deploy? → **Y**
     - Which scope? → アカウントを選択
     - Link to existing project? → **N**（初回）
     - Project name? → プロジェクト名を入力
     - Directory? → `.`（そのまま）

4. **環境変数を設定**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **本番環境にデプロイ**
   ```bash
   vercel --prod
   ```

---

### Step 5: デプロイ後の確認

#### 必須確認項目

- [ ] デプロイされたURLにアクセスできる
- [ ] ホームページが正常に表示される
- [ ] コンソールにエラーがない
- [ ] 「✅ Supabase接続成功」が表示される
- [ ] 店舗データが表示される
- [ ] 地図が表示される（位置情報を許可した場合）
- [ ] 画像が表示される

#### 各ページの動作確認

- [ ] `/home` - ホームページが表示される
- [ ] `/genre` - ジャンルページが表示される
- [ ] `/stores` - 店舗一覧ページが表示される（位置情報が必要）
- [ ] `/genre/:genreId/stores` - ジャンル別店舗ページが表示される
- [ ] `/store/:storeId` - 店舗詳細ページが表示される
- [ ] `/search` - 検索結果ページが表示される

#### 機能確認

- [ ] 「商品から探す」ボタンが動作する
- [ ] 「位置情報から探す」ボタンが動作する
- [ ] 商品検索が動作する
- [ ] ジャンル選択が動作する
- [ ] 店舗カードのクリックが動作する
- [ ] 地図が表示される
- [ ] 画像拡大が動作する（Lightbox2）
- [ ] お気に入り機能が動作する（LocalStorage）

---

## 🔧 トラブルシューティング

### 問題1: Supabase接続エラー

**症状**: コンソールに「⚠️ Supabase環境変数が設定されていません」が表示される

**解決方法**:
1. Vercel Dashboardで環境変数が正しく設定されているか確認
2. 環境変数の値が正しいか確認（URLの末尾にスラッシュがないか）
3. デプロイを再実行（環境変数を変更した場合は必須）

---

### 問題2: データが表示されない

**症状**: ページは表示されるが、店舗や商品が表示されない

**解決方法**:
1. Supabase Dashboard → Table Editorでデータが存在するか確認
2. RLSポリシーが正しく設定されているか確認
3. ブラウザのコンソールでエラーを確認

---

### 問題3: 地図が表示されない

**症状**: 地図が表示されず、空白になる

**解決方法**:
1. ブラウザのコンソールでエラーを確認
2. Leaflet.jsのCDNが正しく読み込まれているか確認
3. 位置情報が許可されているか確認

---

### 問題4: ページが404エラーになる

**症状**: ページをリロードすると404エラーになる

**解決方法**:
1. `vercel.json`に`rewrites`設定があるか確認
2. Vercel Dashboard → Settings → General で「Clean URLs」が有効になっているか確認

---

## 📝 デプロイ後の作業

### 1. カスタムドメインの設定（オプション）

Vercel Dashboard → Settings → Domains からカスタムドメインを設定できます。

### 2. 環境変数の管理

環境変数を変更した場合は、Vercel Dashboardで更新し、再デプロイが必要です。

### 3. ログの確認

Vercel Dashboard → Deployments → 最新のデプロイ → Functions でログを確認できます。

---

## 🔗 参考リンク

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 詳細なデプロイガイド
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - セットアップガイド

