# Supabase Storage設定ガイド

## 📋 概要

Supabase Storageを使用してチラシ画像を保存・管理するための設定手順です。

---

## 🎯 設定内容

1. **Storageバケットの作成** - `flyer-images`バケット
2. **ポリシーの設定** - 公開読み取り、アップロード権限
3. **動作確認** - アップロードと読み取りのテスト

---

## 🚀 Step 1: Storageバケットの作成

### 1. Supabase Dashboardにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択

### 2. Storageバケットを作成

1. 左メニューから「**Storage**」をクリック
2. 「**New bucket**」ボタンをクリック
3. 以下の情報を入力：
   ```
   Name: flyer-images
   Public bucket: ✅（チェックを入れる）
   File size limit: 50 MB（推奨）
   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif（オプション）
   ```
4. 「**Create bucket**」ボタンをクリック

### 3. バケットの確認

- バケット一覧に`flyer-images`が表示されれば成功

---

## 🔐 Step 2: ポリシーの設定

### 方法1: SQL Editorから設定（推奨）

1. **SQL Editorを開く**
   - 左メニューから「**SQL Editor**」をクリック
   - 「**New query**」をクリック

2. **ポリシースクリプトを実行**
   - `supabase/migrations/003_storage_setup.sql`の内容をコピー
   - SQL Editorに貼り付けて「**Run**」ボタンをクリック
   - **「Success. No rows returned」**と表示されれば成功

### 方法2: DashboardのUIから設定

1. **Storage → Policies**
   - 左メニューから「**Storage**」→「**Policies**」をクリック
   - `flyer-images`バケットを選択

2. **ポリシーを追加**
   - 「**New Policy**」をクリック
   - 以下のポリシーを追加：

   **ポリシー1: 公開読み取り**
   ```
   Policy name: Public read access
   Allowed operation: SELECT
   Target roles: public
   USING expression: bucket_id = 'flyer-images'
   ```

   **ポリシー2: 公開アップロード**
   ```
   Policy name: Public upload access
   Allowed operation: INSERT
   Target roles: public
   WITH CHECK expression: bucket_id = 'flyer-images'
   ```

---

## ✅ Step 3: 動作確認

### 1. テスト画像のアップロード

1. **Storage → flyer-images**
   - 左メニューから「**Storage**」→「**flyer-images**」をクリック
   - 「**Upload file**」ボタンをクリック
   - テスト用の画像ファイルを選択
   - アップロードが成功することを確認

2. **公開URLの確認**
   - アップロードした画像をクリック
   - 「**Copy URL**」ボタンをクリック
   - URLがコピーされることを確認
   - ブラウザでURLを開いて画像が表示されることを確認

---

## 📝 ポリシーの説明

### 公開読み取りポリシー

- **目的**: 全員が画像を閲覧できるようにする
- **対象**: `flyer-images`バケット内のすべてのファイル
- **権限**: 読み取り（SELECT）

### アップロードポリシー

- **目的**: 画像をアップロードできるようにする
- **対象**: `flyer-images`バケット
- **権限**: アップロード（INSERT）

**注意**: 本番環境では、アップロード権限を認証済みユーザーのみに制限することを推奨します。

---

## 🔒 セキュリティの注意事項

### 開発環境（現在）

- ✅ 公開読み取り: 全員が閲覧可能
- ✅ 公開アップロード: 全員がアップロード可能（開発用）

### 本番環境（推奨）

- ✅ 公開読み取り: 全員が閲覧可能
- ⚠️ アップロード: 認証済みユーザーのみ（認証機能追加後）

---

## 💡 トラブルシューティング

### 問題1: バケットが作成できない

**解決方法**:
- バケット名が既に使用されている可能性があります
- 別の名前を試すか、既存のバケットを削除してください

### 問題2: ポリシーが適用されない

**解決方法**:
- ポリシーの構文を確認してください
- SQL Editorのエラーメッセージを確認してください

### 問題3: 画像が表示されない

**解決方法**:
- バケットが「Public」に設定されているか確認
- 公開読み取りポリシーが正しく設定されているか確認
- 画像URLが正しいか確認

---

## 📚 参考リンク

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

## ✅ 設定完了後の確認

設定が完了したら、以下を確認してください：

- ✅ `flyer-images`バケットが作成されている
- ✅ 公開読み取りポリシーが設定されている
- ✅ テスト画像をアップロードできる
- ✅ アップロードした画像のURLが取得できる
- ✅ ブラウザで画像が表示される

設定が完了したら、次のステップ（ストレージサービスの実装）に進みます。

