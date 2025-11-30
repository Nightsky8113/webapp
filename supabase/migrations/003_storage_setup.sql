-- Supabase Storage設定
-- チラシ画像を保存するためのStorageバケットとポリシーの設定

-- 注意: このSQLスクリプトはSupabase DashboardのSQL Editorで実行してください
-- Storageバケット自体はDashboardのUIから作成する必要があります

-- ============================================
-- 1. Storageバケットのポリシー設定
-- ============================================

-- 公開読み取りポリシー（全員が画像を閲覧可能）
-- flyer-imagesバケット内のすべてのファイルを公開読み取り可能にする
CREATE POLICY "Public read access for flyer-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'flyer-images');

-- アップロードポリシー（認証済みユーザーのみアップロード可能）
-- 将来的に認証機能を追加した場合に使用
-- 現在は認証なしでもアップロードできるようにする（開発用）
CREATE POLICY "Public upload access for flyer-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'flyer-images');

-- 更新ポリシー（認証済みユーザーのみ更新可能）
CREATE POLICY "Public update access for flyer-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'flyer-images');

-- 削除ポリシー（認証済みユーザーのみ削除可能）
CREATE POLICY "Public delete access for flyer-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'flyer-images');

-- ============================================
-- 2. ファイルサイズ制限の設定（オプション）
-- ============================================
-- 注意: ファイルサイズ制限はバケット作成時に設定する必要があります
-- 最大50MBに設定することを推奨

-- ============================================
-- 3. ファイル形式の制限（オプション）
-- ============================================
-- 画像ファイルのみアップロード可能にする
-- このポリシーは、アップロード時にファイル形式をチェックします
CREATE POLICY "Image files only for flyer-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'flyer-images' AND
    (
        (storage.foldername(name))[1] = 'images' OR
        (name)::text ~ '\.(jpg|jpeg|png|webp|gif)$'
    )
);

-- 注意: 上記のポリシーが厳しすぎる場合は削除してください
-- 開発中は制限を緩めておくことを推奨します

